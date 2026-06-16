import en from '../i18n/en';
import es from '../i18n/es';
import pt from '../i18n/pt';

const translations: Record<string, Record<string, unknown>> = { en, es, pt };
const SUPPORTED_LANGS = ['en', 'es', 'pt'];

let currentLang = 'en';

try {
  const params = new URLSearchParams(window.location.search);
  const urlLang = params.get('lang');
  if (urlLang && SUPPORTED_LANGS.includes(urlLang)) {
    currentLang = urlLang;
  }
} catch { /* ignore */ }

const currentData = translations[currentLang] || translations['en'];
const fallbackData = translations['en'];

function getNestedValue(obj: Record<string, unknown>, path: string): string | undefined {
  const parts = path.split('.');
  let current: unknown = obj;
  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return typeof current === 'string' ? current : undefined;
}

export function useTranslation() {
  return {
    t: (key: string): string => {
      // Try current language first, then English fallback
      return getNestedValue(currentData, key) 
        || getNestedValue(fallbackData, key) 
        || '';
    },
    lang: currentLang,
    i18n: { language: currentLang },
    setLang: (newLang: string) => {
      if (!SUPPORTED_LANGS.includes(newLang)) return;
      const url = new URL(window.location.href);
      url.searchParams.set('lang', newLang);
      window.location.href = url.toString();
    },
  };
}