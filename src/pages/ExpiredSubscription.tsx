import { Warning, Calendar, ArrowRight, WhatsappLogo } from '@phosphor-icons/react';
import { useTranslation } from '../hooks/useTranslation';

export default function ExpiredSubscription() {
  const { t, lang } = useTranslation();

  // Localized content
  const content: Record<string, { title: string; subtitle: string; body: string; ctaRenew: string; ctaSupport: string; or: string }> = {
    en: {
      title: "Your subscription has expired",
      subtitle: "Your free trial period has ended",
      body: "To continue using ReserVamos and receiving bookings through your website, you need to activate your annual plan. Our team is ready to help you with the process.",
      ctaRenew: "Renew My Plan",
      ctaSupport: "Contact Support",
      or: "or",
    },
    es: {
      title: "Tu suscripción ha expirado",
      subtitle: "Tu período de prueba gratuito ha terminado",
      body: "Para continuar usando ReserVamos y recibir reservas a través de tu sitio web, necesitas activar tu plan anual. Nuestro equipo está listo para ayudarte con el proceso.",
      ctaRenew: "Renovar Mi Plan",
      ctaSupport: "Contactar Soporte",
      or: "o",
    },
    pt: {
      title: "Sua assinatura expirou",
      subtitle: "Seu período de teste gratuito terminou",
      body: "Para continuar usando o ReserVamos e receber reservas pelo seu site, você precisa ativar seu plano anual. Nossa equipe está pronta para ajudá-lo com o processo.",
      ctaRenew: "Renovar Meu Plano",
      ctaSupport: "Contatar Suporte",
      or: "ou",
    },
  };

  const c = content[lang as keyof typeof content] || content.en;
  const whatsappUrl = "https://wa.me/526243551663?text=Hi!%20My%20ReserVamos%20subscription%20has%20expired.%20I%20want%20to%20renew%20my%20annual%20plan.";

  return (
    <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl font-bold text-charcoal tracking-tight">
            Reser<span className="text-terracotta">Vamos</span>
          </h1>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-[rgba(138,130,120,0.08)] p-8 text-center">
          {/* Icon */}
          <div className="w-16 h-16 rounded-full bg-[rgba(199,94,58,0.1)] flex items-center justify-center mx-auto mb-5">
            <Calendar size={32} className="text-terracotta" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[rgba(178,58,47,0.08)] rounded-full mb-4">
            <Warning size={14} className="text-[#B23A2F]" />
            <span className="font-body text-xs text-[#B23A2F] font-medium">{c.subtitle}</span>
          </div>

          <h2 className="font-display text-xl font-bold text-charcoal mb-3">
            {c.title}
          </h2>

          <p className="font-body text-sm text-warm-gray leading-relaxed mb-6">
            {c.body}
          </p>

          {/* Plan info card */}
          <div className="bg-sand rounded-lg p-4 mb-6 text-left">
            <div className="flex items-center justify-between mb-2">
              <span className="font-body text-sm text-warm-gray">Annual Plan</span>
              <span className="font-display text-2xl font-bold text-charcoal">$600</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-body text-xs text-warm-gray">(~$50/month)</span>
              <span className="font-body text-xs text-warm-gray">USD / year</span>
            </div>
          </div>

          {/* CTAs */}
          <div className="space-y-3">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 rounded-full font-body font-semibold text-sm bg-terracotta text-white shadow-button hover:bg-terracotta-dark hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
            >
              <ArrowRight size={16} />
              {c.ctaRenew}
            </a>

            <p className="font-body text-xs text-warm-gray">{c.or}</p>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 rounded-full font-body font-semibold text-sm border-2 border-[rgba(138,130,120,0.2)] text-charcoal hover:border-terracotta hover:text-terracotta transition-all flex items-center justify-center gap-2"
            >
              <WhatsappLogo size={18} />
              {c.ctaSupport}
            </a>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center font-body text-xs text-warm-gray mt-6">
          <a href="/" className="text-terracotta hover:underline">Back to homepage</a>
        </p>
      </div>
    </div>
  );
}
