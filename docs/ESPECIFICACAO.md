# Prompt de criação do app "Mariner's Compass Meteorologia"

**Entregável:** prompt de criação de aplicativo para o Claude Code construir do zero (versão 3, revisada)
**Data:** 17/11/2026
**Leitores:** velejadores e marinheiros (Parte A); equipe de desenvolvimento e Claude Code (Parte B)

> **Aviso:** este app não substitui os boletins e avisos oficiais da Marinha do Brasil, do INMET (Instituto Nacional de Meteorologia) ou do DECEA (Departamento de Controle do Espaço Aéreo, órgão da aviação). Também não tem vínculo oficial com o Iate Clube Brasileiro (ICB).

**Neste documento:** [Parte A, visão do produto](#parte-a-visão-do-produto) (para quem navega) e [Parte B, especificação técnica e prompt final](#parte-b-especificação-técnica-e-prompt-final) (para a equipe e para o Claude Code). Os marcadores técnicos estão explicados no início da Parte B.

---

# Parte A: Visão do produto

## A1. O que é

O Mariner's Compass Meteorologia é um app de previsão do tempo feito para quem navega. Ele mostra vento e ondas num mapa em movimento. Você vê o vento correndo sobre a água e avança as horas com uma barra de tempo.

O foco é a Enseada de São Francisco, em Niterói, onde fica a sede do Iate Clube Brasileiro (ICB), na Baía de Guanabara. O app funciona no celular e no computador. Está em português e em inglês desde o início.

O app é gratuito, sem anúncios e sem assinatura. Ele usa só fontes de dados gratuitas.

## A2. Para quem

O app serve a quem sai da enseada em qualquer tipo de barco. São veleiros grandes e pequenos, Optimist, dingue e Laser. Também prancha de vela, canoa, jet ski, bote e lancha.

Serve para regata e para passeio. Quem compete quer saber como o vento oscila e vira. Quem passeia quer saber se o dia está bom para sair.

## A3. O que ajuda a fazer

O app chega em etapas. A **primeira versão** traz o essencial: o mapa de vento e ondas, o painel do ponto, os avisos oficiais e as telas em português e inglês. A **fase 2** acrescenta alertas, escolha da hora de sair, maré e mais camadas de mapa. A **fase 3** acrescenta correntes, dados de estações, comparação de modelos e, só se não houver custo, a instalação por loja de aplicativos. Sem isso, o app continua instalável pelo navegador.

**Planejar antes de sair.** Você abre o mapa e passa as horas pela barra de tempo. Vê quando o vento aperta ou acalma. Toca num ponto da água e lê a previsão daquele lugar, hora a hora.

**Consultar a bordo.** As telas foram pensadas para ler sob o sol forte e para usar com uma só mão. Os botões principais ficam embaixo. À noite, o modo noturno usa só vermelho e preto, para não ofuscar a vista.

**Receber alertas (fase 2).** Você define seus próprios limites, por exemplo vento acima de 20 nós. O app avisa quando a previsão passar do limite.

**Escolher a hora de sair (fase 2).** Você marca o percurso e o app mostra em que horários a saída fica viável, pede atenção ou fica inviável, segundo os seus limites. Isso se chama rota com janela de partida.

**Regata (fases 2 e 3).** O app mostra as oscilações e as viradas do vento ao longo do dia. Mais tarde, compara modelos lado a lado. Se existir uma estação pública de vento na baía, mostra o que ela mede.

## A4. O que NÃO faz

- **Não substitui os boletins da Marinha.** Os avisos de mau tempo e a previsão oficial vêm da Marinha do Brasil. Consulte-os sempre antes de sair.
- **O aviso da Marinha no app depende de registro manual.** Ele só aparece quando o responsável pelo app o registra à mão. Pode atrasar ou faltar. Se o app não mostra aviso, isso não quer dizer que não exista aviso oficial. Confira sempre o boletim oficial.
- **Não é uma estação em tempo real.** O app mostra previsões de modelos de computador. Ele não mede o vento na sua posição agora.
- **O mapa não representa o vento local.** Ele é montado a partir de pontos de dados espaçados. No mapa amplo, o espaço entre os pontos é de 2 graus, cerca de 220 km (cálculo: 2 × 111 km). Ao aproximar na Baía de Guanabara, o mapa passa a usar pontos de 0,25 grau, cerca de 28 km (0,25 × 111 km). A enseada é muito menor que isso. O vento junto ao morro, à ponte ou à entrada da baía pode ser bem diferente do mostrado.
- **Ainda não há um modelo gratuito mais fino para a enseada.** Até agora, a equipe do projeto não encontrou nenhum. Ela continua procurando e, se achar, o app será atualizado.

Por isso o app mostra, em cada tela, um aviso sobre o nível de detalhe do mapa.

## A5. De onde vêm as informações

| O que você vê | Quem fornece | Quando aparece |
|---|---|---|
| Vento e ondas no mapa e no ponto | Open-Meteo, que reúne modelos de previsão | Primeira versão |
| Avisos de mau tempo | Marinha do Brasil. CHM é o Centro de Hidrografia da Marinha; DHN é a Diretoria de Hidrografia e Navegação | Primeira versão, em destaque e com link para o boletim oficial |
| Linha da costa | Natural Earth, dados de uso livre. A costa é simplificada e pode não mostrar os detalhes da enseada | Primeira versão |
| Chuva, temperatura e pressão | Open-Meteo | Fase 2 |
| Maré | Tábua de marés da Marinha (CHM/DHN), com crédito à Marinha | Fase 2 |
| Observações de estações | INMET, boletins de aeroporto (METAR) e boias, se confirmados | Fase 3 |
| Correntes | Serviço europeu Copernicus Marine | Fase 3 |

METAR é o boletim que informa o tempo observado num aeroporto, em código padronizado. DECEA é o órgão da aviação responsável pelo controle do espaço aéreo. ICB é o Iate Clube Brasileiro. INMET é o Instituto Nacional de Meteorologia.

Cada tela mostra o nome da fonte. O crédito à Marinha e ao Open-Meteo fica sempre visível.

## A6. Como ler a tela

- **Mapa:** setas e linhas animadas mostram para onde o vento sopra. A cor indica a força. A legenda de cores fica sempre visível. Ao aproximar na Baía de Guanabara, o mapa troca para pontos mais próximos entre si.
- **Barra de tempo:** fica embaixo. O botão de play avança as horas. As horas aparecem no fuso do seu aparelho.
- **Painel do ponto:** abre ao tocar na água. Mostra vento, rajada e ondas, hora a hora, num gráfico chamado meteograma. Meteograma é um gráfico que mostra a previsão ao longo do tempo. **Para quem está na enseada, é a principal referência do app**, porque dá a previsão hora a hora do ponto tocado. Mesmo assim, é previsão de modelo e não mede o vento no seu local.
- **Faixa de aviso:** quando há aviso oficial registrado, ele aparece em destaque, com o crédito à Marinha, a data do último registro e a data da última conferência do boletim. Sem aviso registrado, o app diz isso e aponta o boletim oficial. Lembre: o registro é manual e pode atrasar.
- **Unidades:** o vento pode ser lido em nós, km/h ou m/s. Um nó é uma milha náutica por hora. A altura das ondas vem em metros.
- **Valores do mapa e do ponto podem diferir.** O mapa é montado a partir de pontos espaçados. O painel do ponto pede a previsão da coordenada tocada, arredondada a 0,25 grau (cerca de 28 km).

## A7. Como começar

1. **Abra o app** no navegador do celular. Você pode instalá-lo na tela inicial.
2. **Leia o aviso de segurança** que aparece na primeira abertura. Ele lembra que o app não substitui a Marinha.
3. **Toque na água** onde pretende navegar. Veja o vento e as ondas das próximas horas. Depois consulte o boletim oficial.

---

# Parte B: Especificação técnica e prompt final

## Como ler a Parte B

Três marcadores aparecem ao longo do texto. Cada um diz o que fazer.

- **[PENDENTE-BLOQUEANTE]**: falta uma decisão humana. Pode-se construir, mas não publicar o item afetado.
- **[A CONFIRMAR]**: não foi possível verificar. Todo item traz um padrão seguro, que vale até a confirmação. Se bastar ler uma página ou rodar um teste, o item tem uma **tarefa** (B14.2) e aparece como "[A CONFIRMAR, tarefa T-xx]". Se depender de uma decisão ou de uma resposta externa, é uma **pendência** (B14.1).
- **[PROPOSTA]**: sugestão da redação, configurável. Pode mudar, desde que registrada. Textos da Parte A que são sugestão, como o aviso de ausência de vínculo oficial com o ICB, são [PROPOSTA].

Tudo o que o Claude Code pode descobrir lendo uma página ou rodando um teste é **tarefa** (B14.2), não pendência.

**Sumário da Parte B:** [B1](#b1-escopo-e-decisões-fechadas) · [B2](#b2-regras-de-governança) · [B3](#b3-fontes-formato-acesso-frequência-e-conformidade) · [B4](#b4-arquitetura) · [B5](#b5-adaptadores-de-fonte) · [B6](#b6-ingestão-e-grades) · [B7](#b7-contrato-da-api-v1) · [B8](#b8-dados) · [B9](#b9-configuração-e-ambiente) · [B10](#b10-identidade-visual) · [B11](#b11-fases-e-critérios-de-aceite) · [B12](#b12-testes-e-qualidade) · [B13](#b13-ferramentas-do-claude-code-por-etapa) · [B14](#b14-pendências-e-tarefas) · [B15](#b15-prompt-final) · [Anexo](#anexo-referências-com-status)

## B1. Escopo e decisões fechadas

| Decisão | Origem | Data |
|---|---|---|
| Nome: Mariner's Compass Meteorologia | Briefing | 17/11/2026 |
| Região: Enseada de São Francisco, Niterói-RJ (sede do ICB). Baía de Guanabara e costa do RJ só como contexto | Briefing | 17/11/2026 |
| Embarcações: veleiros, Optimist, dingue, Laser, prancha, canoa, jet ski, bote e lancha; regata e passeio | Briefing | 17/11/2026 |
| Idiomas: português e inglês desde o início | Briefing | 17/11/2026 |
| Só ferramentas gratuitas; uso não comercial; sem serviço B2B para marinas | Briefing | 17/11/2026 |
| Plataforma: web e mobile, PWA primeiro. Offline não é prioridade | Briefing | 17/11/2026 |
| Contas: GitHub, Supabase e Vercel | Briefing | 17/11/2026 |
| **Hospedagem, meio-termo: o job de ingestão (coleta pesada) roda no GitHub Actions. O Vercel hospeda o site e o `/point`, só com repasse e cache para o Open-Meteo. Sem conta Cloudflare** | **Decisão do dono** | **17/11/2026** |
| Escopo: MVP, fase 2 e fase 3, com critérios de aceite | Briefing | 17/11/2026 |
| Maré: tábua da Marinha, crédito ao CHM/DHN, só previsão, aviso de navegação; confirmação com a Marinha não bloqueante; se negada, usar o nível do mar do modelo com rótulo | Briefing | 17/11/2026 |
| NOAA: redistribuição conforme conclusão anterior (domínio público), com a ressalva de verificar o registro de fontes (tarefa T-12, antes de ativar `GRID_SOURCE=noaa`) | Briefing e pesquisa | 17/11/2026 |
| Tábuas de maré (CSV e PDF) fora do Git | Correção 10 da revisão | 17/11/2026 |
| Sem tiles do OSM em produção | Pesquisa | 17/11/2026 |
| Unidade de contagem de cota: **uma chamada HTTP efetiva ao Open-Meteo** (B6) | Correção 4 e revisão | 17/11/2026 |

### Por que o meio-termo

Os termos do Open-Meteo (https://open-meteo.com/en/terms) dizem: "Rate limits are applied by IP addresses and application". Eles avisam que, em Vercel, Netlify, Render ou Google Sheets, o limite pode ser atingido antes do esperado. Os termos sugerem Cloudflare Workers, que o dono descartou.

O meio-termo reduz o risco assim:

- O Vercel só repassa e guarda em cache as chamadas do `/point`. O tráfego do IP do Vercel fica pequeno.
- A coleta pesada (708 chamadas por rodada) sai do Vercel e roda no GitHub Actions.
- Um orçamento diário de chamadas, com tetos por minuto e por hora no `/point`, em tabelas próprias, limita o total.

O risco **não desaparece**. Os runners do GitHub também compartilham IPs de saída (P-03).

### Escolhas avaliadas

**PWA ou app nativo.** O briefing diz "PWA aceitável; avaliar". Critérios usados:

| Critério | PWA | Nativo empacotado |
|---|---|---|
| Custo zero | Sim | Regras e custos das contas de loja não verificados (P-15) |
| Uma única base de código | Sim | Sim, se empacotar o mesmo PWA |
| Instalação sem loja | Sim | Não |
| Push no iOS | Possível a partir do iOS 16.4, com o PWA na tela inicial (https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/, reaproveitado) | Não avaliado |
| Necessidade de recursos do aparelho | Nenhuma no MVP | Não necessária |

**Decisão:** PWA no MVP e na fase 2. Na fase 3, o empacotamento para lojas é **opcional e condicionado a custo zero**. Contas de loja podem ter custo e regras que não foram verificados: [A CONFIRMAR] (P-15). **Padrão seguro: permanecer só PWA.** Capacitor, Expo e Flutter são candidatos, e suas licenças e custos não foram pesquisados.

**Mapas locais ou regionais gratuitos.** A pesquisa não encontrou provedor regional de mapa-base ou de modelo meteorológico confirmado para a enseada. Decisão: costa do Natural Earth (domínio público) sobre fundo de cor sólida. **Ressalva:** a escala do Natural Earth pode não mostrar a enseada com detalhe; para quem está na enseada, o painel do ponto é a referência principal. A escala é tarefa T-05. A avaliação de fontes brasileiras públicas de linha de costa (por exemplo IBGE) e de dados do OpenStreetMap servidos de forma estática é a tarefa T-16; licenças não afirmadas, [A CONFIRMAR, tarefa T-16], padrão Natural Earth. O PMTiles fica **fora do escopo** deste documento.

## B2. Regras de governança

| Marcador | O que o Claude Code faz | Onde registra |
|---|---|---|
| [PENDENTE-BLOQUEANTE] | Constrói o item, mas **não publica** em produção até haver decisão humana | `docs/PENDENCIAS.md` |
| [A CONFIRMAR] | Segue o **padrão seguro** e anota a ressalva no README. Se houver tarefa (B14.2), executa a tarefa e registra o resultado; se houver pendência (B14.1), registra em `docs/PENDENCIAS.md` | `docs/PENDENCIAS.md` e README |
| [PROPOSTA] | Usa o valor sugerido, mas o deixa configurável (env var ou constante nomeada) | README |

- Item resolvido sai da lista de incertezas.
- Todo [A CONFIRMAR] tem padrão. Se não houver padrão seguro, vira [PENDENTE-BLOQUEANTE].
- Não há [PENDENTE-BLOQUEANTE] em aberto. A exibição da tábua de maré está liberada com regras (P-01); a confirmação formal com a Marinha é [A CONFIRMAR], não bloqueante.
- Responsáveis possíveis: **dono do projeto** ou **Claude Code**. Quem registra e confere avisos oficiais é o dono do projeto (B3.3).

## B3. Fontes: formato, acesso, frequência e conformidade

### B3.1 Catálogo (formato, acesso, frequência)

| Fonte | Formato | Acesso | Frequência | Status das informações |
|---|---|---|---|---|
| Open-Meteo, previsão | JSON por coordenada. Várias coordenadas por chamada: não verificado (tarefa T-07); padrão: uma por requisição | API pública; sem chave, uso não comercial (https://open-meteo.com/en/terms) | Sob demanda; modelos atualizam por ciclo (não verificado) | Termos LIDO |
| Open-Meteo Marine | JSON; alturas em m, direções em graus de origem, períodos em s, correntes em km/h; fuso GMT. Valor em pontos de terra: não verificado (tarefa T-15) | API pública (https://open-meteo.com/en/docs/marine-weather-api) | Sob demanda | REAPROVEITADO |
| NOAA GFS e GFS Wave | GRIB2. Arquivo de onda: `gfswave.tCCz.global.0p25.fNNN.grib2`; horário até 120 h e de 3 em 3 h até 384 h | NOMADS (https://nomads.ncep.noaa.gov/). **Filtro do GFS Wave não localizado.** O endereço `filter_gefs_wave_0p25.pl`, que veio da busca, parece ser do GEFS Wave, outro produto, e **não deve ser usado** como filtro do GFS Wave; a tarefa T-04 localiza o filtro correto | Ciclos 00, 06, 12 e 18 UTC (https://www.nco.ncep.noaa.gov/pmb/products/gfs/nomads/) | BUSCA |
| Avisos de Mau Tempo e METEOROMARINHA (CHM) | Texto ou PDF; formato do aviso não verificado | Site da Marinha (https://www.marinha.mil.br/chm); sem API pública conhecida; páginas oficiais retornaram 403 | METEOROMARINHA 2 vezes ao dia; avisos conforme ocorrência | BUSCA |
| Tábua das Marés 2026 (CHM) | PDF: 44 portos, ilhas, barras, fundeadouro e atracadouro; cabeçalho com posição, fuso, nível médio e carta | Venda pela EMGEPRON; dados também por pedido ao BNDO | Anual | BUSCA |
| BNDO (dados maregráficos, correntes e meteorológicos) | Arquivos por solicitação | Qualquer pessoa pode solicitar; e-mail chm.bndo@marinha.mil.br; prazo "até 10 dias úteis"; gratuito (https://www.gov.br/pt-br/servicos/obter-servicos-do-banco-nacional-de-dados-oceanograficos) | Sob pedido | LIDO |
| INMET, estações automáticas | Dados horários dos últimos 90 dias, atualizados diariamente, sem validação de consistência (https://portal.inmet.gov.br/servicos/esta%C3%A7%C3%B5es-autom%C3%A1ticas) | Portal; API com token [A CONFIRMAR] (P-05) | Diária | BUSCA |
| METAR SBGL e SBRJ | Texto decodificado NOAA/NWS (https://tgftp.ncep.noaa.gov/data/observations/metar/decoded/SBRJ.TXT e .../SBGL.TXT). Fonte oficial DECEA/REDEMET não verificada | HTTP público | Cerca de 30 min a 1 h [A CONFIRMAR] (P-06) | BUSCA |
| PNBOIA e SiMCosta | Variáveis: correntes, ondas, vento e temperatura do ar (PNBOIA). Dados na baía não confirmados | https://www.marinha.mil.br/chm/node/70352 e https://simcosta.furg.br | Não verificada | BUSCA |
| Natural Earth | Arquivos de geometria | Download | Estático | LIDO |

### B3.2 Conformidade (reuso, crédito, limite, status)

| Fonte | Reuso e termos | Crédito | Limite | Status |
|---|---|---|---|---|
| Open-Meteo | Uso livre só **não comercial**. São comerciais: apps com assinatura ou anúncios, produtos ou ações promocionais, pesquisa não declarada em entidades comerciais. Licença CC BY 4.0 | "Dados: Open-Meteo.com (CC BY 4.0)" | 600/min, 5.000/h, menos de 10.000/dia. Pedidos com mais de 10 variáveis ou mais de 2 semanas contam como várias chamadas (https://open-meteo.com/en/pricing, REAPROVEITADO). Limite por IP e por aplicação | Termos LIDO: uso não comercial resolvido. Cotas e peso por chamada: **não relidos**, [A CONFIRMAR, tarefa T-14]. Limite por IP: P-03 |
| NOAA GFS e GFS Wave | Domínio público; uso livre; atribuição pedida e não exigida; sem sugerir endosso | "Dados: NOAA/NCEP GFS e WaveWatch III, modificados pelo app" | Retenção do NOMADS sem fonte oficial | Conclusão de licença mantida (domínio público). **Verificação em aberto:** registro de fontes (https://www.weather.gov/disclaimer e https://registry.opendata.aws/noaa-gfs-bdp-pds) na tarefa T-12, antes de ativar `GRID_SOURCE=noaa` |
| Avisos da Marinha | Termos de reuso não verificados | "Fonte: Marinha do Brasil, CHM/DHN" e aviso de que o app não substitui os boletins | Não aplicável | [A CONFIRMAR] (P-04). Padrão: link ao boletim e texto colado pelo dono do projeto, sem scraping |
| Tábua de marés | Sem licença escrita encontrada | "Fonte: Centro de Hidrografia da Marinha (CHM/DHN) – Marinha do Brasil" | Só dados de previsão; não reproduzir o PDF nem o layout | Exibição liberada com crédito e aviso de navegação; confirmação com a Marinha [A CONFIRMAR], não bloqueante (P-01) |
| INMET | Token e termos [A CONFIRMAR] | "Fonte: INMET" [A CONFIRMAR] | Dados brutos | P-05. Padrão: API fora do MVP |
| METAR | Termos [A CONFIRMAR] | [A CONFIRMAR] | Não aplicável | P-06. Padrão: fora do MVP |
| PNBOIA e SiMCosta | Reuso [A CONFIRMAR]. Notícia de 10/2026 (https://diariodorio.com/rio-de-janeiro/2026/10/18/ponte-rio-niteroi-tem-20-luzes-de-sinalizacao-apagadas-ou-com-falhas-boias-na-baia-de-guanabara-tambem-estao-irregulares.html) diz que boias da baía estão irregulares | [A CONFIRMAR] | Não aplicável | P-07. Padrão: indisponível, fora do MVP |
| Natural Earth | Domínio público; uso pessoal, educacional e comercial; "Attribution is not required" | Sugestão: "Made with Natural Earth." | Sem garantia de precisão; a escala pode não mostrar a enseada | Resolvido. Alternativas de costa (IBGE, OSM estático): licenças não afirmadas, tarefa T-16 |
| Tiles do OSM | Uso pesado, pré-carga e offline proibidos; ODbL exige atribuição (política não lida; reaproveitado) | Não aplicável | Não usar em produção | Resolvido: não usar |
| Copernicus Marine | Licença gratuita; serviço até 30/06/2028 (https://marine.copernicus.eu/user-corner/service-commitments-and-licence, reaproveitado) | Redação exata [A CONFIRMAR, tarefa T-13]. Padrão: "E.U. Copernicus Marine Service Information" | Fim do serviço em 2028 | Fase 3, adaptador trocável |
| Vercel Hobby | Termos citam Hobby só pessoal e não comercial (busca; https://vercel.com/terms). A âncora https://vercel.com/legal/terms#fair-use é **a localizar**: ainda não foi aberta | Não aplicável | Tabela abaixo | [A CONFIRMAR, tarefa T-10] |
| Supabase Free | https://supabase.com/pricing (lida) | Não aplicável | Tabela abaixo | Resolvido |
| Leaflet 1.9.4 | BSD-2-Clause (reaproveitado) | Manter LICENSE | Não aplicável | Resolvido |
| leaflet-velocity | CSIRO Open Source Software Licence Agreement, "variação da licença BSD/MIT" (README lido) | Copiar o LICENSE da versão instalada | Suporte listado: Leaflet 1.0.3 e 0.7.7 | [A CONFIRMAR, tarefa T-11] |

### B3.3 Avisos oficiais da Marinha: como entram no app

A inserção é manual e deliberada, porque não há API pública conhecida. **Consequência para o usuário:** o aviso só aparece quando o dono do projeto o registra; pode atrasar ou faltar. A interface diz isso e manda sempre consultar o boletim oficial.

1. O dono do projeto lê o boletim oficial no site da Marinha.
2. Se há aviso, roda localmente `npm run notice:add -- --title "..." --body "..." --url "..." --valid-until "AAAA-MM-DDThh:mmZ"`. O script `scripts/notices.ts` usa a chave de serviço do `.env.local` e grava em `official_notices`. O RLS bloqueia o acesso anônimo; só o papel de serviço grava.
3. Em qualquer caso, depois de ler o boletim, roda `npm run notice:checked`. O script grava a hora da conferência em `notice_checks` [PROPOSTA].
4. O app mostra o aviso em destaque, com o crédito, o link oficial, a data do último registro e a data da última conferência. Sem aviso, diz que nenhum aviso foi registrado.
5. **Rotina de lembrete [PROPOSTA]:** o lembrete semanal deixava até 7 dias sem conferência. No lugar, um workflow **diário** do GitHub Actions abre ou atualiza uma issue "Conferir avisos da Marinha" se a última conferência registrada tiver mais de `NOTICE_CHECK_MAX_AGE_H` horas (padrão 24). Isso depende de uma pessoa: por isso a interface sempre diz que o aviso pode atrasar ou faltar.
6. Link padrão do aviso: https://www.marinha.mil.br/chm (BUSCA). A notícia de 10/2026 (https://www.sociedademilitar.com.br/2026/10/centro-de-hidrografia-da-marinha-lanca-mapas-interativos-no-brasil-para-reforcar-a-seguranca-maritima-alertas-mau-tempo-alcancam-29-localidades-e-antecipam-riscos-por-ate-cinco-dias-elz.html) diz que o CHM lançou mapas interativos de avisos em 29 localidades. É notícia, **não fonte oficial**. Tarefa T-09: procurar a página oficial desses mapas; se existir, usá-la como link.

### B3.4 Limites dos planos gratuitos (lidos)

| Serviço | Limites relevantes |
|---|---|
| Vercel Hobby (https://vercel.com/docs/limits/fair-use-guidelines, lida, 2026-11-12) | Fast Data Transfer 100 GB/mês; Function Invocations 1.000.000/mês; Fast Origin Transfer 10 GB/mês; Active CPU 4 h/mês; Provisioned Memory 360 GB-h/mês; Image Optimization 5 mil transformações, 300 mil leituras e 100 mil escritas de cache/mês. Middleware edge: 50 ms de CPU médio |
| Supabase Free (https://supabase.com/pricing, lida) | 2 projetos ativos; 500 MB de banco por projeto; 1 GB de storage; 5 GB de egress mais 5 GB de egress em cache; 50.000 MAU; pausa após 1 semana de inatividade; sem backups automáticos |
| GitHub Actions (reaproveitado) | Uso gratuito em repositório público; agendamento desativado após 60 dias sem atividade. Condições de repositório privado: não verificadas, [A CONFIRMAR]; padrão: repositório público |

Consequência: com 4 h de Active CPU por mês, as Functions do Vercel só **repassam** arquivos prontos e respostas em cache.

**Comportamento único sobre o Hobby (T-10).** O padrão é publicar no Hobby, porque o app é gratuito, sem anúncios, assinatura ou compras. Na etapa 1, o Claude Code lê os termos do Vercel (a partir de https://vercel.com/terms), localiza a seção de uso justo ou do plano Hobby (âncora https://vercel.com/legal/terms#fair-use a localizar) e registra a evidência. Se a leitura indicar que o Hobby não permite este app, o Claude Code **interrompe o deploy de produção** e avisa o dono. Deploys de preview continuam permitidos.

## B4. Arquitetura

Fluxo geral: **app (navegador) → API no Vercel → cache e Supabase ← job no GitHub Actions → fontes externas.**

- **Navegador:** nunca chama fonte externa. Só chama a API do próprio app e os arquivos do app (AC-MVP-01).
- **Vercel (site e API):** serve o front-end estático e as Functions `/api/v1/*`. O `/grid` e o `/frames` leem do Supabase e repassam. O `/point` consulta o cache; no `miss` chama o Open-Meteo, dentro do orçamento e dos tetos por minuto e por hora.
- **Supabase:** banco (cache do `/point`, execuções, orçamento, avisos, conferências) e Storage privado (arquivos de grade).
- **GitHub Actions (cron):** job de ingestão. Coleta, gera um arquivo por quadro, região e camada, grava no Supabase e fecha a rodada.
- **Fontes:** Open-Meteo (padrão) e, no alvo, NOAA GFS e GFS Wave.

O Vercel **não** faz coleta em massa. O Vercel Cron não é usado. O cache do `/point` é a tabela `point_cache` [PROPOSTA]; a coalescência de pedidos simultâneos é de melhor esforço.

## B5. Adaptadores de fonte

Cada fonte fica atrás de uma interface própria, com **fonte simulada** para testes e desenvolvimento local. Nenhum teste automatizado chama fonte real. Exceção declarada: as sondagens manuais das tarefas T-07 e T-15, com no máximo 10 chamadas no total, registradas em `docs/MODELOS.md`.

| Adaptador | Variáveis | Unidade na saída | Limite e cuidado | Teste |
|---|---|---|---|---|
| `openmeteo-forecast` | `wind_speed_10m`, `wind_direction_10m`, `wind_gusts_10m` | **Grade: `wind_speed_unit=ms`** (m/s). **`/point`: `wind_speed_unit=kn`** (nós). Direção em graus, de onde sopra. GMT normalizado para UTC com `Z` | **Uma localização por requisição** é o padrão, [A CONFIRMAR, tarefa T-07]: a fonte pode aceitar várias coordenadas por chamada, mas isso não foi verificado, nem como essas chamadas entram na cota. Só se adota agrupamento depois de a T-07 confirmar a regra de contagem. Máximo de 10 variáveis e de 2 semanas por pedido (o adaptador recusa mais que isso). `forecast_days` até 16, padrão 7 (documentação lida); o app usa 9 | Fonte simulada: resposta fixa, erro de limite, resposta lenta |
| `openmeteo-marine` | `wave_height`, `wave_direction`, `wave_period`, `wind_wave_*`, `swell_wave_*` (9 variáveis); fase 2 e 3: `sea_level_height_msl`, correntes | Alturas em m, direções em graus **de origem**, períodos em s, correntes em km/h. GMT | Documentação diz que não serve para navegação costeira. Em pontos de terra, o valor devolvido é desconhecido (tarefa T-15) | Idem. Valor ausente vira `null`, nunca zero |
| `noaa-gfs` e `noaa-gfs-wave` (alvo) | Vento a 10 m (U e V); ondas totais. Variáveis e filtro do GFS Wave: tarefa T-04 | U e V em m/s | Retenção do NOMADS: tarefa T-04. Padrão: baixar a cada rodada | Arquivo GRIB pequeno de teste, gerado localmente |
| `official-notices` | Título, texto, emissão, validade, URL; conferências | Texto | Sem scraping | Aviso expirado não aparece em destaque |
| `tides` (fase 2) | Previsão da estação escolhida | m, referencial da tábua | Só previsão. Sem CSV ou PDF no Git | Importação local para `tide_predictions` |
| `currents` (fase 3) | Correntes | Declarada em `meta.units` | Adaptador trocável | Fonte simulada |
| `observations` (fase 3) | INMET, METAR, boia | Declarada em `meta.units` | Ressalva de qualidade | Fonte simulada |

Regra comum: todo adaptador declara a unidade em `meta.units`.

**Modelo usado.** Para a comparação de modelos da fase 3 ser possível, os adaptadores `openmeteo-*` **fixam o modelo explicitamente**, se a documentação (T-07 e T-08) mostrar como fazê-lo, usando `OPENMETEO_MODEL_FORECAST` e `OPENMETEO_MODEL_MARINE` (sem padrão: vazio significa que a fonte escolhe). Se a resposta informar o modelo, o adaptador registra o valor retornado. A cada rodada, grava o modelo em `model_runs.model` no formato `forecast:<modelo>|marine:<modelo>` [PROPOSTA]; se nem a configuração nem a resposta informarem o modelo, grava `auto`. Com `auto`, a comparação de modelos fica indisponível (AC-F3-04 já é condicional).

**URLs do Open-Meteo.** Os endereços dos hosts de previsão e de Marine **não constam** das fontes lidas além do caminho `/v1/marine`. Não há valor padrão: o Claude Code lê os exemplos de código em https://open-meteo.com/en/docs e https://open-meteo.com/en/docs/marine-weather-api e grava os valores em `OPENMETEO_FORECAST_URL` e `OPENMETEO_MARINE_URL` (tarefa T-07). Sem as variáveis, o job e o `/point` falham com erro claro e **não** chamam a fonte (fail-closed). Em desenvolvimento, vale a fonte simulada.

## B6. Ingestão e grades

**Onde roda:** GitHub Actions, por cron, a cada 6 horas [PROPOSTA]. Para `noaa`, defasado cerca de 5 horas após cada ciclo do GFS [PROPOSTA]. **O repositório deve ser público.** Motivo: o briefing já trata o repositório como público (por isso a regra de não publicar dados de maré nele). A ideia anterior de que "runners gratuitos só valem em repositório público" não foi verificada e foi retirada; condições de repositório privado: [A CONFIRMAR] (B3.4), padrão público.

### Duas grades, mesma fonte

O mapa de 2° sobre o bbox inteiro tem cerca de 220 km entre pontos. Na vista inicial (zoom 10) isso dá vento praticamente uniforme na enseada. Por isso o job coleta duas grades, da **mesma fonte**:

| Parâmetro | Grade ampla (`wide`) | Grade da baía (`bay`) [PROPOSTA] |
|---|---|---|
| Área (bbox, ordem `oeste,sul,leste,norte`) | `-54,-35,-30,5` (longitude -54 a -30; latitude -35 a 5) | `-44,-24,-42,-22` (longitude -44 a -42; latitude -24 a -22). Contém o centro da vista inicial do briefing (-22,71982; -43,17215). A tarefa T-05 confere no mapa que cobre a Baía de Guanabara e a enseada |
| Resolução `openmeteo` (padrão) | 2°: 13 colunas × 21 linhas = **273 pontos**. Espaçamento de cerca de 220 km (2 × 111 km, cálculo próprio) | 0,25°: 9 colunas × 9 linhas = **81 pontos**. Espaçamento de cerca de 28 km (0,25 × 111 km, cálculo próprio). Coincide com o arredondamento do `/point` |
| Resolução `noaa` (alvo) | 0,5° [PROPOSTA]: 49 × 81 = **3.969 pontos** | Fica para quando a fonte for ativada (T-04) |
| Camadas | `wind` e `waves` (ondas totais) | `wind` e `waves` |

**Por que manter a grade ampla.** Ela dá o contexto regional que o briefing pede (Baía de Guanabara e costa do RJ como contexto): quando o usuário afasta o mapa, vê o panorama maior. Custa 546 das 708 chamadas por rodada e cabe no orçamento (pior caso diário de 7.540, abaixo de 10.000). Se a cota apertar, a alternativa é subir o passo da grade ampla para 4° (7 × 11 = 77 pontos, 154 chamadas), configurável por `GRID_RES_DEG`.

**Limite da grade fina.** Ela **não** garante detalhe local: pontos vizinhos podem receber valores iguais, se vierem da mesma célula do modelo. A resolução real do modelo continua sujeita à tarefa T-08. A grade fina melhora o mapa na enseada em relação à ampla, mas o aviso de resolução da tela continua obrigatório.

**Qual grade o front usa [PROPOSTA].** Com zoom a partir de `BAY_GRID_MIN_ZOOM` (padrão 9) e centro do mapa dentro do bbox da baía, usa a grade `bay`. Caso contrário, usa a `wide`. A vista inicial (zoom 10) usa a `bay`.

| Parâmetro | Valor |
|---|---|
| `run_time` | `openmeteo`: id da coleta (horário UTC do início do job, com `Z`). `noaa`: ciclo do modelo. As duas regiões de uma rodada compartilham o mesmo `run_time` |

### Quais instantes cada quadro cobre

- Os instantes de `times[]` ficam alinhados a **múltiplos de 3 h em UTC** (00, 03, 06, ... UTC).
- O primeiro quadro é o primeiro múltiplo de 3 h igual ou posterior ao `run_time`. Os quadros seguem de 3 em 3 h, até 168 h depois do primeiro: **57 quadros** por camada e por região.
- No `openmeteo`, o job pede **`forecast_days=9`** (menor que 2 semanas) nas duas fontes e filtra as horas múltiplas de 3. Motivo: se o job começar entre 21:01 e 23:59 UTC do dia D, o primeiro quadro é 00:00 UTC de D+1 e o último é 00:00 UTC de D+8. Com 8 dias, a série terminaria em 23:00 de D+7 e faltaria o último quadro (56 em vez de 57). Com 9 dias, termina em 23:00 de D+8. Isto supõe que a série comece em 00:00 GMT do dia corrente; a tarefa T-07 verifica.
- **Se a fonte devolver menos horas do que os 57 quadros exigem, a rodada é incompleta:** não é publicada, a última rodada válida é mantida e o fato é registrado em `model_runs.status = aborted` e no log do job. Isso alinha o comportamento ao AC-MVP-19.
- O passo horário fica no painel do ponto, não no mapa.

### Formato do arquivo de vento

- O arquivo é um array de dois objetos, **U primeiro, V depois**, no formato de saída do grib2json que o leaflet-velocity lê (README lido).
- Cada objeto tem `header` e `data[]` plano com `nx × ny` valores.
- **Não fixe de memória** os valores de `dx`, `dy`, `parameterCategory` e `parameterNumber`. Copie-os do `demo/*.json` do pacote instalado (tarefa T-01).
- Hipótese a verificar contra o demo: `dx` e `dy` positivos, com o sentido norte → sul dado por `la1 > la2`.
- Valores próprios do app. Grade `wide`: `lo1 = -54`, `la1 = 5`, `lo2 = -30`, `la2 = -35`, `nx = 13`, `ny = 21`. Grade `bay`: `lo1 = -44`, `la1 = -22`, `lo2 = -42`, `la2 = -24`, `nx = 9`, `ny = 9`. Os dados vão em linhas de **norte para sul**, de **oeste para leste**.
- U e V em **m/s**. O teste de fumaça (vento conhecido sobre o mapa) confirma a orientação.

### Formato do arquivo de ondas [PROPOSTA]

Array de dois objetos, **altura primeiro, direção depois**. Cada um tem `header` com os mesmos campos geométricos do vento, mais `parameter` (`"height"` ou `"direction"`) e `unit` (`"m"` ou `"deg_from"`). O `data[]` é plano, `nx × ny`, com `null` onde não há dado (terra). Não há U e V; a camada é desenhada pelo renderizador próprio.

### Regra de interpolação das ondas com nulos [PROPOSTA]

Na grade da baía, muitas células são de terra e vêm `null`. O front interpola de forma bilinear em cada ponto do mapa, a partir dos 4 cantos da célula:

1. Se os 4 cantos são válidos: interpolação bilinear normal.
2. Se o **canto mais próximo** do ponto é `null`: o pixel fica **transparente** (a onda não invade a terra).
3. Se o canto mais próximo é válido e outro canto é `null`: interpola só com os cantos válidos, com os pesos bilineares renormalizados (soma 1).
4. Se os 4 cantos são `null`: transparente.
5. A direção das ondas é interpolada por componentes (seno e cosseno), não pelo ângulo bruto, para que 359° e 1° não produzam 180°.

Teste de aceite (AC-MVP-24): cantos 00=1,0; 10=2,0; 01=3,0; 11=`null` (em metros). No ponto (x=0,25; y=0,25), o nulo é o canto 11, o mais próximo é o 00 (válido), os pesos são 0,5625, 0,1875, 0,1875, e o valor esperado é (0,5625×1 + 0,1875×2 + 0,1875×3) / 0,9375 = **1,6 m**. No ponto (0,75; 0,75), o canto mais próximo é o 11 (nulo): **transparente**. Com os 4 cantos nulos: transparente. Com os 4 válidos: bilinear normal.

### Conversão no job `openmeteo`

Com `wind_speed_unit=ms`, a velocidade `s` e a direção meteorológica `d` (de onde sopra, em radianos) viram `u = -s·sen(d)` e `v = -s·cos(d)`. Nós e km/h só na interface.

### Unidade de contagem e orçamento (cálculo único)

**Unidade: uma chamada HTTP efetiva ao Open-Meteo, com peso 1.** Toda tentativa conta, inclusive retry. O peso 1 vale porque cada requisição tem no máximo 10 variáveis e 2 semanas (regra da página de preços, REAPROVEITADO; verificação: tarefa T-14). O adaptador recusa pedido fora desses limites, então nenhuma chamada pesa mais que 1. Cada requisição cobre uma coordenada (padrão; B5).

| Item | Cálculo | Chamadas |
|---|---|---|
| Rodada, grade ampla, sem retry | 273 pontos × 2 requisições (forecast e marine) | 546 |
| Rodada, grade da baía, sem retry | 81 pontos × 2 requisições | 162 |
| **Rodada do job, sem retry** | 546 + 162 | **708** |
| Teto da rodada, com margem de 25% para retries [PROPOSTA] | 708 × 1,25 = 885 | **885** (`INGEST_ROUND_BUDGET`) |
| Teto diário do job (4 rodadas) | 885 × 4 | **3.540** (`INGEST_DAILY_BUDGET`) |
| Uso normal do job por dia | 708 × 4 | 2.832 |
| `/point`: teto declarado | `POINT_DAILY_BUDGET` | 4.000 |
| `/point`: limite operacional (80%) | 4.000 × 0,8 = 3.200 chamadas = 1.600 misses × 2 | **3.200** |
| **Pior caso diário (job no teto + `/point` no teto declarado)** | 3.540 + 4.000 | **7.540**, abaixo de 10.000 |
| Pior caso com o `/point` no limite operacional | 3.540 + 3.200 | 6.740 |
| Por minuto, pior caso | job 300 (`INGEST_MAX_PER_MIN`) + `/point` 100 (`POINT_MAX_PER_MIN`) | 400, abaixo de 600 |
| Por hora, pior caso | rodada de até 885 + `/point` 1.000 (`POINT_MAX_PER_HOUR`) | 1.885, abaixo de 5.000 |

O job grava **cada tentativa HTTP** em `quota_counter`, na fonte `openmeteo_ingest`. O `/point` grava 2 por miss, na fonte `openmeteo_point`. O job usa no máximo 300 chamadas por minuto [PROPOSTA]; uma rodada de até 885 chamadas cabe em cerca de 3 minutos (885 ÷ 300 = 2,95).

**Falhas e retries.** O job tenta de novo com espera crescente, no máximo `INGEST_RETRY_MAX=2` retries por requisição. Ao atingir o teto da rodada ou do dia, **aborta**, não publica a rodada incompleta e mantém a última rodada válida, marcada `stale` pelo tempo. Erro de limite da fonte não gera nova tentativa imediata.

**Rodadas fechadas.** Uma rodada só aparece em `/frames` depois que todos os arquivos foram gravados: 57 quadros × 2 camadas × 2 regiões = **228 arquivos**. Mantêm-se as duas rodadas mais recentes; as anteriores saem no fim da ingestão. O job também remove entradas de `point_cache` com mais de 24 h [PROPOSTA] e janelas de `quota_window` com mais de 2 dias.

**Manutenção.** Todo job lê o Supabase ao menos uma vez (evita a pausa por inatividade). Se isso de fato basta, é verificação **pós-deploy** (tarefa T-03), não parte da construção. Um commit mensal de "heartbeat" evita a desativação do agendamento após 60 dias sem atividade [PROPOSTA].

## B7. Contrato da API v1

**Convenções.**

- **Tempo:** todo `time[]` e `run_time` em ISO 8601 UTC com `Z`. O front exibe no fuso do aparelho.
- **Unidades:** `/point`: vento e rajada em nós; alturas em m; períodos em s; direções em graus. Grade de vento: U e V em m/s. Todo JSON traz `meta.units`.
- **`meta`:** `source`, `run_time`, `updated_at`, `units`, `status`, `layers`, `attribution[]`. Ausente é `null`, nunca zero.
- **`status`:** `ok`, `partial` ou `stale`. Não existe `unavailable`: quando não há dado utilizável, a API não devolve corpo de dados e responde erro 503 (`data_expired` ou `service_unavailable`).
- **Erros:** `{ "error": { "code": "...", "message": "..." } }`. Códigos: `invalid_coordinates` e `invalid_parameter` (422); `run_not_found` (404) [PROPOSTA]; `rate_limited` (429) [PROPOSTA], com `Retry-After`; `quota_exhausted`, `data_expired` e `service_unavailable` (503) [PROPOSTA para o último]; `not_implemented` (501). `service_unavailable` vale para Supabase indisponível e para fonte indisponível sem cache utilizável. Respostas de erro usam `Cache-Control: no-store`.

### Endpoints

1. **`GET /api/v1/frames?layer=wind|waves`**
   - Devolve `{ meta: { run_time, updated_at, status, ... }, times[] }` para a rodada fechada mais recente. A lista de instantes vale para as duas regiões.
   - **É aqui que o vencimento é calculado e entregue.** O servidor compara a idade do `run_time` com a hora atual: mais de 18 h dá `status: "stale"` (HTTP 200); sem rodada ou com mais de 48 h dá **503 `data_expired`** [PROPOSTA nos limites].
   - Cache curto: `Cache-Control: public, max-age=60` [PROPOSTA]. Nunca imutável.
2. **`GET /api/v1/grid?layer=&run_time=&time=&bbox=&res=`**
   - `layer`, `run_time` e `time` obrigatórios, em ISO UTC com `Z`. Sem `run_time`: **422 `invalid_parameter`**.
   - `bbox` (ordem `oeste,sul,leste,norte`) e `res` são opcionais; sem eles, vale a grade ampla. Se informados, devem formar um dos **pares pré-gerados**: (`-54,-35,-30,5`; `2`) ou (`-44,-24,-42,-22`; `0.25`), com a resolução da fonte ativa. Outro valor ou par misto: **422 `invalid_parameter`**.
   - `run_time` inexistente ou já removido: **404 `run_not_found`**. O cliente recarrega `/frames` e tenta uma vez com o novo `run_time`.
   - Rodada fechada responde com `Cache-Control: public, max-age=31536000, immutable`.
   - Cabeçalhos só com informação **imutável**: `X-Source`, `X-Run-Time` e `X-Attribution`, expostos por `Access-Control-Expose-Headers`. **Não há `X-Status` nem `X-Updated-At`**, porque uma resposta imutável congelaria o valor. O front **não confia** no `/grid` para saber se o dado está vencido; usa o `/frames`.
   - Defesa: a Function também devolve 503 `data_expired` se o `run_time` pedido tiver mais de 48 h e o pedido chegar até ela.
   - A Function só repassa o arquivo do Storage, sem processá-lo.
3. **`GET /api/v1/point?lat=&lon=&vars=&hours=`**
   - **Validação.** `lat` entre -35 e 5 e `lon` entre -54 e -30 (o bbox amplo); fora disso, 422 `invalid_coordinates`. `hours` inteiro de 1 a 168. `vars` só da lista permitida: `wind_speed_10m`, `wind_gusts_10m`, `wind_direction_10m` e as 9 de ondas. Qualquer outro valor: 422 `invalid_parameter`. O limite de 10 variáveis e de 2 semanas por pedido à fonte é respeitado por construção (3 variáveis de forecast, 9 de marine, 9 dias).
   - **Chave do cache:** `lat` e `lon` arredondados a 0,25° (`POINT_ROUND_DEG`). O pedido à fonte é sempre o **conjunto completo** (as 3 variáveis de forecast e as 9 de marine, `forecast_days=9`). `vars` e `hours` apenas **recortam** a resposta. Assim, a mesma coordenada gera uma só chamada, qualquer que seja o recorte.
   - **Como `hours` é contado:** a resposta começa na **hora atual em UTC arredondada para baixo** (inclusive) e traz `hours` horas a partir dela. Se o cache tiver menos horas que o pedido, devolve as disponíveis, sem preencher. Os 9 dias pedidos à fonte cobrem 168 h a partir da hora atual mesmo com dado de até 6 h de idade.
   - **Resposta:** `{ meta, hourly: { time[], wind_speed_10m[], wind_gusts_10m[], wind_direction_10m[], wave_height[], wave_direction[], wave_period[], wind_wave_*[], swell_wave_*[] } }`. O painel mostra a coordenada arredondada. Em pontos de terra, ondas podem vir `null` (tarefa T-15).
   - **Estados do cache e o que o `/point` faz (nesta ordem):**
     1. Supabase indisponível (cache ou contador): **fail-closed**, 503 `service_unavailable`, sem chamar a fonte.
     2. Entrada `ok` com idade até `POINT_CACHE_TTL_S` (3 h): **hit**, `status: "ok"`. Entrada `partial` com idade até `POINT_PARTIAL_TTL_S` (15 min): hit, `status: "partial"`.
     3. Sem entrada, entrada vencida ou entrada ilegível ("cache com erro"): **miss**. A entrada ilegível é tratada como ausente e **não** gera contagem extra.
     4. No miss, reserva 2 chamadas (ver "Orçamento"). Reserva negada: se há entrada vencida com idade de até `POINT_STALE_MAX_S` (6 h), serve-a com `status: "stale"` (HTTP 200); senão, 503 `quota_exhausted` ou 429 `rate_limited`.
     5. Reserva concedida: chama forecast e marine em paralelo, **sem retry imediato**. As duas chamadas contam, deem certo ou não.
        - Ambas respondem: grava `ok` e responde `ok`.
        - **Falha parcial** (uma responde, a outra não): grava e responde `status: "partial"`, com os campos faltantes `null`. Vale por no máximo 15 min [PROPOSTA]. Contaram 2 chamadas. Passados os 15 min, o próximo pedido é um novo miss e **repete as duas chamadas** (o conjunto completo), reservando e contando mais 2. Não existe repetição parcial de 1 chamada.
        - Ambas falham: se há entrada vencida com até 6 h, serve-a com `status: "stale"`; senão, 503 `service_unavailable`. A reserva continua contada (conservador).
   - **Status entre 3 h e 6 h:** entrada com idade entre 3 h e 6 h só é servida quando a fonte não pôde ser consultada (falha, reserva negada); nesse caso, `status: "stale"`. Com a fonte disponível, é miss e se renova. Entrada com mais de 6 h nunca é servida.
4. **`GET /api/v1/notices`**: avisos oficiais válidos, com URL, crédito, `last_registered_at` (data do último registro) e `last_checked_at` (data da última conferência).
5. **`GET /api/v1/route`**: fase 2; no MVP responde 501.

### Orçamento e tetos do `/point`

Cada `miss` reserva **2 chamadas** (forecast e marine) por uma função do banco (RPC) **atômica e condicional**, `reserve_calls(at, source, n, day_limit, hour_limit, minute_limit)` [PROPOSTA: os limites por hora e por minuto são acréscimo desta versão]. A função só incrementa se, na mesma transação, `calls_dia + n ≤ day_limit`, `calls_hora + n ≤ hour_limit` e `calls_minuto + n ≤ minute_limit` (limite nulo = não se aplica). Se algum falhar, **nada** é incrementado e ela devolve `allowed = false` e o motivo (`day`, `hour` ou `minute`). O dia vem de `quota_counter`; as janelas de hora e de minuto vêm de `quota_window`. A reserva ocorre **antes** da chamada à fonte.

- **Limite diário operacional = 80% de `POINT_DAILY_BUDGET`** (3.200 chamadas, 1.600 misses). Os 20% restantes (800 chamadas) são **margem** contra erro na contagem do Open-Meteo, cujo peso por chamada não foi relido (tarefa T-14). Como a reserva é condicional, o contador nunca passa do limite.
- **Tetos por minuto e por hora [PROPOSTA]:** `POINT_MAX_PER_MIN=100` chamadas (50 misses por minuto) e `POINT_MAX_PER_HOUR=1000` chamadas (500 misses por hora). Sem eles, um cliente poderia gerar rajadas acima de 600 por minuto ou próximas de 5.000 por hora e levar a um bloqueio por IP. Com os tetos, somados ao job: 300 + 100 = 400 por minuto e 885 + 1.000 = 1.885 por hora, dentro dos limites da fonte.
- Reserva negada por limite **diário**: **503 `quota_exhausted`** com `Retry-After` (padrão: próximo dia UTC). Negada por **minuto ou hora**: **429 `rate_limited`** com `Retry-After` em segundos até o início da próxima janela. A verificação diária vem primeiro. Cache hit continua em qualquer caso.
- Os tetos são globais, não por cliente. Eles protegem a fonte; não impedem que um cliente consuma a capacidade (ver "Abuso").

**Abuso.** O limite por cliente fica **desligado** por padrão, porque o cabeçalho de IP do cliente no Vercel ainda não foi verificado (tarefa T-02). Risco: um único cliente pode consumir os 1.600 misses do dia (ou os 500 da hora) com coordenadas diferentes. Consequência: novos pontos ficam indisponíveis até a janela seguinte; pontos já em cache continuam. O teto protege a cota do Open-Meteo; o custo é de disponibilidade, não de bloqueio da fonte. Padrão: aceitar esse risco, registrar em `docs/PENDENCIAS.md` e ligar o limite por cliente se a tarefa T-02 confirmar o cabeçalho.

**Concorrência.** A coalescência é de melhor esforço. Pedidos simultâneos à mesma chave podem gerar mais de uma chamada; o orçamento e os tetos limitam o dano.

## B8. Dados

### Esquema mínimo

- `model_runs(id uuid PK, source text, model text, run_time timestamptz, ingested_at timestamptz default now(), status text)`, **única por `(source, model, run_time)`**. `model` no formato de B5. `status`: `open` (gravando), `closed` (publicável) ou `aborted` [PROPOSTA]. Só rodadas `closed` aparecem em `/frames`.
- `grid_layers(id uuid PK, run_id uuid FK → model_runs, region text, layer text, valid_time timestamptz, bbox double precision[4], res numeric, storage_path text, expires_at timestamptz)`, **única por `(run_id, region, layer, valid_time)`**. `region`: `wide` ou `bay`. `layer`: `wind` ou `waves`. `bbox` na ordem `oeste,sul,leste,norte`. `res` em graus. `expires_at`: momento a partir do qual o arquivo pode ser removido (padrão: `run_time` + 48 h) [PROPOSTA].
- `quota_counter(day date, source text, calls integer default 0)`, PK `(day, source)`. Fontes: `openmeteo_point` e `openmeteo_ingest`. Unidade: chamadas HTTP.
- `quota_window(source text, granularity text, bucket_start timestamptz, calls integer default 0)`, PK `(source, granularity, bucket_start)`; `granularity` é `minute` ou `hour` [PROPOSTA]. Usada pelos tetos do `/point`.
- `point_cache(key text PK, payload jsonb, status text, fetched_at timestamptz)`. `key` é a coordenada arredondada (por exemplo `-22.75:-43.25`) [PROPOSTA]; `status` é `ok` ou `partial`. A estimativa nossa, a medir, é de cerca de 19 KB por entrada (15 KB × 216/168, ajustada de 168 h para 9 dias); com até 1.600 misses por dia e limpeza a cada 24 h, fica folgada nos 500 MB do plano.
- `official_notices(id uuid PK, title text, body text, issued_at timestamptz, valid_until timestamptz, source_url text, registered_at timestamptz default now())` [PROPOSTA].
- `notice_checks(id uuid PK, checked_at timestamptz default now())` [PROPOSTA].
- `tide_stations(id text PK, name text, lat double precision, lon double precision, source_note text)`.
- `tide_predictions(station_id text FK, datetime_utc timestamptz, height_m numeric, import_batch text)`, PK `(station_id, datetime_utc)`.
- `push_subscriptions(id uuid PK, endpoint text única, keys jsonb, rules jsonb, created_at timestamptz default now(), last_notified_at timestamptz)` (fase 2).

Formato de `rules` [PROPOSTA]: `{"version":1,"point":{"lat":-22.75,"lon":-43.25},"thresholds":{"wind_kn":20,"gust_kn":25,"wave_m":1.5},"horizon_h":48}`.

### Segurança

- **RLS ativa em todas as tabelas, sem política para os papéis `anon` e `public`.** Só o papel de serviço (Functions, job e scripts locais) acessa os dados. O front não acessa o Supabase diretamente.
- A chave de serviço fica só em secrets e no `.env.local` ignorado pelo Git. Storage privado.

### Privacidade (fase 2) [PROPOSTA]

Endpoint de push e coordenadas em `rules` são dados pessoais em potencial. Mitigações: coordenadas em `rules` arredondadas a 0,25°; nenhuma identificação do usuário; assinatura removida em resposta 404 ou 410; nenhum analytics de terceiros; aviso de privacidade no app dizendo o que se guarda e como apagar.

### Maré

CSV e PDF de maré ficam **fora do Git**: `.gitignore` e pasta de trabalho fora do repositório. Importação por script local para `tide_predictions`. Backup local fora do repositório (o plano gratuito não tem backups automáticos). Exibição liberada conforme P-01: crédito "Fonte: Centro de Hidrografia da Marinha (CHM/DHN) – Marinha do Brasil", só os dados de previsão (sem reproduzir o PDF nem o layout) e aviso de navegação. Se a Marinha negar a republicação, desligar a exibição e voltar ao nível do mar do modelo, rotulado "nível do mar do modelo, não é tábua de maré".

## B9. Configuração e ambiente

### Pré-requisitos no Windows 11

1. Instalar Node.js 22 [PROPOSTA], Git, GitHub CLI (`gh`), Supabase CLI, Vercel CLI e **Docker Desktop** (o `supabase start` exige Docker). Python só se ativar `GRID_SOURCE=noaa`.
   - **Instalação via `winget` [PROPOSTA].** Antes de instalar, confirmar o identificador de cada pacote com `winget search`; não presumir identificadores. Para Supabase CLI e Vercel CLI, seguir a documentação oficial de cada um (tarefa T-17).
   - **Docker Desktop no Windows 11: requisitos a verificar (tarefa T-17).** Em geral dependem de WSL2 e de virtualização habilitada na BIOS; o Claude Code confere o estado da máquina (por exemplo `wsl --status`) e as condições de uso do Docker Desktop (custo zero) na documentação oficial, antes de rodar `supabase start`.
   - **Playwright e Node:** o prompt anterior dizia que o Playwright aceita Node 22, 24 ou 26. Status: **REAPROVEITADO**, não relido (https://playwright.dev/docs/intro). A T-17 confirma que a versão escolhida do Node é aceita.
   - **Versões exatas.** Fixar versões exatas das dependências (sem `^` nem `~`) em `package.json` e `package-lock.json`, e usar `npm ci` na CI. Fixar a versão do Node em `.nvmrc` e em `engines` do `package.json`.
2. Autenticar: `gh auth login`, `supabase login`, `vercel login`.
3. Criar o repositório **público** no GitHub (`gh repo create ... --public`). Motivo: o briefing trata o repositório como público (B6).
4. Criar o projeto Supabase (Free) pelo painel, pela CLI ou pelo MCP; guardar URL e chave de serviço.
5. Criar e vincular o projeto Vercel (`vercel link`).
6. Cadastrar secrets: `gh secret set` para o GitHub Actions e `vercel env add` para o Vercel. Nada de segredo no repositório.

### Estrutura de pastas

```text
/                          raiz do repositório (público)
  apps/web/                front-end (Vite, TypeScript)
  apps/web/vendor/         só se leaflet-velocity for vendorizado
  api/                     Vercel Functions (/api/v1/*)
  ingest/                  job de ingestão em TypeScript (ingest/noaa/ em Python, alvo)
  supabase/migrations/     migrações e testes SQL
  scripts/                 notices.ts, importação local de maré, verificações de CI
  docs/                    PENDENCIAS.md, MODELOS.md, README de fontes
  .github/workflows/       ingestão, CI, lembrete diário de avisos, heartbeat
  .nvmrc                   versão exata do Node
  vercel.json              build do front e rotas
```

### Ferramentas e idiomas [PROPOSTA]

Vitest para testes unitários e Playwright para E2E. Gerenciador de pacotes: npm. Mensagens de commit em português do Brasil. Identificadores de código (variáveis, funções, tabelas, endpoints) em inglês. Textos da interface nos arquivos `pt-BR` e `en`. Licença do código do repositório: MIT [PROPOSTA], decisão final do dono do projeto; as licenças de terceiros (Leaflet, leaflet-velocity) são mantidas.

### Variáveis de ambiente

| Variável | Padrão | Onde fica |
|---|---|---|
| `SUPABASE_URL` | (sem padrão) | Vercel, GitHub Actions (variável), `.env.local` |
| `SUPABASE_SERVICE_ROLE_KEY` | (sem padrão) | **Secret** no Vercel e no GitHub Actions; `.env.local` |
| `GRID_SOURCE` | `openmeteo` | GitHub Actions, `.env.local` |
| `SOURCE_MODE` | `live` em produção; `simulated` em dev e testes | Vercel, GitHub Actions, `.env.local` |
| `OPENMETEO_FORECAST_URL` | sem padrão; obter na documentação (T-07); sem valor, falha fechada | Vercel, GitHub Actions |
| `OPENMETEO_MARINE_URL` | idem | Vercel, GitHub Actions |
| `OPENMETEO_MODEL_FORECAST` / `OPENMETEO_MODEL_MARINE` | vazio (a fonte escolhe); gravado em `model_runs.model` (B5) [PROPOSTA] | Vercel, GitHub Actions |
| `FORECAST_DAYS` | 9 [PROPOSTA] (job e `/point`) | Vercel, GitHub Actions |
| `POINT_DAILY_BUDGET` | 4000 | Vercel |
| `POINT_OPERATING_PCT` | 80 | Vercel |
| `POINT_CACHE_TTL_S` | 10800 (3 h) | Vercel |
| `POINT_STALE_MAX_S` | 21600 (6 h) [PROPOSTA] | Vercel |
| `POINT_PARTIAL_TTL_S` | 900 (15 min) [PROPOSTA] | Vercel |
| `POINT_MAX_PER_MIN` | 100 chamadas [PROPOSTA] | Vercel |
| `POINT_MAX_PER_HOUR` | 1000 chamadas [PROPOSTA] | Vercel |
| `POINT_ROUND_DEG` | 0.25 [PROPOSTA] | Vercel |
| `INGEST_ROUND_BUDGET` | 885 [PROPOSTA] | GitHub Actions |
| `INGEST_DAILY_BUDGET` | 3540 [PROPOSTA] | GitHub Actions |
| `INGEST_RETRY_MAX` | 2 [PROPOSTA] | GitHub Actions |
| `INGEST_MAX_PER_MIN` | 300 [PROPOSTA] | GitHub Actions |
| `FRAMES_CACHE_S` | 60 [PROPOSTA] | Vercel |
| `GRID_STALE_HOURS` / `GRID_EXPIRED_HOURS` | 18 / 48 [PROPOSTA] | Vercel |
| `GRID_BBOX` / `GRID_RES_DEG` (grade ampla) | `-54,-35,-30,5` / `2` | GitHub Actions, Vercel |
| `GRID_BAY_BBOX` / `GRID_BAY_RES_DEG` (grade da baía) | `-44,-24,-42,-22` / `0.25` [PROPOSTA] | GitHub Actions, Vercel |
| `BAY_GRID_MIN_ZOOM` | 9 [PROPOSTA] | Front (variável de build) |
| `NOTICE_CHECK_MAX_AGE_H` | 24 [PROPOSTA] | GitHub Actions |
| `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` | (fase 2) | Chave privada como **secret** |

**Desenvolvimento local.** `supabase start`, `.env.local` e `vercel dev`. Dados de teste vêm da fonte simulada. O job roda local com `SOURCE_MODE=simulated`.

## B10. Identidade visual [PROPOSTA]

Rosa dos ventos e bússola são o motivo. A inspiração de interação vem de apps como Windy (https://windy.app/map) e PredictWind Atlas (https://forecast.predictwind.com/atlas/): partículas de vento, barra de tempo, meteograma e camadas. **Não se copiam marca, layout, paleta nem ativos dessas empresas.**

### Paleta inicial (tokens)

Valores iniciais, a validar com a skill `dataviz` e com a auditoria de contraste. Ajustar se falharem em AA.

| Token | Claro | Escuro | Noturno |
|---|---|---|---|
| Fundo | `#F4EBD9` (areia-clara) | `#061629` (azul-marinho muito escuro) | `#000000` |
| Texto | `#0B2545` (azul-marinho profundo) | `#E8F1F5` (gelo) | `#FF4D4D` |
| Acento | `#0A6C94` (azul-mar) | `#4FD1E8` (ciano) | `#FF4D4D` |
| Alerta laranja | `#B54708` | `#FDA64F` | só vermelho |
| Alerta vermelho | `#B42318` | `#FF6B6B` | `#FF4D4D` com ícone e rótulo |

### Regras

- Contraste mínimo AA; meta AAA nos valores principais, para uso ao sol.
- **Modo noturno:** só vermelho e preto. As escalas de vento e de onda ficam **monocromáticas, variando a luminância** do vermelho, e sempre com **rótulos numéricos** na legenda, porque a cor sozinha não distingue as faixas.
- Tipografia do sistema, sem webfont. Valor principal grande; números tabulares.
- Ícones próprios: bússola, rosa dos ventos, vento, onda.
- Espaçamento em múltiplos de 4 px; raio de 8 px; alvos de toque de pelo menos 44 px. Ações principais na parte inferior.
- Vista inicial do mapa: centro em -22,71982, -43,17215, zoom 10, valores da URL de referência do briefing. O Claude Code confere no mapa e ajusta para a enseada. O bbox inteiro continua acessível ao afastar o mapa (grade ampla).
- Interpolação bilinear no front, sem blocos; regra de nulos nas ondas em B6.
- Modal de segurança na primeira abertura. Rodapé fixo: "Dados de modelos numéricos. Não substitui previsão oficial da Marinha do Brasil para navegação."
- **Avisos de resolução por tela** (texto ao velejador, em linguagem simples; sem mencionar verificação de processo):
  - **Mapa amplo:** "Mapa regional montado a partir de pontos espaçados em 2° (cerca de 220 km). Não representa o vento local da enseada."
  - **Mapa da baía:** "Mapa montado a partir de pontos espaçados em 0,25° (cerca de 28 km). Não representa o vento local da enseada: junto ao morro, à ponte ou à entrada da baía o vento pode ser bem diferente."
  - **Painel do ponto:** "Previsão para a coordenada arredondada a 0,25° (cerca de 28 km). Os valores podem diferir do mapa. É previsão de modelo, não medição no seu local."
  - Se a tarefa T-08 confirmar a resolução real do modelo, os textos podem ser ajustados [PROPOSTA].
- **Aviso fixo da faixa de avisos:** "Os avisos oficiais entram no app por registro manual e podem atrasar ou faltar. Consulte sempre o boletim oficial da Marinha."
- Rótulo da fonte em cada tela.

## B11. Fases e critérios de aceite

### MVP

Entrega: mapa com vento animado (partículas) e ondas totais, com grade ampla e grade da baía; barra de tempo com play e pré-carga de 3 quadros à frente; painel do ponto (meteograma com vento, rajada e ondas); aviso oficial em destaque (entrada manual, com data de registro e de conferência); pt e en; modos claro, escuro e noturno; PWA; job no GitHub Actions e API no Vercel. **Todos os critérios abaixo são obrigatórios, exceto o AC-MVP-12, que é recomendado e não bloqueia.**

| ID | Critério | Teste |
|---|---|---|
| AC-MVP-01 | Nenhuma requisição do navegador a domínio fora da API e dos arquivos do app | E2E lista as requisições |
| AC-MVP-02 | `/grid` exige `run_time` e `time`; sem `run_time` responde 422; rodada fechada com `Cache-Control` imutável; sem `X-Status` | Teste de API |
| AC-MVP-03 | Conversões U/V (casos a a e e o oblíquo), normalização da onda, direção 360 e negativa, e conversões de unidade passam (casos a a m, B12) | Teste unitário |
| AC-MVP-04 | `bbox` ou `res` fora dos pares pré-gerados: 422 `invalid_parameter`; `-54,-35,-30,5` com `2` e `-44,-24,-42,-22` com `0.25` são aceitos; par misto dá 422; sem `bbox` e `res`, vale a grade ampla | Teste de API |
| AC-MVP-05 | Com limite operacional de 3.200 chamadas: o 1.600º miss de ponto novo passa; o 1.601º dá 503 `quota_exhausted`; o contador sobe de 2 em 2; cache hit segue funcionando | Fonte simulada |
| AC-MVP-06 | Cliques repetidos e sequenciais no mesmo ponto arredondado, mesmo com `vars` e `hours` diferentes, geram uma chamada (2 requisições). Teste concorrente é informativo, não bloqueante | Fonte simulada |
| AC-MVP-07 | **No `/frames`:** `run_time` com mais de 18 h dá `status: "stale"`; com mais de 48 h dá 503 `data_expired`. No `/grid`, pedido direto com `run_time` de mais de 48 h dá 503 | Relógio simulado |
| AC-MVP-08 | Cada tela mostra o aviso de resolução próprio (mapa amplo, mapa da baía e ponto), o aviso fixo da faixa de avisos e o rótulo da fonte | E2E |
| AC-MVP-09 | Nenhum dado de maré no repositório. A CI falha se `git ls-files` listar: (a) qualquer `.pdf` ou `.csv`; (b) qualquer caminho em `tides/` ou `data-private/`; (c) arquivo `.json`, `.sql` ou de seed (`supabase/seed*`, `seed*`) cujo caminho case, sem distinguir maiúsculas e acentos, com `tide`, `mare` ou `tabua`, fora de `supabase/migrations/`; (d) migração ou seed com `INSERT INTO tide_predictions`. **Exceção:** a lista `scripts/ci/tide-allowlist.txt` admite fixtures legítimas (dados sintéticos para teste, por exemplo `fixtures/tide-sample.json`); cada linha tem um comentário e a lista passa por revisão do dono. Testes negativos: `tides/x.csv` falha; um arquivo `tide-*.json` fora da lista falha; o mesmo arquivo na lista passa | CI com repositório temporário |
| AC-MVP-10 | Sem tiles OSM em produção | E2E sobre as requisições |
| AC-MVP-11 | axe-core sem violações críticas (WCAG AA); Lighthouse de acessibilidade ≥ 90 [PROPOSTA] | CI |
| AC-MVP-12 | Recomendado: shell em cache e último dado com horário quando sem rede (offline não é prioridade) | E2E |
| AC-MVP-13 | Nenhuma chave de serviço no front ou no repositório | Varredura em CI |
| AC-MVP-14 | RLS ativa em todas as tabelas, **nenhuma política para `anon` e nenhuma para `public`** (sem cláusula `TO`, a política vale para `public`, que alcança `anon`) | CI: consulta SQL a `pg_tables` (`rowsecurity`) e a `pg_policies` (nenhuma linha cujo `roles` inclua `anon` ou `public`) no stack local; antes do deploy, `get_advisors` do Supabase MCP sem alerta crítico |
| AC-MVP-15 | Todos os textos da interface existem em `pt-BR` e `en` | Teste de chaves |
| AC-MVP-16 | Nenhuma Function do Vercel chama o Open-Meteo, exceto `/point`; `/grid` e `/frames` só leem do Supabase | Teste de integração |
| AC-MVP-17 | Aviso válido inserido pelo script `notice:add` aparece em destaque com crédito, link, data de registro e data da última conferência (`notice:checked`); sem aviso, o app diz que nada foi registrado e aponta o boletim oficial; o aviso fixo ("registro manual, pode atrasar ou faltar") aparece nos dois casos. O workflow diário abre ou atualiza a issue quando a última conferência tem mais de `NOTICE_CHECK_MAX_AGE_H` | E2E e teste do workflow com relógio simulado |
| AC-MVP-18 | Erro de limite da fonte: serve `stale` (cache com até 6 h) ou 503, sem nova tentativa imediata | Fonte simulada |
| AC-MVP-19 | O job grava cada tentativa HTTP em `quota_counter` (`openmeteo_ingest`); aborta ao passar de 885 chamadas na rodada; só publica rodada completa (57 quadros × 2 camadas × 2 regiões = 228 arquivos). Com `forecast_days=9`, um `run_time` às 21:01 UTC ainda gera os 57 quadros; se a fonte devolver horas a menos, a rodada **não** é publicada (`aborted`) e a anterior é mantida | Job com fonte simulada |
| AC-MVP-20 | Com o Supabase indisponível, o `/point` responde 503 `service_unavailable` e não chama a fonte | Fonte simulada |
| AC-MVP-21 | `/point` valida coordenadas dentro do bbox, `hours` de 1 a 168 e `vars` da lista; o resto dá 422. Com `hours=24`, a resposta começa na hora atual UTC arredondada para baixo e tem 24 entradas | Teste de API |
| AC-MVP-22 | `docs/MODELOS.md` existe, com modelos, resoluções, cobertura, termos, URL e data de leitura (tarefa T-08), e com o resultado das sondagens T-07 e T-15 | Revisão |
| AC-MVP-23 | **Tetos do `/point`:** com `POINT_MAX_PER_MIN=100`, o 50º miss no mesmo minuto passa e o 51º dá 429 `rate_limited` com `Retry-After`; no minuto seguinte, volta a passar. Com `POINT_MAX_PER_HOUR=1000`, o 500º miss da hora passa e o 501º dá 429. Reserva negada não incrementa nenhum contador. Cache hit não é limitado. Se o teto diário e o de minuto são excedidos juntos, o código é 503 `quota_exhausted` | Fonte simulada com relógio simulado |
| AC-MVP-24 | **Ondas com nulos:** a regra de interpolação de B6 passa nos 4 casos numéricos (valor 1,6 m; transparente com o canto mais próximo nulo; 4 nulos; 4 válidos) e interpola a direção por componentes (359° e 1° dão cerca de 0°) | Teste unitário |
| AC-MVP-25 | **Alinhamento dos quadros:** `run_time` 2026-11-17T21:01Z dá primeiro quadro 2026-11-18T00:00Z e último 2026-11-25T00:00Z, com 57 quadros; 2026-11-17T21:00Z dá primeiro 21:00Z e último 2026-11-24T21:00Z; 2026-11-17T00:00Z dá primeiro 00:00Z. Todos os instantes são múltiplos de 3 h UTC | Teste unitário |
| AC-MVP-26 | **Cache do `/point`:** entrada `ok` com 2 h é hit `ok`; com 4 h e fonte disponível é miss (renova); com 4 h e fonte falhando é `stale` (200); com 7 h e fonte falhando é 503 `service_unavailable`; falha parcial dá `partial`, conta 2 chamadas, vale 15 min e, depois, o novo miss repete as 2 chamadas e conta mais 2; entrada ilegível é miss e conta 2 uma única vez | Fonte simulada com relógio simulado |
| AC-MVP-27 | **Escolha da grade:** em zoom 10 com centro dentro do bbox da baía, o front pede `/grid` com `bbox=-44,-24,-42,-22` e `res=0.25`; em zoom abaixo de `BAY_GRID_MIN_ZOOM` ou com o centro fora do bbox, pede a grade ampla | E2E |

### Fase 2

Chuva, temperatura e pressão (isóbaras); alertas Web Push; rota com janela de partida; maré; swell e vaga como camadas; oscilações e rondadas do vento; camada de nuvens só se a fonte tiver a variável (padrão: não entregar). O meteograma passa a incluir chuva e maré.

| ID | Critério | Teste |
|---|---|---|
| AC-F2-01 | Camadas de chuva, temperatura e pressão com legenda e fonte | E2E |
| AC-F2-02 | Push: resposta 404 ou 410 do serviço remove a assinatura | Serviço simulado |
| AC-F2-03 | Push funciona em iOS 16.4 ou superior, com o PWA na tela inicial (P-11) | Teste manual em aparelho |
| AC-F2-04 | Rota amostrada a cada 5 NM; precedência: inviável > atenção > viável | Teste unitário |
| AC-F2-05 | Janela de partida lista horários com status por trecho | Teste unitário |
| AC-F2-06 | Maré exibida com o crédito ao CHM/DHN e o aviso de navegação; com a exibição desligada (se a Marinha negar), só o nível do mar do modelo, rotulado "nível do mar do modelo, não é tábua de maré" | E2E |
| AC-F2-07 | Camadas de swell e vaga separadas, com legenda | E2E |
| AC-F2-08 | Meteograma destaca oscilações e rondadas do vento numa série simulada | Teste unitário |
| AC-F2-09 | Alertas respeitam os limites do usuário e o idioma escolhido | Fonte simulada |
| AC-F2-10 | Coordenadas em `rules` arredondadas a 0,25°; assinatura apagável | Teste unitário |

### Fase 3

Correntes; observações INMET com ressalva; METAR como contexto; estação local de vento; comparação de modelos lado a lado; empacotamento mobile para lojas **somente se** custo zero for confirmado (P-15).

| ID | Critério | Teste |
|---|---|---|
| AC-F3-01 | Adaptador de correntes trocável, testado com fonte simulada; issue de reavaliação até 30/06/2027 [PROPOSTA] | Integração |
| AC-F3-02 | Observações INMET só entregues se token e termos forem confirmados (P-05); sempre com ressalva de qualidade | E2E |
| AC-F3-03 | Estação local de vento só entregue se houver fonte pública confirmada (P-07) | E2E |
| AC-F3-04 | Comparação de modelos lado a lado, se houver modelos verificados em `docs/MODELOS.md` (P-09) e `model_runs.model` registrar o modelo de cada rodada (B5) | E2E |
| AC-F3-05 | O PWA instala e abre. Empacotamento para lojas só se P-15 for aprovado (padrão: não entregar); se aprovado, instala e abre | Teste de instalação |
| AC-F3-06 | Auditoria `web-design-guidelines` sem pendências críticas | Revisão |

## B12. Testes e qualidade

**Conversões (testes unitários obrigatórios).** `s` é a velocidade, `d` a direção meteorológica (de onde sopra).

| Caso | Entrada | Resultado esperado |
|---|---|---|
| a | vento de Norte (d=0) | v = -s, u = 0 |
| b | vento de Leste (d=90) | u = -s, v = 0 |
| c | vento de Oeste (d=270) | u = +s |
| d | vento de Sul (d=180) | v = +s |
| e | onda com direção de origem 0 | seta aponta 180 |
| f | vento oblíquo (d=45) | u = v = -s·sen(45°) ≈ -0,7071·s |
| g | onda com origem 270 | seta aponta 90 (módulo 360) |
| h | 10 nós em m/s; m/s em km/h | 10 nós = 5,1444 m/s (1 nó = 1852 m / 3600 s), tolerância de 1e-4; 1 m/s = 3,6 km/h |
| i | 10 m/s em nós | ≈ 19,4384 nós (10 ÷ 0,514444), tolerância de 1e-3 |
| j | km/h e nós, nos dois sentidos | 10 nós = 18,52 km/h; 18,52 km/h = 10 nós; ida e volta preserva o valor (tolerância 1e-9) |
| k | vento com d=360 | igual ao d=0: u ≈ 0, v = -s (tolerância 1e-9) |
| l | vento com d=-90; onda com origem -90 | vento igual ao d=270 (u = +s, v ≈ 0); onda: seta aponta 90 (módulo positivo) |
| m | onda com origem 360 | seta aponta 180 |

**Tempo.** `Z` normalizado; exibição no fuso do aparelho; teste em UTC-3 e em UTC+0. **Quadros alinhados a múltiplos de 3 h UTC**, com os casos de AC-MVP-25.

**Dado vencido.** Ver AC-MVP-07 (testado no `/frames`) e AC-MVP-26 (`/point`).

**Demais.** Ordem dos dados da grade (norte para sul, oeste para leste), nas duas regiões; interpolação bilinear e regra de nulos (AC-MVP-24); contador de 2 em 2 e tetos por minuto e hora no `/point` (AC-MVP-23); contagem por tentativa no job; coalescência por cliques sequenciais; E2E com Playwright (`context.newCDPSession(page)` para emular rede); cliente reage a `run_not_found` recarregando `/frames` uma vez.

**Qualidade.** Lint e testes antes de cada commit (hooks). `code-review` e `security-review` antes de cada merge. A skill `web-design-guidelines` revisa cada tela antes da entrega.

## B13. Ferramentas do Claude Code por etapa

Nomes levantados pelo pesquisador como existentes nesta instalação. Os recursos de cada MCP dependem de sessão autenticada; sem ela, usar as CLIs `vercel` e `supabase`. O comando de instalação da skill do Supabase vem da página oficial lida (https://supabase.com/docs/guides/getting-started/ai-skills). Se uma ferramenta não existir no ambiente, use a CLI equivalente e registre.

| Ferramenta | Tipo | Etapa | Por quê |
|---|---|---|---|
| `npx skills add supabase/agent-skills` | skill externa | Antes do banco e das migrações | Orientação oficial. Instala `supabase` e `supabase-postgres-best-practices`; para uma só, `--skill NOME` |
| CLAUDE.md do projeto | recurso | Início | Regras permanentes: idioma, unidades, marcações |
| Modo de planejamento | recurso | Antes de cada fase | Plano revisável antes de escrever código |
| `frontend-design` | skill | Fase 1, identidade e telas | Direção estética sem cara de template |
| `dataviz` | skill | Meteograma, escalas de cor e legendas | Paleta validada em claro e escuro |
| `web-design-guidelines` | skill | Antes de cada tela; fase 3 | Auditoria de acessibilidade e UX |
| Subagentes | recurso | Ingestão, interface e revisão | Trabalho paralelo, contextos separados |
| Worktrees | recurso | Fases paralelas | Isolamento de branches |
| Supabase MCP | MCP | `apply_migration`, `execute_sql`, `get_advisors`, `query_logs`, `generate_typescript_types` | Ler logs e advisors antes de mudar o banco |
| `supabase` CLI | CLI | Stack local, migrações, testes SQL | Recomendada nas instruções do MCP |
| Vercel MCP | MCP | `create_deployment`, `get_runtime_logs`, `get_runtime_errors`, `create_project_env`, `edit_project_env` | Operação e diagnóstico |
| `gh` (GitHub CLI) | CLI | PRs, issues, workflows, secrets, CI | Operação do repositório e do job |
| `run` | skill | Subir o app e ver a mudança | Confirma no app real |
| `webapp-testing` | skill (Playwright local) | Testes E2E | Teste reprodutível em navegador |
| `agent-browser` | skill | Exploração e QA manual | Automação de navegador |
| Claude in Chrome | MCP | Inspecionar a página real | Ver o que o usuário vê |
| `code-review` | skill | Cada PR antes do merge | Correção e regressões |
| `security-review` | skill | RLS, CORS, secrets, Functions | Segurança |
| `simplify` | skill | Após cada fase | Evitar repetição |
| Hooks | recurso | Antes de cada commit | Lint e testes automáticos |
| `skill-creator` | skill | Opcional | Só se valer criar skill do projeto (ex.: validação de conversão U/V) |

## B14. Pendências e tarefas

### B14.1 Pendências (incertezas reais)

Tabela a copiar para `docs/PENDENCIAS.md`. A coluna **Decisão** traz o padrão seguro. **Data** é a data de registro. Responsável: **dono do projeto** ou **Claude Code**. Os IDs foram mantidos para rastreabilidade com a revisão anterior: P-02, P-08, P-10, P-13 e P-14 viraram as tarefas T-10, T-11, T-12, T-13 e T-14 (B14.2), porque bastam leitura de página ou teste.

| ID | Decisão (e padrão seguro) | Data | Motivo | Evidência | Responsável |
|---|---|---|---|---|---|
| P-01 | [A CONFIRMAR] Confirmação formal da Marinha sobre a republicação da tábua de maré (não bloqueante). Padrão: exibir com crédito ao CHM/DHN, só dados de previsão, sem reproduzir o PDF nem o layout, com aviso de navegação; se a Marinha negar, desligar a exibição e usar o nível do mar do modelo com rótulo | 17/11/2026 | Sem licença escrita; PDF oficial e público; exibição aprovada pelo dono | Pedido ao BNDO (chm.bndo@marinha.mil.br, "até 10 dias úteis", gratuito; gov.br LIDO). Estação candidata: Niterói/Ponta da Armação, série 1989–2021 (BUSCA, IBGE); presença na tábua 2026 e distância [A CONFIRMAR] (P-12) | dono do projeto |
| P-03 | [A CONFIRMAR] Limite por IP do Open-Meteo no Vercel e nos runners do GitHub. Padrão: cache de 3 h, orçamento, tetos por minuto e por hora, sem nova tentativa imediata, `stale` em falha | 17/11/2026 | Termos avisam sobre Vercel; runners também compartilham IPs | https://open-meteo.com/en/terms (LIDO) | Claude Code |
| P-04 | [A CONFIRMAR] Termos de reuso dos avisos da Marinha. Padrão: link e texto colado pelo dono, sem scraping | 17/11/2026 | Páginas do CHM retornaram 403 | https://www.marinha.mil.br/chm (BUSCA) | dono do projeto |
| P-05 | [A CONFIRMAR] Token, termos e URL de alertas do INMET. Padrão: API fora do MVP | 17/11/2026 | Manual só citado por terceiros | https://portal.inmet.gov.br/manual/manual-de-uso-da-api-esta%C3%A7%C3%B5es (não lido) | dono do projeto |
| P-06 | [A CONFIRMAR] METAR: URL e termos do DECEA/REDEMET; distância até a enseada. Padrão: fora do MVP; não estimar distância | 17/11/2026 | Fonte oficial não verificada. SBJR é Jacarepaguá, não Santos Dumont | METAR NOAA/NWS (BUSCA) | dono do projeto |
| P-07 | [A CONFIRMAR] Dados de boia ou estação costeira na baía. Padrão: indisponível, fora do MVP | 17/11/2026 | PNBOIA lançada em 2014 (BUSCA); notícia de 10/2026 aponta boias irregulares | https://www.marinha.mil.br/chm/node/70352 e notícia do Diário do Rio (BUSCA) | dono do projeto |
| P-09 | [A CONFIRMAR] Existência de modelo gratuito de maior resolução para a enseada. Padrão: grades de 2° e 0,25°, interpolação bilinear, avisos por tela | 17/11/2026 | Nenhum encontrado; página de modelos do Open-Meteo retornou 404 | https://open-meteo.com/en/docs/models (NÃO LIDO). Tarefa T-08 | Claude Code pesquisa; dono do projeto aprova qualquer troca |
| P-11 | [A CONFIRMAR] Web Push no iOS e conta VAPID. Padrão: teste manual em aparelho; push só em PWA instalado | 17/11/2026 | Depende de aparelho real | https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/ (REAPROVEITADO) | Claude Code prepara; dono do projeto testa |
| P-12 | [A CONFIRMAR] Estação maregráfica mais próxima da enseada. Padrão: Niterói/Ponta da Armação se estiver nos 44 portos da tábua 2026; senão, a mais próxima listada, com distância registrada | 17/11/2026 | Lista da tábua 2026 não lida | Tábua 2026 (BUSCA) | dono do projeto |
| P-15 | [A CONFIRMAR] Custo e regras de contas de loja de aplicativos (fase 3, empacotamento mobile). Padrão: permanecer só PWA | 17/11/2026 | Briefing exige custo zero; custo das contas de loja não verificado | Nenhuma fonte lida | dono do projeto decide; Claude Code levanta as condições se o dono pedir |

**Resolvidos** (fora das incertezas): licença do Natural Earth, limites do Supabase Free, skill oficial do Supabase e a hospedagem (meio-termo). **Não estão na lista de resolvidos:** a licença do NOAA (conclusão mantida, mas a verificação do registro de fontes é a tarefa T-12 e `GRID_SOURCE=noaa` fica desligado até ela terminar) e o filtro do GFS Wave (não localizado, tarefa T-04).

### B14.2 Tarefas do Claude Code (não são incertezas)

Cada tarefa tem uma etapa na ordem de execução do B15. Resultados vão para `docs/PENDENCIAS.md`, README ou `docs/MODELOS.md`.

| ID | Tarefa | Etapa | Padrão se não resolver |
|---|---|---|---|
| T-01 | Instalar o leaflet-velocity, abrir `demo/*.json` e copiar `header` (`dx`, `dy`, `parameterCategory`, `parameterNumber`, `parameterUnit`) e a ordem dos dados. Registrar no README | 3 | Usar o demo como verdade; o teste de fumaça decide a orientação |
| T-02 | Ler a documentação do Vercel sobre o cabeçalho de IP do cliente e regras de firewall | 5 | Sem limite por cliente |
| T-03 | **Verificação pós-deploy:** na primeira semana de produção, observar se as leituras do job evitam a pausa do Supabase por inatividade | 7 (depois do deploy) | Leitura simples a cada execução |
| T-04 | Se ativar `noaa`: **localizar o filtro do GFS Wave** (o `filter_gefs_wave_0p25.pl` é do GEFS Wave e não vale), listar variáveis e níveis do filtro no dia, escolher vento a 10 m (U e V) e ondas totais, registrar a retenção observada | Só ao ativar `noaa` | Baixar a cada rodada; `noaa` desligado |
| T-05 | Escolher a escala mais detalhada do Natural Earth e conferir a costa da enseada; conferir no mapa que o bbox da baía cobre a Baía de Guanabara e a enseada. Registrar que a escala pode não mostrar a enseada | 6 | Mostrar o aviso "costa simplificada" |
| T-06 | Ler o fuso e o cabeçalho do PDF da tábua 2026 (fase 2, só local) | Fase 2 | Não assumir fuso |
| T-07 | Obter as URLs dos endpoints do Open-Meteo na documentação. Verificar: (a) se aceita várias coordenadas por chamada e como isso entra na cota; (b) se a série começa em 00:00 GMT do dia corrente e se previsão e Marine aceitam `forecast_days=9` e devolvem horas suficientes para 57 quadros; (c) como fixar o modelo e se a resposta o informa. Sondagem manual de poucas chamadas, dentro do limite de 10 do total | 3 | Falha fechada sem as variáveis; uma localização por requisição; `model = auto` |
| T-08 | Pesquisar modelos e resoluções disponíveis (Open-Meteo e fontes regionais, por exemplo CPTEC/INPE como candidato a verificar, sem presumir dados) e gravar `docs/MODELOS.md` | 3 | Manter 2° e 0,25° e os avisos |
| T-09 | Procurar a página oficial dos mapas interativos do CHM citados na notícia de 10/2026 | 5 | Link para https://www.marinha.mil.br/chm |
| T-10 | Ler os termos do Vercel (https://vercel.com/terms), localizar a seção de uso justo ou do plano Hobby (âncora `#fair-use` a localizar) e registrar a evidência. Reconfirmar o registro antes do primeiro deploy de produção | 1 (reconfirmar na 7) | Publicar no Hobby; se a leitura indicar vedação, interromper o deploy de produção e avisar o dono |
| T-11 | Testar o leaflet-velocity com o Leaflet 1.9.4 (teste de fumaça). A documentação do plugin lista só Leaflet 1.0.3 e 0.7.7 | 6 | Fixar a versão que passar; se falhar, vendorizar (B15) |
| T-12 | Se ativar `noaa`: verificar o registro de fontes da NOAA (https://www.weather.gov/disclaimer e https://registry.opendata.aws/noaa-gfs-bdp-pds) | Só ao ativar `noaa` | `GRID_SOURCE=noaa` desligado |
| T-13 | Fase 3: conferir a redação exata da atribuição do Copernicus na página de licença | Fase 3 | "E.U. Copernicus Marine Service Information" |
| T-14 | Reler https://open-meteo.com/en/pricing: cotas e peso por chamada | 3 | Peso 1 por requisição, margem de 25% no job, limite de 80% no `/point` |
| T-15 | Verificar o que o Marine devolve em pontos de terra: `null` ou o valor do mar mais próximo. Sondagem manual de poucas chamadas (dentro do limite de 10); registrar em `docs/MODELOS.md` | 3 (depois da T-07) | Tratar como `null` ("sem dado de onda neste ponto"); se vier valor do mar próximo, mostrar a nota "ondas do mar mais próximo, informado pela fonte" no painel |
| T-16 | Avaliar fontes públicas brasileiras de linha de costa (por exemplo IBGE) e dados do OpenStreetMap servidos de forma estática, para melhorar a costa da enseada. Licenças não afirmadas: [A CONFIRMAR]; registrar as condições lidas | 6 | Natural Earth |
| T-17 | Verificar os pré-requisitos do Windows 11 para o Docker Desktop (WSL2, virtualização, condições de uso), confirmar identificadores do `winget`, a versão do Node aceita pelo Playwright, e criar `.nvmrc`, `engines` e versões exatas | 1 | Parar e avisar o dono se o Docker não puder rodar; sem Docker, não há `supabase start` local |

## B15. Prompt final

Copie o bloco abaixo e entregue-o ao Claude Code numa pasta vazia, no Windows 11 com PowerShell.

````text
PAPEL
Você é o desenvolvedor principal do app "Mariner's Compass Meteorologia", um app meteorológico náutico para a Enseada de São Francisco, Niterói-RJ (sede do Iate Clube Brasileiro, ICB, sem vínculo oficial com o clube), na Baía de Guanabara. Construa do zero, sem fazer perguntas. Onde houver incerteza, siga o padrão seguro e registre em docs/PENDENCIAS.md. Documentação e commits em português do Brasil; identificadores de código em inglês; textos da interface em arquivos pt-BR e en, ambos desde o início. Nunca invente fatos, URLs, nomes de pacotes ou modelos.

MARCADORES
[PENDENTE-BLOQUEANTE]: construa, mas não publique em produção. [A CONFIRMAR]: siga o padrão e anote no README; se houver tarefa, execute-a e registre o resultado. [PROPOSTA]: use o valor sugerido, configurável (env var ou constante nomeada). Tudo o que você pode descobrir lendo uma página ou rodando um teste é TAREFA (lista abaixo), não incerteza. Responsáveis: "dono do projeto" ou "Claude Code".

PRÉ-REQUISITOS (Windows 11, PowerShell)
1. Instale Node.js 22 [PROPOSTA], Git, gh, Supabase CLI, Vercel CLI e Docker Desktop (o supabase start exige Docker). Python só se ativar GRID_SOURCE=noaa. Instalação via winget [PROPOSTA]: confirme o identificador de cada pacote com winget search, sem presumir; para Supabase CLI e Vercel CLI siga a documentação oficial. Requisitos do Docker Desktop no Windows 11 (em geral WSL2 e virtualização habilitada): VERIFIQUE antes de rodar supabase start (T-17). A compatibilidade do Playwright com a versão do Node (documentação lista 22, 24 e 26; REAPROVEITADO do prompt anterior, não relido) também se confirma na T-17. Gerenciador: npm. Testes: Vitest (unidades) e Playwright (E2E). VERSÕES EXATAS: fixe versões exatas das dependências (sem ^ nem ~) em package.json e package-lock.json, use npm ci na CI, e fixe a versão do Node em .nvmrc e em engines.
2. Autentique: gh auth login, supabase login, vercel login.
3. Crie o repositório PÚBLICO no GitHub (gh repo create --public). Motivo: o briefing trata o repositório como público (por isso nenhum dado de maré entra nele). Condições de repositório privado: [A CONFIRMAR]; padrão: público. Licença do código: MIT [PROPOSTA; o dono decide].
4. Crie o projeto Supabase (Free) pelo painel, CLI ou MCP. Crie e vincule o projeto Vercel (vercel link).
5. Cadastre secrets: gh secret set (Actions) e vercel env add (Vercel). Nunca grave segredo no repositório.
Estrutura de pastas: apps/web (front, Vite e TypeScript; apps/web/vendor só se vendorizar o leaflet-velocity); api (Vercel Functions /api/v1/*); ingest (job em TypeScript; ingest/noaa em Python, alvo); supabase/migrations; scripts (notices.ts, importação local de maré, verificações de CI); docs (PENDENCIAS.md, MODELOS.md); .github/workflows (ingestão, CI, lembrete diário de avisos, heartbeat); .nvmrc; vercel.json.

USO E LICENÇAS
- App gratuito, não comercial, sem anúncios, sem assinatura, sem compras, sem serviço B2B. Só ferramentas gratuitas.
- Open-Meteo (https://open-meteo.com/en/terms): uso livre só não comercial; CC BY 4.0. Exiba sempre "Dados: Open-Meteo.com (CC BY 4.0)". Os termos dizem que o limite é por IP e por aplicação e avisam que, em Vercel, Netlify, Render ou Google Sheets, o limite pode ser atingido antes do esperado (sugerem Cloudflare Workers, descartado pelo dono). Por isso: a coleta pesada roda no GitHub Actions; o Vercel só repassa e guarda em cache o /point, com tetos por minuto e por hora. O risco de IP compartilhado persiste (P-03).
- NOAA (GFS e GFS Wave): conclusão de licença mantida (domínio público); atribuição pedida, não exigida: "Dados: NOAA/NCEP GFS e WaveWatch III, modificados pelo app". Não sugira endosso. GRID_SOURCE=noaa fica DESLIGADO até a T-12 (registro de fontes: https://www.weather.gov/disclaimer e https://registry.opendata.aws/noaa-gfs-bdp-pds) e a T-04.
- Avisos da Marinha (CHM/DHN): crédito "Fonte: Marinha do Brasil, CHM/DHN". Sem scraping. Mecanismo: o dono do projeto lê o boletim oficial; se há aviso, roda localmente npm run notice:add -- --title "..." --body "..." --url "..." --valid-until "AAAA-MM-DDThh:mmZ" (scripts/notices.ts, chave de serviço do .env.local) e grava em official_notices; em qualquer caso roda npm run notice:checked, que grava checked_at em notice_checks [PROPOSTA]. O RLS bloqueia anônimo. O app mostra o aviso em destaque, com crédito, link oficial (padrão https://www.marinha.mil.br/chm), data do último registro e data da última conferência. Sem aviso: "Nenhum aviso registrado no app. Consulte o boletim oficial", com o link. Texto fixo na área de avisos (pt-BR e en): "Os avisos oficiais entram no app por registro manual e podem atrasar ou faltar. Consulte sempre o boletim oficial da Marinha." Crie um workflow DIÁRIO que abre ou atualiza a issue "Conferir avisos da Marinha" se a última conferência tiver mais de NOTICE_CHECK_MAX_AGE_H horas (padrão 24) [PROPOSTA].
- Natural Earth (costa): domínio público; sugestão "Made with Natural Earth." A escala pode não mostrar a enseada (T-05); alternativas de costa na T-16, com padrão Natural Earth. Tiles do OpenStreetMap: proibidos em produção. PMTiles: fora do escopo.
- Maré: tábua da Marinha, crédito "Fonte: Centro de Hidrografia da Marinha (CHM/DHN) – Marinha do Brasil", só previsão, com aviso de navegação. CSV e PDF de maré NUNCA entram no Git (.gitignore e pasta fora do repositório). Importação por script local para tide_predictions. Exiba a tábua com o crédito e o aviso de navegação; a confirmação com a Marinha é [A CONFIRMAR, P-01], não bloqueante. Se a Marinha negar, desligue a exibição e use sea_level_height_msl rotulado "nível do mar do modelo, não é tábua de maré".
- Aviso permanente no rodapé: "Dados de modelos numéricos. Não substitui previsão oficial da Marinha do Brasil para navegação." Modal de segurança na primeira abertura. Aviso de que o app não tem vínculo oficial com o ICB [PROPOSTA].
- Vercel Hobby (T-10): padrão é publicar no Hobby (app gratuito, sem anúncios, assinatura ou compras). Na etapa 1, leia os termos do Vercel (https://vercel.com/terms), localize a seção de uso justo ou do plano Hobby (a âncora https://vercel.com/legal/terms#fair-use é a localizar) e registre a evidência em docs/PENDENCIAS.md; reconfirme antes do primeiro deploy de produção. Se a leitura indicar que o Hobby não permite este app, INTERROMPA o deploy de produção e avise o dono. Previews continuam permitidos.
- Empacotamento mobile para lojas (fase 3): custo e regras das contas de loja não verificados (P-15). Padrão seguro: permanecer só PWA.

STACK
- Front: TypeScript, Vite, sem framework de interface; Leaflet 1.9.4 fixo no package-lock; leaflet-velocity para o vento. Instale a versão mais recente do plugin e fixe a que passar no teste de fumaça (T-11: vento animado sobre o Leaflet 1.9.4). Se falhar, NÃO rebaixe o Leaflet: copie o plugin para apps/web/vendor/leaflet-velocity com o LICENSE (CSIRO Open Source Software Licence Agreement) e aplique só as alterações estritamente necessárias para funcionar com o Leaflet 1.9.4, sem mudar a API pública, listadas em apps/web/vendor/leaflet-velocity/PATCHES.md. Camada de ondas própria em Canvas (extensão de L.Layer).
- API: Vercel Functions em TypeScript. Só repassam arquivos e respostas em cache; sem processamento pesado (Hobby: 4 h de Active CPU por mês).
- Banco e Storage: Supabase Free. Job: GitHub Actions com cron, repositório público, TypeScript (Node fixado em .nvmrc). Para noaa, módulo Python com cfgrib e ecCodes.
- PWA com Service Worker (PWA no MVP e na fase 2; empacotamento na fase 3 só se P-15 for aprovado). Offline não é prioridade.
- Dev local: supabase start, .env.local (ignorado pelo Git), vercel dev. Fonte simulada para dev e testes (SOURCE_MODE=simulated). Nenhum teste automatizado chama fonte real; exceção: as sondagens manuais T-07 e T-15, no máximo 10 chamadas no total, registradas em docs/MODELOS.md.

FONTES E ADAPTADORES
Cada fonte fica atrás de uma interface, com versão simulada, e declara a unidade em meta.units. Ausente é null, nunca zero. Todo tempo em ISO 8601 UTC com Z (o Open-Meteo devolve GMT sem Z: normalize). A interface exibe no fuso do aparelho.
- Open-Meteo forecast: wind_speed_10m, wind_direction_10m, wind_gusts_10m. Na grade, wind_speed_unit=ms (m/s). No /point, wind_speed_unit=kn. Direção em graus, de onde sopra. forecast_days até 16 (padrão 7); o app usa FORECAST_DAYS=9.
- Open-Meteo Marine (/v1/marine): wave_height, wave_direction, wave_period, wind_wave_height, wind_wave_direction, wind_wave_period, swell_wave_height, swell_wave_direction, swell_wave_period. Alturas em m, direções em graus de origem, períodos em s. A documentação diz que não serve para navegação costeira. Valor em pontos de terra: desconhecido (T-15).
- URLs: SEM valor padrão. Leia os exemplos em https://open-meteo.com/en/docs e https://open-meteo.com/en/docs/marine-weather-api (T-07) e grave em OPENMETEO_FORECAST_URL e OPENMETEO_MARINE_URL. Sem as variáveis, o job e o /point falham com erro claro e NÃO chamam a fonte.
- Uma localização por requisição é o PADRÃO [A CONFIRMAR, T-07]: a fonte pode aceitar várias coordenadas por chamada, mas isso e a regra de contagem na cota não foram verificados. Só agrupe se a T-07 confirmar a regra de contagem. No máximo 10 variáveis e 2 semanas por requisição (o adaptador recusa mais que isso).
- Modelo: fixe o parâmetro de modelo explicitamente se a documentação mostrar como (OPENMETEO_MODEL_FORECAST e OPENMETEO_MODEL_MARINE, vazios por padrão = a fonte escolhe); registre o valor retornado se a resposta o informar. Grave em model_runs.model no formato forecast:<modelo>|marine:<modelo>; se nada informar o modelo, grave "auto" (a comparação de modelos da fase 3 fica indisponível).
- Interfaces futuras: noaa-gfs, noaa-gfs-wave (arquivo gfswave.tCCz.global.0p25.fNNN.grib2; o filtro do GFS Wave NÃO foi localizado: filter_gefs_wave_0p25.pl parece ser do GEFS Wave, outro produto, e não deve ser usado; localize o correto na T-04), tides, currents, observations.

ARQUITETURA
App (navegador) -> API no Vercel -> Supabase (cache e Storage) <- job no GitHub Actions -> fontes. O navegador nunca chama fonte externa. /grid e /frames só leem do Supabase. Só o /point chama o Open-Meteo, dentro do orçamento e dos tetos. Sem Vercel Cron e sem Cloudflare.

INGESTÃO E GRADES
- Duas regiões da mesma fonte. wide (ampla, contexto regional): bbox -54,-35,-30,5 (ordem oeste,sul,leste,norte), 2 graus, 13 colunas x 21 linhas = 273 pontos (espaçamento de cerca de 220 km, 2 x 111 km). bay (baía) [PROPOSTA]: bbox -44,-24,-42,-22, 0,25 grau, 9 x 9 = 81 pontos (cerca de 28 km, 0,25 x 111 km); contém o centro da vista inicial; confira na T-05. Alvo noaa: 0,5 grau, 49 x 81 = 3.969 pontos [PROPOSTA] (só região wide; a baía fica para quando noaa for ativado). Camadas em cada região: wind e waves (ondas totais). A grade fina NÃO garante detalhe local: pontos vizinhos podem ter valores iguais; a resolução real do modelo depende da T-08. Se a cota apertar, suba o passo da wide para 4 graus (77 pontos, 154 chamadas).
- Instantes: múltiplos de 3 h em UTC. O primeiro quadro é o primeiro múltiplo de 3 h igual ou posterior ao run_time; seguem de 3 em 3 h até 168 h depois do primeiro: 57 quadros por camada e região. No openmeteo, peça forecast_days=9 (não 8: um job entre 21:01 e 23:59 UTC tem o primeiro quadro às 00:00 UTC de D+1 e o último às 00:00 UTC de D+8) e filtre as horas múltiplas de 3. Se a fonte devolver menos horas do que os 57 quadros exigem, a rodada é incompleta: NÃO publique, mantenha a anterior, marque model_runs.status=aborted e registre.
- Arquivo de vento: array de dois objetos, U primeiro e V depois, no formato de saída do grib2json que o leaflet-velocity lê: header e data[] plano com nx x ny valores. NÃO fixe de memória dx, dy, parameterCategory, parameterNumber nem parameterUnit: copie do demo/*.json do pacote instalado (T-01) e registre no README. Hipótese a verificar: dx e dy positivos, com o sentido norte->sul dado por la1 > la2. Valores próprios. wide: lo1=-54, la1=5, lo2=-30, la2=-35, nx=13, ny=21. bay: lo1=-44, la1=-22, lo2=-42, la2=-24, nx=9, ny=9. Dados em linhas de norte para sul, de oeste para leste. U e V em m/s. O teste de fumaça confirma a orientação.
- Arquivo de ondas [PROPOSTA]: array de dois objetos, altura primeiro e direção depois; header com a mesma geometria do vento mais parameter ("height" ou "direction") e unit ("m" ou "deg_from"); data[] plano nx x ny com null onde não há dado (terra). Sem U e V. A seta aponta para (direção + 180) módulo 360.
- Regra de interpolação das ondas com nulos [PROPOSTA]: no front, interpolação bilinear a partir dos 4 cantos da célula. (1) 4 cantos válidos: bilinear normal. (2) canto MAIS PRÓXIMO nulo: pixel transparente. (3) canto mais próximo válido e outro canto nulo: use só os cantos válidos com pesos renormalizados. (4) 4 nulos: transparente. (5) direção interpolada por componentes (seno e cosseno). Teste: cantos 00=1,0; 10=2,0; 01=3,0; 11=null; no ponto (0,25; 0,25) o valor é (0,5625*1 + 0,1875*2 + 0,1875*3) / 0,9375 = 1,6 m; no ponto (0,75; 0,75) é transparente.
- Qual grade o front usa [PROPOSTA]: com zoom >= BAY_GRID_MIN_ZOOM (padrão 9) e centro dentro do bbox da baía, use a bay; senão, a wide. A vista inicial (zoom 10) usa a bay.
- Conversão no job openmeteo (s em m/s, d em radianos, de onde sopra): u = -s*sen(d), v = -s*cos(d).
- run_time no openmeteo = id da coleta (horário UTC do início do job, com Z); as duas regiões compartilham o run_time. Uma rodada só é publicada quando os 228 arquivos (57 quadros x 2 camadas x 2 regiões) estão gravados. Mantenha as 2 rodadas mais recentes. Remova entradas de point_cache com mais de 24 h e janelas de quota_window com mais de 2 dias.
- Repositório público; cron a cada 6 horas [PROPOSTA]. Cada job lê o Supabase ao menos uma vez (T-03 é verificação PÓS-DEPLOY de que isso evita a pausa). Commit mensal de heartbeat [PROPOSTA] para o agendamento não ser desativado após 60 dias sem atividade.

CONTAGEM E ORÇAMENTO (UMA unidade: chamada HTTP efetiva ao Open-Meteo, peso 1; toda tentativa conta, inclusive retry; uma coordenada por requisição)
- Job: wide 273 pontos x 2 requisições = 546; bay 81 x 2 = 162; total 708 chamadas por rodada; 4 rodadas = 2.832 por dia. Teto da rodada com margem de 25% para retries: 708 x 1,25 = 885 (INGEST_ROUND_BUDGET). Teto diário: 885 x 4 = 3.540 (INGEST_DAILY_BUDGET). Retries: até INGEST_RETRY_MAX=2 por requisição, com espera crescente; no máximo 300 chamadas por minuto (uma rodada de 885 cabe em cerca de 3 min). Ao atingir o teto, ABORTE, não publique a rodada incompleta e mantenha a última válida. Grave cada tentativa HTTP em quota_counter (fonte openmeteo_ingest). Erro de limite da fonte: sem nova tentativa imediata.
- /point: cada miss reserva 2 chamadas (forecast e marine) pela RPC atômica e condicional reserve_calls(at, source, n, day_limit, hour_limit, minute_limit), ANTES de chamar a fonte; na mesma transação ela só incrementa (quota_counter para o dia; quota_window para hora e minuto) se calls + n <= cada limite aplicável (limite nulo = não se aplica); se algum falhar, nada é incrementado e ela devolve allowed=false e o motivo (day, hour ou minute). POINT_DAILY_BUDGET = 4.000 (teto declarado). Limite operacional diário = 80% (3.200 chamadas = 1.600 misses); os 20% restantes são margem contra erro de contagem do Open-Meteo (T-14). Tetos [PROPOSTA]: POINT_MAX_PER_MIN=100 chamadas (50 misses) e POINT_MAX_PER_HOUR=1000 chamadas (500 misses); evitam rajadas acima de 600/min ou próximas de 5.000/h e bloqueio por IP. Reserva negada por limite diário: 503 quota_exhausted com Retry-After (padrão: próximo dia UTC); por minuto ou hora: 429 rate_limited com Retry-After em segundos; o diário é verificado primeiro. Cache hit segue em todos os casos. Supabase indisponível: FAIL-CLOSED, 503 service_unavailable, sem chamar a fonte.
- Pior caso diário: 3.540 + 4.000 = 7.540, abaixo de 10.000 por dia (com o /point no limite operacional: 3.540 + 3.200 = 6.740). Pior caso por minuto: 300 + 100 = 400 (< 600). Por hora: 885 + 1.000 = 1.885 (< 5.000). Limites do Open-Meteo: 600/min, 5.000/h, menos de 10.000/dia (página de preços reaproveitada; releia na T-14).

API v1 (convenções: meta com source, run_time, updated_at, units, status, layers, attribution[]; status = ok, partial ou stale (NÃO existe "unavailable": sem dado utilizável, a API responde 503 data_expired ou service_unavailable); erros { "error": { "code", "message" } } com invalid_coordinates e invalid_parameter (422), run_not_found (404), rate_limited (429), quota_exhausted, data_expired e service_unavailable (503; service_unavailable = Supabase fora, ou as duas fontes falhando sem cache utilizável), not_implemented (501); erros com Cache-Control: no-store)
- GET /api/v1/frames?layer=wind|waves -> { meta (run_time, updated_at, status), times[] } da rodada fechada mais recente (vale para as duas regiões). AQUI o vencimento é calculado: idade do run_time > 18 h = status "stale" (HTTP 200); sem rodada ou > 48 h = 503 data_expired. Cache-Control: public, max-age=60 (nunca imutável).
- GET /api/v1/grid?layer=&run_time=&time=&bbox=&res=. layer, run_time e time obrigatórios (ISO UTC com Z); sem run_time = 422 invalid_parameter. bbox (oeste,sul,leste,norte) e res opcionais; sem eles vale a grade wide. Se informados, devem formar um par pré-gerado: (-54,-35,-30,5 com 2) ou (-44,-24,-42,-22 com 0.25); outro valor ou par misto = 422 invalid_parameter. run_time inexistente = 404 run_not_found (o cliente recarrega /frames e tenta uma vez). Rodada fechada: Cache-Control: public, max-age=31536000, immutable. Cabeçalhos só imutáveis: X-Source, X-Run-Time, X-Attribution (Access-Control-Expose-Headers). NÃO envie X-Status nem X-Updated-At; o front NÃO confia no /grid para vencimento e usa o /frames. Se o run_time pedido tiver > 48 h, responda 503 data_expired. A Function só repassa o arquivo do Storage.
- GET /api/v1/point?lat=&lon=&vars=&hours=. Valide: lat entre -35 e 5, lon entre -54 e -30 (senão 422 invalid_coordinates); hours inteiro de 1 a 168; vars só da lista (wind_speed_10m, wind_gusts_10m, wind_direction_10m e as 9 de ondas); senão 422 invalid_parameter. Chave de cache = lat e lon arredondadas a 0,25 grau (POINT_ROUND_DEG) na tabela point_cache; a chamada à fonte é SEMPRE o conjunto completo (3 variáveis de forecast e 9 de marine, forecast_days=9); vars e hours apenas recortam a resposta. hours conta A PARTIR DA HORA ATUAL EM UTC ARREDONDADA PARA BAIXO (inclusive); se houver menos horas no cache, devolva as disponíveis, sem preencher. Resposta: { meta, hourly{ time[], wind_speed_10m[], wind_gusts_10m[], wind_direction_10m[], wave_height[], wave_direction[], wave_period[], wind_wave_*[], swell_wave_*[] } }, vento e rajada em nós. Mostre a coordenada arredondada. Ondas podem vir null em pontos de terra (T-15). Ordem de decisão: (1) Supabase indisponível = 503 service_unavailable, sem chamar a fonte. (2) Entrada ok com idade <= POINT_CACHE_TTL_S (3 h) = hit ok; entrada partial com idade <= POINT_PARTIAL_TTL_S (15 min) = hit partial. (3) Sem entrada, vencida ou ilegível ("cache com erro") = miss; a entrada ilegível é tratada como ausente e NÃO gera contagem extra. (4) No miss, reserve 2 chamadas. Reserva negada: se há entrada vencida com idade <= POINT_STALE_MAX_S (6 h), sirva-a com status "stale" (200); senão 503 quota_exhausted ou 429 rate_limited. (5) Reserva concedida: chame forecast e marine em paralelo, SEM retry imediato; as duas contam, deem certo ou não. Ambas ok = grave e responda ok. Falha parcial = status "partial", campos faltantes null, cache de no máximo 15 min; contaram 2; depois dos 15 min o próximo pedido é novo miss e REPETE AS DUAS chamadas (conjunto completo), reservando e contando mais 2 (não existe repetição parcial). Ambas falham = se há entrada vencida com idade <= 6 h, sirva com "stale"; senão 503 service_unavailable (a reserva continua contada). Entrada entre 3 h e 6 h só é servida quando a fonte não pôde ser consultada, com status "stale"; entrada com mais de 6 h nunca é servida. Coalescência de pedidos simultâneos é de melhor esforço.
- Limite por cliente: DESLIGADO (cabeçalho de IP no Vercel a verificar, T-02). Risco aceito e registrado: um cliente pode esgotar os 1.600 misses do dia (ou os 500 da hora); novos pontos ficam indisponíveis até a janela seguinte, pontos em cache seguem. Os tetos por minuto e hora são globais. Ligue o limite por cliente se T-02 confirmar o cabeçalho.
- GET /api/v1/notices -> avisos válidos, com URL, crédito, last_registered_at e last_checked_at. GET /api/v1/route -> 501 no MVP.

DADOS (Supabase)
Tabelas e colunas (migrações via Supabase CLI):
- model_runs(id uuid PK, source text, model text, run_time timestamptz, ingested_at timestamptz default now(), status text), ÚNICA por (source, model, run_time). status: open, closed ou aborted [PROPOSTA]; só closed aparece em /frames.
- grid_layers(id uuid PK, run_id uuid FK -> model_runs, region text ('wide' ou 'bay'), layer text ('wind' ou 'waves'), valid_time timestamptz, bbox double precision[4] (ordem oeste,sul,leste,norte), res numeric (graus), storage_path text, expires_at timestamptz (padrão run_time + 48 h)), ÚNICA por (run_id, region, layer, valid_time).
- quota_counter(day date, source text, calls integer default 0), PK (day, source); fontes openmeteo_point e openmeteo_ingest; unidade: chamadas HTTP.
- quota_window(source text, granularity text ('minute' ou 'hour'), bucket_start timestamptz, calls integer default 0), PK (source, granularity, bucket_start) [PROPOSTA].
- point_cache(key text PK (coordenada arredondada, ex. "-22.75:-43.25"), payload jsonb, status text ('ok' ou 'partial'), fetched_at timestamptz).
- official_notices(id uuid PK, title text, body text, issued_at timestamptz, valid_until timestamptz, source_url text, registered_at timestamptz default now()) [PROPOSTA]; notice_checks(id uuid PK, checked_at timestamptz default now()) [PROPOSTA].
- tide_stations(id text PK, name text, lat double precision, lon double precision, source_note text); tide_predictions(station_id text FK, datetime_utc timestamptz, height_m numeric, import_batch text), PK (station_id, datetime_utc).
- push_subscriptions(id uuid PK, endpoint text única, keys jsonb, rules jsonb, created_at timestamptz default now(), last_notified_at timestamptz) (fase 2). Formato de rules [PROPOSTA]: {"version":1,"point":{"lat":-22.75,"lon":-43.25},"thresholds":{"wind_kn":20,"gust_kn":25,"wave_m":1.5},"horizon_h":48}.
Siga a skill do Supabase (npx skills add supabase/agent-skills). RLS ativa em TODAS as tabelas, SEM política para anon e SEM política para public (sem cláusula TO, a política vale para public, que alcança anon); só o papel de serviço acessa. O front nunca acessa o Supabase. Chave de serviço só em secrets e .env.local. Storage privado. Privacidade (fase 2): coordenadas em rules arredondadas a 0,25 grau; sem identificação do usuário; assinatura removida em 404 ou 410; sem analytics de terceiros; aviso de privacidade no app.

VARIÁVEIS DE AMBIENTE (nome | padrão | onde)
| SUPABASE_URL | sem padrão | Vercel, Actions, .env.local |
| SUPABASE_SERVICE_ROLE_KEY | secret | Vercel, Actions, .env.local |
| GRID_SOURCE | openmeteo | Actions, .env.local |
| SOURCE_MODE | live em produção; simulated em dev e testes | Vercel, Actions, .env.local |
| OPENMETEO_FORECAST_URL, OPENMETEO_MARINE_URL | sem padrão (T-07); falha fechada | Vercel, Actions |
| OPENMETEO_MODEL_FORECAST, OPENMETEO_MODEL_MARINE | vazio (a fonte escolhe) [PROPOSTA] | Vercel, Actions |
| FORECAST_DAYS | 9 [PROPOSTA] | Vercel, Actions |
| POINT_DAILY_BUDGET | 4000 | Vercel |
| POINT_OPERATING_PCT | 80 | Vercel |
| POINT_CACHE_TTL_S | 10800 (3 h) | Vercel |
| POINT_STALE_MAX_S | 21600 (6 h) [PROPOSTA] | Vercel |
| POINT_PARTIAL_TTL_S | 900 (15 min) [PROPOSTA] | Vercel |
| POINT_MAX_PER_MIN | 100 chamadas [PROPOSTA] | Vercel |
| POINT_MAX_PER_HOUR | 1000 chamadas [PROPOSTA] | Vercel |
| POINT_ROUND_DEG | 0.25 [PROPOSTA] | Vercel |
| INGEST_ROUND_BUDGET | 885 [PROPOSTA] | Actions |
| INGEST_DAILY_BUDGET | 3540 [PROPOSTA] | Actions |
| INGEST_RETRY_MAX | 2 [PROPOSTA] | Actions |
| INGEST_MAX_PER_MIN | 300 [PROPOSTA] | Actions |
| FRAMES_CACHE_S | 60 [PROPOSTA] | Vercel |
| GRID_STALE_HOURS, GRID_EXPIRED_HOURS | 18, 48 [PROPOSTA] | Vercel |
| GRID_BBOX, GRID_RES_DEG (wide) | -54,-35,-30,5 ; 2 | Actions, Vercel |
| GRID_BAY_BBOX, GRID_BAY_RES_DEG (bay) | -44,-24,-42,-22 ; 0.25 [PROPOSTA] | Actions, Vercel |
| BAY_GRID_MIN_ZOOM | 9 [PROPOSTA] | front (variável de build) |
| NOTICE_CHECK_MAX_AGE_H | 24 [PROPOSTA] | Actions |
| VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY | fase 2; a privada como secret | Vercel, Actions |
Crie .env.example sem segredos e documente tudo no README.

FUNCIONALIDADES
MVP: mapa com vento animado (partículas) e ondas totais, com grade wide e grade bay; barra de tempo com play e pré-carga de 3 quadros à frente; painel do ponto (meteograma com vento, rajada, direção e ondas); faixa de aviso oficial (com data de registro e de conferência e o texto fixo); seletor de unidades (nós, km/h, m/s); pt e en; modos claro, escuro e noturno; legenda sempre visível; modal de segurança; rodapé fixo; interpolação bilinear (sem blocos; regra de nulos nas ondas). Avisos de resolução, um por tela, em linguagem simples (não mencione verificação de processo):
 - Mapa amplo: "Mapa regional montado a partir de pontos espaçados em 2° (cerca de 220 km). Não representa o vento local da enseada."
 - Mapa da baía: "Mapa montado a partir de pontos espaçados em 0,25° (cerca de 28 km). Não representa o vento local da enseada: junto ao morro, à ponte ou à entrada da baía o vento pode ser bem diferente."
 - Ponto: "Previsão para a coordenada arredondada a 0,25° (cerca de 28 km). Os valores podem diferir do mapa. É previsão de modelo, não medição no seu local."
 Se a T-08 confirmar a resolução real, os textos podem ser ajustados [PROPOSTA]. Rótulo da fonte em cada tela.
Fase 2: chuva, temperatura e pressão (isóbaras); alertas Web Push com limites do usuário (envio disparado pelo job após cada rodada [PROPOSTA]); rota com janela de partida; maré (com crédito ao CHM/DHN, conforme P-01); swell e vaga como camadas; oscilações e rondadas do vento; meteograma com chuva e maré; nuvens só se a fonte tiver a variável.
Fase 3: correntes (Copernicus, adaptador trocável, issue de reavaliação até 30/06/2027 [PROPOSTA]); observações INMET com ressalva; METAR de SBGL e SBRJ como contexto (SBJR é Jacarepaguá, não Santos Dumont); estação local de vento se houver fonte pública; comparação de modelos lado a lado (só com modelos verificados em docs/MODELOS.md e model_runs.model informado); empacotamento para lojas só se P-15 for aprovado (padrão: só PWA).

IDENTIDADE VISUAL [PROPOSTA]
Rosa dos ventos e bússola como motivo. Inspiração de interação em Windy (https://windy.app/map) e PredictWind Atlas (https://forecast.predictwind.com/atlas/), SEM copiar marca, layout, paleta ou ativos. Tokens iniciais (valide com dataviz e auditoria de contraste; ajuste se falhar AA): claro fundo #F4EBD9, texto #0B2545, acento #0A6C94, alerta laranja #B54708, vermelho #B42318; escuro fundo #061629, texto #E8F1F5, acento #4FD1E8, laranja #FDA64F, vermelho #FF6B6B; noturno fundo #000000, texto e acento #FF4D4D (só vermelho e preto; escalas monocromáticas por luminância e com rótulos numéricos). Contraste mínimo AA, meta AAA nos valores principais. Tipografia do sistema, sem webfont; valor principal grande; números tabulares. Ícones próprios. Espaçamento múltiplo de 4 px; raio 8 px; alvos de toque >= 44 px; ações principais na parte inferior. Vista inicial: centro -22,71982, -43,17215, zoom 10 (da URL de referência do briefing); confira e ajuste para a enseada. O bbox inteiro continua acessível ao afastar o mapa.

TAREFAS (execute; não são incertezas; etapa entre parênteses)
T-01 (3) abrir demo/*.json do leaflet-velocity instalado e copiar header e ordem dos dados. T-02 (5) ler a documentação do Vercel sobre o cabeçalho de IP do cliente (padrão: sem limite por cliente). T-03 (7, PÓS-DEPLOY) observar, na primeira semana de produção, se as leituras do job evitam a pausa do Supabase (padrão: leitura a cada execução). T-04 (só ao ativar noaa) localizar o filtro do GFS Wave (não o do GEFS Wave), listar variáveis e níveis do filtro e registrar a retenção observada (padrão: baixar a cada rodada). T-05 (6) escolher a escala mais detalhada do Natural Earth, conferir a costa da enseada (a escala pode não mostrá-la) e conferir que o bbox da baía cobre a baía e a enseada (padrão: aviso "costa simplificada"). T-06 (fase 2) ler o fuso e o cabeçalho do PDF da tábua 2026 só localmente (padrão: não assumir fuso). T-07 (3) obter as URLs do Open-Meteo; verificar (a) várias coordenadas por chamada e como contam na cota, (b) se a série começa às 00:00 GMT do dia corrente e se forecast e Marine aceitam forecast_days=9 com horas suficientes para 57 quadros, (c) como fixar e ler o modelo (padrões: uma localização por requisição; model=auto). T-08 (3) PESQUISAR MODELOS: leia a documentação do Open-Meteo (a página https://open-meteo.com/en/docs/models retornou 404 na pesquisa; use o caminho que existir) e fontes regionais gratuitas (por exemplo CPTEC/INPE, como candidato a verificar, sem presumir que existam dados); grave docs/MODELOS.md com modelo, resolução, cobertura do Brasil, termos de uso, URL e data da leitura; padrão: manter as grades de 2 e 0,25 grau e os avisos; só troque de fonte se cobertura e licença estiverem confirmadas e se o dono aprovar. T-09 (5) procurar a página oficial dos mapas interativos de avisos do CHM (a notícia de 10/2026 em sociedademilitar.com.br diz que existem, 29 localidades; é notícia, não fonte oficial); padrão: link https://www.marinha.mil.br/chm. T-10 (1; reconfirmar na 7) ler os termos do Vercel, localizar a seção de uso justo/Hobby e registrar a evidência (padrão: publicar no Hobby; se houver vedação, interromper o deploy de produção e avisar o dono). T-11 (6) testar o leaflet-velocity com o Leaflet 1.9.4 (padrão: fixar a versão que passar; senão vendorizar). T-12 (só ao ativar noaa) verificar o registro de fontes da NOAA (padrão: noaa desligado). T-13 (fase 3) conferir a redação da atribuição do Copernicus (padrão: "E.U. Copernicus Marine Service Information"). T-14 (3) reler https://open-meteo.com/en/pricing: cotas e peso por chamada (padrão: peso 1, margem de 25% no job, limite de 80% no /point). T-15 (3, depois da T-07) verificar o que o Marine devolve em pontos de terra, null ou valor do mar mais próximo, e registrar em docs/MODELOS.md (padrão: null = "sem dado de onda neste ponto"; se vier valor do mar próximo, mostre a nota "ondas do mar mais próximo, informado pela fonte"). T-16 (6) avaliar fontes públicas brasileiras de linha de costa (por exemplo IBGE) e dados do OpenStreetMap servidos de forma estática, sem afirmar licença: [A CONFIRMAR]; padrão: Natural Earth. T-17 (1) verificar os requisitos do Docker Desktop no Windows 11 (WSL2, virtualização, condições de uso), os identificadores do winget, a versão do Node aceita pelo Playwright, e criar .nvmrc, engines e versões exatas.

PENDÊNCIAS PARA docs/PENDENCIAS.md (colunas: ID | Decisão e padrão | Data | Motivo | Evidência | Responsável; use Data = 17/11/2026; IDs mantidos; P-02, P-08, P-10, P-13 e P-14 viraram as tarefas T-10, T-11, T-12, T-13 e T-14)
| P-01 | [A CONFIRMAR] Confirmação formal da Marinha sobre a republicação da tábua de maré (não bloqueante). Padrão: exibir com crédito ao CHM/DHN, só dados de previsão, sem reproduzir o PDF nem o layout, com aviso de navegação; se a Marinha negar, desligar a exibição e usar o nível do mar do modelo com rótulo | 17/11/2026 | Sem licença escrita; PDF oficial e público; exibição aprovada pelo dono | Pedido ao BNDO: chm.bndo@marinha.mil.br, até 10 dias úteis, gratuito (https://www.gov.br/pt-br/servicos/obter-servicos-do-banco-nacional-de-dados-oceanograficos, lida) | dono do projeto |
| P-03 | [A CONFIRMAR] Limite por IP do Open-Meteo no Vercel e nos runners do GitHub. Padrão: cache de 3 h, orçamento, tetos por minuto e hora, sem nova tentativa imediata, stale em falha | 17/11/2026 | Termos avisam sobre Vercel; runners compartilham IPs | https://open-meteo.com/en/terms (lida) | Claude Code |
| P-04 | [A CONFIRMAR] Termos de reuso dos avisos da Marinha. Padrão: link e texto colado, sem scraping | 17/11/2026 | Páginas do CHM retornaram 403 | https://www.marinha.mil.br/chm (busca) | dono do projeto |
| P-05 | [A CONFIRMAR] Token, termos e URL de alertas do INMET. Padrão: API fora do MVP | 17/11/2026 | Manual só citado por terceiros | https://portal.inmet.gov.br/manual/manual-de-uso-da-api-esta%C3%A7%C3%B5es (não lido) | dono do projeto |
| P-06 | [A CONFIRMAR] METAR: URL e termos do DECEA/REDEMET e distância. Padrão: fora do MVP; não estimar distância | 17/11/2026 | Fonte oficial não verificada | METAR NOAA/NWS (busca) | dono do projeto |
| P-07 | [A CONFIRMAR] Dados de boia ou estação costeira na baía. Padrão: indisponível, fora do MVP | 17/11/2026 | Boias da baía irregulares segundo notícia de 10/2026 | https://www.marinha.mil.br/chm/node/70352 (busca) | dono do projeto |
| P-09 | [A CONFIRMAR] Modelo gratuito de maior resolução. Padrão: grades de 2 e 0,25 grau, interpolação bilinear, avisos por tela | 17/11/2026 | Nenhum encontrado | T-08 | Claude Code pesquisa; dono do projeto aprova troca |
| P-11 | [A CONFIRMAR] Web Push no iOS e VAPID. Padrão: teste manual em aparelho; push só em PWA instalado | 17/11/2026 | Depende de aparelho real | https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/ | Claude Code prepara; dono do projeto testa |
| P-12 | [A CONFIRMAR] Estação maregráfica mais próxima. Padrão: Niterói/Ponta da Armação se constar nos 44 portos da tábua 2026; senão a mais próxima, com distância registrada | 17/11/2026 | Lista 2026 não lida | Série 1989–2021 (busca, IBGE) | dono do projeto |
| P-15 | [A CONFIRMAR] Custo e regras de contas de loja (fase 3). Padrão: permanecer só PWA | 17/11/2026 | Briefing exige custo zero; custo não verificado | nenhuma fonte lida | dono do projeto |

ORDEM DE EXECUÇÃO (use o modo de planejamento antes de cada etapa)
1. Pré-requisitos, repositório e projetos. T-17 (Docker/WSL2, winget, Node, versões exatas) e T-10 (termos do Vercel). Crie CLAUDE.md do projeto (idiomas, unidades, marcadores, regras acima), docs/PENDENCIAS.md com as pendências acima, .gitignore (CSV e PDF de maré, .env*).
2. Instale a skill do Supabase; supabase start; migrações (incluindo quota_window e notice_checks), RLS sem política para anon e public, e a RPC reserve_calls; rode os advisors.
3. Adaptadores com fonte simulada e testes de conversão, tempo, alinhamento de quadros e vencimento. Tarefas T-01, T-07, T-08, T-14 e, depois da T-07, T-15.
4. Job de ingestão (simulada primeiro, depois Open-Meteo) com as duas regiões, e workflows (ingestão, CI, lembrete diário, heartbeat).
5. Functions /frames, /grid, /point (com tetos), /notices e scripts notice:add e notice:checked. Tarefas T-02 e T-09.
6. Front-end (frontend-design, dataviz, web-design-guidelines), pt e en. Tarefas T-05, T-11 e T-16.
7. E2E, code-review, security-review, simplify; reconfirme o registro da T-10; deploy no Vercel (MVP). Depois do deploy, T-03 na primeira semana. Só então planeje a fase 2 e depois a fase 3 (T-06 na fase 2; T-13 na fase 3; T-04 e T-12 só se ativar noaa).

FERRAMENTAS POR ETAPA (por quê)
Nomes levantados como existentes nesta instalação. MCPs exigem sessão autenticada; sem ela, use as CLIs vercel e supabase. Se uma ferramenta não existir, use a CLI equivalente e registre.
- npx skills add supabase/agent-skills (skill externa, antes do banco): orientação oficial; instala supabase e supabase-postgres-best-practices (uma só: --skill NOME).
- CLAUDE.md do projeto (início): regras permanentes. Modo de planejamento (antes de cada fase): plano revisável.
- frontend-design (fase 1): direção estética sem cara de template. dataviz (meteograma, escalas, legendas): paleta validada em claro e escuro. web-design-guidelines (antes de cada tela; fase 3): auditoria de acessibilidade e UX.
- Subagentes (ingestão, interface, revisão): paralelo, contextos separados. Worktrees (fases paralelas): isolamento de branches. Hooks (antes de cada commit): lint e testes.
- Supabase MCP (apply_migration, execute_sql, get_advisors, query_logs, generate_typescript_types): ler logs e advisors antes de mudar o banco. supabase CLI: stack local, migrações, testes SQL.
- Vercel MCP (create_deployment, get_runtime_logs, get_runtime_errors, create_project_env, edit_project_env): operação e diagnóstico. gh: PRs, issues, workflows, secrets, CI.
- run (subir o app e ver a mudança): confirma no app real. webapp-testing (E2E com Playwright local): teste reprodutível. agent-browser (QA manual): automação de navegador. Claude in Chrome (inspeção): ver o que o usuário vê.
- code-review (cada PR): correção e regressões. security-review (RLS, CORS, secrets, Functions): segurança. simplify (após cada fase): evitar repetição. skill-creator (opcional): só se valer criar skill do projeto.

CRITÉRIOS DE ACEITE DO MVP (todos obrigatórios, exceto o 12, recomendado e não bloqueante)
01 nenhuma requisição do navegador a domínio fora da API e dos arquivos do app (E2E). 02 /grid exige run_time e time; sem run_time = 422; rodada fechada com Cache-Control imutável; sem X-Status. 03 testes unitários: (a) N d=0 -> v=-s, u=0; (b) L d=90 -> u=-s, v=0; (c) O d=270 -> u=+s; (d) S d=180 -> v=+s; (e) onda com origem 0 -> seta 180; (f) d=45 -> u=v=-s*sen(45 graus), cerca de -0,7071*s; (g) onda com origem 270 -> seta 90; (h) 10 nós = 5,1444 m/s (1 nó = 1852 m / 3600 s, tolerância 1e-4) e 1 m/s = 3,6 km/h; (i) 10 m/s = cerca de 19,4384 nós (tolerância 1e-3); (j) 10 nós = 18,52 km/h, 18,52 km/h = 10 nós, ida e volta preserva o valor (1e-9); (k) vento d=360 igual a d=0 (1e-9); (l) vento d=-90 igual a d=270, onda com origem -90 -> seta 90; (m) onda com origem 360 -> seta 180. 04 bbox ou res fora dos pares pré-gerados = 422 invalid_parameter; (-54,-35,-30,5 com 2) e (-44,-24,-42,-22 com 0.25) aceitos; par misto = 422; sem bbox e res vale a wide. 05 com limite operacional de 3.200 chamadas, o 1.600º miss de ponto novo passa e o 1.601º dá 503 quota_exhausted; contador de 2 em 2; cache hit segue. 06 cliques sequenciais no mesmo ponto arredondado, mesmo com vars e hours diferentes, geram uma chamada (2 requisições); teste concorrente é informativo. 07 no /frames, run_time > 18 h = stale e > 48 h = 503 data_expired; no /grid, pedido direto com run_time > 48 h = 503. 08 aviso de resolução próprio em cada tela (mapa amplo, mapa da baía e ponto), texto fixo da faixa de avisos e rótulo da fonte. 09 CI falha se git ls-files listar: .pdf ou .csv; caminho em tides/ ou data-private/; arquivo .json, .sql ou de seed (supabase/seed*, seed*) cujo caminho case, sem distinguir maiúsculas e acentos, com tide, mare ou tabua, fora de supabase/migrations/; migração ou seed com INSERT INTO tide_predictions. Exceção: lista scripts/ci/tide-allowlist.txt para fixtures legítimas (dados sintéticos; cada linha comentada, revisada pelo dono). Testes negativos: tides/x.csv falha; tide-*.json fora da lista falha; o mesmo na lista passa. 10 sem tiles OSM em produção. 11 axe-core sem violações críticas (WCAG AA) e Lighthouse de acessibilidade >= 90 [PROPOSTA]. 12 recomendado: offline mínimo com shell em cache e último dado com horário. 13 nenhuma chave de serviço no front ou no repositório (varredura em CI). 14 RLS ativa em todas as tabelas e nenhuma política para anon nem para public: CI consulta pg_tables (rowsecurity) e pg_policies (nenhuma linha cujo roles inclua anon ou public) no stack local; antes do deploy, get_advisors do Supabase MCP sem alerta crítico. 15 todos os textos em pt-BR e en. 16 nenhuma Function do Vercel chama o Open-Meteo exceto /point. 17 aviso inserido por notice:add aparece em destaque com crédito, link, data de registro e data da última conferência (notice:checked); sem aviso, mensagem padrão; o texto fixo (registro manual, pode atrasar ou faltar) aparece nos dois casos; o workflow diário abre ou atualiza a issue quando a última conferência passa de NOTICE_CHECK_MAX_AGE_H. 18 erro de limite da fonte = stale (cache com até 6 h) ou 503, sem nova tentativa imediata. 19 o job grava cada tentativa HTTP em quota_counter, aborta ao passar de 885 chamadas na rodada e só publica rodada completa (57 quadros x 2 camadas x 2 regiões = 228 arquivos); com forecast_days=9, run_time às 21:01 UTC ainda gera 57 quadros; se a fonte devolver horas a menos, a rodada não é publicada (aborted) e a anterior é mantida. 20 Supabase indisponível: /point = 503 service_unavailable sem chamar a fonte. 21 /point valida coordenadas no bbox, hours de 1 a 168 e vars da lista; o resto = 422; com hours=24 a resposta começa na hora UTC atual arredondada para baixo e tem 24 entradas. 22 docs/MODELOS.md existe com modelos, resoluções, cobertura, termos, URL, data (T-08) e resultado das sondagens T-07 e T-15. 23 tetos do /point: com 100 chamadas/min, o 50º miss no minuto passa e o 51º dá 429 rate_limited com Retry-After, e no minuto seguinte volta a passar; com 1000 chamadas/h, o 500º miss passa e o 501º dá 429; reserva negada não incrementa contador; cache hit não é limitado; excesso diário e de minuto juntos = 503 quota_exhausted (relógio simulado). 24 ondas com nulos: a regra de B6 passa nos 4 casos (1,6 m; transparente com o canto mais próximo nulo; 4 nulos; 4 válidos) e a direção é interpolada por componentes (359 e 1 grau dão cerca de 0). 25 alinhamento dos quadros: run_time 2026-11-17T21:01Z -> primeiro 2026-11-18T00:00Z e último 2026-11-25T00:00Z, 57 quadros; 2026-11-17T21:00Z -> primeiro 21:00Z e último 2026-11-24T21:00Z; 2026-11-17T00:00Z -> primeiro 00:00Z; todos múltiplos de 3 h UTC. 26 cache do /point: entrada ok com 2 h = hit ok; com 4 h e fonte disponível = miss; com 4 h e fonte falhando = stale (200); com 7 h e fonte falhando = 503 service_unavailable; falha parcial = partial, conta 2, vale 15 min e depois o novo miss repete as 2 chamadas e conta mais 2; entrada ilegível = miss, conta 2 uma única vez. 27 em zoom 10 com centro dentro do bbox da baía o front pede /grid com bbox=-44,-24,-42,-22 e res=0.25; em zoom abaixo de BAY_GRID_MIN_ZOOM ou centro fora do bbox, pede a grade ampla (E2E). Teste de fuso: Z normalizado e exibição correta em UTC-3 e UTC+0.

CRITÉRIOS DE ACEITE DA FASE 2
F2-01 camadas de chuva, temperatura e pressão com legenda e fonte (E2E). F2-02 resposta 404 ou 410 do serviço de push remove a assinatura (serviço simulado). F2-03 push funciona em iOS 16.4 ou superior com PWA na tela inicial (teste manual em aparelho, P-11). F2-04 rota amostrada a cada 5 NM; precedência inviável > atenção > viável (unitário). F2-05 janela de partida lista horários com status por trecho (unitário). F2-06 maré exibida com crédito ao CHM/DHN e aviso de navegação; com a exibição desligada (se a Marinha negar), só "nível do mar do modelo, não é tábua de maré" (E2E). F2-07 camadas de swell e vaga separadas, com legenda (E2E). F2-08 meteograma destaca oscilações e rondadas do vento numa série simulada (unitário). F2-09 alertas respeitam os limites do usuário e o idioma (fonte simulada). F2-10 coordenadas em rules arredondadas a 0,25 grau e assinatura apagável (unitário).

CRITÉRIOS DE ACEITE DA FASE 3
F3-01 adaptador de correntes trocável, testado com fonte simulada; issue de reavaliação até 30/06/2027 [PROPOSTA]. F3-02 observações INMET só com token e termos confirmados (P-05), sempre com ressalva de qualidade (E2E). F3-03 estação local de vento só com fonte pública confirmada (P-07) (E2E). F3-04 comparação de modelos lado a lado, se houver modelos verificados em docs/MODELOS.md (P-09) e model_runs.model informado (E2E). F3-05 o PWA instala e abre; empacotamento para lojas só se P-15 for aprovado (padrão: não entregar); se aprovado, instala e abre (teste de instalação). F3-06 auditoria web-design-guidelines sem pendências críticas.

RESSALVAS
O app não substitui avisos e previsões oficiais. O aviso da Marinha só aparece quando registrado manualmente e pode atrasar ou faltar. O mapa não representa o vento local da enseada: a grade ampla tem espaçamento de 2 graus (cerca de 220 km) e a da baía, de 0,25 grau (cerca de 28 km); a resolução real dos modelos gratuitos depende da T-08. Dados de boias da baía não estão confirmados. O limite do Open-Meteo por IP no Vercel e no GitHub Actions continua incerto: mantenha cache, orçamento, tetos por minuto e hora e o comportamento stale. A tábua de maré é exibida com crédito ao CHM/DHN; se a Marinha negar a republicação, desligue a exibição.
````

## Conclusão

O prompt acima fecha a hospedagem pelo meio-termo. O job pesado roda no GitHub Actions; o Vercel só repassa e guarda em cache, com tetos por minuto e por hora. A contagem usa uma única unidade, a chamada HTTP efetiva. O mapa passa a ter uma grade fina de 0,25° em torno da Baía de Guanabara, além da grade ampla de contexto. A rodada tem 708 chamadas, o teto diário do job é 3.540 e o pior caso diário soma 7.540 chamadas, abaixo de 10.000.

O próximo passo é entregar o bloco B15 ao Claude Code. O dono do projeto envia em paralelo o pedido de confirmação ao BNDO (P-01, maré, não bloqueante), responde P-15 (contas de loja, fase 3) e passa a conferir o boletim da Marinha todos os dias. O restante tem padrão seguro e tarefa associada.

---

## Anexo: referências com status

Legenda: LIDO = lida nesta rodada; BUSCA = só resultado de busca; REAPROVEITADO = conclusão anterior, não relida; NÃO LIDO = bloqueada (403, 404 ou erro).

| Referência | URL | Uso no documento | Status |
|---|---|---|---|
| Termos do Open-Meteo | https://open-meteo.com/en/terms | B1, B3, P-03 | LIDO |
| Preços e cotas do Open-Meteo | https://open-meteo.com/en/pricing | B3, B6, T-14 | REAPROVEITADO |
| Open-Meteo Marine | https://open-meteo.com/en/docs/marine-weather-api | B3, B5, T-15 | REAPROVEITADO |
| Open-Meteo, documentação de previsão | https://open-meteo.com/en/docs | B5 (T-07) | REAPROVEITADO |
| Modelos do Open-Meteo | https://open-meteo.com/en/docs/models | T-08 | NÃO LIDO (404) |
| Limites do Vercel Hobby | https://vercel.com/docs/limits/fair-use-guidelines | B3.4 | LIDO (2026-11-12) |
| Termos do Vercel | https://vercel.com/terms; âncora https://vercel.com/legal/terms#fair-use (a localizar) | T-10 | BUSCA |
| Preços do Supabase | https://supabase.com/pricing | B3.4 | LIDO |
| Skills do Supabase para agentes | https://supabase.com/docs/guides/getting-started/ai-skills | B13 | LIDO |
| BNDO (gov.br): e-mail chm.bndo@marinha.mil.br, "até 10 dias úteis", gratuito | https://www.gov.br/pt-br/servicos/obter-servicos-do-banco-nacional-de-dados-oceanograficos | B3, P-01 | LIDO |
| BNDO, download | https://www.marinha.mil.br/chm/dados-do-bndo/download | B3 | BUSCA |
| CHM, avisos e boletins | https://www.marinha.mil.br/chm | B3, T-09 | BUSCA; páginas oficiais /node/79040, /node/70980 e /dados-do-smm-previsoes-especiais NÃO LIDAS (403) |
| CHM, PNBOIA | https://www.marinha.mil.br/chm/node/70352 | B3, P-07 | BUSCA |
| Notícia, mapas interativos do CHM (10/2026, não oficial) | https://www.sociedademilitar.com.br/2026/10/centro-de-hidrografia-da-marinha-lanca-mapas-interativos-no-brasil-para-reforcar-a-seguranca-maritima-alertas-mau-tempo-alcancam-29-localidades-e-antecipam-riscos-por-ate-cinco-dias-elz.html | B3.3, T-09 | BUSCA |
| Notícia, boias da baía (10/2026) | https://diariodorio.com/rio-de-janeiro/2026/10/18/ponte-rio-niteroi-tem-20-luzes-de-sinalizacao-apagadas-ou-com-falhas-boias-na-baia-de-guanabara-tambem-estao-irregulares.html | B3.2, P-07 | BUSCA |
| INMET, estações automáticas (dados horários dos últimos 90 dias) | https://portal.inmet.gov.br/servicos/esta%C3%A7%C3%B5es-autom%C3%A1ticas | B3.1 | BUSCA |
| INMET, manual da API | https://portal.inmet.gov.br/manual/manual-de-uso-da-api-esta%C3%A7%C3%B5es | P-05 | citado por terceiros, não lido |
| METAR SBRJ e SBGL | https://tgftp.ncep.noaa.gov/data/observations/metar/decoded/SBRJ.TXT; .../SBGL.TXT | B3.1 | BUSCA |
| SiMCosta | https://simcosta.furg.br | B3.1 | BUSCA |
| Niterói/Ponta da Armação, série 1989–2021 (IBGE) | https://biblioteca.ibge.gov.br/visualizacao/livros/livp147160.pdf | P-01, P-12 | BUSCA |
| NOAA, descrição do modelo de ondas | https://polar.ncep.noaa.gov/waves/Model_Description.pdf | B3.1 | BUSCA |
| NOAA, ciclos do GFS | https://www.nco.ncep.noaa.gov/pmb/products/gfs/nomads/ | B3.1 | BUSCA |
| NOMADS, filtro do GEFS Wave (parece ser outro produto; **não usar** como filtro do GFS Wave; o do GFS Wave é a localizar, T-04) | https://nomads.ncep.noaa.gov/cgi-bin/filter_gefs_wave_0p25.pl | B3.1 | BUSCA |
| NOAA, disclaimer e registro de fontes | https://www.weather.gov/disclaimer; https://registry.opendata.aws/noaa-gfs-bdp-pds | B3.2, T-12 | REAPROVEITADO |
| Natural Earth, termos | https://www.naturalearthdata.com/about/terms-of-use/ | B3.2 | LIDO |
| OSM, política de tiles | https://operations.osmfoundation.org/policies/tiles/ | B3.2 | NÃO LIDO (conclusão reaproveitada) |
| leaflet-velocity, README | https://raw.githubusercontent.com/danwild/leaflet-velocity/master/README.md | B3.2, B6 | LIDO |
| Leaflet 1.9.4 | https://registry.npmjs.org/leaflet/latest | B3.2 | REAPROVEITADO |
| Copernicus Marine, licença | https://marine.copernicus.eu/user-corner/service-commitments-and-licence | B3.2, T-13 | REAPROVEITADO |
| GitHub Actions, eventos e agendamento | https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows | B3.4 | REAPROVEITADO |
| cfgrib | https://github.com/ecmwf/cfgrib | B15 (módulo noaa) | REAPROVEITADO (prompt anterior) |
| Web Push no iOS | https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/ | B1, P-11 | REAPROVEITADO |
| Playwright (inclui a frase "aceita Node 22, 24 ou 26") | https://playwright.dev/docs/intro | B9, B12, T-17 | REAPROVEITADO |
| Referências de interação (só inspiração) | https://windy.app/map; https://forecast.predictwind.com/atlas/ | B10 | referências de produto |

**Referências a localizar (sem URL ainda):** seção de uso justo do Vercel (T-10); filtro do GFS Wave no NOMADS (T-04); fontes brasileiras de costa e OSM estático (T-16); requisitos do Docker Desktop no Windows 11 (T-17); condições de repositório privado no GitHub Actions (B3.4); regras das contas de loja (P-15).

Referências retiradas por não serem usadas: PMTiles, Windy API e FAQ da API do PredictWind.
