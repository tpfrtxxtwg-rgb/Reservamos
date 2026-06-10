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

function getInitialLang(): string {
  try {
    const saved = localStorage.getItem('i18nextLng');
    if (saved && resources[saved as keyof typeof resources]) return saved;
  } catch { /* localStorage not available */ }

  try {
    const browserLang = navigator.language.split('-')[0];
    if (resources[browserLang as keyof typeof resources]) return browserLang;
  } catch { /* navigator not available */ }

  return 'en';
}

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: getInitialLang(),
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
// Persist language changes to localStorage
i18n.on('languageChanged', (lng) => {
  try {
    localStorage.setItem('i18nextLng', lng);
  } catch { /* localStorage not available */ }
});