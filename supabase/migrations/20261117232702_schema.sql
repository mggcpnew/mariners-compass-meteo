-- Esquema mínimo (ESPECIFICACAO.md, B8).
-- Segurança: RLS ativa em todas as tabelas e NENHUMA política. Só o papel de
-- serviço (service_role, que ignora RLS) acessa os dados. O front nunca acessa
-- o Supabase. Além da RLS, os privilégios de anon e authenticated são revogados
-- (defesa extra, AC-MVP-14).

-- Privilégios padrão: nada novo criado por este papel em public fica acessível
-- a anon/authenticated, e funções novas não ganham EXECUTE para PUBLIC.
alter default privileges in schema public revoke all on tables from anon, authenticated;
alter default privileges in schema public revoke all on sequences from anon, authenticated;
alter default privileges in schema public revoke execute on functions from public, anon, authenticated;

-- Rodadas do modelo. Só rodadas 'closed' aparecem em /frames.
create table public.model_runs (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  model text not null,
  run_time timestamptz not null,
  ingested_at timestamptz not null default now(),
  status text not null default 'open',
  constraint model_runs_status_check check (status in ('open', 'closed', 'aborted')),
  constraint model_runs_source_model_run_time_key unique (source, model, run_time)
);
create index model_runs_status_run_time_idx on public.model_runs (status, run_time desc);

-- Arquivos de grade no Storage privado, um por (rodada, região, camada, instante).
create table public.grid_layers (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.model_runs (id) on delete cascade,
  region text not null,
  layer text not null,
  valid_time timestamptz not null,
  bbox double precision[] not null, -- oeste, sul, leste, norte
  res numeric not null,             -- graus
  storage_path text not null,
  expires_at timestamptz not null,  -- padrão: run_time + 48 h [PROPOSTA]
  constraint grid_layers_region_check check (region in ('wide', 'bay')),
  constraint grid_layers_layer_check check (layer in ('wind', 'waves')),
  constraint grid_layers_bbox_check check (array_ndims(bbox) = 1 and array_length(bbox, 1) = 4),
  constraint grid_layers_res_check check (res > 0),
  constraint grid_layers_run_region_layer_time_key unique (run_id, region, layer, valid_time)
);
-- A FK run_id é coberta pelo índice da unique (coluna inicial).
create index grid_layers_expires_at_idx on public.grid_layers (expires_at);

-- Contador diário de chamadas HTTP ao Open-Meteo (unidade: chamada efetiva).
create table public.quota_counter (
  day date not null,
  source text not null,
  calls integer not null default 0,
  constraint quota_counter_pkey primary key (day, source),
  constraint quota_counter_source_check check (source in ('openmeteo_point', 'openmeteo_ingest')),
  constraint quota_counter_calls_check check (calls >= 0)
);

-- Janelas de minuto e de hora (tetos do /point e do job) [PROPOSTA].
create table public.quota_window (
  source text not null,
  granularity text not null,
  bucket_start timestamptz not null,
  calls integer not null default 0,
  constraint quota_window_pkey primary key (source, granularity, bucket_start),
  constraint quota_window_source_check check (source in ('openmeteo_point', 'openmeteo_ingest')),
  constraint quota_window_granularity_check check (granularity in ('minute', 'hour')),
  constraint quota_window_calls_check check (calls >= 0)
);
create index quota_window_bucket_start_idx on public.quota_window (bucket_start);

-- Cache do /point. key = coordenada arredondada, ex. '-22.75:-43.25' [PROPOSTA].
create table public.point_cache (
  key text primary key,
  payload jsonb not null,
  status text not null,
  fetched_at timestamptz not null,
  constraint point_cache_status_check check (status in ('ok', 'partial'))
);
create index point_cache_fetched_at_idx on public.point_cache (fetched_at);

-- Avisos oficiais da Marinha, entrada manual (npm run notice:add) [PROPOSTA].
create table public.official_notices (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  issued_at timestamptz,
  valid_until timestamptz,
  source_url text not null,
  registered_at timestamptz not null default now()
);
create index official_notices_valid_until_idx on public.official_notices (valid_until);

-- Conferências do boletim (npm run notice:checked) [PROPOSTA].
create table public.notice_checks (
  id uuid primary key default gen_random_uuid(),
  checked_at timestamptz not null default now()
);
create index notice_checks_checked_at_idx on public.notice_checks (checked_at desc);

-- Maré (fase 2). Os dados vêm de importação local; nunca de migração ou seed (AC-MVP-09).
create table public.tide_stations (
  id text primary key,
  name text not null,
  lat double precision not null,
  lon double precision not null,
  source_note text
);

create table public.tide_predictions (
  station_id text not null references public.tide_stations (id) on delete cascade,
  datetime_utc timestamptz not null,
  height_m numeric not null,
  import_batch text,
  constraint tide_predictions_pkey primary key (station_id, datetime_utc)
);
-- A FK station_id é coberta pela PK (coluna inicial).

-- Assinaturas Web Push (fase 2). Coordenadas em rules arredondadas a 0,25°.
create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  endpoint text not null,
  keys jsonb not null,
  rules jsonb not null,
  created_at timestamptz not null default now(),
  last_notified_at timestamptz,
  constraint push_subscriptions_endpoint_key unique (endpoint)
);

-- RLS em todas as tabelas, sem nenhuma política; privilégios de anon e
-- authenticated revogados.
alter table public.model_runs enable row level security;
alter table public.grid_layers enable row level security;
alter table public.quota_counter enable row level security;
alter table public.quota_window enable row level security;
alter table public.point_cache enable row level security;
alter table public.official_notices enable row level security;
alter table public.notice_checks enable row level security;
alter table public.tide_stations enable row level security;
alter table public.tide_predictions enable row level security;
alter table public.push_subscriptions enable row level security;

revoke all on
  public.model_runs,
  public.grid_layers,
  public.quota_counter,
  public.quota_window,
  public.point_cache,
  public.official_notices,
  public.notice_checks,
  public.tide_stations,
  public.tide_predictions,
  public.push_subscriptions
from anon, authenticated;

-- Acesso explícito do service_role: desde 30/10/2026 tabelas novas não são
-- expostas automaticamente à Data API (changelog do Supabase), então o grant
-- não fica a cargo dos privilégios padrão do projeto.
grant select, insert, update, delete on
  public.model_runs,
  public.grid_layers,
  public.quota_counter,
  public.quota_window,
  public.point_cache,
  public.official_notices,
  public.notice_checks,
  public.tide_stations,
  public.tide_predictions,
  public.push_subscriptions
to service_role;
