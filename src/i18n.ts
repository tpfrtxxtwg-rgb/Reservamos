import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './i18n/en.json';
import es from './i18n/es.json';
import pt from './i18n/pt.json';

const resources = {
  en: { translation: en },
  es: { translation: es },
  pt: { translation: pt },
};

const SUPPORTED_LANGS = ['en', 'es', 'pt'];

function getInitialLang(): string {
  // Try localStorage first
  try {
    const saved = localStorage.getItem('i18nextLng');
    if (saved && SUPPORTED_LANGS.includes(saved)) {
      return saved;
    }
  } catch {
    // localStorage not available
  }

  // Try browser language
  try {
    if (typeof navigator !== 'undefined' && navigator.language) {
      const browserLang = navigator.language.split('-')[0];
      if (SUPPORTED_LANGS.includes(browserLang)) {
        return browserLang;
      }
    }
  } catch {
    // navigator not available
  }

  // Default to English
  return 'en';
}

const initialLang = getInitialLang();

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: initialLang,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

// Persist language changes to localStorage
i18n.on('languageChanged', (lng) => {
  try {
    localStorage.setItem('i18nextLng', lng);
  } catch {
    // localStorage not available
  }
});

export default i18n;
