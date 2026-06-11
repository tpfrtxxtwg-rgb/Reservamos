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

i18n
  .use(initReactI18next)
  .init({
    lng: initialLang,
    fallbackLng: 'en',
    resources: {
      en: { translation: { hero: { title: 'Loading...' } } },
    },
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
  });

async function loadTranslations() {
  const results = await Promise.all(
    SUPPORTED_LANGS.map(async (lang) => {
      try {
        const res = await fetch(`/i18n/${lang}.json`);
        if (!res.ok) return null;
        return { lang, data: await res.json() };
      } catch { return null; }
    })
  );

  let loaded = false;
  results.forEach((result) => {
    if (result) {
      i18n.addResourceBundle(result.lang, 'translation', result.data, true, true);
      loaded = true;
    }
  });

  if (loaded) {
    i18n.changeLanguage(initialLang);
  }
}

loadTranslations();

i18n.on('languageChanged', (lng) => {
  try { localStorage.setItem('i18nextLng', lng); } catch { /* localStorage not available */ }
});

export default i18n;