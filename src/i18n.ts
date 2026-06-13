import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const SUPPORTED_LANGS = ['en', 'es', 'pt'];

function getUrlLang(): string | null {
  try {
    const params = new URLSearchParams(window.location.search);
    return params.get('lang');
  } catch {
    return null;
  }
}

function getInitialLang(): string {
  const urlLang = getUrlLang();
  if (urlLang && SUPPORTED_LANGS.includes(urlLang)) return urlLang;
  return 'en';
}

const initialLang = getInitialLang();

const fallbackEn = {
  hero: { title: 'Loading...', subtitle: '' },
};

i18n
  .use(initReactI18next)
  .init({
    lng: initialLang,
    fallbackLng: 'en',
    resources: { en: { translation: fallbackEn } },
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
  });

async function loadTranslation(lang: string) {
  try {
    const res = await fetch(`/i18n/${lang}.json`);
    if (!res.ok) return;
    const data = await res.json();
    i18n.addResourceBundle(lang, 'translation', data, true, true);
    if (lang === initialLang) {
      i18n.changeLanguage(lang);
    }
  } catch (err) {
    console.error(`[i18n] Failed to load ${lang}.json:`, err);
  }
}

loadTranslation(initialLang);
SUPPORTED_LANGS.filter(l => l !== initialLang).forEach(loadTranslation);

export default i18n;