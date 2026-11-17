-- RPC atômica e condicional de reserva de chamadas (ESPECIFICACAO.md, B7
-- "Orçamento e tetos do /point"). A reserva ocorre ANTES da chamada à fonte.
--
-- Só incrementa se, na mesma transação, calls + p_n <= cada limite aplicável
-- (dia em quota_counter; hora e minuto em quota_window). Limite nulo = não se
-- aplica. Se algum falhar, nada é incrementado e devolve allowed = false com o
-- motivo. Ordem de verificação: day, hour, minute (o diário vem primeiro, para
-- que dia e minuto estourados juntos deem quota_exhausted, AC-MVP-23).
--
-- p_at vem do chamador para permitir relógio simulado nos testes. Só o
-- service_role executa a função.

create function public.reserve_calls(
  p_at timestamptz,
  p_source text,
  p_n integer,
  p_day_limit integer,
  p_hour_limit integer,
  p_minute_limit integer
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
  v_hour timestamptz;
  v_minute timestamptz;
  v_day_calls integer;
  v_hour_calls integer;
  v_minute_calls integer;
begin
  if p_at is null then
    raise exception 'reserve_calls: p_at is required' using errcode = '22004';
  end if;
  if p_source is null then
    raise exception 'reserve_calls: p_source is required' using errcode = '22004';
  end if;
  if p_n is null or p_n <= 0 then
    raise exception 'reserve_calls: p_n must be > 0 (got %)', p_n using errcode = '22023';
  end if;
  if p_day_limit < 0 or p_hour_limit < 0 or p_minute_limit < 0 then
    raise exception 'reserve_calls: limits must be >= 0 or null' using errcode = '22023';
  end if;

  -- Janelas sempre em UTC.
  v_day := (p_at at time zone 'UTC')::date;
  v_hour := date_trunc('hour', p_at at time zone 'UTC') at time zone 'UTC';
  v_minute := date_trunc('minute', p_at at time zone 'UTC') at time zone 'UTC';

  -- Garante as três linhas (a fonte inválida falha no CHECK das tabelas).
  insert into public.quota_counter (day, source, calls)
  values (v_day, p_source, 0)
  on conflict (day, source) do nothing;

  insert into public.quota_window (source, granularity, bucket_start, calls)
  values (p_source, 'hour', v_hour, 0), (p_source, 'minute', v_minute, 0)
  on conflict (source, granularity, bucket_start) do nothing;

  -- Trava as linhas sempre na mesma ordem (dia, hora, minuto) para evitar deadlock.
  select qc.calls into v_day_calls
  from public.quota_counter qc
  where qc.day = v_day and qc.source = p_source
  for update;

  select qw.calls into v_hour_calls
  from public.quota_window qw
  where qw.source = p_source and qw.granularity = 'hour' and qw.bucket_start = v_hour
  for update;

  select qw.calls into v_minute_calls
  from public.quota_window qw
  where qw.source = p_source and qw.granularity = 'minute' and qw.bucket_start = v_minute
  for update;

  if p_day_limit is not null and v_day_calls + p_n > p_day_limit then
    return query select false, 'day'::text, v_day_calls, v_hour_calls, v_minute_calls;
    return;
  end if;
  if p_hour_limit is not null and v_hour_calls + p_n > p_hour_limit then
    return query select false, 'hour'::text, v_day_calls, v_hour_calls, v_minute_calls;
    return;
  end if;
  if p_minute_limit is not null and v_minute_calls + p_n > p_minute_limit then
    return query select false, 'minute'::text, v_day_calls, v_hour_calls, v_minute_calls;
    return;
  end if;

  update public.quota_counter
  set calls = calls + p_n
  where day = v_day and source = p_source
  returning calls into v_day_calls;

  update public.quota_window
  set calls = calls + p_n
  where source = p_source and granularity = 'hour' and bucket_start = v_hour
  returning calls into v_hour_calls;

  update public.quota_window
  set calls = calls + p_n
  where source = p_source and granularity = 'minute' and bucket_start = v_minute
  returning calls into v_minute_calls;

  return query select true, null::text, v_day_calls, v_hour_calls, v_minute_calls;
end;
$$;

comment on function public.reserve_calls(timestamptz, text, integer, integer, integer, integer) is
  'Reserva atômica e condicional de chamadas ao Open-Meteo (dia, hora e minuto em UTC). Só service_role.';

revoke execute on function public.reserve_calls(timestamptz, text, integer, integer, integer, integer)
  from public, anon, authenticated;
grant execute on function public.reserve_calls(timestamptz, text, integer, integer, integer, integer)
  to service_role;
