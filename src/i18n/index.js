import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { LANGS } from './langs'

/* Vite auto-discovers locale files: a new language needs no code change here */
const files = import.meta.glob('../locales/*/common.json', { eager: true })
const resources = Object.fromEntries(
  Object.entries(files).map(([path, mod]) => [path.match(/locales\/(\w+)\//)[1], { common: mod.default }]),
)

/* saved choice wins; otherwise the browser language; otherwise English */
const detect = () => {
  const saved = localStorage.getItem('ui.lang')
  if (LANGS.some((l) => l.code === saved)) return saved
  const nav = (navigator.language || 'en').slice(0, 2)
  return LANGS.some((l) => l.code === nav) ? nav : 'en'
}

i18n.use(initReactI18next).init({
  resources,
  lng: detect(),
  fallbackLng: 'it', // Italian is the source language — guaranteed complete
  supportedLngs: LANGS.map((l) => l.code),
  nonExplicitSupportedLngs: true, // 'en-GB' → 'en'
  defaultNS: 'common',
  interpolation: { escapeValue: false }, // React already escapes
})

i18n.on('languageChanged', (lng) => {
  localStorage.setItem('ui.lang', lng)
  document.documentElement.lang = lng
})
document.documentElement.lang = i18n.language

export default i18n
