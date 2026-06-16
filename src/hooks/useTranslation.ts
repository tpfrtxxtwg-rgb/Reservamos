const SUPPORTED_LANGS = ['en', 'es', 'pt'];

let currentLang = 'en';
try {
  const params = new URLSearchParams(window.location.search);
  const urlLang = params.get('lang');
  if (urlLang && SUPPORTED_LANGS.includes(urlLang)) currentLang = urlLang;
} catch { /* ignore */ }

const translations: Record<string, Record<string, string>> = {
  en: {
    // Hero
    'hero.title': 'The Booking Engine for Private Transportation',
    'hero.subtitle': 'Embeddable widget. High conversion. Zero hassle.',
    'hero.ctaDemo': 'View Demo',
    'hero.ctaDocs': 'Documentation',
    'hero.statsOperators': 'Operators',
    'hero.statsBookings': 'Bookings',
    'hero.statsUptime': 'Uptime',
    // Features
    'features.label': 'Features',
    'features.title': 'Your Brand, Your Clients, Your Rules',
    'features.subtitle': 'Complete control over your transportation business',
    'features.whyTitle': 'Why Private Operators Choose ReserVamos',
    'features.why1Title': 'Zero Commission',
    'features.why1Desc': 'Keep 100% of your revenue. Fixed monthly price.',
    'features.why2Title': 'Your Own Brand',
    'features.why2Desc': 'White-label widget with your logo and colors.',
    'features.why3Title': 'Direct Payments',
    'features.why3Desc': 'Stripe & PayPal integrated. Money goes to your account.',
    // Pricing
    'pricing.label': 'Pricing',
    'pricing.title': 'Booking Engine Plan',
    'pricing.subtitle': 'For all private transportation operators',
    'pricing.month': 'month',
    'pricing.price': '$50',
    'pricing.getStarted': 'Get Started',
    'pricing.contactSales': 'Contact Sales',
    'pricing.whatsIncluded': "What's included",
    'pricing.feature1': 'Widget ready to work in your website',
    'pricing.feature2': 'Configurable by the owner',
    'pricing.feature3': 'Email notifications',
    'pricing.feature4': 'Basic reports',
    'pricing.feature5': 'Advanced payments (PayPal, Stripe)',
    // Demo Widget
    'demoSection.label': 'See It In Action',
    'demoSection.title': 'Live Booking Demo',
    'demoSection.description': 'Experience the reservation flow your clients will see',
    // Integration
    'integration.label': 'Integration',
    'integration.title': 'Add to Your Website in Minutes',
    'integration.description': 'One line of code. Full integration.',
    'integration.codeComment': 'ReserVamos Booking Widget',
    'integration.cta': 'Get Integration Code',
    // Footer
    'footer.product': 'Product',
    'footer.resources': 'Resources',
    'footer.company': 'Company',
    'footer.legal': 'Legal',
    'footer.copyright': 'All rights reserved.',
    // Header
    'header.product': 'Product',
    'header.features': 'Features',
    'header.pricing': 'Pricing',
    'header.integration': 'Integration',
    'header.adminPanel': 'Admin Panel',
    'header.signIn': 'Sign In',
    'header.getStarted': 'Get Started',
  },
  es: {
    // Hero
    'hero.title': 'El Motor de Reservaciones para Transportación Privada',
    'hero.subtitle': 'Widget embebible. Alta conversión. Sin complicaciones.',
    'hero.ctaDemo': 'Ver Demo',
    'hero.ctaDocs': 'Documentación',
    'hero.statsOperators': 'Operadores',
    'hero.statsBookings': 'Reservas',
    'hero.statsUptime': 'Uptime',
    // Features
    'features.label': 'Características',
    'features.title': 'Tu Marca, Tus Clientes, Tus Reglas',
    'features.subtitle': 'Control completo sobre tu negocio de transporte',
    'features.whyTitle': 'Por qué los operadores privados eligen ReserVamos',
    'features.why1Title': 'Cero Comisión',
    'features.why1Desc': 'Mantén el 100% de tus ingresos. Precio mensual fijo.',
    'features.why2Title': 'Tu Propia Marca',
    'features.why2Desc': 'Widget white-label con tu logo y colores.',
    'features.why3Title': 'Pagos Directos',
    'features.why3Desc': 'Stripe y PayPal integrados. El dinero va a tu cuenta.',
    // Pricing
    'pricing.label': 'Precios',
    'pricing.title': 'Plan Motor de Reservas',
    'pricing.subtitle': 'Para todos los operadores de transporte privado',
    'pricing.month': 'mes',
    'pricing.price': '$50',
    'pricing.getStarted': 'Comenzar',
    'pricing.contactSales': 'Contactar Ventas',
    'pricing.whatsIncluded': 'Qué incluye',
    'pricing.feature1': 'Widget listo para funcionar en tu sitio web',
    'pricing.feature2': 'Configurable por el dueño',
    'pricing.feature3': 'Notificaciones por email',
    'pricing.feature4': 'Reportes básicos',
    'pricing.feature5': 'Pagos avanzados (PayPal, Stripe)',
    // Demo Widget
    'demoSection.label': 'Vívelo en Vivo',
    'demoSection.title': 'Demo de Reserva en Vivo',
    'demoSection.description': 'Experimenta el flujo de reserva que tus clientes verán',
    // Integration
    'integration.label': 'Integración',
    'integration.title': 'Agrega a Tu Sitio Web en Minutos',
    'integration.description': 'Una línea de código. Integración completa.',
    'integration.codeComment': 'Widget de Reservas ReserVamos',
    'integration.cta': 'Obtener Código de Integración',
    // Footer
    'footer.product': 'Producto',
    'footer.resources': 'Recursos',
    'footer.company': 'Empresa',
    'footer.legal': 'Legal',
    'footer.copyright': 'Todos los derechos reservados.',
    // Header
    'header.product': 'Producto',
    'header.features': 'Características',
    'header.pricing': 'Precios',
    'header.integration': 'Integración',
    'header.adminPanel': 'Panel Admin',
    'header.signIn': 'Iniciar Sesión',
    'header.getStarted': 'Comenzar',
  },
  pt: {
    // Hero
    'hero.title': 'O Motor de Reservas para Transporte Privado',
    'hero.subtitle': 'Widget incorporável. Alta conversão. Sem complicações.',
    'hero.ctaDemo': 'Ver Demo',
    'hero.ctaDocs': 'Documentação',
    'hero.statsOperators': 'Operadores',
    'hero.statsBookings': 'Reservas',
    'hero.statsUptime': 'Uptime',
    // Features
    'features.label': 'Recursos',
    'features.title': 'Sua Marca, Seus Clientes, Suas Regras',
    'features.subtitle': 'Controle completo sobre seu negócio de transporte',
    'features.whyTitle': 'Por que operadores privados escolhem ReserVamos',
    'features.why1Title': 'Zero Comissão',
    'features.why1Desc': 'Mantenha 100% da sua receita. Preço mensal fixo.',
    'features.why2Title': 'Sua Própria Marca',
    'features.why2Desc': 'Widget white-label com seu logo e cores.',
    'features.why3Title': 'Pagamentos Diretos',
    'features.why3Desc': 'Stripe e PayPal integrados. O dinheiro vai para sua conta.',
    // Pricing
    'pricing.label': 'Preços',
    'pricing.title': 'Plano Motor de Reservas',
    'pricing.subtitle': 'Para todos os operadores de transporte privado',
    'pricing.month': 'mês',
    'pricing.price': '$50',
    'pricing.getStarted': 'Começar',
    'pricing.contactSales': 'Contactar Vendas',
    'pricing.whatsIncluded': 'O que inclui',
    'pricing.feature1': 'Widget pronto para funcionar no seu site',
    'pricing.feature2': 'Configurável pelo dono',
    'pricing.feature3': 'Notificações por email',
    'pricing.feature4': 'Relatórios básicos',
    'pricing.feature5': 'Pagamentos avançados (PayPal, Stripe)',
    // Demo Widget
    'demoSection.label': 'Experimente ao Vivo',
    'demoSection.title': 'Demo de Reserva ao Vivo',
    'demoSection.description': 'Experimente o fluxo de reserva que seus clientes verão',
    // Integration
    'integration.label': 'Integración',
    'integration.title': 'Adicione ao Seu Site em Minutos',
    'integration.description': 'Uma linha de código. Integração completa.',
    'integration.codeComment': 'Widget de Reservas ReserVamos',
    'integration.cta': 'Obter Código de Integração',
    // Footer
    'footer.product': 'Produto',
    'footer.resources': 'Recursos',
    'footer.company': 'Empresa',
    'footer.legal': 'Legal',
    'footer.copyright': 'Todos os direitos reservados.',
    // Header
    'header.product': 'Produto',
    'header.features': 'Recursos',
    'header.pricing': 'Preços',
    'header.integration': 'Integración',
    'header.adminPanel': 'Painel Admin',
    'header.signIn': 'Entrar',
    'header.getStarted': 'Começar',
  },
};

export function useTranslation() {
  const data = translations[currentLang] || translations['en'];
  return {
    t: (key: string): string => data[key] || key,
    lang: currentLang,
    i18n: { language: currentLang },
    setLang: (newLang: string) => {
      if (!SUPPORTED_LANGS.includes(newLang)) return;
      const url = new URL(window.location.href);
      url.searchParams.set('lang', newLang);
      window.location.href = url.toString();
    },
  };
}