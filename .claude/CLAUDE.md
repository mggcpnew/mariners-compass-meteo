# Mariner's Compass Meteorologia

App meteorológico náutico (PWA) para a Enseada de São Francisco, Niterói-RJ (sede do Iate Clube Brasileiro, ICB), na Baía de Guanabara. Mostra vento e ondas num mapa animado, com barra de tempo, painel do ponto (meteograma) e avisos oficiais da Marinha. Gratuito, não comercial, sem anúncios, sem assinatura. Sem vínculo oficial com o ICB.

**Especificação completa:** [docs/ESPECIFICACAO.md](../docs/ESPECIFICACAO.md). Plano de execução: [docs/PLANO-EXECUCAO.md](../docs/PLANO-EXECUCAO.md). Consulte a seção certa quando precisar de detalhe (não carregue o arquivo inteiro sem necessidade):

- B5 adaptadores · B6 ingestão e grades · B7 contrato da API v1 · B8 dados e RLS
- B9 ambiente e variáveis · B10 identidade visual · B11 critérios de aceite
- B14 pendências e tarefas (T-01 a T-17) · B15 prompt final e ordem de execução

Em conflito entre este arquivo e a especificação, vale a especificação; avise o dono da divergência.

## Como trabalhar

1. Responder e escrever sempre em **português do Brasil**.
2. Respostas curtas e diretas no chat. Documentação, commits e textos de interface continuam completos.
3. Fazer só o escopo pedido. Melhoria extra se **oferece no fim**; não se implementa junto.
4. **Avisar sempre** que uma alteração deixar o sistema mais vulnerável, mesmo quando foi pedida.
5. **Antes do push:** `npm run lint`, `npm test` e `npm run build` passando.
6. Usar o **modo de planejamento** antes de cada etapa da ordem de execução (B15) e antes de cada fase.
7. Nunca inventar fatos, URLs, nomes de pacotes, identificadores do `winget` nem modelos. O que pode ser descoberto lendo uma página ou rodando um teste é **tarefa** (B14.2): execute e registre.

### Autonomia

Nos itens [A CONFIRMAR], siga o padrão seguro e registre. **Pare e pergunte ao dono** antes de:

- deploy em produção no Vercel;
- trocar ou ativar fonte de dados (ex.: `GRID_SOURCE=noaa`, outro modelo, nova API);
- decidir a licença do código (padrão proposto: MIT);
- criar repositório, projeto Supabase ou projeto Vercel, ou mudar configuração nessas contas;
- cadastrar ou alterar secrets.

## Marcadores

- **[PENDENTE-BLOQUEANTE]:** construa, mas não publique em produção. Registre em `docs/PENDENCIAS.md`.
- **[A CONFIRMAR]:** siga o padrão seguro; anote no README. Tarefa: execute e registre o resultado. Pendência: registre em `docs/PENDENCIAS.md`.
- **[PROPOSTA]:** use o valor sugerido, sempre configurável (env var ou constante nomeada). Documente no README.
- Item resolvido sai da lista de incertezas. [A CONFIRMAR] sem padrão seguro vira [PENDENTE-BLOQUEANTE].

## Idiomas

- Documentação e mensagens de commit: pt-BR.
- Identificadores de código (variáveis, funções, tabelas, endpoints): inglês.
- Textos da interface: arquivos `pt-BR` e `en`, ambos desde o início. Nenhum texto fixo no código.

## Arquitetura (invariantes)

`navegador -> API no Vercel -> Supabase (banco + Storage privado) <- job no GitHub Actions -> fontes externas`

- O navegador **nunca** chama fonte externa nem o Supabase. Só a API do app e os arquivos do app.
- Vercel só repassa e guarda em cache (Hobby: 4 h de Active CPU/mês). `/grid` e `/frames` só leem do Supabase.
- **Só `/point` chama o Open-Meteo**, dentro do orçamento e dos tetos por minuto e hora (RPC `reserve_calls`, reserva **antes** de chamar).
- Coleta pesada só no GitHub Actions (cron a cada 6 h). Sem Vercel Cron. Sem Cloudflare.
- Supabase indisponível: **fail-closed** (503 `service_unavailable`), sem chamar a fonte.
- Sem `OPENMETEO_FORECAST_URL` / `OPENMETEO_MARINE_URL`: falha com erro claro, sem chamar a fonte.
- Rodada só é publicada completa (228 arquivos). Incompleta: `aborted`, mantém a anterior.
- Cada fonte fica atrás de um adaptador com versão simulada (`SOURCE_MODE=simulated`).

## Unidades e tempo

