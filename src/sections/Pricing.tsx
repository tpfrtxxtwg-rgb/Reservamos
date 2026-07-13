import { Check } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';

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
          <div className="bg-white rounded-xl shadow-md p-8 flex flex-col justify-center items-center text-center">
            <p className="font-body text-lg text-warm-gray mb-4">
              {t('pricing.subtitle') || 'For all private transportation operators'}
            </p>
            <div className="mb-6">
              <span className="font-body text-5xl font-bold text-charcoal">$50</span>
              <span className="font-body text-base text-warm-gray ml-1">USD / {t('pricing.month') || 'month'}</span>
            </div>
            <div className="flex flex-col gap-3 w-full max-w-xs">
              <button onClick={() => window.location.href = '/register'}
                className="w-full py-3 rounded-full font-body font-semibold text-sm bg-terracotta text-white shadow-button hover:bg-terracotta-dark hover:-translate-y-0.5 transition-all">
                {t('pricing.getStarted') || 'Get Started'}
              </button>
              <button className="w-full py-3 rounded-full font-body font-semibold text-sm border-2 border-[rgba(138,130,120,0.2)] text-charcoal hover:border-terracotta hover:text-terracotta transition-all">
                {t('pricing.contactSales') || 'Contact Sales'}
              </button>
            </div>
          </div>

          {/* Card 2 - Features */}
          <div className="bg-white rounded-xl shadow-md p-8 flex flex-col">
            <h3 className="font-display text-lg font-semibold text-charcoal mb-6">
              {t('pricing.whatsIncluded') || "What's included"}
            </h3>
            <ul className="space-y-4 flex-1">
              {features.map((feature, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[rgba(199,94,58,0.1)] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check size={14} weight="bold" className="text-terracotta" />
                  </div>
                  <span className="font-body text-sm text-charcoal">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
