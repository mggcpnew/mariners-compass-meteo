# Mariner's Compass Meteorologia

App de previsão do tempo para quem navega na Enseada de São Francisco, Niterói-RJ, na Baía de Guanabara. Mostra vento e ondas num mapa animado, com barra de tempo, previsão hora a hora do ponto tocado e os avisos oficiais da Marinha. Funciona no celular e no computador, em português e em inglês.

Gratuito, sem anúncios e sem assinatura. Sem vínculo oficial com o Iate Clube Brasileiro (ICB).

> **Aviso:** este app não substitui os boletins e avisos oficiais da Marinha do Brasil. Ele mostra previsões de modelos numéricos, não medições. Consulte sempre o boletim oficial antes de sair.

**Estado:** etapa 5 de 7 (API v1 e registro de avisos). Ainda não há funcionalidade para o usuário. Plano: [docs/PLANO-EXECUCAO.md](docs/PLANO-EXECUCAO.md). Especificação: [docs/ESPECIFICACAO.md](docs/ESPECIFICACAO.md).

## Pré-requisitos (Windows 11)

| Ferramenta | Versão | Instalação |
|---|---|---|
| Node.js | 24.13.0 (`.nvmrc`) | já instalado |
| Git | 2.53 ou superior | já instalado |
| WSL2 | 2.1.5 ou superior | `wsl --install` (admin, reiniciar) |
| Docker Desktop | 4.99.0 | `winget install --id Docker.DockerDesktop -e` |
| GitHub CLI | 2.104.0 | `winget install --id GitHub.cli -e` |
| Vercel CLI | 65.17.0 | `npm i -g vercel` (global, como manda a documentação) |
| Supabase CLI | 3.2.0 | devDependency do projeto; use `npx supabase` |

## Como rodar

```powershell
npm ci
copy .env.example .env.local   # preencha os valores
npx supabase start             # exige o Docker Desktop aberto (banco, job e testes pgTAP)
npm run dev                    # front + API v1 simulada em http://localhost:5173
```

No `npm run dev`, a API v1 roda dentro do Vite (`apps/web/dev/dev-api.ts`) com o mesmo handler da produção, uma rodada simulada em memória e `SOURCE_MODE=simulated`. Não precisa de Supabase, Docker nem `vercel dev` (que falha no Windows, D-34), e nada chama fonte externa. O build de produção não inclui esse código.

| Comando | O que faz |
|---|---|
| `npm run dev` | Sobe o front (Vite) com a API v1 simulada |
| `npm run build` | Gera `apps/web/dist` |
| `npm run lint` | ESLint em todo o repositório |
| `npm test` | Testes unitários (Vitest); nenhum usa rede |
| `npm run typecheck` | Verificação de tipos (`packages/core`, `packages/api`, `ingest`, `scripts`, `apps/web`) |
| `npm run ingest` | Uma rodada do job de ingestão (variáveis do ambiente) |
| `npm run notice:add` / `notice:checked` | Registro manual de avisos da Marinha e da conferência do boletim |

Antes de cada push: `npm run lint`, `npm run typecheck`, `npm test` e `npm run build` passando.

## Job de ingestão (`ingest/`)

Roda no GitHub Actions (`.github/workflows/ingest.yml`) a cada 6 h, às 02:15, 08:15, 14:15 e 20:15 UTC (fora da janela 21:01–23:59 UTC; ver P-16). Cada rodada:

1. Abre a rodada em `model_runs` (`open`). Supabase fora do ar: aborta sem chamar a fonte.
2. Coleta previsão e ondas nos 273 pontos da grade ampla e nos 81 da baía: 708 chamadas, uma coordenada por requisição. Antes de **cada tentativa** HTTP, reserva 1 chamada em `reserve_calls` (fonte `openmeteo_ingest`, teto diário `INGEST_DAILY_BUDGET`, teto por minuto `INGEST_MAX_PER_MIN`).
3. Até `INGEST_RETRY_MAX` retries (3 no GitHub) com espera de 15 s, 45 s e 135 s. Erro 429 da fonte, teto diário ou mais de `INGEST_ROUND_BUDGET` chamadas: **aborta**.
4. Recorta os 57 quadros; se faltar hora, aborta. Grava 228 arquivos em `grids/runs/<run_time>/<região>/<camada>/<instante>.json` e as linhas em `grid_layers`; só então marca `closed`.
5. Abortada: `aborted`, arquivos dela removidos, rodada anterior mantida, código de saída 1.
6. Limpeza: mantém as 2 rodadas `closed` mais recentes; remove `point_cache` com mais de 24 h e `quota_window` com mais de 2 dias.