- Todo tempo em ISO 8601 UTC com `Z`. O Open-Meteo devolve GMT sem `Z`: normalize. A interface exibe no fuso do aparelho.
- Grade: vento em m/s (`wind_speed_unit=ms`). `/point`: vento em nós (`wind_speed_unit=kn`).
- Direção em graus, **de onde sopra**. Conversão: `u = -s*sen(d)`, `v = -s*cos(d)`. Seta de onda = `(direção + 180) mod 360`.
- 1 nó = 1852 m / 3600 s. Alturas em m, períodos em s, correntes em km/h.
- Todo adaptador declara a unidade em `meta.units`.
- Valor ausente é `null`, **nunca zero**.
- Quadros em múltiplos de 3 h UTC; 57 quadros por camada e região; `forecast_days=9`.
- Contagem de cota: **uma chamada HTTP efetiva = 1**, inclusive retries. Uma coordenada por requisição até a T-07 confirmar outra regra.

## Fontes, créditos e proibições

- Open-Meteo: só uso não comercial. Crédito sempre visível: "Dados: Open-Meteo.com (CC BY 4.0)".
- Marinha: "Fonte: Marinha do Brasil, CHM/DHN". **Sem scraping.** Avisos entram só por `npm run notice:add`; conferência por `npm run notice:checked`.
- Maré: "Fonte: Centro de Hidrografia da Marinha (CHM/DHN) – Marinha do Brasil". Só previsão. **CSV e PDF de maré nunca entram no Git.**
- NOAA: `GRID_SOURCE=noaa` desligado até T-04 e T-12.
- Costa: Natural Earth. **Tiles do OpenStreetMap proibidos em produção.** PMTiles fora do escopo.
- Windy e PredictWind são só inspiração de interação: não copiar marca, layout, paleta nem ativos.
- Manter os LICENSE de terceiros (Leaflet, leaflet-velocity). Não rebaixar o Leaflet 1.9.4; se o plugin falhar, vendorizar em `apps/web/vendor/leaflet-velocity` com `PATCHES.md`.

## Segurança e dados

- RLS ativa em **todas** as tabelas, **sem política para `anon` nem para `public`**. Só o papel de serviço acessa.
- `SUPABASE_SERVICE_ROLE_KEY` só em secrets e `.env.local`. Nunca no front nem no repositório.
- Storage privado. Repositório público: nada de segredo, nada de dado de maré.
- Ler logs e advisors do Supabase antes de mudar o banco. Migrações só via Supabase CLI em `supabase/migrations/`.
- Fase 2 (push): coordenadas arredondadas a 0,25°, sem identificar o usuário, sem analytics de terceiros.

## Textos obrigatórios da interface

- Rodapé fixo: "Dados de modelos numéricos. Não substitui previsão oficial da Marinha do Brasil para navegação."
- Modal de segurança na primeira abertura.
- Faixa de avisos: "Os avisos oficiais entram no app por registro manual e podem atrasar ou faltar. Consulte sempre o boletim oficial da Marinha."
- Aviso de resolução em cada tela (mapa amplo, mapa da baía, painel do ponto): textos exatos em B10.
- Rótulo da fonte em cada tela. Tudo em pt-BR e en.

## Visual e acessibilidade

- Modos claro, escuro e noturno (noturno: só vermelho e preto; escalas por luminância com rótulos numéricos).
- Contraste mínimo AA; meta AAA nos valores principais. Alvos de toque >= 44 px; ações principais embaixo.
- Tipografia do sistema, sem webfont; números tabulares. Tokens de cor em B10.

## Stack e comandos

- Front: TypeScript + Vite, sem framework de UI; Leaflet 1.9.4; leaflet-velocity; camada de ondas própria em Canvas.
- API: Vercel Functions em TypeScript (`api/`). Job: TypeScript em `ingest/`.
- Banco: Supabase Free. Testes: Vitest (unidade) e Playwright (E2E). Gerenciador: npm.
- Versões exatas (sem `^` nem `~`); `npm ci` na CI; Node fixado em `.nvmrc` e `engines`.
- Dev local: `supabase start` (exige Docker Desktop), `.env.local`, `vercel dev`.
- Ambiente: Windows 11 com PowerShell.
- Nenhum teste automatizado chama fonte real. Exceção: sondagens T-07 e T-15 (máximo 10 chamadas, em `docs/MODELOS.md`).

## Documentos a manter

- `docs/PENDENCIAS.md`: colunas ID | Decisão e padrão | Data | Motivo | Evidência | Responsável.
- `docs/MODELOS.md`: modelos, resolução, cobertura, termos, URL, data da leitura e sondagens.
- `README.md`: ressalvas [A CONFIRMAR], valores [PROPOSTA] e todas as variáveis de ambiente.
- `.env.example` sem segredos.
