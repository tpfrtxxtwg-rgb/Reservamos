import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './i18n/en';
import es from './i18n/es';
import pt from './i18n/pt';

const resources = {
  en: { translation: en },
  es: { translation: es },
  pt: { translation: pt },
};

const SUPPORTED_LANGS = ['en', 'es', 'pt'];

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? match[2] : null;
}

function getInitialLang(): string {
  const cookieLang = getCookie('i18nextLng');
  if (cookieLang && SUPPORTED_LANGS.includes(cookieLang)) return cookieLang;

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

export default i18n;