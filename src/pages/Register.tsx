import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Check, ArrowLeft, ArrowRight, ShieldCheck, Calendar, Tag, CreditCard, Sparkle } from '@phosphor-icons/react';
import { trpc } from '@/providers/trpc';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import type { Stripe } from '@stripe/stripe-js';

const ANNUAL_PRICE = 600;
const TRIAL_DAYS = 7;

interface RegisterForm {
  companyName: string;
  email: string;
  password: string;
  confirmPassword: string;
  couponCode: string;
}

function CardForm({
  form,
  discountPercent,
  onBack,
  onSuccess,
}: {
  form: RegisterForm;
  discountPercent: number;
  onBack: () => void;
  onSuccess: (data: { clientId: number; apiKey: string; trialEnd: string }) => void;
}) {
  const { t } = useTranslation();
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);

  const createSetupIntent = trpc.stripeSubscription.createSetupIntent.useMutation();
  const createSubscription = trpc.stripeSubscription.createSubscription.useMutation();

  const handleSubmit = async () => {
    if (!stripe || !elements) return;
    setError('');
    setProcessing(true);

    try {
      // Step 1: Create Stripe customer + setup intent
      const setup = await createSetupIntent.mutateAsync({
        email: form.email,
        name: form.companyName,
      });

      // Step 2: Confirm card setup
      const { setupIntent, error: setupError } = await stripe.confirmCardSetup(
        setup.clientSecret!,
        {
          payment_method: {
            card: elements.getElement(CardElement)!,
            billing_details: {
              name: form.companyName,
              email: form.email,
            },
          },
        }
      );

      if (setupError) {
        setError(setupError.message || 'Card verification failed');
        setProcessing(false);
        return;
      }

      // Step 3: Create subscription with trial
      const result = await createSubscription.mutateAsync({
        customerId: setup.customerId,
        paymentMethodId: setupIntent!.payment_method as string,
        companyName: form.companyName,
        companyEmail: form.email,
        companyPassword: form.password,
        couponCode: form.couponCode || undefined,
      });

      onSuccess({
        clientId: result.clientId,
        apiKey: result.apiKey,
        trialEnd: result.trialEnd,
      });
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const finalAmount = Math.round(ANNUAL_PRICE * (1 - discountPercent / 100) * 100) / 100;

  return (
    <div className="max-w-md mx-auto">
      <h2 className="font-display text-2xl font-bold text-charcoal mb-2 text-center">
        {t('register.paymentInfo') || 'Payment Information'}
      </h2>
      <p className="font-body text-sm text-warm-gray text-center mb-6">
        {t('register.trialDescription', { days: TRIAL_DAYS }) || `Your card will not be charged for ${TRIAL_DAYS} days.`}
      </p>

      {/* Summary */}
      <div className="bg-sand rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="font-body text-sm text-warm-gray">ReserVamos Annual</span>
          <span className="font-body text-sm font-semibold text-charcoal">${ANNUAL_PRICE} USD</span>
        </div>
        {discountPercent > 0 && (
          <div className="flex items-center justify-between mb-2">
            <span className="font-body text-sm text-[#2D6A4F]">Discount ({discountPercent}%)</span>
            <span className="font-body text-sm font-semibold text-[#2D6A4F]">-${(ANNUAL_PRICE - finalAmount).toFixed(2)}</span>
          </div>
        )}
        <div className="border-t border-[rgba(138,130,120,0.15)] pt-2 flex items-center justify-between">
          <span className="font-body text-sm font-semibold text-charcoal">Total after trial</span>
          <span className="font-display text-lg font-bold text-terracotta">${finalAmount.toFixed(2)} USD</span>
        </div>
      </div>

      {/* Card Input */}
      <div className="mb-6">
        <label className="font-body text-xs font-medium text-warm-gray uppercase tracking-wide mb-2 block">
          {t('register.cardDetails') || 'Card Details'}
        </label>
        <div className="bg-white border border-[rgba(138,130,120,0.2)] rounded-lg p-4">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  fontFamily: '"DM Sans", sans-serif',
                  color: '#3D3833',
                  '::placeholder': { color: '#8A8278' },
                },
                invalid: { color: '#B23A2F' },
              },
            }}
          />
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-[rgba(178,58,47,0.08)] border border-[rgba(178,58,47,0.2)] rounded-lg">
          <p className="font-body text-xs text-[#B23A2F]">{error}</p>
        </div>
      )}

      <div className="flex gap-3">
        <button onClick={onBack}
          className="flex-1 py-3 border border-[rgba(138,130,120,0.2)] text-warm-gray rounded-lg font-body text-sm font-medium hover:border-terracotta hover:text-terracotta transition-colors">
          <ArrowLeft size={16} className="inline mr-1" /> {t('common.back') || 'Back'}
        </button>
        <button onClick={handleSubmit} disabled={processing || !stripe}
          className="flex-[2] py-3 bg-terracotta text-white rounded-lg font-body text-sm font-semibold hover:bg-terracotta-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
          {processing ? (
            <span className="animate-pulse">{t('register.processing') || 'Processing...'}</span>
          ) : (
            <>{t('register.startTrial') || `Start ${TRIAL_DAYS}-Day Free Trial`}</>
          )}
        </button>
      </div>

      <p className="font-body text-[11px] text-warm-gray text-center mt-4 flex items-center justify-center gap-1">
        <ShieldCheck size={14} /> {t('register.securePayment') || 'Secure payment powered by Stripe'}
      </p>
    </div>
  );
}

