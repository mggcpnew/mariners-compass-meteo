// Campos do header que o leaflet-velocity lê (tarefa T-01).
// Origem: demo/wind-gbr.json e demo/wind-global.json do repositório
// onaci/leaflet-velocity na tag v2.1.4 (a mesma versão instalada; o pacote do
// npm não traz a pasta demo), e dist/leaflet-velocity.js (função buildGrid).
//
// - O plugin identifica U e V por "parameterCategory,parameterNumber":
//   "2,2" (ou "1,2") = U; "2,3" (ou "1,3") = V.
// - dx e dy são POSITIVOS; o sentido norte -> sul vem de la1 > la2.
// - data[] é plano, por linhas: linha 0 = la1 (norte), de oeste (lo1) para leste.
// - O plugin calcula a data do quadro com refTime + forecastTime (horas).

export const VELOCITY_U = {
  parameterCategory: 2,
  parameterNumber: 2,
  parameterNumberName: 'eastward_wind',
  parameterUnit: 'm.s-1',
} as const

export const VELOCITY_V = {
  parameterCategory: 2,
  parameterNumber: 3,
  parameterNumberName: 'northward_wind',
  parameterUnit: 'm.s-1',
} as const
