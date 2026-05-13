import { useState, useCallback } from 'react';
import Header from '@/sections/Header';
import Hero from '@/sections/Hero';
import DemoWidget from '@/sections/DemoWidget';
import Features from '@/sections/Features';
import Pricing from '@/sections/Pricing';
import IntegrationCTA from '@/sections/IntegrationCTA';
import Footer from '@/sections/Footer';
import AdminPanel from '@/sections/AdminPanel';

export default function App() {
  const [page, setPage] = useState<'landing' | 'admin'>('landing');

  const scrollToDemo = useCallback(() => {
    const el = document.getElementById('demo');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  }, []);

  if (page === 'admin') {
    return <AdminPanel onBack={() => setPage('landing')} />;
  }

  return (
    <div className="min-h-screen bg-sand-light">
      <Header onNavigate={(target) => target === 'admin' ? setPage('admin') : undefined} />
      <Hero onScrollToDemo={scrollToDemo} />
      <DemoWidget />
      <Features />
      <Pricing />
      <IntegrationCTA />
      <Footer />
    </div>
  );
}
