import './style.css'
import ptBR from './i18n/pt-BR.json'
import en from './i18n/en.json'

// Esqueleto da etapa 1. O mapa, a barra de tempo e o painel do ponto entram na etapa 6.
const messages = { 'pt-BR': ptBR, en } as const
const locale = navigator.language.toLowerCase().startsWith('pt') ? 'pt-BR' : 'en'
const t = messages[locale]

document.documentElement.lang = locale
document.querySelector<HTMLDivElement>('#app')!.textContent = t['app.title']