export default function Register() {
  const { t } = useTranslation();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<RegisterForm>({
    companyName: '', email: '', password: '', confirmPassword: '', couponCode: '',
  });
  const [discountPercent, setDiscountPercent] = useState(0);
  const [couponError, setCouponError] = useState('');
  const [registered, setRegistered] = useState(false);
  const [regData, setRegData] = useState({ clientId: 0, apiKey: '', trialEnd: '' });

  // Fetch Stripe publishable key from backend (runtime, not build-time)
  const { data: stripeConfig, isLoading: configLoading } = trpc.stripeSubscription.checkConfig.useQuery();
  const stripePromise = useMemo<Promise<Stripe | null>>(() => {
    const pk = stripeConfig?.publishableKey;
    if (pk) return loadStripe(pk);
    return Promise.resolve(null);
  }, [stripeConfig?.publishableKey]);

  const validateCoupon = trpc.coupon.validate.useQuery(
    { code: form.couponCode },
    { enabled: false }
  );

  const handleApplyCoupon = async () => {
    if (!form.couponCode.trim()) return;
    setCouponError('');
    try {
      const result = await validateCoupon.refetch();
      if (result.data?.valid) {
        setDiscountPercent(result.data.discountPercent);
      } else {
        setCouponError(result.data?.reason || 'Invalid coupon');
        setDiscountPercent(0);
      }
    } catch {
      setCouponError('Could not validate coupon');
      setDiscountPercent(0);
    }
  };

  const handleRegisterSuccess = (data: { clientId: number; apiKey: string; trialEnd: string }) => {
    setRegData(data);
    setRegistered(true);
  };

  if (registered) {
    const trialEndDate = new Date(regData.trialEnd);
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-[rgba(45,106,79,0.1)] flex items-center justify-center mx-auto mb-4">
            <Sparkle size={32} className="text-[#2D6A4F]" />
          </div>
          <h1 className="font-display text-2xl font-bold text-charcoal mb-2">
            {t('register.welcome') || 'Welcome to ReserVamos!'}
          </h1>
          <p className="font-body text-sm text-warm-gray mb-6">
            {t('register.trialActive', { date: trialEndDate.toLocaleDateString() }) ||
              `Your ${TRIAL_DAYS}-day free trial is active until ${trialEndDate.toLocaleDateString()}.`}
          </p>

          <div className="bg-sand rounded-lg p-4 mb-6 text-left">
            <p className="font-body text-xs text-warm-gray mb-1">{t('register.yourApiKey') || 'Your API Key'}</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-white border border-[rgba(138,130,120,0.15)] rounded-md px-3 py-2 font-mono text-sm text-charcoal break-all">
                {regData.apiKey}
              </code>
            </div>
            <p className="font-body text-[11px] text-warm-gray mt-2">
              {t('register.apiKeyDesc') || 'Use this key to embed the booking widget on your website.'}
            </p>
          </div>

          <button
            onClick={() => window.location.href = `/login`}
            className="w-full py-3 bg-terracotta text-white rounded-lg font-body font-semibold hover:bg-terracotta-dark transition-colors"
          >
            {t('register.goToDashboard') || 'Go to Dashboard'}
          </button>
        </div>
      </div>
    );
  }

  // Show user-friendly message when Stripe is not configured
  if (configLoading) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center p-6">
        <div className="max-w-md text-center">
          <p className="font-body text-warm-gray">{t('common.loading') || 'Loading...'}</p>
        </div>
      </div>
    );
  }

  if (!stripeConfig?.configured || !stripeConfig?.publishableKey) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-[rgba(199,94,58,0.1)] flex items-center justify-center mx-auto mb-4">
            <CreditCard size={32} className="text-terracotta" />
          </div>
          <h1 className="font-display text-2xl font-bold text-charcoal mb-2">
            {t('register.paymentSetupTitle') || 'Payment Setup in Progress'}
          </h1>
          <p className="font-body text-sm text-warm-gray mb-6">
            {t('register.paymentSetupDesc') || 'We are currently configuring our secure payment system. Registration will be available shortly.'}
          </p>
          <div className="bg-white rounded-lg p-4 mb-6 border border-[rgba(138,130,120,0.1)]">
            <p className="font-mono text-xs text-warm-gray">
              {t('register.reference') || 'Reference'}: STRIPE_NOT_CONFIGURED
            </p>
          </div>
          <button onClick={() => window.location.href = '/'}
            className="w-full py-3 bg-terracotta text-white rounded-lg font-body font-semibold hover:bg-terracotta-dark transition-colors">
            {t('common.back') || 'Back to Home'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl font-bold text-charcoal tracking-tight">Reser<span className="text-terracotta">Vamos</span></h1>
          <p className="font-body text-sm text-warm-gray mt-1">{t('register.subtitle') || 'Booking Engine for Transportation Companies'}</p>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className={`flex items-center gap-2 ${s > 1 ? 'ml-2' : ''}`}>
              {s > 1 && <div className={`w-8 h-[2px] ${s <= step ? 'bg-terracotta' : 'bg-[rgba(138,130,120,0.2)]'}`} />}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-body text-sm font-semibold ${
                s === step ? 'bg-terracotta text-white' : s < step ? 'bg-[#2D6A4F] text-white' : 'bg-[rgba(138,130,120,0.15)] text-warm-gray'
              }`}>
                {s < step ? <Check size={16} /> : s}
              </div>
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* Step 1: Company Info */}
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="bg-white rounded-xl shadow-sm border border-[rgba(138,130,120,0.08)] p-6">
                <h2 className="font-display text-xl font-bold text-charcoal mb-4">
                  {t('register.companyInfo') || 'Company Information'}
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="font-body text-xs font-medium text-warm-gray uppercase tracking-wide mb-1.5 block">{t('register.companyName') || 'Company Name'}</label>
                    <input type="text" value={form.companyName} onChange={e => setForm(p => ({ ...p, companyName: e.target.value }))}
                      className="w-full h-11 bg-[#FAFAF8] border border-[rgba(138,130,120,0.2)] rounded-md px-3 font-body text-sm text-charcoal focus:border-terracotta outline-none" />
                  </div>
                  <div>
                    <label className="font-body text-xs font-medium text-warm-gray uppercase tracking-wide mb-1.5 block">{t('register.email') || 'Email'}</label>
                    <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                      className="w-full h-11 bg-[#FAFAF8] border border-[rgba(138,130,120,0.2)] rounded-md px-3 font-body text-sm text-charcoal focus:border-terracotta outline-none" />
                  </div>
                  <div>
                    <label className="font-body text-xs font-medium text-warm-gray uppercase tracking-wide mb-1.5 block">{t('register.password') || 'Password'}</label>
                    <input type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                      className="w-full h-11 bg-[#FAFAF8] border border-[rgba(138,130,120,0.2)] rounded-md px-3 font-body text-sm text-charcoal focus:border-terracotta outline-none" />
                  </div>
                  <div>
                    <label className="font-body text-xs font-medium text-warm-gray uppercase tracking-wide mb-1.5 block">{t('register.confirmPassword') || 'Confirm Password'}</label>
                    <input type="password" value={form.confirmPassword} onChange={e => setForm(p => ({ ...p, confirmPassword: e.target.value }))}
                      className="w-full h-11 bg-[#FAFAF8] border border-[rgba(138,130,120,0.2)] rounded-md px-3 font-body text-sm text-charcoal focus:border-terracotta outline-none" />
                  </div>
                </div>

                <button onClick={() => {
                  if (!form.companyName || !form.email || !form.password || form.password !== form.confirmPassword) return;
                  setStep(2);
                }} disabled={!form.companyName || !form.email || !form.password || form.password !== form.confirmPassword}
                  className="w-full mt-6 py-3 bg-terracotta text-white rounded-lg font-body font-semibold hover:bg-terracotta-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                  {t('common.next') || 'Next'} <ArrowRight size={16} />
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 2: Plan + Coupon */}
          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="bg-white rounded-xl shadow-sm border border-[rgba(138,130,120,0.08)] p-6">
                <h2 className="font-display text-xl font-bold text-charcoal mb-4">
                  {t('register.selectPlan') || 'Select Your Plan'}
                </h2>

                {/* Plan Card */}
                <div className="bg-sand rounded-lg p-5 mb-6 border-2 border-terracotta">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-body text-sm font-semibold text-charcoal">{t('register.annualPlan') || 'Annual Plan'}</h3>
                    <span className="px-2 py-1 bg-terracotta text-white rounded font-body text-[11px] font-semibold">{t('register.mostPopular') || 'Most Popular'}</span>
                  </div>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="font-display text-3xl font-bold text-charcoal">${(ANNUAL_PRICE * (1 - discountPercent / 100)).toFixed(2)}</span>
                    <span className="font-body text-sm text-warm-gray">/ {t('register.year') || 'year'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[#2D6A4F]">
                    <Calendar size={16} />
                    <span className="font-body text-xs">{t('register.trialIncluded', { days: TRIAL_DAYS }) || `${TRIAL_DAYS}-day free trial included`}</span>
                  </div>
                  {discountPercent > 0 && (
                    <p className="font-body text-xs text-[#2D6A4F] mt-1">
                      {t('register.discountApplied', { percent: discountPercent }) || `${discountPercent}% discount applied`}
                    </p>
                  )}
                </div>

                {/* Coupon */}
                <div className="mb-6">
                  <label className="font-body text-xs font-medium text-warm-gray uppercase tracking-wide mb-2 flex items-center gap-1">
                    <Tag size={14} /> {t('register.couponCode') || 'Have a coupon?'}
                  </label>
                  <div className="flex gap-2">
                    <input type="text" value={form.couponCode} onChange={e => setForm(p => ({ ...p, couponCode: e.target.value }))}
                      placeholder="WELCOME50"
                      className="flex-1 h-10 bg-[#FAFAF8] border border-[rgba(138,130,120,0.2)] rounded-md px-3 font-body text-sm text-charcoal focus:border-terracotta outline-none uppercase" />
                    <button onClick={handleApplyCoupon}
                      className="px-4 py-2 border-2 border-terracotta text-terracotta rounded-md font-body text-sm font-medium hover:bg-[rgba(199,94,58,0.05)] transition-colors">
                      {t('register.apply') || 'Apply'}
                    </button>
                  </div>
                  {couponError && <p className="font-body text-xs text-[#B23A2F] mt-1">{couponError}</p>}
                  {discountPercent > 0 && <p className="font-body text-xs text-[#2D6A4F] mt-1">{discountPercent}% discount applied!</p>}
                </div>

                <div className="flex gap-3">
                  <button onClick={() => setStep(1)}
                    className="flex-1 py-3 border border-[rgba(138,130,120,0.2)] text-warm-gray rounded-lg font-body text-sm font-medium hover:border-terracotta hover:text-terracotta transition-colors">
                    <ArrowLeft size={16} className="inline mr-1" /> {t('common.back') || 'Back'}
                  </button>
                  <button onClick={() => setStep(3)}
                    className="flex-[2] py-3 bg-terracotta text-white rounded-lg font-body font-semibold hover:bg-terracotta-dark transition-colors flex items-center justify-center gap-2">
                    {t('register.continue') || 'Continue'} <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 3: Payment */}
          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="bg-white rounded-xl shadow-sm border border-[rgba(138,130,120,0.08)] p-6">
                <Elements stripe={stripePromise}>
                  <CardForm
                    form={form}
                    discountPercent={discountPercent}
                    onBack={() => setStep(2)}
                    onSuccess={handleRegisterSuccess}
                  />
                </Elements>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <p className="text-center font-body text-xs text-warm-gray mt-6">
          {t('register.alreadyAccount') || 'Already have an account?'}{' '}
          <a href="/login" className="text-terracotta hover:underline">{t('register.login') || 'Log in'}</a>
        </p>
      </div>
    </div>
  );
}
