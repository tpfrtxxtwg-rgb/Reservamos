import { Check } from '@phosphor-icons/react';
import { useTranslation } from '../hooks/useTranslation';

export default function Pricing() {
  const { t } = useTranslation();

  const features = [
    t('pricing.feature1') || '1 Website',
    t('pricing.feature2') || 'Configurable by the owner',
    t('pricing.feature3') || 'Email notifications',
    t('pricing.feature4') || 'Basic reports',
    t('pricing.feature5') || 'Advanced payments (PayPal, Stripe)',
  ];

  return (
    <section id="pricing" className="py-20 md:py-28 bg-sand">
      <div className="max-w-4xl mx-auto px-6">
        {/* Title */}
        <div className="text-center mb-14">
          <span className="font-body text-xs font-semibold uppercase tracking-[0.1em] text-terracotta mb-3 block">
            {t('pricing.label') || 'Pricing'}
          </span>
          <h2 className="font-display text-3xl md:text-[40px] font-bold text-charcoal">
            {t('pricing.title') || 'Booking Engine Plan'}
          </h2>
        </div>

        {/* Two cards layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto items-stretch">
          {/* Card 1 - Price */}
          <div className="bg-white rounded-2xl p-8 md:p-10 border border-[rgba(138,130,120,0.15)] shadow-sm">
            <h3 className="font-display text-2xl font-bold text-charcoal mb-2">
              {t('pricing.card1Title') || 'Booking Engine'}
            </h3>
            <div className="flex items-baseline gap-1 mb-6">
              <span className="font-display text-4xl md:text-5xl font-bold text-charcoal">$39</span>
              <span className="font-body text-sm text-warm-gray">/ {t('pricing.month') || 'month'}</span>
            </div>
            <ul className="space-y-3 mb-8">
              {features.map((feature, i) => (
                <li key={i} className="flex items-center gap-3">
                  <span className="w-5 h-5 rounded-full bg-terracotta/10 flex items-center justify-center flex-shrink-0">
                    <Check size={12} className="text-terracotta" weight="bold" />
                  </span>
                  <span className="font-body text-sm text-charcoal-light">{feature}</span>
                </li>
              ))}
            </ul>
            <button className="w-full py-3.5 border-2 border-terracotta text-terracotta rounded-full font-body font-semibold hover:bg-terracotta hover:text-white transition-all">
              {t('pricing.cta') || 'Start Free Trial'}
            </button>
          </div>

          {/* Card 2 - Why */}
          <div className="bg-white rounded-2xl p-8 md:p-10 border border-[rgba(138,130,120,0.15)] shadow-sm">
            <h3 className="font-display text-2xl font-bold text-charcoal mb-2">
              {t('pricing.card2Title') || 'Why ReserVamos?'}
            </h3>
            <p className="font-body text-base text-charcoal-light mb-6">
              {t('pricing.card2Desc') || 'No commissions per booking. Fixed monthly price. You control your brand, your clients, and your payments.'}
            </p>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center gap-3">
                <span className="w-5 h-5 rounded-full bg-terracotta/10 flex items-center justify-center flex-shrink-0">
                  <Check size={12} className="text-terracotta" weight="bold" />
                </span>
                <span className="font-body text-sm text-charcoal-light">{t('pricing.why1') || 'No commission per reservation'}</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="w-5 h-5 rounded-full bg-terracotta/10 flex items-center justify-center flex-shrink-0">
                  <Check size={12} className="text-terracotta" weight="bold" />
                </span>
                <span className="font-body text-sm text-charcoal-light">{t('pricing.why2') || 'You keep your clients'}</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="w-5 h-5 rounded-full bg-terracotta/10 flex items-center justify-center flex-shrink-0">
                  <Check size={12} className="text-terracotta" weight="bold" />
                </span>
                <span className="font-body text-sm text-charcoal-light">{t('pricing.why3') || 'Stripe & PayPal integrated'}</span>
              </li>
            </ul>
            <button className="w-full py-3.5 border-2 border-terracotta text-terracotta rounded-full font-body font-semibold hover:bg-terracotta hover:text-white transition-all">
              {t('pricing.cta') || 'Start Free Trial'}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}