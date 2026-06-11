import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

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

const initialLang = getInitialLang();

async function loadResources() {
  const [en, es, pt] = await Promise.all(
    SUPPORTED_LANGS.map(async (lang) => {
      try {
        const response = await fetch(`/i18n/${lang}.json`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.json();
      } catch (err) {
        console.error(`[i18n] Failed to load ${lang}.json:`, err);
        return {};
      }
    })
  );

  return {
    en: { translation: en },
    es: { translation: es },
    pt: { translation: pt },
  };
}

i18n
  .use(initReactI18next)
  .init({
    lng: initialLang,
    fallbackLng: 'en',
    resources: {},
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

loadResources().then((resources) => {
  Object.entries(resources).forEach(([lang, resource]) => {
    i18n.addResourceBundle(lang, 'translation', resource.translation, true, true);
  });
  i18n.changeLanguage(initialLang);
});

i18n.on('languageChanged', (lng) => {
  try {
    localStorage.setItem('i18nextLng', lng);
  } catch { /* localStorage not available */ }
n});

export default i18n;