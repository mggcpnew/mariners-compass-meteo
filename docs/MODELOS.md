# Modelos e sondagens

Tarefas T-07, T-08 e T-15 (etapa 3). Cada linha traz URL e data de leitura. O que não foi lido aparece como não verificado.

## Endpoints e parâmetros do Open-Meteo (T-07)

| Item | Resultado | Fonte (lida em 17/11/2026) |
|---|---|---|
| Endpoint de previsão | `https://api.open-meteo.com/v1/forecast` | https://open-meteo.com/en/docs |
| Endpoint Marine | `https://marine-api.open-meteo.com/v1/marine` | https://open-meteo.com/en/docs/marine-weather-api |
| Várias coordenadas por chamada | Aceita (`latitude=a,b&longitude=c,d`; a resposta vira lista). **Como isso conta na cota não está documentado** ("one API call corresponds to one HTTP API request"; a regra de peso fala de "a single location"). Mantido: uma coordenada por requisição | docs e https://open-meteo.com/en/pricing |
| Início da série | "Time always starts at 0:00 today". Confirmado nas sondagens 1 a 5: primeira hora `00:00` GMT do dia | docs e sondagens |
| `forecast_days` (previsão) | 0 a 16, padrão 7. Com 9: 216 horas (sondagem 1) | docs |
| `forecast_days` (Marine) | **A documentação diz 0 a 8** (padrão citado como 5 na tabela e 7 no texto). Na sondagem 3, `forecast_days=9` foi **aceito** e devolveu 216 horas, sem nulos. Ver P-16 | docs Marine e sondagem 3 |
| Fuso | Padrão GMT; o adaptador envia `timezone=GMT` explicitamente. Horas sem `Z` (`2026-11-18T00:00`), normalizadas para `2026-11-18T00:00:00Z` | docs e sondagens |
| Fixar o modelo | Parâmetro `models` (padrão `auto`/`best_match`). IDs vistos em exemplos oficiais: `ecmwf_ifs`, `dwd_icon_seamless`, `ncep_gfs_seamless`. Lista completa de IDs não localizada (página de modelos dá 404) | https://open-meteo.com/en/docs/ecmwf-api, https://open-meteo.com/en/docs/dwd-api, https://open-meteo.com/en/docs/gfs-api |
| A resposta informa o modelo? | **Não.** Campos: `latitude`, `longitude`, `elevation`, `generationtime_ms`, `utc_offset_seconds`, `timezone`, `timezone_abbreviation`, `hourly`, `hourly_units`. Com `models` vazio, `model_runs.model = auto` | docs e sondagens 1 e 2 |
| Unidades devolvidas | Vento `m/s` (com `wind_speed_unit=ms`), direção `°` (gravada como `deg`), ondas `m`, `°`, `s` | sondagens 1 e 3 |

## Modelos (T-08)

Resolução e cobertura conforme as páginas do Open-Meteo. **A página geral de modelos (https://open-meteo.com/en/docs/models) devolveu 404 em 17/11/2026.** A documentação de previsão diz que, fora das regiões com modelo regional, vale "Global models only"; não há modelo regional listado para o Brasil.

| Modelo | Resolução | Cobertura do Brasil | Termos de uso | URL | Data da leitura |
|---|---|---|---|---|---|
| ECMWF IFS HRES | 9 km; horário até 90 h, depois 3 h e 6 h; 15 dias; a cada 6 h | Global | CC BY 4.0 (open data ECMWF); Open-Meteo só não comercial sem chave | https://open-meteo.com/en/docs/ecmwf-api | 17/11/2026 |
| ECMWF IFS 0.25 Open-Data | 0,25° (~25 km); 3 h; 15 dias | Global | idem | idem | 17/11/2026 |
| NCEP GFS | 0,11° (~13 km); 16 dias; a cada 6 h | Global | Open-Meteo CC BY 4.0, não comercial | https://open-meteo.com/en/docs/gfs-api | 17/11/2026 |
| DWD ICON Global | 0,1° (~11 km); 7,5 dias; a cada 6 h | Global | idem | https://open-meteo.com/en/docs/dwd-api | 17/11/2026 |
| MeteoFrance MFWAM (ondas) | 0,08° (~8 km) | Global | idem | https://open-meteo.com/en/docs/marine-weather-api | 17/11/2026 |
| ECMWF WAM (ondas) | 9 km (e versão 0,25°) | Global | idem | idem | 17/11/2026 |
| GFS Wave (ondas) | 0,25° (global); 0,16° só de 52,5°N a 15°S (não cobre o RJ) | Global (0,25°) | idem | idem | 17/11/2026 |
| DWD GWAM (ondas) | 0,25° | Global | idem | idem | 17/11/2026 |
| CPTEC/INPE (WRF, BAM) | Não verificado | Brasil | Não verificado | https://www.gov.br/pt-br/servicos/consultar-previsao-numerica-de-tempo-e-clima-inpe (busca; formato e acesso dos dados não localizados) | 17/11/2026 |

Observações:

- Na sondagem 1, a previsão para (-22,9; -43,1) usou a célula centrada em (-22,88225; -43,07611). Na sondagem 2 (`models=ecmwf_ifs`), os valores foram idênticos aos do padrão nesse ponto. Isso sugere, sem confirmar, que o `best_match` usou o ECMWF IFS ali.
- A documentação do Marine diz que os dados "not suitable for coastal navigation" e que "Accuracy at coastal areas is limited".
- Nenhum modelo gratuito de resolução local para a enseada foi confirmado (P-09 continua aberta). O melhor visto para ondas é o MFWAM (~8 km), em uso pelo `best_match` sem confirmação.

## Sondagens manuais (T-07 e T-15)

Máximo de 10 chamadas reais no total. **Usadas: 5.** Respostas brutas guardadas fora do repositório.

| Nº | Data/hora UTC | Endpoint | Parâmetros | Resultado |
|---|---|---|---|---|
| 1 | 2026-11-18T00:03:44Z | forecast | lat -22.9, lon -43.1, as 3 variáveis de vento, `wind_speed_unit=ms`, `forecast_days=9` | 200. 216 horas, de `2026-11-18T00:00` a `2026-11-26T23:00`. Célula (-22,88225; -43,07611), elevação 12 m. Unidades `m/s` e `°`. Sem nulos. Sem campo de modelo |
| 2 | 2026-11-18T00:03:53Z | forecast | idem + `models=ecmwf_ifs` | 200. Mesmas 216 horas e mesmos valores da sondagem 1. Sem campo de modelo |
| 3 | 2026-11-18T00:04:04Z | marine | lat -22.9, lon -43.1, as 9 variáveis, `forecast_days=9` | 200. **216 horas aceitas** (doc diz máximo 8). Célula (-22,875; -43,124985). Todas as 9 séries sem nulos (ex.: `wave_height` 0,78 m) |
| 4 | 2026-11-18T00:04:16Z | marine | lat -22.5, lon -43.25 (terra, serra; ponto da grade `bay`), 9 variáveis, `forecast_days=9` | 200. Célula (-22,458336; -43,291656), elevação 976 m. **Todas as 216 horas `null`** |
| 5 | 2026-11-18T00:04:18Z | marine | lat -22.0, lon -43.0 (terra; canto da grade `bay`), idem | 200. Célula (-21,958336; -43,041656), elevação 407 m. **Todas as 216 horas `null`** |

**Conclusão da T-15:** em pontos de terra o Marine devolve `null` (não o valor do mar mais próximo). O app trata como "sem dado de onda neste ponto". Em ponto costeiro (sondagem 3), a fonte usou uma célula com dado.
