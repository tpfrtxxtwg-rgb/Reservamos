import { useMemo } from 'react';
import en from '../i18n/en';
import es from '../i18n/es';
import pt from '../i18n/pt';

const translations: Record<string, Record<string, unknown>> = { en, es, pt };
const SUPPORTED_LANGS = ['en', 'es', 'pt'];

function getUrlLang(): string {
  try {
    const params = new URLSearchParams(window.location.search);
    const lang = params.get('lang');
    if (lang && SUPPORTED_LANGS.includes(lang)) return lang;
  } catch { /* ignore */ }
  return 'en';
}

function getNestedValue(obj: Record<string, unknown>, path: string): string {
  const parts = path.split('.');
  let current: unknown = obj;
  for (const part of parts) {
    if (current === null || current === undefined) return path;
    current = (current as Record<string, unknown>)[part];
  }
  return typeof current === 'string' ? current : path;
}

export function useTranslation() {
  const lang = useMemo(() => getUrlLang(), []);
  const data = useMemo(() => translations[lang] || translations['en'], [lang]);

  const t = useMemo(() => {
    return (key: string): string => getNestedValue(data, key);
  }, [data]);

  const setLang = (newLang: string) => {
    if (!SUPPORTED_LANGS.includes(newLang)) return;
    const url = new URL(window.location.href);
    url.searchParams.set('lang', newLang);
    window.location.href = url.toString();
  };

  return { t, lang, i18n: { language: lang, changeLanguage: setLang }, setLang };
}