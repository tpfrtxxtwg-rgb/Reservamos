import { useTranslation } from 'react-i18next';
import BookingWidget from '@/components/BookingWidget';

export default function DemoWidget() {
  const { t } = useTranslation();

  return (
    <section id="demo" className="py-20 md:py-28 bg-sand-light">
      <div className="max-w-6xl mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-12">
          <span className="font-body text-xs font-semibold uppercase tracking-[0.1em] text-terracotta mb-3 block">
            {t('demoSection.label') || 'Pruébalo en Vivo'}
          </span>
          <h2 className="font-display text-3xl md:text-[40px] font-bold text-charcoal mb-4">
            {t('demoSection.title') || 'Tu Cliente Reserva en Segundos'}
          </h2>
          <p className="font-body text-base text-warm-gray max-w-2xl mx-auto">
            {t('demoSection.description') || 'El widget se adapta al diseño de cualquier sitio web. El viajero completa su reserva en menos de 2 minutos.'}
          </p>
        </div>

        {/* Widget Mockup Container */}
        <div className="flex justify-center">
          <div className="w-full max-w-5xl bg-white rounded-2xl shadow-xl overflow-hidden">
            {/* Mock Browser Bar */}
            <div className="bg-[#F0EDE8] px-4 py-3 flex items-center gap-2 border-b border-[rgba(138,130,120,0.1)]">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-[#E8A0A0]" />
                <div className="w-3 h-3 rounded-full bg-[#E8D5A0]" />
                <div className="w-3 h-3 rounded-full bg-[#A0D9A0]" />
              </div>
              <div className="flex-1 mx-4">
                <div className="bg-white rounded-md px-4 py-1.5 font-body text-xs text-warm-gray text-center max-w-sm mx-auto border border-[rgba(138,130,120,0.1)]">
                  transportesrivieramaya.com/reservar
                </div>
              </div>
            </div>

            {/* Mock Website Content + Widget */}
            <div className="flex flex-col md:flex-row">
              {/* Mock Website Content */}
              <div className="hidden md:block flex-1 p-8 bg-white">
                <div className="h-6 w-40 bg-sand rounded mb-4" />
                <div className="h-4 w-full bg-[#F5EFE6] rounded mb-2" />
                <div className="h-4 w-[80%] bg-[#F5EFE6] rounded mb-6" />
                <div className="h-32 bg-sand rounded-lg mb-4 overflow-hidden">
                  <img src="/hero-cancun.jpg" alt="" className="w-full h-full object-cover opacity-60" />
                </div>
                <div className="h-4 w-full bg-[#F5EFE6] rounded mb-2" />
                <div className="h-4 w-[60%] bg-[#F5EFE6] rounded mb-2" />
                <div className="h-4 w-[90%] bg-[#F5EFE6] rounded" />
              </div>

              {/* Widget Sidebar */}
              <div className="w-full md:w-auto md:min-w-[380px] p-6 bg-[#FAFAF8] flex justify-center">
                <BookingWidget allowedSlugs={['airport-transfer']} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
