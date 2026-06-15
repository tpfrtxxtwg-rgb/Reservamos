import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';

import enData from '../i18n/en';
import esData from '../i18n/es';
import ptData from '../i18n/pt';

const translations: Record<string, Record<string, unknown>> = {
  en: enData,
  es: esData,
  pt: ptData,
};

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

interface TranslationContextType {
  lang: string;
  t: (key: string) => string;
  setLang: (lang: string) => void;
}

const TranslationContext = createContext<TranslationContextType>({
  lang: 'en',
  t: (key: string) => key,
  setLang: () => {},
});

export function TranslationProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState(getUrlLang);

  const t = useCallback(
    (key: string) => {
      const data = translations[lang] || translations['en'];
      return getNestedValue(data, key);
    },
    [lang]
  );

  const setLang = useCallback((newLang: string) => {
    if (!SUPPORTED_LANGS.includes(newLang)) return;
    const url = new URL(window.location.href);
    url.searchParams.set('lang', newLang);
    window.location.href = url.toString();
  }, []);

  const value = useMemo(() => ({ lang, t, setLang }), [lang, t, setLang]);

  return (
    <TranslationContext.Provider value={value}>
      {children}
    </TranslationContext.Provider>
  );
}

export function useTranslation() {
  return useContext(TranslationContext);
}