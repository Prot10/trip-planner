import i18n from './index'
import { LANGS } from './langs'

/* Intl locale tag for the current UI language (dates, numbers, currency) */
export const intlLocale = () => LANGS.find((l) => l.code === i18n.language)?.intl ?? 'en-US'