Rodar localmente contra o stack local (dados simulados):

```powershell
npx supabase start
$env:SOURCE_MODE='simulated'; $env:SUPABASE_URL='http://127.0.0.1:54321'
$env:SUPABASE_SERVICE_ROLE_KEY='<SERVICE_ROLE_KEY de "npx supabase status">'
npm run ingest
```

## API v1 (Vercel Functions)

Uma única Function (`api/index.ts`) atende `/api/v1/*` por rewrite (`vercel.json`), como a Vercel recomenda; o código fica em `packages/api`. Erros: `{ "error": { "code", "message" } }` com `Cache-Control: no-store`.

| Endpoint | Resposta | Cache |
|---|---|---|
| `GET /api/v1/frames?layer=wind\|waves` | `meta` (`run_time`, `updated_at`, `status` ok/stale, unidades, crédito) e os 57 `times[]`. Mais de 18 h: `stale`; mais de 48 h ou sem rodada: 503 `data_expired` | `public, max-age=60` |
| `GET /api/v1/grid?layer=&run_time=&time=&bbox=&res=` | O arquivo da grade, sem processamento. `bbox`/`res` só nos pares `-54,-35,-30,5`+`2` ou `-44,-24,-42,-22`+`0.25` (ausentes = ampla). Sem `run_time`: 422; rodada inexistente: 404 `run_not_found`; mais de 48 h: 503 | `public, max-age=31536000, immutable`; `X-Source`, `X-Run-Time`, `X-Attribution` (codificado com `encodeURIComponent`) |
| `GET /api/v1/point?lat=&lon=&vars=&hours=` | Série horária no ponto arredondado a 0,25°, a partir da hora UTC atual; vento em nós. `vars` vazio = todas; `hours` ausente = 168. `status` ok/partial/stale | `public, max-age=60` |
| `GET /api/v1/notices` | Avisos válidos, crédito, link do boletim, `last_registered_at`, `last_checked_at` | `public, max-age=60` |
| `GET /api/v1/route` | 501 `not_implemented` (fase 2) | `no-store` |

**`/point`:** cache em `point_cache` (3 h; parcial 15 min; vencido servido como `stale` até 6 h só se a fonte não puder ser consultada). No miss, reserva 2 chamadas antes de chamar a fonte: teto diário operacional (3.200), 100 por minuto e 1.000 por hora globais, e **limite por cliente** de 40 por hora e 200 por dia (20 e 100 pontos novos). O cliente é identificado pelo HMAC do IP (`CLIENT_HASH_SECRET`); o IP bruto nunca é gravado e os contadores somem em 2 dias. Negado: 503 `quota_exhausted` (dia) ou 429 `rate_limited`, com `Retry-After`. Supabase fora do ar: 503 sem chamar a fonte.

