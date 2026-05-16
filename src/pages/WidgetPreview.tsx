import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Copy, Check, Eye, Code, Globe } from '@phosphor-icons/react';
import { trpc } from '@/providers/trpc.tsx';
import { useClientAuth } from '@/providers/ClientAuthProvider.tsx';
import BookingWidget from '@/components/BookingWidget';

export default function WidgetPreview() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { isAuthenticated, isLoading: authLoading, user } = useClientAuth();
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');

  const { data: settings, isLoading: settingsLoading } = trpc.clientSettings.get.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  const apiKey = settings?.apiKey || '';
  const isReady = !!apiKey && isAuthenticated;
  const origin = typeof window !== 'undefined' ? window.location.origin : '';

  // Embed code that clients can copy and paste into their website
  const embedCode = `<!-- ReserVamos Booking Widget -->
<div id="reservamos-widget"></div>
<script src="${origin}/widget/embed.js?key=${apiKey}" crossorigin="anonymous" async></script>
<!-- End ReserVamos Widget -->`;

  // Simple iframe embed as alternative
  const iframeCode = `<!-- ReserVamos Booking Widget (Iframe) -->
<iframe 
  src="${origin}/widget/embed?key=${apiKey}" 
  width="100%" 
  height="800" 
  frameborder="0"
  style="border-radius: 12px; box-shadow: 0 4px 24px rgba(0,0,0,0.08);"
></iframe>
<!-- End ReserVamos Widget -->`;

  const handleCopy = useCallback((text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, []);

  if (authLoading || settingsLoading) {
    return (
      <div className="min-h-screen bg-sand-light flex items-center justify-center">
        <div className="animate-pulse text-warm-gray font-body">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sand-light">
      {/* Header */}
      <header className="h-16 bg-white border-b border-[rgba(138,130,120,0.1)] flex items-center justify-between px-6 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/admin')}
            className="flex items-center gap-2 text-warm-gray hover:text-charcoal transition-colors"
          >
            <ArrowLeft size={20} />
            <span className="font-body text-sm">{t('common.back') || 'Back to Admin'}</span>
          </button>
          <div className="w-px h-6 bg-[rgba(138,130,120,0.15)]" />
          <h1 className="font-display text-lg font-semibold text-charcoal">
            {t('widgetPreview.title') || 'Widget Preview'}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-sand rounded-lg p-0.5">
            <button
              onClick={() => setActiveTab('preview')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-md font-body text-sm transition-all ${
                activeTab === 'preview'
                  ? 'bg-white text-charcoal shadow-sm'
                  : 'text-warm-gray hover:text-charcoal'
              }`}
            >
              <Eye size={16} />
              {t('widgetPreview.preview') || 'Preview'}
            </button>
            <button
              onClick={() => setActiveTab('code')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-md font-body text-sm transition-all ${
                activeTab === 'code'
                  ? 'bg-white text-charcoal shadow-sm'
                  : 'text-warm-gray hover:text-charcoal'
              }`}
            >
              <Code size={16} />
              {t('widgetPreview.embedCode') || 'Embed Code'}
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {activeTab === 'preview' ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Info Banner */}
            <div className="bg-white rounded-xl shadow-sm border border-[rgba(138,130,120,0.08)] p-5 mb-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-[rgba(199,94,58,0.1)] flex items-center justify-center flex-shrink-0">
                  <Globe size={20} className="text-[#C75E3A]" />
                </div>
                <div>
                  <h2 className="font-display text-base font-semibold text-charcoal mb-1">
                    {t('widgetPreview.howItLooks') || 'This is how your customers will see it'}
                  </h2>
                  <p className="font-body text-sm text-warm-gray">
                    {t('widgetPreview.description') || 'The booking engine below uses your configured zones, vehicles, pricing, and optional services. Customers can book directly from your website.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Widget Container */}
            <div className="bg-white rounded-xl shadow-sm border border-[rgba(138,130,120,0.08)] p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="font-body text-xs font-medium text-warm-gray uppercase tracking-wide">
                  {settings?.name || 'Your Company'} — {t('widgetPreview.bookingEngine') || 'Booking Engine'}
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-body text-xs text-warm-gray">API Key:</span>
                  <code className="font-mono text-xs bg-sand px-2 py-1 rounded text-charcoal">
                    {apiKey.slice(0, 12)}...
                  </code>
                </div>
              </div>

              {/* The actual widget - only render when apiKey is loaded */}
              <div className="border border-[rgba(138,130,120,0.08)] rounded-lg overflow-hidden">
                {isReady ? (
                  <BookingWidget apiKey={apiKey} />
                ) : (
                  <div className="flex items-center justify-center h-64 bg-white">
                    <span className="font-body text-sm text-warm-gray animate-pulse">Loading your booking engine...</span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Embed Instructions */}
            <div className="bg-white rounded-xl shadow-sm border border-[rgba(138,130,120,0.08)] p-5 mb-6">
              <h2 className="font-display text-base font-semibold text-charcoal mb-2">
                {t('widgetPreview.addToWebsite') || 'Add to Your Website'}
              </h2>
              <p className="font-body text-sm text-warm-gray mb-4">
                {t('widgetPreview.embedInstructions') || 'Copy the code below and paste it into your website HTML where you want the booking widget to appear. You can place it on any page.'}
              </p>

              {/* Method 1: Script */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-body text-sm font-semibold text-charcoal">
                    {t('widgetPreview.method1') || 'Method 1: Script Tag (Recommended)'}
                  </h3>
                  <button
                    onClick={() => handleCopy(embedCode)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#C75E3A] text-white rounded-md font-body text-xs hover:bg-[#a84d2f] transition-colors"
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    {copied ? 'Copied!' : 'Copy Code'}
                  </button>
                </div>
                <div className="bg-[#1e1e1e] rounded-lg p-4 overflow-x-auto">
                  <pre className="font-mono text-xs text-[#d4d4d4] leading-relaxed whitespace-pre">
                    {embedCode}
                  </pre>
                </div>
              </div>

              {/* Method 2: Iframe */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-body text-sm font-semibold text-charcoal">
                    {t('widgetPreview.method2') || 'Method 2: Iframe (Simplest)'}
                  </h3>
                  <button
                    onClick={() => handleCopy(iframeCode)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-charcoal text-white rounded-md font-body text-xs hover:bg-charcoal/80 transition-colors"
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    {copied ? 'Copied!' : 'Copy Code'}
                  </button>
                </div>
                <div className="bg-[#1e1e1e] rounded-lg p-4 overflow-x-auto">
                  <pre className="font-mono text-xs text-[#d4d4d4] leading-relaxed whitespace-pre">
                    {iframeCode}
                  </pre>
                </div>
              </div>
            </div>

            {/* Method 3: Direct Link */}
            <div className="bg-white rounded-xl shadow-sm border border-[rgba(138,130,120,0.08)] p-5">
              <h3 className="font-body text-sm font-semibold text-charcoal mb-2">
                {t('widgetPreview.method3') || 'Method 3: Direct Booking Link'}
              </h3>
              <p className="font-body text-sm text-warm-gray mb-3">
                {t('widgetPreview.directLinkDesc') || 'Share this link directly with customers via email, WhatsApp, or social media. Opens a clean widget-only page.'}
              </p>
              <div className="flex items-center gap-3">
                <code className="flex-1 font-mono text-xs bg-sand px-3 py-2.5 rounded-md text-charcoal truncate">
                  {origin}/?key={apiKey}
                </code>
                <button
                  onClick={() => handleCopy(`${origin}/?key=${apiKey}`)}
                  className="flex items-center gap-1.5 px-4 py-2.5 border border-[rgba(138,130,120,0.2)] rounded-md font-body text-sm text-charcoal hover:bg-sand transition-colors"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
