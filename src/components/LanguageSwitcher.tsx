import { useTranslation } from 'react-i18next';
import { Globe } from '@phosphor-icons/react';

const languages = [
  { code: 'en', label: 'lang.en' },
  { code: 'es', label: 'lang.es' },
  { code: 'pt', label: 'lang.pt' },
];

export default function LanguageSwitcher() {
  const { i18n, t } = useTranslation();

  const currentLang = i18n.language.substring(0, 2);

  return (
    <div className="relative group">
      <button className="flex items-center gap-1.5 text-sm font-medium text-charcoal-light hover:text-terracotta transition-colors">
        <Globe size={16} />
        <span className="uppercase text-xs">{currentLang}</span>
      </button>
      <div className="absolute right-0 top-full mt-1 bg-white border border-[rgba(138,130,120,0.15)] rounded-lg shadow-md overflow-hidden hidden group-hover:block z-50 min-w-[120px]">
        {languages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => i18n.changeLanguage(lang.code)}
            className={`w-full text-left px-3 py-2 text-sm font-body transition-colors ${
              currentLang === lang.code
                ? 'bg-terracotta/10 text-terracotta font-semibold'
                : 'text-charcoal hover:bg-sand-light'
            }`}
          >
            {t(lang.label)}
          </button>
        ))}
      </div>
    </div>
  );
}
