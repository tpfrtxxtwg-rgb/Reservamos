import { Check } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';

export default function Pricing() {
  const { t } = useTranslation();

  const plans = [
    { key: 'starter' as const, popular: false },
    { key: 'professional' as const, popular: true },
    { key: 'enterprise' as const, popular: false },
  ];

  return (
    <section id="pricing" className="py-20 md:py-28 bg-sand">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-14">
          <span className="font-body text-xs font-semibold uppercase tracking-[0.1em] text-terracotta mb-3 block">
            {t('pricing.label')}
          </span>
          <h2 className="font-display text-3xl md:text-[40px] font-bold text-charcoal">
            {t('pricing.title')}
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map(plan => {
            const features = t(`pricing.${plan.key}.features`, { returnObjects: true }) as string[];
            return (
              <div key={plan.key}
                className={`relative bg-white rounded-xl shadow-md p-8 flex flex-col ${plan.popular ? 'ring-2 ring-terracotta' : ''}`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-terracotta text-white px-4 py-1 rounded-full font-body text-xs font-semibold">
                    {t('pricing.professional.badge')}
                  </div>
                )}
                <h3 className="font-display text-xl font-semibold text-charcoal mb-1">{t(`pricing.${plan.key}.name`)}</h3>
                <p className="font-body text-sm text-warm-gray mb-4">{t(`pricing.${plan.key}.description`)}</p>
                <div className="mb-6">
                  <span className="font-body text-4xl font-bold text-charcoal">{t(`pricing.${plan.key}.price`)}</span>
                  <span className="font-body text-sm text-warm-gray">{t(`pricing.${plan.key}.period`)}</span>
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                  {features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check size={16} weight="bold" className="text-[#2D6A4F] mt-0.5 flex-shrink-0" />
                      <span className="font-body text-sm text-charcoal">{feature}</span>
                    </li>
                  ))}
                </ul>
                <button className={`w-full py-3 rounded-full font-body font-semibold text-sm transition-all ${
                  plan.popular
                    ? 'bg-terracotta text-white shadow-button hover:bg-terracotta-dark hover:-translate-y-0.5'
                    : 'border-2 border-[rgba(138,130,120,0.2)] text-charcoal hover:border-terracotta hover:text-terracotta'
                }`}>
                  {t(`pricing.${plan.key}.cta`)}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
