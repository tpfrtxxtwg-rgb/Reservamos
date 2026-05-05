import { useState, useEffect } from 'react';
import { List, X } from '@phosphor-icons/react';

interface HeaderProps {
  onNavigate: (page: string) => void;
}

const navLinks = [
  { label: 'Producto', target: 'features' },
  { label: 'Caracter\u00edsticas', target: 'demo' },
  { label: 'Precios', target: 'pricing' },
  { label: 'Integraci\u00f3n', target: 'integration' },
];

export default function Header({ onNavigate }: HeaderProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleClick = (target: string) => {
    if (target === 'admin') {
      onNavigate('admin');
    } else {
      const el = document.getElementById(target);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
    setMobileOpen(false);
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 h-16 flex items-center transition-all duration-300 ${
        scrolled ? 'bg-[rgba(245,239,230,0.9)] backdrop-blur-md shadow-sm' : 'bg-transparent'
      }`}
    >
      <div className="w-full max-w-6xl mx-auto px-6 flex items-center justify-between">
        <button onClick={() => onNavigate('landing')} className="font-display text-2xl font-bold text-charcoal">
          ReserVamos
        </button>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map(link => (
            <button
              key={link.target}
              onClick={() => handleClick(link.target)}
              className="font-body text-sm font-medium text-charcoal-light hover:text-charcoal transition-colors"
            >
              {link.label}
            </button>
          ))}
          <button
            onClick={() => onNavigate('admin')}
            className="bg-terracotta text-white px-6 py-2.5 rounded-full font-body text-sm font-semibold shadow-button hover:bg-terracotta-dark hover:-translate-y-0.5 transition-all"
          >
            Panel Admin
          </button>
        </nav>

        {/* Mobile Toggle */}
        <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden text-charcoal">
          {mobileOpen ? <X size={24} /> : <List size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="absolute top-16 left-0 right-0 bg-[rgba(245,239,230,0.98)] backdrop-blur-md border-t border-[rgba(138,130,120,0.1)] p-6 md:hidden shadow-lg">
          <nav className="flex flex-col gap-4">
            {navLinks.map(link => (
              <button
                key={link.target}
                onClick={() => handleClick(link.target)}
                className="font-body text-base font-medium text-charcoal-light hover:text-charcoal text-left transition-colors"
              >
                {link.label}
              </button>
            ))}
            <button
              onClick={() => handleClick('admin')}
              className="bg-terracotta text-white px-6 py-3 rounded-full font-body text-sm font-semibold shadow-button text-center mt-2"
            >
              Panel Admin
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}
