import { useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import Header from '@/sections/Header';
import Hero from '@/sections/Hero';
import DemoWidget from '@/sections/DemoWidget';
import Features from '@/sections/Features';
import Pricing from '@/sections/Pricing';
import IntegrationCTA from '@/sections/IntegrationCTA';
import Footer from '@/sections/Footer';
import BookingWidget from '@/components/BookingWidget';

/**
 * LandingPage - Main marketing page.
 *
 * Supports two modes:
 * 1. Default: Full landing page with marketing sections
 * 2. Direct booking: If ?apiKey= or ?key= is provided, shows only
 *    the booking widget (for direct links shared via email/WhatsApp)
 */
export default function LandingPage() {
  const [searchParams] = useSearchParams();
  const { i18n } = useTranslation();
  const apiKey = searchParams.get('apiKey') || searchParams.get('key') || '';

  // Set language from ?lng= query param if provided
  useEffect(() => {
    const lang = searchParams.get('lng');
    if (lang && ['en', 'es', 'pt'].includes(lang) && i18n.language !== lang) {
      i18n.changeLanguage(lang);
    }
  }, [searchParams, i18n]);

  const scrollToDemo = useCallback(() => {
    const el = document.getElementById('demo');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Mode 2: Direct booking link (?apiKey=...)
  // Show only the widget, no marketing content
  if (apiKey) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex items-start justify-center p-4">
        <div className="w-full max-w-[420px]">
          <BookingWidget apiKey={apiKey} />
        </div>
      </div>
    );
  }

  // Mode 1: Full landing page
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
