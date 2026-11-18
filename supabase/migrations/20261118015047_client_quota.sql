-- Limite por cliente do /point (B7, "Abuso"; T-02 confirmou que a Vercel
-- define o IP do cliente). O IP bruto nunca é gravado: client_hash é um HMAC
-- calculado na Function com um segredo. Linhas com mais de 2 dias são
-- apagadas pelo job de ingestão.

create table public.client_quota (
  client_hash text not null,
  granularity text not null,
  bucket_start timestamptz not null,
  calls integer not null default 0,
  constraint client_quota_pkey primary key (client_hash, granularity, bucket_start),
  constraint client_quota_granularity_check check (granularity in ('hour', 'day')),
  constraint client_quota_calls_check check (calls >= 0),
  constraint client_quota_hash_check check (client_hash ~ '^[0-9a-f]{32,64}$')
);
create index client_quota_bucket_start_idx on public.client_quota (bucket_start);

alter table public.client_quota enable row level security;
revoke all on public.client_quota from anon, authenticated;
grant select, insert, update, delete on public.client_quota to service_role;

-- Reserva do /point: limite do cliente (hora e dia) + tetos globais
-- (reserve_calls), tudo na mesma transação. Nada é incrementado se algum
-- limite falhar. Precedência: o teto diário global vem primeiro (503
-- quota_exhausted); depois os limites do cliente; depois hora e minuto
-- globais. Motivos: day, client_day, client_hour, hour, minute.
create function public.reserve_point_calls(
  p_at timestamptz,
  p_client_hash text,
  p_n integer,
  p_day_limit integer,
  p_hour_limit integer,
  p_minute_limit integer,
  p_client_hour_limit integer,
  p_client_day_limit integer
)
returns table (
  allowed boolean,
  reason text,
  day_calls integer,
  hour_calls integer,
  minute_calls integer
)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_day date;
  v_day_start timestamptz;
  v_hour timestamptz;
  v_client_day integer;
  v_client_hour integer;
  v_global_day integer;
  v_reason text;
  r record;
begin
  if p_client_hash is null then
    raise exception 'reserve_point_calls: p_client_hash is required' using errcode = '22004';
  end if;
  if p_n is null or p_n <= 0 then
    raise exception 'reserve_point_calls: p_n must be > 0 (got %)', p_n using errcode = '22023';
  end if;
  if p_client_hour_limit < 0 or p_client_day_limit < 0 then
    raise exception 'reserve_point_calls: client limits must be >= 0 or null' using errcode = '22023';
  end if;

  v_day := (p_at at time zone 'UTC')::date;
  v_day_start := v_day::timestamp at time zone 'UTC';
  v_hour := date_trunc('hour', p_at at time zone 'UTC') at time zone 'UTC';

  -- Linhas do cliente: garante e trava (ordem fixa: day, hour).
  insert into public.client_quota (client_hash, granularity, bucket_start, calls)
  values (p_client_hash, 'day', v_day_start, 0), (p_client_hash, 'hour', v_hour, 0)
  on conflict (client_hash, granularity, bucket_start) do nothing;

  select cq.calls into v_client_day from public.client_quota cq
  where cq.client_hash = p_client_hash and cq.granularity = 'day' and cq.bucket_start = v_day_start
  for update;
  select cq.calls into v_client_hour from public.client_quota cq
  where cq.client_hash = p_client_hash and cq.granularity = 'hour' and cq.bucket_start = v_hour
  for update;

  if p_client_day_limit is not null and v_client_day + p_n > p_client_day_limit then
    v_reason := 'client_day';
  elsif p_client_hour_limit is not null and v_client_hour + p_n > p_client_hour_limit then
    v_reason := 'client_hour';
  end if;

  if v_reason is not null then
    -- O teto diário global tem precedência na resposta (503 em vez de 429).
    select qc.calls into v_global_day from public.quota_counter qc
    where qc.day = v_day and qc.source = 'openmeteo_point';
    if p_day_limit is not null and coalesce(v_global_day, 0) + p_n > p_day_limit then
      v_reason := 'day';
    end if;
    return query select false, v_reason, coalesce(v_global_day, 0), null::integer, null::integer;
    return;
  end if;

  select * into r from public.reserve_calls(p_at, 'openmeteo_point', p_n, p_day_limit, p_hour_limit, p_minute_limit);
  if r.allowed then
    update public.client_quota set calls = calls + p_n
    where client_hash = p_client_hash
      and ((granularity = 'day' and bucket_start = v_day_start) or (granularity = 'hour' and bucket_start = v_hour));
  end if;
  return query select r.allowed, r.reason, r.day_calls, r.hour_calls, r.minute_calls;
end;
$$;

comment on function public.reserve_point_calls(timestamptz, text, integer, integer, integer, integer, integer, integer) is
  'Reserva do /point: limite por cliente (hash) + tetos globais, atômica. Só service_role.';

revoke execute on function public.reserve_point_calls(timestamptz, text, integer, integer, integer, integer, integer, integer)
  from public, anon, authenticated;
grant execute on function public.reserve_point_calls(timestamptz, text, integer, integer, integer, integer, integer, integer)
  to service_role;
