# Mariner's Compass Meteorologia

App de previsão do tempo para quem navega na Enseada de São Francisco, Niterói-RJ, na Baía de Guanabara. Mostra vento e ondas num mapa animado, com barra de tempo, previsão hora a hora do ponto tocado e os avisos oficiais da Marinha. Funciona no celular e no computador, em português e em inglês.

Gratuito, sem anúncios e sem assinatura. Sem vínculo oficial com o Iate Clube Brasileiro (ICB).

> **Aviso:** este app não substitui os boletins e avisos oficiais da Marinha do Brasil. Ele mostra previsões de modelos numéricos, não medições. Consulte sempre o boletim oficial antes de sair.

**Estado:** etapa 3 de 7 (adaptadores de fonte e lógica comum). Ainda não há funcionalidade para o usuário. Plano: [docs/PLANO-EXECUCAO.md](docs/PLANO-EXECUCAO.md). Especificação: [docs/ESPECIFICACAO.md](docs/ESPECIFICACAO.md).

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
npx supabase start             # exige o Docker Desktop aberto
npm run dev                    # front em modo de desenvolvimento
```

| Comando | O que faz |
|---|---|
| `npm run dev` | Sobe o front (Vite) |
| `npm run build` | Gera `apps/web/dist` |
| `npm run lint` | ESLint em todo o repositório |
| `npm test` | Testes unitários (Vitest); nenhum usa rede |
| `npm run typecheck` | Verificação de tipos do `packages/core` |
| `npm run notice:add` / `notice:checked` | Registro de avisos da Marinha (implementados na etapa 5) |

Antes de cada push: `npm run lint`, `npm test` e `npm run build` passando.

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
ingest/              job de ingestão (GitHub Actions)
packages/core/       código comum: adaptadores de fonte, conversões, tempo, quadros, vencimento
supabase/            config da CLI e migrações
scripts/             avisos, importação local de maré, verificações de CI
docs/                especificação, plano, pendências, modelos
.github/workflows/   ingestão, CI, lembrete de avisos, heartbeat
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
- Costa: "Made with Natural Earth."

## Licença

Código sob a licença [MIT](LICENSE). As licenças de terceiros (Leaflet, leaflet-velocity) são mantidas.
