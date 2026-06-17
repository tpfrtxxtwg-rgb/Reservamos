import { useTranslation } from '../hooks/useTranslation';
import { Code, CreditCard, Translate, Clock, Bell, Layout } from '@phosphor-icons/react';

export default function Features() {
  const { t } = useTranslation();

  const features = [
    {
      icon: <Code size={22} />,
      title: t('features.embeddableWidget.title'),
      description: t('features.embeddableWidget.description'),
    },
    {
      icon: <CreditCard size={22} />,
      title: t('features.integratedPayments.title'),
      description: t('features.integratedPayments.description'),
    },
    {
      icon: <Translate size={22} />,
      title: t('features.multilanguage.title'),
      description: t('features.multilanguage.description'),
    },
    {
      icon: <Clock size={22} />,
      title: t('features.realTimeAvailability.title'),
      description: t('features.realTimeAvailability.description'),
    },
    {
      icon: <Bell size={22} />,
      title: t('features.autoNotifications.title'),
      description: t('features.autoNotifications.description'),
    },
    {
      icon: <Layout size={22} />,
      title: t('features.controlPanel.title'),
      description: t('features.controlPanel.description'),
    },
  ];

  return (
    <section id="features" className="py-20 md:py-28 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-14">
          <span className="font-body text-xs font-semibold uppercase tracking-[0.1em] text-terracotta mb-3 block">
            {t('features.label')}
          </span>
          <h2 className="font-display text-3xl md:text-[40px] font-bold text-charcoal">
            {t('features.title')}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <div
              key={i}
              className="bg-white border border-[rgba(138,130,120,0.15)] rounded-lg p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group"
            >
              <div className="w-12 h-12 rounded-full bg-[rgba(199,94,58,0.1)] flex items-center justify-center text-terracotta mb-4 group-hover:bg-terracotta group-hover:text-white transition-colors">
                {feature.icon}
              </div>
              <h3 className="font-display text-xl font-semibold text-charcoal mb-2">
                {feature.title}
              </h3>
              <p className="font-body text-sm text-warm-gray leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}