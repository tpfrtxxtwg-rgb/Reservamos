import { useEffect, useRef, useState } from 'react';
import { ArrowRight, FileText } from '@phosphor-icons/react';
import { useTranslation } from '../hooks/useTranslation';
import BookingWidget from '@/components/BookingWidget';
import AnimatedCounter from '@/components/AnimatedCounter';

export default function Hero() {
  const { t } = useTranslation();
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const handleScrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section ref={sectionRef} className="relative min-h-[100dvh] flex items-center justify-center overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0 z-0">
        <img
          src="/hero-cancun.jpg"
          alt="Hero background"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-[rgba(30,30,30,0.6)]" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left column */}
          <div className="max-w-xl">
            <h1 className="font-display text-4xl sm:text-5xl lg:text-[56px] font-bold text-white leading-[1.1] mb-6">
              {t('hero.title')}
            </h1>
            <p className="font-body text-base sm:text-lg text-white/85 leading-relaxed mb-8">
              {t('hero.subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 mb-8">
              <button
                onClick={() => handleScrollTo('demo')}
                className="inline-flex items-center justify-center gap-2 bg-terracotta hover:bg-terracotta-dark text-white px-7 py-3.5 rounded-full font-body font-semibold shadow-button hover:-translate-y-0.5 transition-all"
              >
                <ArrowRight size={18} weight="bold" />
                {t('hero.ctaDemo')}
              </button>
              <button
                onClick={() => handleScrollTo('integration')}
                className="inline-flex items-center justify-center gap-2 border-2 border-white/30 hover:border-white/60 text-white px-7 py-3.5 rounded-full font-body font-semibold transition-all"
              >
                <FileText size={18} />
                {t('hero.ctaDocs')}
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 sm:gap-6">
              <div className="text-center">
                <div className="font-display text-2xl sm:text-3xl font-bold text-white mb-1">
                  <AnimatedCounter target={200} suffix="+" />
                </div>
                <div className="font-body text-xs sm:text-sm text-white/70">{t('hero.statsOperators')}</div>
              </div>
              <div className="text-center">
                <div className="font-display text-2xl sm:text-3xl font-bold text-white mb-1">
                  <AnimatedCounter target={50} suffix="k" />
                </div>
                <div className="font-body text-xs sm:text-sm text-white/70">{t('hero.statsBookings')}</div>
              </div>
              <div className="text-center">
                <div className="font-display text-2xl sm:text-3xl font-bold text-white mb-1">
                  <AnimatedCounter target={99} suffix=".9%" />
                </div>
                <div className="font-body text-xs sm:text-sm text-white/70">{t('hero.statsUptime')}</div>
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className={`flex justify-center lg:justify-end transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <div className="w-full max-w-[420px]">
              <BookingWidget />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
