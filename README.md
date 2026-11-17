# Mariner's Compass Meteorologia

App de previsão do tempo para quem navega na Enseada de São Francisco, Niterói-RJ, na Baía de Guanabara. Mostra vento e ondas num mapa animado, com barra de tempo, previsão hora a hora do ponto tocado e os avisos oficiais da Marinha. Funciona no celular e no computador, em português e em inglês.

Gratuito, sem anúncios e sem assinatura. Sem vínculo oficial com o Iate Clube Brasileiro (ICB).

> **Aviso:** este app não substitui os boletins e avisos oficiais da Marinha do Brasil. Ele mostra previsões de modelos numéricos, não medições. Consulte sempre o boletim oficial antes de sair.

**Estado:** etapa 1 de 7 (estrutura inicial). Ainda não há funcionalidade. Plano: [docs/PLANO-EXECUCAO.md](docs/PLANO-EXECUCAO.md). Especificação: [docs/ESPECIFICACAO.md](docs/ESPECIFICACAO.md).

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
| `npm test` | Testes unitários (Vitest) |
| `npm run notice:add` / `notice:checked` | Registro de avisos da Marinha (implementados na etapa 5) |

Antes de cada push: `npm run lint`, `npm test` e `npm run build` passando.

## Estrutura

```text
apps/web/            front-end (Vite + TypeScript, sem framework de UI)
api/v1/              Vercel Functions (/api/v1/*)
ingest/              job de ingestão (GitHub Actions)
supabase/            config da CLI e migrações
scripts/             avisos, importação local de maré, verificações de CI
docs/                especificação, plano, pendências, modelos
.github/workflows/   ingestão, CI, lembrete de avisos, heartbeat
```

## Variáveis de ambiente

Todas estão em [.env.example](.env.example), com os padrões da especificação (B9). Segredos (`SUPABASE_SERVICE_ROLE_KEY`, `VAPID_PRIVATE_KEY`) ficam só em `.env.local`, nos secrets do GitHub Actions e no Vercel. Nunca no repositório.

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
