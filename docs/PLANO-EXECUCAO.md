# Plano de execução: Mariner's Compass Meteorologia

## Contexto

Projeto vazio. Só existem `.claude/CLAUDE.md` (regras) e a especificação `prompt-mariners-compass_2026-11-17.md`, ambos numa pasta do OneDrive. O B15 da especificação define 7 etapas. Este plano detalha a **etapa 1 (estrutura inicial com as CLIs)** e resume as etapas 2 a 7, que terão plano próprio (modo de planejamento antes de cada uma).

Decisões do dono (17/11/2026):
- Repositório em `C:\dev\mariners-compass`, fora do OneDrive.
- Instalar WSL2 e Docker Desktop para o `supabase start` local.
- Node 24 (já instalado, v24.13.0) no lugar do Node 22 [PROPOSTA]. Registrar em `docs/PENDENCIAS.md`.
- Nome: `mariners-compass-meteo` (GitHub, Vercel e Supabase).

Estado da máquina: Node v24.13.0, npm 11.6.2, git 2.53, winget 1.29 presentes. **Ausentes:** `gh`, `supabase`, `vercel`, Docker, WSL.

## Passo 0

Salvar este plano como `PLANO-EXECUCAO.md` na raiz do projeto atual (`...\AMM - Avisos Marírtimos e Meteriológicos\`). No passo 1.2, ele é copiado para `C:\dev\mariners-compass\docs\PLANO-EXECUCAO.md`.

## Paradas obrigatórias (pergunto antes)

- **P1:** você roda `wsl --install` como admin e reinicia o PC.
- **P2:** você faz os logins interativos (`gh auth login`, `npx supabase login`, `npx vercel login`), pelo prefixo `!` no chat ou no seu terminal.
- **P3:** a licença do código (MIT [PROPOSTA]), antes do primeiro push.
- **P4:** `gh repo create` (cria um repositório público, ação externa).
- **P5:** a criação do projeto Supabase (região sugerida: `sa-east-1`, São Paulo).
- **P6:** `vercel link` (cria o projeto Vercel).
- **P7:** a cada cadastro de secret (`gh secret set`, `vercel env add`).

## Etapa 1: estrutura inicial

### 1.1 Pré-requisitos (T-17)
1. Ler a documentação oficial do Docker Desktop para Windows: requisitos e condições de uso gratuito. Registrar em `docs/PENDENCIAS.md`.
2. Verificar a virtualização: `systeminfo` / `Get-ComputerInfo` (só leitura).
3. **P1:** `wsl --install`, reiniciar, depois `wsl --status`.
4. `winget search Docker.DockerDesktop` e `winget search GitHub.cli`: confirmar os IDs, sem presumir. Depois `winget install --id <ID confirmado> -e`.
5. Supabase CLI e Vercel CLI como **devDependencies com versão exata** (`supabase`, `vercel`), usadas via `npx`. Antes, confirmar na documentação oficial de cada um que esse método é suportado no Windows. Assim as versões ficam fixadas no `package-lock.json`.
6. Confirmar na documentação do Playwright que o Node 24 é suportado.

### 1.2 Pasta e git
1. Criar `C:\dev\mariners-compass` e copiar `.claude/CLAUDE.md`.
2. Copiar a especificação para `docs/ESPECIFICACAO.md` e corrigir o link no `CLAUDE.md`. O arquivo original fica no OneDrive.
3. `git init -b main`.

### 1.3 Raiz (npm workspaces)
- `package.json` na raiz: `"private": true`, `"workspaces": ["apps/web", "ingest"]`, `"engines": { "node": "24.13.0" }`. Scripts `lint`, `test`, `build`, `notice:add`, `notice:checked` (os dois últimos como stub até a etapa 5).
- `.npmrc` com `save-exact=true`, para que nenhum `^`/`~` entre em instalações.
- `.nvmrc` com `24.13.0`.
- `tsconfig.base.json` compartilhado. O `api/` usa as dependências da raiz.
- ESLint e Vitest na raiz, com versões exatas. Playwright fica para a etapa 7.

### 1.4 Front: `npm create vite`
1. `npm create vite@latest -- --help`: conferir as flags da versão atual (modo não interativo, sem instalar e sem `dev`).
2. `npm create vite@latest apps/web -- --template vanilla-ts`, com TypeScript e sem framework de UI, como pede o B15.
3. Trocar `^`/`~` por versões exatas no `apps/web/package.json`. Apagar o conteúdo demo do template.
4. Criar `apps/web/src/i18n/pt-BR.json` e `en.json` vazios. A estrutura de textos começa já com os dois idiomas.

### 1.5 Banco: `supabase init`
1. `npx supabase init` na raiz, que gera `supabase/config.toml`.
2. `npx supabase start` só para testar a stack (Docker funcionando), depois `npx supabase stop`.
3. Migrações ficam para a etapa 2.

### 1.6 Estrutura restante (B9)
`api/v1/`, `ingest/` (com `package.json` próprio), `scripts/ci/`, `docs/`, `.github/workflows/`. Arquivos vazios ou `.gitkeep` só onde for preciso.

### 1.7 Arquivos de governança
- `.gitignore`: `node_modules/`, `dist/`, `.env*` (exceto `.env.example`), `.vercel/`, `supabase/.temp/`, `*.pdf`, `*.csv`, `tides/`, `data-private/`.
- `.env.example` com todas as variáveis do B9, sem valores secretos.
- `docs/PENDENCIAS.md` com P-01, P-03 a P-07, P-09, P-11, P-12 e P-15 (tabela do B15) e a decisão sobre o Node 24.
- `docs/MODELOS.md` com esqueleto (preenchido na etapa 3).
- `README.md`: o que é, avisos, como rodar, variáveis.
- `vercel.json`: `buildCommand` `npm run build -w apps/web`, `outputDirectory` `apps/web/dist` e **`"git": { "deploymentEnabled": { "main": false } }`**. Isso impede deploy de produção automático no push para `main` até a T-10 e a sua liberação.

### 1.8 T-10 (termos do Vercel)
Ler https://vercel.com/terms e as diretrizes de uso justo, localizar a seção do Hobby e registrar a evidência em `docs/PENDENCIAS.md`. Se houver vedação, parar e avisar.

### 1.9 Contas e vínculos (com paradas)
1. **P2:** logins.
2. **P3:** licença, depois `LICENSE`.
3. `npm run lint && npm test && npm run build` passando.
4. Primeiro commit (pt-BR).
5. **P4:** `gh repo create mariners-compass-meteo --public --source . --remote origin --push`.
6. **P5:** criar o projeto Supabase Free `mariners-compass-meteo` (pelo painel ou pelo MCP), depois `npx supabase link --project-ref <ref>`.
7. **P6:** `npx vercel link --project mariners-compass-meteo`, conectado ao repositório GitHub. Os previews continuam liberados.
8. **P7:** secrets, só quando forem necessários (etapas 4 e 5).

## Etapas 2 a 7 (resumo; cada uma com plano próprio)

2. Skill do Supabase (`npx skills add supabase/agent-skills`), migrações (B8), RLS sem política para `anon`/`public`, RPC `reserve_calls`, advisors.
3. Adaptadores com fonte simulada e testes de unidade (AC-03, 24, 25). T-01, T-07, T-08, T-14 e T-15.
4. Job de ingestão (simulado, depois Open-Meteo), duas regiões, workflows (ingestão, CI, lembrete diário, heartbeat).
5. Functions `/frames`, `/grid`, `/point`, `/notices` e scripts de avisos. T-02 e T-09.
6. Front (Leaflet 1.9.4, leaflet-velocity, ondas em Canvas, pt-BR/en, 3 modos). T-05, T-11 e T-16.
7. E2E (Playwright), code-review, security-review, simplify; reconfirmar a T-10; **deploy de produção só com a sua aprovação**; T-03 na 1ª semana.

## Verificação da etapa 1

- `node -v` = v24.13.0; `wsl --status` OK; `docker version` OK; `gh --version`; `npx supabase --version`; `npx vercel --version`.
- `npm ci` sem erro; `npm run lint`, `npm test` e `npm run build` passando; `apps/web/dist` gerado.
- Nenhum `^`/`~` nos `package.json` (busca no repositório).
- `npx supabase start` sobe a stack; `npx supabase status` mostra os serviços; `stop` em seguida.
- `git ls-files` sem `.env`, PDF ou CSV.
- `gh repo view` mostra o repositório público; o preview do Vercel gera build verde; nenhum deploy de produção criado.
