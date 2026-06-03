import { Check } from '@phosphor-icons/react';

const plans = [
  {
    name: 'Starter',
    price: '$49',
    period: '/mes',
    description: 'Para operadores peque\u00f1os',
    features: ['1 sitio web', '100 reservas/mes', 'Pagos b\u00e1sicos', 'Soporte por email', 'Reportes b\u00e1sicos'],
    popular: false,
  },
  {
    name: 'Professional',
    price: '$149',
    period: '/mes',
    description: 'Para operadores en crecimiento',
    features: [
      '5 sitios web',
      'Reservas ilimitadas',
      'Pagos avanzados (Stripe, PayPal)',
      'Notificaciones WhatsApp',
      'Reportes avanzados',
      'Soporte prioritario',
    ],
    popular: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    description: 'Para grandes operadores',
    features: [
      'Sitios ilimitados',
      'API completa',
      'Todos los m\u00e9todos de pago',
      'White-label disponible',
      'Soporte dedicado 24/7',
      'Onboarding personalizado',
    ],
    popular: false,
  },
];

export default function Pricing() {
<<<<<<< HEAD
=======
  const { t } = useTranslation();

  const features = [
    t('pricing.feature1') || '1 Website',
    t('pricing.feature2') || 'Configurable by the owner',
    t('pricing.feature3') || 'Email notifications',
    t('pricing.feature4') || 'Basic reports',
    t('pricing.feature5') || 'Advanced payments (PayPal, Stripe)',
  ];

>>>>>>> 6688a34e810e9ce150c1cc87b0709d5780c1b305
  return (
    <section id="pricing" className="py-20 md:py-28 bg-sand">
      <div className="max-w-4xl mx-auto px-6">
        {/* Title */}
        <div className="text-center mb-14">
          <span className="font-body text-xs font-semibold uppercase tracking-[0.1em] text-terracotta mb-3 block">
<<<<<<< HEAD
            Precios
          </span>
          <h2 className="font-display text-3xl md:text-[40px] font-bold text-charcoal">
            Planes Transparentes
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map(plan => (
            <div
              key={plan.name}
              className={`relative bg-white rounded-xl shadow-md p-8 flex flex-col ${
                plan.popular ? 'ring-2 ring-terracotta' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-terracotta text-white px-4 py-1 rounded-full font-body text-xs font-semibold">
                  M\u00e1s Popular
                </div>
              )}

              <h3 className="font-display text-xl font-semibold text-charcoal mb-1">{plan.name}</h3>
              <p className="font-body text-sm text-warm-gray mb-4">{plan.description}</p>

              <div className="mb-6">
                <span className="font-body text-4xl font-bold text-charcoal">{plan.price}</span>
                <span className="font-body text-sm text-warm-gray">{plan.period}</span>
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check size={16} weight="bold" className="text-[#2D6A4F] mt-0.5 flex-shrink-0" />
                    <span className="font-body text-sm text-charcoal">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                className={`w-full py-3 rounded-full font-body font-semibold text-sm transition-all ${
                  plan.popular
                    ? 'bg-terracotta text-white shadow-button hover:bg-terracotta-dark hover:-translate-y-0.5'
                    : 'border-2 border-[rgba(138,130,120,0.2)] text-charcoal hover:border-terracotta hover:text-terracotta'
                }`}
              >
                {plan.name === 'Enterprise' ? 'Contactar Ventas' : 'Comenzar'}
              </button>
            </div>
          ))}
=======
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
              <button className="w-full py-3 rounded-full font-body font-semibold text-sm bg-terracotta text-white shadow-button hover:bg-terracotta-dark hover:-translate-y-0.5 transition-all">
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
>>>>>>> 6688a34e810e9ce150c1cc87b0709d5780c1b305
        </div>
      </div>
    </section>
  );
}
