import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import JSON as raw strings to preserve UTF-8 characters
// ?raw prevents esbuild from escaping \uXXXX sequences
import enRaw from './i18n/en.json?raw';
import esRaw from './i18n/es.json?raw';
import ptRaw from './i18n/pt.json?raw';

const en = JSON.parse(enRaw);
const es = JSON.parse(esRaw);
const pt = JSON.parse(ptRaw);

const resources = { en: { translation: en }, es: { translation: es }, pt: { translation: pt } };
const SUPPORTED_LANGS = ['en', 'es', 'pt'];

function getInitialLang(): string {
  try {
    const saved = localStorage.getItem('i18nextLng');
    if (saved && SUPPORTED_LANGS.includes(saved)) return saved;
  } catch { /* localStorage not available */ }

  try {
    if (typeof navigator !== 'undefined' && navigator.language) {
      const browserLang = navigator.language.split('-')[0];
      if (SUPPORTED_LANGS.includes(browserLang)) return browserLang;
    }
  } catch { /* navigator not available */ }

  return 'en';
}

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: getInitialLang(),
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
  });

i18n.on('languageChanged', (lng) => {
  try { localStorage.setItem('i18nextLng', lng); } catch { /* localStorage not available */ }
});

export default i18n;