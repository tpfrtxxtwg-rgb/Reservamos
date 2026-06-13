import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from '@phosphor-icons/react';

const languages = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'pt', label: 'Português' },
];

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const currentLang = i18n.language || 'en';

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleChange = (code: string) => {
    setOpen(false);
    const url = new URL(window.location.href);
    url.searchParams.set('lang', code);
    window.location.href = url.toString();
  };

  return (
    <div ref={ref} className=\"relative\">
      <button
        onClick={() => setOpen(!open)}
        className=\"flex items-center gap-1.5 text-sm font-medium text-charcoal-light hover:text-terracotta transition-colors\"
      >
        <Globe size={16} />
        <span className=\"uppercase text-xs\">{currentLang}</span>
      </button>

      {open && (
        <div className=\"absolute right-0 top-full mt-1 bg-white border border-[rgba(138,130,120,0.15)] rounded-lg shadow-md overflow-hidden z-50 min-w-[120px]\">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleChange(lang.code)}
              className={`w-full text-left px-3 py-2 text-sm font-body transition-colors ${
                currentLang === lang.code
                  ? 'bg-terracotta/10 text-terracotta font-semibold'
                  : 'text-charcoal hover:bg-sand-light'
              }`}
            >
              {lang.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}