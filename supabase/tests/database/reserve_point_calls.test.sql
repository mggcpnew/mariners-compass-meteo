-- reserve_point_calls: limite por cliente + tetos globais, atômico.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(12);

create function pg_temp.point_many(
  p_at timestamptz, p_hash text, p_times integer,
  p_day integer, p_hour integer, p_minute integer, p_c_hour integer, p_c_day integer
) returns integer language plpgsql as $$
declare
  v_ok integer := 0;
  r record;
begin
  for i in 1..p_times loop
    select * into r from public.reserve_point_calls(p_at, p_hash, 2, p_day, p_hour, p_minute, p_c_hour, p_c_day);
    if r.allowed then v_ok := v_ok + 1; end if;
  end loop;
  return v_ok;
end;
$$;

-- Cliente A: teto de 40 chamadas por hora (20 misses).
select is(
  pg_temp.point_many('2026-11-17T10:00:00Z', repeat('a', 32), 20, 3200, 1000, null, 40, 200),
  20,
  'cliente: 20 misses passam com teto 40 por hora'
);
select results_eq(
  $$select allowed, reason from reserve_point_calls('2026-11-17T10:30:00Z', repeat('a', 32), 2, 3200, 1000, null, 40, 200)$$,
  $$values (false, 'client_hour'::text)$$,
  'cliente: o 21º miss da hora é negado (client_hour)'
);
select is(
  (select calls from quota_counter where day = '2026-11-17' and source = 'openmeteo_point'),
  40,
  'negada pelo cliente não incrementa o contador global'
);
select is(
  (select calls from client_quota where client_hash = repeat('a', 32) and granularity = 'hour'
     and bucket_start = '2026-11-17T10:00:00Z'),
  40,
  'negada pelo cliente não incrementa o contador do cliente'
);

-- Outro cliente não é afetado.
select results_eq(
  $$select allowed from reserve_point_calls('2026-11-17T10:30:00Z', repeat('b', 32), 2, 3200, 1000, null, 40, 200)$$,
  $$values (true)$$,
  'outro cliente segue liberado'
);

-- Hora seguinte libera o cliente A.
select results_eq(
  $$select allowed from reserve_point_calls('2026-11-17T11:00:00Z', repeat('a', 32), 2, 3200, 1000, null, 40, 200)$$,
  $$values (true)$$,
  'cliente: hora seguinte volta a passar'
);

-- Teto diário do cliente (200 = 100 misses), em horas diferentes.
select is(
  pg_temp.point_many('2026-11-18T01:00:00Z', repeat('c', 32), 20, 3200, 1000, null, 40, 200)
  + pg_temp.point_many('2026-11-18T02:00:00Z', repeat('c', 32), 20, 3200, 1000, null, 40, 200)
  + pg_temp.point_many('2026-11-18T03:00:00Z', repeat('c', 32), 20, 3200, 1000, null, 40, 200)
  + pg_temp.point_many('2026-11-18T04:00:00Z', repeat('c', 32), 20, 3200, 1000, null, 40, 200)
  + pg_temp.point_many('2026-11-18T05:00:00Z', repeat('c', 32), 20, 3200, 1000, null, 40, 200),
  100,
  'cliente: 100 misses no dia'
);
select results_eq(
  $$select allowed, reason from reserve_point_calls('2026-11-18T06:00:00Z', repeat('c', 32), 2, 3200, 1000, null, 40, 200)$$,
  $$values (false, 'client_day'::text)$$,
  'cliente: o 101º miss do dia é negado (client_day)'
);

-- Teto diário global tem precedência sobre o limite do cliente.
select results_eq(
  $$select allowed, reason from reserve_point_calls('2026-11-18T06:00:00Z', repeat('c', 32), 2, 200, 1000, null, 40, 200)$$,
  $$values (false, 'day'::text)$$,
  'global diário e cliente estourados juntos: motivo day'
);

-- Tetos globais continuam valendo para quem está dentro do limite do cliente.
select results_eq(
  $$select allowed, reason from reserve_point_calls('2026-11-19T10:00:00Z', repeat('d', 32), 2, 3200, 1000, 0, 40, 200)$$,
  $$values (false, 'minute'::text)$$,
  'cliente liberado, teto global por minuto negado'
);
select is(
  (select calls from client_quota where client_hash = repeat('d', 32) and granularity = 'day'),
  0,
  'negada no global não incrementa o cliente'
);

select throws_ok(
  $$select * from reserve_point_calls('2026-11-19T10:00:00Z', 'not-a-hash', 2, 3200, 1000, 100, 40, 200)$$,
  '23514',
  null,
  'hash fora do formato é rejeitado'
);

select * from finish();
rollback;
