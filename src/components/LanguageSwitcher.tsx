import { useState, useRef, useEffect } from 'react';
import { useTranslation } from '../context/TranslationContext';
import { Globe } from '@phosphor-icons/react';

const languages = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'pt', label: 'Português' },
];

export default function LanguageSwitcher() {
  const { lang, setLang } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-sm font-medium text-charcoal-light hover:text-terracotta transition-colors"
      >
        <Globe size={16} />
        <span className="uppercase text-xs">{lang}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 bg-white border border-[rgba(138,130,120,0.15)] rounded-lg shadow-md overflow-hidden z-50 min-w-[120px]">
          {languages.map((language) => (
            <button
              key={language.code}
              onClick={() => {
                setOpen(false);
                setLang(language.code);
              }}
              className={`w-full text-left px-3 py-2 text-sm font-body transition-colors ${
                lang === language.code
                  ? 'bg-terracotta/10 text-terracotta font-semibold'
                  : 'text-charcoal hover:bg-sand-light'
              }`}
            >
              {language.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}