import { useState, useRef, useEffect } from 'react';
import { Globe } from '@phosphor-icons/react';

const languages = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'pt', label: 'Português' },
];

function setLangCookie(code: string) {
  document.cookie = `i18nextLng=${code};path=/;max-age=31536000`;
}

function getLangCookie(): string | null {
  const match = document.cookie.match(/i18nextLng=([a-z]{2})/);
  return match ? match[1] : null;
}

export default function LanguageSwitcher() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const currentLang = getLangCookie() || 'en';

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
    setLangCookie(code);
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-sm font-medium text-charcoal-light hover:text-terracotta transition-colors"
      >
        <Globe size={16} />
        <span className="uppercase text-xs">{currentLang}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 bg-white border border-[rgba(138,130,120,0.15)] rounded-lg shadow-md overflow-hidden z-50 min-w-[120px]">
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