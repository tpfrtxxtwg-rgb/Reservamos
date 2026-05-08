import { useCallback } from 'react';
import Header from '@/sections/Header';
import Hero from '@/sections/Hero';
import DemoWidget from '@/sections/DemoWidget';
import Features from '@/sections/Features';
import Pricing from '@/sections/Pricing';
import IntegrationCTA from '@/sections/IntegrationCTA';
import Footer from '@/sections/Footer';

export default function LandingPage() {
  const scrollToDemo = useCallback(() => {
    const el = document.getElementById('demo');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  }, []);

  return (
    <div className="min-h-screen bg-sand-light">
      <Header />
      <Hero onScrollToDemo={scrollToDemo} />
      <DemoWidget />
      <Features />
      <Pricing />
      <IntegrationCTA />
      <Footer />
    </div>
  );
}
