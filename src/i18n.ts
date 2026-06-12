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

function getInitialLang(): string {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const urlLang = urlParams.get('lang');
    if (urlLang && SUPPORTED_LANGS.includes(urlLang)) {
      return urlLang;
    }
  } catch { /* ignore */ }
  return 'en';
}

const initialLang = getInitialLang();

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: initialLang,
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
  });

export default i18n;