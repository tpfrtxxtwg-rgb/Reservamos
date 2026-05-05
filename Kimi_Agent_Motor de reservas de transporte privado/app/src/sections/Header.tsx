import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { List, X } from '@phosphor-icons/react';
import { useAuth } from '@/hooks/useAuth';

const navLinks = [
  { label: 'Producto', target: 'features' },
  { label: 'Características', target: 'demo' },
  { label: 'Precios', target: 'pricing' },
  { label: 'Integración', target: 'integration' },
];

export default function Header() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleClick = (target: string) => {
    if (target === 'admin') {
      navigate('/admin');
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
        <button onClick={() => navigate('/')} className="font-display text-2xl font-bold text-charcoal">
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
            onClick={() => navigate('/admin')}
            className="bg-terracotta text-white px-6 py-2.5 rounded-full font-body text-sm font-semibold shadow-button hover:bg-terracotta-dark hover:-translate-y-0.5 transition-all"
          >
            {isAuthenticated ? 'Panel Admin' : 'Panel Admin'}
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
              onClick={() => { navigate('/admin'); setMobileOpen(false); }}
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
