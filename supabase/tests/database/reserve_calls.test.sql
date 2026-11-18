-- reserve_calls (B7 "Orçamento e tetos do /point"; AC-MVP-05 e AC-MVP-23 no
-- nível do banco). Relógio simulado via p_at; cada cenário usa um dia UTC próprio.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(22);

-- Executa n reservas sequenciais e devolve quantas foram concedidas.
create function pg_temp.reserve_many(
  p_at timestamptz, p_source text, p_times integer,
  p_day integer, p_hour integer, p_minute integer
) returns integer language plpgsql as $$
declare
  v_ok integer := 0;
  r record;
begin
  for i in 1..p_times loop
    select * into r from public.reserve_calls(p_at, p_source, 2, p_day, p_hour, p_minute);
    if r.allowed then v_ok := v_ok + 1; end if;
  end loop;
  return v_ok;
end;
$$;

-- 1. Limite diário operacional 3.200: 1.600 misses passam, o 1.601º é negado.
select is(
  pg_temp.reserve_many('2000-01-17T10:00:00Z', 'openmeteo_point', 1600, 3200, null, null),
  1600,
  'dia: 1.600 reservas de 2 passam com limite 3.200'
);
select is(
  (select calls from quota_counter where day = '2000-01-17' and source = 'openmeteo_point'),
  3200,
  'dia: contador sobe de 2 em 2 até 3.200'
);
select results_eq(
  $$select allowed, reason from reserve_calls('2000-01-17T10:00:00Z', 'openmeteo_point', 2, 3200, null, null)$$,
  $$values (false, 'day'::text)$$,
  'dia: a 1.601ª reserva é negada com motivo day'
);
select is(
  (select calls from quota_counter where day = '2000-01-17' and source = 'openmeteo_point'),
  3200,
  'reserva negada não incrementa o contador diário'
);
select is(
  (select calls from quota_window where source = 'openmeteo_point' and granularity = 'hour'
     and bucket_start = '2000-01-17T10:00:00Z'),
  3200,
  'reserva negada não incrementa a janela de hora'
);
select is(
  (select calls from quota_window where source = 'openmeteo_point' and granularity = 'minute'
     and bucket_start = '2000-01-17T10:00:00Z'),
  3200,
  'reserva negada não incrementa a janela de minuto'
);

-- 2. Fontes separadas não se somam.
select results_eq(
  $$select allowed, day_calls from reserve_calls('2000-01-17T10:00:00Z', 'openmeteo_ingest', 2, 3200, null, null)$$,
  $$values (true, 2)$$,
  'openmeteo_ingest tem contador próprio'
);

-- 3. Virada do dia UTC zera o contador diário.
select results_eq(
  $$select allowed, day_calls from reserve_calls('2000-01-18T00:00:00Z', 'openmeteo_point', 2, 3200, null, null)$$,
  $$values (true, 2)$$,
  'novo dia UTC começa do zero'
);

-- 4. Teto por minuto 100: 50º miss passa, 51º é negado; no minuto seguinte volta.
select is(
  pg_temp.reserve_many('2000-01-19T10:00:15Z', 'openmeteo_point', 50, 3200, 1000, 100),
  50,
  'minuto: 50 reservas passam com teto 100'
);
select results_eq(
  $$select allowed, reason from reserve_calls('2000-01-19T10:00:59Z', 'openmeteo_point', 2, 3200, 1000, 100)$$,
  $$values (false, 'minute'::text)$$,
  'minuto: a 51ª reserva é negada com motivo minute'
);
select results_eq(
  $$select allowed, minute_calls from reserve_calls('2000-01-19T10:01:00Z', 'openmeteo_point', 2, 3200, 1000, 100)$$,
  $$values (true, 2)$$,
  'minuto seguinte volta a passar'
);

-- 5. Teto por hora 1.000: 500º miss passa, 501º é negado.
select is(
  pg_temp.reserve_many('2000-01-20T10:00:00Z', 'openmeteo_point', 500, 3200, 1000, null),
  500,
  'hora: 500 reservas passam com teto 1.000'
);
select results_eq(
  $$select allowed, reason from reserve_calls('2000-01-20T10:59:59Z', 'openmeteo_point', 2, 3200, 1000, null)$$,
  $$values (false, 'hour'::text)$$,
  'hora: a 501ª reserva é negada com motivo hour'
);
select results_eq(
  $$select allowed, hour_calls from reserve_calls('2000-01-20T11:00:00Z', 'openmeteo_point', 2, 3200, 1000, null)$$,
  $$values (true, 2)$$,
  'hora seguinte volta a passar'
);

-- 6. Dia e minuto estourados juntos: o motivo é day (503 quota_exhausted na API).
select results_eq(
  $$select allowed from reserve_calls('2000-01-21T10:00:00Z', 'openmeteo_point', 2, 2, 1000, 2)$$,
  $$values (true)$$,
  'dia+minuto: primeira reserva passa'
);
select results_eq(
  $$select allowed, reason from reserve_calls('2000-01-21T10:00:00Z', 'openmeteo_point', 2, 2, 1000, 2)$$,
  $$values (false, 'day'::text)$$,
  'dia+minuto estourados juntos: motivo day'
);

-- 7. Limites nulos não se aplicam.
select results_eq(
  $$select allowed, reason from reserve_calls('2000-01-17T10:00:00Z', 'openmeteo_point', 2, null, null, null)$$,
  $$values (true, null::text)$$,
  'limites nulos: reserva sempre concedida'
);

-- 8. Janelas em UTC mesmo com p_at em outro fuso.
select results_eq(
  $$select day_calls from reserve_calls('2000-01-22T22:30:00-03:00', 'openmeteo_ingest', 2, null, null, null)$$,
  $$values (2)$$,
  'p_at com -03:00 gera reserva'
);
select ok(
  exists (select 1 from quota_counter where day = '2000-01-23' and source = 'openmeteo_ingest')
  and exists (select 1 from quota_window where source = 'openmeteo_ingest' and granularity = 'hour'
              and bucket_start = '2000-01-23T01:00:00Z'),
  '22:30-03:00 cai no dia 2000-01-23 e na hora 01:00Z'
);

-- 9. Entradas inválidas.
select throws_ok(
  $$select * from reserve_calls('2000-01-17T10:00:00Z', 'openmeteo_point', 0, 3200, null, null)$$,
  '22023',
  null,
  'p_n = 0 é rejeitado'
);
select throws_ok(
  $$select * from reserve_calls('2000-01-17T10:00:00Z', 'openmeteo_point', 2, -1, null, null)$$,
  '22023',
  null,
  'limite negativo é rejeitado'
);
select throws_ok(
  $$select * from reserve_calls('2000-01-17T10:00:00Z', 'other_source', 2, 3200, null, null)$$,
  '23514',
  null,
  'fonte fora da lista é rejeitada pelo CHECK'
);

select * from finish();
rollback;
