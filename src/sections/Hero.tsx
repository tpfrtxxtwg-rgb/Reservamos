import { useEffect, useRef, useState } from 'react';
import { ArrowRight, FileText } from '@phosphor-icons/react';

interface HeroProps {
  onScrollToDemo: () => void;
}

function AnimatedCounter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          const duration = 1500;
          const startTime = Date.now();
          const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(target * eased));
            if (progress < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  return (
    <span ref={ref}>
      {count.toLocaleString()}{suffix}
    </span>
  );
}

export default function Hero({ onScrollToDemo }: HeroProps) {
  return (
    <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src="/hero-cancun.jpg"
          alt="Cancun"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-[rgba(26,26,26,0.55)]" />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-6 pt-16 max-w-4xl mx-auto">
        <h1 className="font-display text-4xl sm:text-5xl md:text-[56px] font-bold text-white leading-tight mb-5"
          style={{ textShadow: '0 2px 20px rgba(0,0,0,0.3)' }}>
          Motor de Reservaciones para Transportaci\u00f3n Privada
        </h1>
        <p className="font-body text-base sm:text-lg text-white/85 mb-8 max-w-2xl mx-auto">
          Widget embebible. Alta conversi\u00f3n. Sin complicaciones.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <button
            onClick={onScrollToDemo}
            className="flex items-center gap-2 bg-terracotta text-white px-8 py-3.5 rounded-full font-body font-semibold shadow-button hover:bg-terracotta-dark hover:-translate-y-0.5 transition-all"
          >
            Ver Demo
            <ArrowRight size={18} />
          </button>
          <button className="flex items-center gap-2 border-[1.5px] border-white/40 text-white px-8 py-3.5 rounded-full font-body font-medium hover:bg-white/10 transition-all">
            <FileText size={18} />
            Documentaci\u00f3n
          </button>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-3 gap-4 max-w-xl mx-auto border-t border-white/20 pt-6">
          <div className="text-center">
            <div className="font-display text-2xl sm:text-3xl font-bold text-white mb-1">
              <AnimatedCounter target={200} suffix="+" />
            </div>
            <div className="font-body text-xs sm:text-sm text-white/70">Operadores</div>
          </div>
          <div className="text-center border-x border-white/20">
            <div className="font-display text-2xl sm:text-3xl font-bold text-white mb-1">
              <AnimatedCounter target={50} suffix="K+" />
            </div>
            <div className="font-body text-xs sm:text-sm text-white/70">Reservas</div>
          </div>
          <div className="text-center">
            <div className="font-display text-2xl sm:text-3xl font-bold text-white mb-1">
              <AnimatedCounter target={99} suffix=".9%" />
            </div>
            <div className="font-body text-xs sm:text-sm text-white/70">Uptime</div>
          </div>
        </div>
      </div>
    </section>
  );
}
