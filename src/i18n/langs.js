/* The single source of truth for supported languages. Adding a language:
   1 entry here + src/locales/<code>/common.json (auto-discovered) +
   1 entry in LANG_NAMES in server/agent.mjs. Nothing else. */
export const LANGS = [
  { code: 'it', native: 'Italiano', intl: 'it-IT' },
  { code: 'en', native: 'English', intl: 'en-US' },
]
