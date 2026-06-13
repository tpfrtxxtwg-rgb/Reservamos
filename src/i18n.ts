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

i18n
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
  });

export default i18n;