import { Key } from '@phosphor-icons/react';

export default function IntegrationCTA() {
  return (
    <section id="integration" className="py-20 md:py-28 bg-charcoal">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <h2 className="font-display text-3xl md:text-[36px] font-bold text-white mb-4">
          \u00bfListo para Integrar?
        </h2>
        <p className="font-body text-base text-white/70 mb-8 max-w-xl mx-auto">
          Solo necesitas copiar y pegar este c\u00f3digo en tu sitio web. El widget se cargar\u00e1 autom\u00e1ticamente.
        </p>

        {/* Code Snippet */}
        <div className="bg-[#252525] rounded-lg p-6 mb-8 text-left max-w-2xl mx-auto overflow-x-auto">
          <pre className="font-mono text-sm">
            <code>
              <span className="text-warm-gray">{`<!-- ReserVamos Widget -->`}</span>
              {'\n'}
              <span className="text-terracotta">{'<'}</span>
              <span className="text-[#7DD3FC]">{'script'}</span>
              {'\n  '}
              <span className="text-[#A5D6A7]">{'src'}</span>
              <span className="text-white">{'='}</span>
              <span className="text-terracotta">{'"https://cdn.reservamos.app/widget.js"'}</span>
              {'\n  '}
              <span className="text-[#A5D6A7]">{'data-client-id'}</span>
              <span className="text-white">{'='}</span>
              <span className="text-terracotta">{'"tu-client-id"'}</span>
              {'\n  '}
              <span className="text-[#A5D6A7]">{'data-theme'}</span>
              <span className="text-white">{'='}</span>
              <span className="text-terracotta">{'"light"'}</span>
              {'\n'}
              <span className="text-terracotta">{'>'}</span>
              <span className="text-terracotta">{'</'}</span>
              <span className="text-[#7DD3FC]">{'script'}</span>
              <span className="text-terracotta">{'>'}</span>
            </code>
          </pre>
        </div>

        <button className="inline-flex items-center gap-2 bg-terracotta text-white px-8 py-3.5 rounded-full font-body font-semibold shadow-button hover:bg-terracotta-dark hover:-translate-y-0.5 transition-all">
          <Key size={18} />
          Obtener API Key
        </button>
      </div>
    </section>
  );
}
