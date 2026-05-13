export default function Footer() {
  const columns = [
    {
      title: 'Producto',
      links: ['Widget', 'Panel Admin', 'API', 'Precios'],
    },
    {
      title: 'Recursos',
      links: ['Documentaci\u00f3n', 'Gu\u00eda de Integraci\u00f3n', 'Blog', 'Soporte'],
    },
    {
      title: 'Compa\u00f1\u00eda',
      links: ['Nosotros', 'Contacto', 'Carreras', 'Prensa'],
    },
    {
      title: 'Legal',
      links: ['T\u00e9rminos', 'Privacidad', 'Cookies', 'GDPR'],
    },
  ];

  return (
    <footer className="bg-charcoal pt-12 pb-8">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          <div className="col-span-2 md:col-span-1">
            <span className="font-display text-xl font-bold text-white mb-3 block">
              ReserVamos
            </span>
            <p className="font-body text-sm text-white/50">
              Motor de reservaciones para transportaci\u00f3n tur\u00edstica privada.
            </p>
          </div>
          {columns.map(col => (
            <div key={col.title}>
              <h4 className="font-body text-sm font-semibold text-white mb-3">{col.title}</h4>
              <ul className="space-y-2">
                {col.links.map(link => (
                  <li key={link}>
                    <a
                      href="#"
                      className="font-body text-sm text-white/50 hover:text-terracotta transition-colors"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-white/10 pt-6 text-center">
          <p className="font-body text-xs text-white/40">
            2025 ReserVamos. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
