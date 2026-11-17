-- AC-MVP-14: RLS ativa em todas as tabelas, nenhuma política para anon nem
-- para public (sem cláusula TO, a política vale para public, que alcança anon).
-- Também confere privilégios revogados e o bucket privado.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(11);

select is(
  (select count(*)::int from pg_tables where schemaname = 'public' and not rowsecurity),
  0,
  'todas as tabelas de public têm RLS ativa'
);

select is(
  (select count(*)::int from pg_tables where schemaname = 'public'),
  10,
  'public tem as 10 tabelas do esquema mínimo (B8)'
);

select is(
  (select count(*)::int from pg_policies where schemaname = 'public'),
  0,
  'nenhuma política em public'
);

select is(
  (select count(*)::int from pg_policies
   where schemaname in ('public', 'storage')
     and roles && array['anon', 'public']::name[]),
  0,
  'nenhuma política para anon ou public em public e storage'
);

select is(
  (select count(*)::int from information_schema.role_table_grants
   where table_schema = 'public' and grantee in ('anon', 'authenticated', 'PUBLIC')),
  0,
  'anon, authenticated e PUBLIC sem privilégio em tabelas de public'
);

select ok(
  not has_function_privilege('anon', 'public.reserve_calls(timestamptz, text, integer, integer, integer, integer)', 'execute'),
  'anon não executa reserve_calls'
);

select ok(
  not has_function_privilege('authenticated', 'public.reserve_calls(timestamptz, text, integer, integer, integer, integer)', 'execute'),
  'authenticated não executa reserve_calls'
);

select ok(
  has_function_privilege('service_role', 'public.reserve_calls(timestamptz, text, integer, integer, integer, integer)', 'execute'),
  'service_role executa reserve_calls'
);

select is(
  (select public from storage.buckets where id = 'grids'),
  false,
  'bucket grids existe e é privado'
);

set local role anon;
select throws_ok(
  'select * from public.point_cache',
  '42501',
  null,
  'anon não lê point_cache'
);
reset role;

set local role authenticated;
select throws_ok(
  'select * from public.official_notices',
  '42501',
  null,
  'authenticated não lê official_notices'
);
reset role;

select * from finish();
rollback;