Variáveis da Vercel: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` e `CLIENT_HASH_SECRET` (sensíveis), `SOURCE_MODE=live`, `OPENMETEO_FORECAST_URL`, `OPENMETEO_MARINE_URL`; as demais do B9 são opcionais.

## Avisos da Marinha (registro manual)

Sem scraping. Leia o boletim oficial (https://www.marinha.mil.br/chm) e, com o `.env.local` preenchido:

```powershell
npm run notice:add -- --title "Aviso de mau tempo" --body "Texto do aviso" --url "https://www.marinha.mil.br/chm" --valid-until "2026-11-20T00:00Z"
npm run notice:checked   # sempre, com ou sem aviso novo
```

## Workflows do GitHub Actions

| Workflow | Quando | O que faz |
|---|---|---|
| `ci.yml` | push no `main` e PR | lint, tipos, testes, build, sem maré no Git (AC-MVP-09), sem chave de serviço (AC-MVP-13), pgTAP no stack local (AC-MVP-14) |
| `ingest.yml` | cron a cada 6 h e manual | job de ingestão |
| `notice-reminder.yml` | diário, 11:00 UTC | abre ou atualiza a issue "Conferir avisos da Marinha" se a última conferência passar de `NOTICE_CHECK_MAX_AGE_H` |
| `heartbeat.yml` | dia 1 de cada mês | commit do bot em `.github/heartbeat.txt`, para o GitHub não desativar os agendamentos após 60 dias |

Configuração no GitHub (Settings > Secrets and variables > Actions): secret `SUPABASE_SERVICE_ROLE_KEY`; variables `SUPABASE_URL`, `SOURCE_MODE=live`, `OPENMETEO_FORECAST_URL`, `OPENMETEO_MARINE_URL`. As demais variáveis do B9 são opcionais (vazio = padrão). Actions fixadas por SHA; `heartbeat.yml` é o único com permissão de escrita.

## Banco de dados (Supabase)

Migrações em `supabase/migrations/` (sempre criadas com `npx supabase migration new <nome>`) e testes pgTAP em `supabase/tests/database/`.

```powershell
npx supabase start          # stack local (Docker Desktop aberto)
npx supabase db reset       # recria o banco local e aplica as migrações
npx supabase test db        # testes pgTAP (RLS fechada e reserve_calls)
npx supabase db lint        # erros de tipo nas funções
npx supabase db advisors    # advisors de segurança e desempenho
npx supabase stop
```

- **Esquema:** tabelas da especificação (B8). RLS ativa em todas, **sem nenhuma política**; `anon` e `authenticated` sem privilégio. Só o papel de serviço acessa (Functions, job e scripts locais).
- **`reserve_calls(at, source, n, day_limit, hour_limit, minute_limit)`:** reserva atômica de chamadas ao Open-Meteo antes de chamar a fonte. Verifica dia, hora e minuto (UTC), nessa ordem; limite nulo não se aplica; se negar, não incrementa nada e devolve o motivo (`day`, `hour` ou `minute`). Só o `service_role` executa.
- **Storage:** bucket privado `grids` (`GRID_BUCKET`) [PROPOSTA], sem políticas.
- **Advisors:** os avisos `rls_enabled_no_policy` (nível INFO) são intencionais: nenhuma tabela deve ser acessível pela Data API.
- **Skills do Claude Code:** `supabase` e `supabase-postgres-best-practices` (MIT) em `.claude/skills/`, versão fixada em `skills-lock.json`. Restaurar: `npx skills experimental_install`.

## Estrutura

```text
apps/web/            front-end (Vite + TypeScript, sem framework de UI)
api/v1/              Vercel Functions (/api/v1/*)
ingest/              job de ingestão (GitHub Actions; Node 24 roda o TypeScript direto)
packages/core/       código comum: adaptadores de fonte, conversões, tempo, quadros, vencimento
packages/api/        rotas da API v1 (usadas pela Function api/index.ts)
supabase/            config da CLI e migrações
scripts/             avisos, importação local de maré, verificações de CI
docs/                especificação, plano, pendências, modelos
.github/workflows/   ingestão, CI, lembrete de avisos, heartbeat
```

## Front-end (`apps/web`)

- Mapa Leaflet 1.9.4 **sem tiles** (AC-MVP-10): fundo da cor do mar e terra do Natural Earth 10m recortada em `apps/web/public/data/land.geojson` (cerca de 130 KB).
- Vento: partículas do leaflet-velocity 2.1.4 (T-11: funciona com o Leaflet 1.9.4 sem patch; o plugin usa o `L` global, exposto em `src/leaflet-global.ts`).
- Ondas: camada própria em Canvas (`src/waves-layer.ts`), interpolação bilinear com a regra de nulos do B6 e setas no sentido de propagação.
- Grade: baía (`-44,-24,-42,-22`, 0,25°) com zoom a partir de `BAY_GRID_MIN_ZOOM` (variável de **build**, padrão 9) e centro dentro do bbox da baía; senão a ampla (AC-MVP-27).
- Barra de tempo: quadros de 3 h no fuso do aparelho, play e pré-carga de 3 quadros à frente.
- Vista inicial: Enseada de São Francisco (-22,915, -43,105), zoom 10 (T-05).
- Textos em `apps/web/src/i18n/{pt-BR,en}.json`; o teste confere as mesmas chaves nos dois idiomas.

Para regenerar a costa (arquivos de entrada fora do repositório):

```powershell
# baixe ne_10m_land.geojson e ne_10m_minor_islands.geojson da tag v5.1.2 de
# https://github.com/nvkelso/natural-earth-vector (pasta geojson/)
node scripts/coast.ts <ne_10m_land.geojson> <ne_10m_minor_islands.geojson>
```

## Variáveis de ambiente

Todas estão em [.env.example](.env.example), com os padrões da especificação (B9). Segredos (`SUPABASE_SERVICE_ROLE_KEY`, `VAPID_PRIVATE_KEY`) ficam só em `.env.local`, nos secrets do GitHub Actions e no Vercel. Nunca no repositório.

## Fontes de dados (adaptadores)

`packages/core` tem os adaptadores do Open-Meteo (previsão e Marine) e uma fonte simulada. `SOURCE_MODE` é **obrigatório**: `live` usa o Open-Meteo, `simulated` gera dados determinísticos sem rede (dev e testes). Em `live`, sem `OPENMETEO_FORECAST_URL` e `OPENMETEO_MARINE_URL` o app falha antes de chamar a fonte.

- Endpoints (T-07, lidos em 17/11/2026): `https://api.open-meteo.com/v1/forecast` e `https://marine-api.open-meteo.com/v1/marine`.
- Uma coordenada por requisição. A resposta não informa o modelo: sem `OPENMETEO_MODEL_*`, a rodada grava `auto`.
- Tempo canônico: `YYYY-MM-DDTHH:mm:ssZ`. Ausente é `null`, nunca zero. Em terra, as ondas vêm `null` (T-15).
- Detalhes e sondagens: [docs/MODELOS.md](docs/MODELOS.md).

### Arquivo de vento para o leaflet-velocity (T-01)

Lido no demo da tag `v2.1.4` (o pacote do npm não traz `demo/`) e no código do plugin:

| Campo | U | V |
|---|---|---|
| `parameterCategory` | 2 | 2 |
| `parameterNumber` | 2 | 3 |
| `parameterUnit` | `m.s-1` | `m.s-1` |

`dx` e `dy` positivos, `la1 > la2` (norte para sul). `data[]` plano, por linhas, de norte para sul e de oeste para leste. O plugin data o quadro por `refTime` + `forecastTime`. Constantes em `packages/core/src/grid/velocity-header.ts`.

## Ressalvas e valores provisórios

- Itens [A CONFIRMAR], decisões e resultado das tarefas: [docs/PENDENCIAS.md](docs/PENDENCIAS.md).
- Valores [PROPOSTA] são configuráveis pelas variáveis de ambiente.
- Deploy de produção automático está desligado em `vercel.json` (`git.deploymentEnabled.main = false`) até a liberação do dono.

## Fontes e créditos

- Previsão: "Dados: Open-Meteo.com (CC BY 4.0)". Uso não comercial.
- Avisos: "Fonte: Marinha do Brasil, CHM/DHN".
- Costa: "Made with Natural Earth." (domínio público; Natural Earth 10m, v5.1.2).
- Licenças de terceiros publicadas com o app em `/licenses/` (Leaflet, leaflet-velocity).

## Licença

Código sob a licença [MIT](LICENSE). As licenças de terceiros (Leaflet, leaflet-velocity) são mantidas.
