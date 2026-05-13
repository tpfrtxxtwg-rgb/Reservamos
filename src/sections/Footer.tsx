import { useTranslation } from 'react-i18next';

export default function Footer() {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  const columns = [
    { title: t('footer.product'), links: ['Widget', 'Admin Panel', 'API', t('header.pricing')] },
    { title: t('footer.resources'), links: ['Documentation', 'Integration Guide', 'Blog', 'Support'] },
    { title: t('footer.company'), links: ['About Us', 'Contact', 'Careers', 'Press'] },
    { title: t('footer.legal'), links: ['Terms', 'Privacy', 'Cookies', 'GDPR'] },
  ];

  return (
    <footer className="bg-charcoal pt-12 pb-8">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          <div className="col-span-2 md:col-span-1">
            <span className="font-display text-xl font-bold text-white mb-3 block">ReserVamos</span>
            <p className="font-body text-sm text-white/50">
              {t('hero.subtitle')}
            </p>
          </div>
          {columns.map(col => (
            <div key={col.title}>
              <h4 className="font-body text-sm font-semibold text-white mb-3">{col.title}</h4>
              <ul className="space-y-2">
                {col.links.map(link => (
                  <li key={link}>
                    <a href="#" className="font-body text-sm text-white/50 hover:text-terracotta transition-colors">{link}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-white/10 pt-6 text-center">
          <p className="font-body text-xs text-white/40">
            &copy; {year} ReserVamos. {t('footer.copyright')}
          </p>
        </div>
      </div>
    </footer>
  );
}
