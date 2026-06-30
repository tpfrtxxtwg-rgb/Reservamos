import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import BookingWidget from '@/components/BookingWidget';

/**
 * EmbedWidget - Clean widget-only page for external embedding.
 *
 * Usage:
 *   - Iframe:  <iframe src="https://yoursite.com/widget/embed?key=API_KEY&lng=en" />
 *   - Direct:  https://yoursite.com/widget/embed?key=API_KEY&lng=en
 *
 * This page renders ONLY the booking widget with no header, footer,
 * or landing page chrome. It reads the API key from the ?key= query param.
 * Language can be set with ?lng=en (en|es|pt). Default: browser detection.
 */
export default function EmbedWidget() {
  const [searchParams] = useSearchParams();
  const [apiKey, setApiKey] = useState('');
  const { i18n } = useTranslation();

  useEffect(() => {
    // Support both ?key= and ?apiKey= for flexibility
    const key = searchParams.get('key') || searchParams.get('apiKey') || '';
    setApiKey(key);

    // Set language from ?lng= query param if provided
    const lang = searchParams.get('lng');
    if (lang && ['en', 'es', 'pt'].includes(lang) && i18n.language !== lang) {
      i18n.changeLanguage(lang);
    }

    // Send height to parent window for auto-resize if requested
    const sendHeight = () => {
      if (window.parent !== window) {
        const height = document.documentElement.scrollHeight;
        window.parent.postMessage(
          { type: 'reservamos-resize', height },
          '*'
        );
      }
    };

    // Send initial height and on resize
    sendHeight();
    const observer = new MutationObserver(sendHeight);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true });
    window.addEventListener('resize', sendHeight);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', sendHeight);
    };
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-[#FAFAF8] p-4">
      <div className="w-full max-w-[640px] mx-auto">
        {apiKey ? (
          <BookingWidget apiKey={apiKey} />
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-[rgba(138,130,120,0.1)] p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-[rgba(199,94,58,0.1)] flex items-center justify-center mx-auto mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#C75E3A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 16v-4"/>
                <path d="M12 8h.01"/>
              </svg>
            </div>
            <h2 className="font-display text-lg font-semibold text-charcoal mb-2">
              Missing API Key
            </h2>
            <p className="font-body text-sm text-warm-gray">
              Please provide a valid API key using the <code className="bg-sand px-1.5 py-0.5 rounded text-xs">?key=</code> query parameter.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
