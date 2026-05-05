import { Code, CreditCard, Translate, Clock, Bell, Layout } from '@phosphor-icons/react';

const features = [
  {
    icon: <Code size={22} />,
    title: 'Widget Embebible',
    description: 'Integra con un script. Funciona en WordPress, React, cualquier sitio.',
  },
  {
    icon: <CreditCard size={22} />,
    title: 'Pagos Integrados',
    description: 'Stripe, PayPal, MercadoPago. El pago se procesa dentro del widget.',
  },
  {
    icon: <Translate size={22} />,
    title: 'Multi-Idioma',
    description: 'Espa\u00f1ol, ingl\u00e9s, portugu\u00e9s. Detecci\u00f3n autom\u00e1tica del navegador.',
  },
  {
    icon: <Clock size={22} />,
    title: 'Disponibilidad en Tiempo Real',
    description: 'El calendario muestra solo fechas y horarios disponibles.',
  },
  {
    icon: <Bell size={22} />,
    title: 'Notificaciones Autom\u00e1ticas',
    description: 'Confirmaciones por email y WhatsApp al instante.',
  },
  {
    icon: <Layout size={22} />,
    title: 'Panel de Control',
    description: 'Gestiona reservas, conductores, veh\u00edculos y reportes.',
  },
];

export default function Features() {
  return (
    <section id="features" className="py-20 md:py-28 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-14">
          <span className="font-body text-xs font-semibold uppercase tracking-[0.1em] text-terracotta mb-3 block">
            Caracter\u00edsticas
          </span>
          <h2 className="font-display text-3xl md:text-[40px] font-bold text-charcoal">
            Todo lo que Necesitas
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
