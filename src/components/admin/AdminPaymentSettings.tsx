import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { CreditCard, Check, FloppyDisk, Lightning, Warning, Wallet } from '@phosphor-icons/react';
import { trpc } from '@/providers/trpc';

export default function AdminPaymentSettings() {
  const { t } = useTranslation();
  const utils = trpc.useUtils();

  const { data: settings, isLoading } = trpc.paymentSettings.get.useQuery();
  const updateSettings = trpc.paymentSettings.update.useMutation({
    onSuccess: () => { utils.paymentSettings.get.invalidate(); setSaved(true); setTimeout(() => setSaved(false), 2000); },
  });
  const testPayment = trpc.paymentSettings.testPayment.useMutation();

  const [testMode, setTestMode] = useState(true);
  const [stripeEnabled, setStripeEnabled] = useState(false);
  const [stripeSecretKey, setStripeSecretKey] = useState('');
  const [stripePublishableKey, setStripePublishableKey] = useState('');
  const [paypalEnabled, setPaypalEnabled] = useState(false);
  const [paypalClientId, setPaypalClientId] = useState('');
  const [paypalClientSecret, setPaypalClientSecret] = useState('');
  const [acceptedMethods, setAcceptedMethods] = useState('cash');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (settings) {
      setTestMode(settings.testMode ?? true);
      setStripeEnabled(settings.stripeEnabled ?? false);
      setStripeSecretKey(settings.stripeSecretKey ?? '');
      setStripePublishableKey(settings.stripePublishableKey ?? '');
      setPaypalEnabled(settings.paypalEnabled ?? false);
      setPaypalClientId(settings.paypalClientId ?? '');
      setPaypalClientSecret(settings.paypalClientSecret ?? '');
      setAcceptedMethods(settings.acceptedMethods ?? 'cash');
    }
  }, [settings]);

  const handleSave = () => {
    updateSettings.mutate({
      testMode,
      stripeEnabled,
      stripeSecretKey: stripeSecretKey || null,
      stripePublishableKey: stripePublishableKey || null,
      paypalEnabled,
      paypalClientId: paypalClientId || null,
      paypalClientSecret: paypalClientSecret || null,
      acceptedMethods: acceptedMethods as any,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="font-body text-warm-gray">{t('common.loading')}...</span>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h2 className="font-display text-xl font-semibold text-charcoal">{t('admin.paymentSettings') || 'Payment Integrations'}</h2>
        <p className="font-body text-sm text-warm-gray mt-1">{t('admin.paymentSettingsDesc') || 'Configure PayPal and Stripe payment gateways'}</p>
      </div>

      {/* Test Mode Banner */}
      <div className={`rounded-lg p-4 mb-6 flex items-center gap-3 ${testMode ? 'bg-[rgba(199,94,58,0.08)] border border-[rgba(199,94,58,0.2)]' : 'bg-[rgba(45,106,79,0.08)] border border-[rgba(45,106,79,0.2)]'}`}>
        {testMode ? (
          <Warning size={20} className="text-terracotta flex-shrink-0" />
        ) : (
          <Check size={20} className="text-[#2D6A4F] flex-shrink-0" />
        )}
        <div className="flex-1">
          <p className={`font-body text-sm font-medium ${testMode ? 'text-terracotta' : 'text-[#2D6A4F]'}`}>
            {testMode
              ? (t('admin.testModeActive') || 'Test Mode Active — No real charges will be made')
              : (t('admin.liveModeActive') || 'Live Mode — Real payments will be processed')}
          </p>
          <p className="font-body text-xs text-warm-gray mt-0.5">
            {testMode
              ? (t('admin.testModeDesc') || 'Customers can complete bookings without being charged. Use this to test the full payment flow.')
              : (t('admin.liveModeDesc') || 'Make sure your Stripe/PayPal credentials are for live/production environment.')}
          </p>
        </div>
        <button
          onClick={() => setTestMode(!testMode)}
          className={`relative w-12 h-7 rounded-full transition-colors duration-200 flex items-center flex-shrink-0 ${testMode ? 'bg-terracotta' : 'bg-[#2D6A4F]'}`}
        >
          <motion.div
            className="w-5 h-5 bg-white rounded-full shadow-sm"
            animate={{ x: testMode ? 24 : 4 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          />
        </button>
      </div>

      {/* Accepted Payment Methods */}
      <div className="bg-white rounded-lg shadow-sm border border-[rgba(138,130,120,0.08)] p-6 mb-4">
        <h3 className="font-body text-sm font-semibold text-charcoal mb-4">{t('admin.acceptedMethods') || 'Accepted Payment Methods'}</h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            { key: 'cash', label: t('admin.methodCash') || 'Cash Only' },
            { key: 'card', label: t('admin.methodCard') || 'Credit Card (Stripe)' },
            { key: 'paypal', label: t('admin.methodPaypal') || 'PayPal' },
            { key: 'card_paypal', label: t('admin.methodCardPaypal') || 'Card + PayPal' },
            { key: 'all', label: t('admin.methodAll') || 'All Methods' },
          ].map((m) => (
            <button
              key={m.key}
              onClick={() => setAcceptedMethods(m.key)}
              className={`px-4 py-3 rounded-lg border-2 font-body text-sm font-medium transition-all text-left ${
                acceptedMethods === m.key
                  ? 'border-terracotta bg-[rgba(199,94,58,0.05)] text-terracotta'
                  : 'border-[rgba(138,130,120,0.15)] text-warm-gray hover:border-[rgba(138,130,120,0.3)]'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stripe */}
      <div className="bg-white rounded-lg shadow-sm border border-[rgba(138,130,120,0.08)] p-6 mb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[rgba(99,91,255,0.1)] flex items-center justify-center">
              <CreditCard size={18} className="text-[#635BFF]" />
            </div>
            <h3 className="font-body text-sm font-semibold text-charcoal">Stripe</h3>
          </div>
          <button
            onClick={() => setStripeEnabled(!stripeEnabled)}
            className="relative w-12 h-7 rounded-full transition-colors duration-200 flex items-center"
            style={{ backgroundColor: stripeEnabled ? '#635BFF' : 'rgba(138,130,120,0.3)' }}
          >
            <motion.div
              className="w-5 h-5 bg-white rounded-full shadow-sm"
              animate={{ x: stripeEnabled ? 24 : 4 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            />
          </button>
        </div>

        {stripeEnabled && (
          <div className="space-y-3">
            <div>
              <label className="font-body text-xs font-medium text-warm-gray uppercase tracking-wide mb-1.5 block">{t('admin.stripePublishableKey') || 'Publishable Key'}</label>
              <input
                type="password"
                value={stripePublishableKey}
                onChange={(e) => setStripePublishableKey(e.target.value)}
                placeholder="pk_live_... or pk_test_..."
                className="w-full h-11 bg-[#FAFAF8] border border-[rgba(138,130,120,0.2)] rounded-md px-3 font-body text-sm text-charcoal focus:border-[#635BFF] outline-none transition-all"
              />
            </div>
            <div>
              <label className="font-body text-xs font-medium text-warm-gray uppercase tracking-wide mb-1.5 block">{t('admin.stripeSecretKey') || 'Secret Key'}</label>
              <input
                type="password"
                value={stripeSecretKey}
                onChange={(e) => setStripeSecretKey(e.target.value)}
                placeholder="sk_live_... or sk_test_..."
                className="w-full h-11 bg-[#FAFAF8] border border-[rgba(138,130,120,0.2)] rounded-md px-3 font-body text-sm text-charcoal focus:border-[#635BFF] outline-none transition-all"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => testPayment.mutate({ provider: 'stripe' })}
                disabled={testPayment.isPending || !stripeSecretKey}
                className="flex items-center gap-1.5 px-4 py-2 border border-[rgba(138,130,120,0.2)] text-warm-gray rounded-md font-body text-sm font-medium hover:border-[#635BFF] hover:text-[#635BFF] transition-colors disabled:opacity-50"
              >
                <Lightning size={14} /> {t('admin.testConnection') || 'Test'}
              </button>
              {testPayment.isSuccess && testPayment.data?.testMode && (
                <span className="font-body text-xs text-[#2D6A4F]">{testPayment.data?.reason}</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* PayPal */}
      <div className="bg-white rounded-lg shadow-sm border border-[rgba(138,130,120,0.08)] p-6 mb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[rgba(0,69,124,0.1)] flex items-center justify-center">
              <Wallet size={18} className="text-[#00457C]" />
            </div>
            <h3 className="font-body text-sm font-semibold text-charcoal">PayPal</h3>
          </div>
          <button
            onClick={() => setPaypalEnabled(!paypalEnabled)}
            className="relative w-12 h-7 rounded-full transition-colors duration-200 flex items-center"
            style={{ backgroundColor: paypalEnabled ? '#00457C' : 'rgba(138,130,120,0.3)' }}
          >
            <motion.div
              className="w-5 h-5 bg-white rounded-full shadow-sm"
              animate={{ x: paypalEnabled ? 24 : 4 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            />
          </button>
        </div>

        {paypalEnabled && (
          <div className="space-y-3">
            <div>
              <label className="font-body text-xs font-medium text-warm-gray uppercase tracking-wide mb-1.5 block">{t('admin.paypalClientId') || 'Client ID'}</label>
              <input
                type="password"
                value={paypalClientId}
                onChange={(e) => setPaypalClientId(e.target.value)}
                placeholder="Client ID from PayPal Developer"
                className="w-full h-11 bg-[#FAFAF8] border border-[rgba(138,130,120,0.2)] rounded-md px-3 font-body text-sm text-charcoal focus:border-[#00457C] outline-none transition-all"
              />
            </div>
            <div>
              <label className="font-body text-xs font-medium text-warm-gray uppercase tracking-wide mb-1.5 block">{t('admin.paypalClientSecret') || 'Client Secret'}</label>
              <input
                type="password"
                value={paypalClientSecret}
                onChange={(e) => setPaypalClientSecret(e.target.value)}
                placeholder="Client Secret from PayPal Developer"
                className="w-full h-11 bg-[#FAFAF8] border border-[rgba(138,130,120,0.2)] rounded-md px-3 font-body text-sm text-charcoal focus:border-[#00457C] outline-none transition-all"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => testPayment.mutate({ provider: 'paypal' })}
                disabled={testPayment.isPending || !paypalClientId}
                className="flex items-center gap-1.5 px-4 py-2 border border-[rgba(138,130,120,0.2)] text-warm-gray rounded-md font-body text-sm font-medium hover:border-[#00457C] hover:text-[#00457C] transition-colors disabled:opacity-50"
              >
                <Lightning size={14} /> {t('admin.testConnection') || 'Test'}
              </button>
              {testPayment.isSuccess && testPayment.data?.testMode && (
                <span className="font-body text-xs text-[#2D6A4F]">{testPayment.data?.reason}</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Save */}
      <div className="flex items-center gap-3">
        <button onClick={handleSave} disabled={updateSettings.isPending}
          className="flex items-center gap-2 px-6 py-3 bg-terracotta text-white rounded-lg font-body text-sm font-semibold hover:bg-terracotta-dark transition-colors disabled:opacity-50">
          {updateSettings.isPending ? <span>{t('common.saving')}</span> : saved ? <><Check size={16} /> {t('common.saved')}</> : <><FloppyDisk size={16} /> {t('common.saveChanges')}</>}
        </button>
      </div>
    </div>
  );
}
