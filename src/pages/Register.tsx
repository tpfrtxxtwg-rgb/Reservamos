import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '../hooks/useTranslation';
import {
  Check, ArrowLeft, ArrowRight, ShieldCheck, Calendar, Tag,
  Sparkle, Eye, EyeSlash, Lock, Copy, CheckCircle, X,
  Warning, ArrowCounterClockwise
} from '@phosphor-icons/react';
import { trpc } from '@/providers/trpc';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

const ANNUAL_PRICE = 6000; // $6,000 MXN annual
const TRIAL_DAYS = 7;

const STRIPE_PK = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '';
const stripePromise = STRIPE_PK ? loadStripe(STRIPE_PK) : null;

// --- Helpers ---

/** Simple interpolation: replaces {key} in translation string */
function interpolate(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => String(vars[key] ?? ''));
}

interface RegisterForm {
  companyName: string;
  email: string;
  password: string;
  confirmPassword: string;
  couponCode: string;
}

interface FormErrors {
  companyName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  terms?: string;
}

function getPasswordStrength(password: string): { score: number; label: string; color: string; width: string } {
  if (!password) return { score: 0, label: '', color: '', width: '0%' };
  const hasLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const met = [hasLength, hasUpper, hasNumber, hasSpecial].filter(Boolean).length;

  if (password.length < 6) return { score: 1, label: 'register.weak', color: 'bg-[#B23A2F]', width: '25%' };
  if (met <= 1) return { score: 1, label: 'register.weak', color: 'bg-[#B23A2F]', width: '25%' };
  if (met === 2) return { score: 2, label: 'register.fair', color: 'bg-[#E89005]', width: '50%' };
  if (met === 3) return { score: 3, label: 'register.good', color: 'bg-[#C4A35A]', width: '75%' };
  return { score: 4, label: 'register.strong', color: 'bg-[#2D6A4F]', width: '100%' };
}

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// --- Card Form (Step 3) ---

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
  const { t, lang } = useTranslation();
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);

  const createSetupIntent = trpc.stripeSubscription.createSetupIntent.useMutation();
  const createSubscription = trpc.stripeSubscription.createSubscription.useMutation();

  const finalAmount = Math.round(ANNUAL_PRICE * (1 - discountPercent / 100) * 100) / 100;

  const handleSubmit = async () => {
    if (!stripe || !elements) return;
    setError('');
    setProcessing(true);

    try {
      const setup = await createSetupIntent.mutateAsync({
        email: form.email,
        name: form.companyName,
      });

      const { setupIntent, error: setupError } = await stripe.confirmCardSetup(
        setup.clientSecret!,
        {
          payment_method: {
            card: elements.getElement(CardElement)!,
            billing_details: { name: form.companyName, email: form.email },
          },
        }
      );

      if (setupError) {
        setError(setupError.message || 'Card verification failed');
        setProcessing(false);
        return;
      }

      const result = await createSubscription.mutateAsync({
        customerId: setup.customerId,
        paymentMethodId: setupIntent!.payment_method as string,
        companyName: form.companyName,
        companyEmail: form.email,
        companyPassword: form.password,
        couponCode: form.couponCode || undefined,
        lang: lang || 'en',
      });

      onSuccess({ clientId: result.clientId, apiKey: result.apiKey, trialEnd: result.trialEnd });
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <h2 className="font-display text-2xl font-bold text-charcoal mb-2 text-center">
        {t('register.paymentInfo') || 'Payment Information'}
      </h2>
      <p className="font-body text-sm text-warm-gray text-center mb-6">
        {interpolate(t('register.trialDescription') || 'Your card will not be charged for {days} days.', { days: TRIAL_DAYS })}
      </p>

      {/* Summary */}
      <div className="bg-sand rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="font-body text-sm text-warm-gray">ReserVamos Anual</span>
          <span className="font-body text-sm font-semibold text-charcoal">${ANNUAL_PRICE} MXN</span>
        </div>
        {discountPercent > 0 && (
          <div className="flex items-center justify-between mb-2">
            <span className="font-body text-sm text-[#2D6A4F]">Discount ({discountPercent}%)</span>
            <span className="font-body text-sm font-semibold text-[#2D6A4F]">-${(ANNUAL_PRICE - finalAmount).toFixed(2)}</span>
          </div>
        )}
        <div className="border-t border-[rgba(138,130,120,0.15)] pt-2 flex items-center justify-between">
          <span className="font-body text-sm font-semibold text-charcoal">Total after trial</span>
          <span className="font-display text-lg font-bold text-terracotta">${finalAmount.toFixed(2)} MXN</span>
        </div>
      </div>

      {/* Card Input */}
      <div className="mb-4">
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

      {/* Security badges */}
      <div className="flex items-center justify-center gap-4 mb-6">
        <div className="flex items-center gap-1.5">
          <Lock size={14} className="text-[#2D6A4F]" />
          <span className="font-body text-[11px] text-[#2D6A4F] font-medium">{t('register.sslSecure') || 'SSL Secure'}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <ShieldCheck size={14} className="text-[#2D6A4F]" />
          <span className="font-body text-[11px] text-[#2D6A4F] font-medium">{t('register.pciCompliant') || 'PCI Compliant'}</span>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-[rgba(178,58,47,0.08)] border border-[rgba(178,58,47,0.2)] rounded-lg flex items-start gap-2">
          <X size={16} className="text-[#B23A2F] flex-shrink-0 mt-0.5" />
          <p className="font-body text-xs text-[#B23A2F]">{error}</p>
        </div>
      )}

      <div className="flex gap-3">
        <button onClick={onBack}
          className="flex-1 py-3 border border-[rgba(138,130,120,0.2)] text-warm-gray rounded-lg font-body text-sm font-medium hover:border-terracotta hover:text-terracotta transition-colors flex items-center justify-center gap-1">
          <ArrowLeft size={16} /> {t('common.back') || 'Back'}
        </button>
        <button onClick={handleSubmit} disabled={processing || !stripe}
          className="flex-[2] py-3 bg-terracotta text-white rounded-lg font-body text-sm font-semibold hover:bg-terracotta-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
          {processing ? (
            <span className="animate-pulse">{t('register.processing') || 'Processing...'}</span>
          ) : (
            <>{t('register.startTrial')?.replace('{days}', String(TRIAL_DAYS)) || `Start ${TRIAL_DAYS}-Day Free Trial`}</>
          )}
        </button>
      </div>

      <p className="font-body text-[11px] text-warm-gray text-center mt-4 flex items-center justify-center gap-1">
        <ShieldCheck size={14} /> {t('register.securePayment') || 'Secure payment powered by Stripe'}
      </p>
    </div>
  );
}

// --- Main Register Component ---

export default function Register() {
  const { t } = useTranslation();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<RegisterForm>({
    companyName: '', email: '', password: '', confirmPassword: '', couponCode: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [couponError, setCouponError] = useState('');
  const [registered, setRegistered] = useState(false);
  const [regData, setRegData] = useState({ clientId: 0, apiKey: '', trialEnd: '' });
  const [copied, setCopied] = useState(false);

  const validateCoupon = trpc.coupon.validate.useQuery(
    { code: form.couponCode },
    { enabled: false }
  );

  // Password strength
  const strength = getPasswordStrength(form.password);
  const hasLength = form.password.length >= 8;
  const hasUpper = /[A-Z]/.test(form.password);
  const hasNumber = /[0-9]/.test(form.password);

  const validateStep1 = useCallback((): boolean => {
    const newErrors: FormErrors = {};

    if (!form.companyName.trim()) {
      newErrors.companyName = t('register.requiredField') || 'This field is required';
    }
    if (!form.email.trim()) {
      newErrors.email = t('register.requiredField') || 'This field is required';
    } else if (!validateEmail(form.email)) {
      newErrors.email = t('register.invalidEmail') || 'Please enter a valid email address';
    }
    if (!form.password) {
      newErrors.password = t('register.requiredField') || 'This field is required';
    } else {
      if (form.password.length < 8) {
        newErrors.password = t('register.passwordMinLength') || 'At least 8 characters';
      }
    }
    if (!form.confirmPassword) {
      newErrors.confirmPassword = t('register.requiredField') || 'This field is required';
    } else if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = t('register.passwordMismatch') || 'Passwords do not match';
    }
    if (!acceptedTerms) {
      newErrors.terms = t('register.pleaseAcceptTerms') || 'You must accept the terms to continue';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [form, acceptedTerms, t]);

  const handleNext = () => {
    if (validateStep1()) {
      setStep(2);
    }
  };

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

  const handleCopyApiKey = () => {
    navigator.clipboard.writeText(regData.apiKey).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // --- Success Screen ---
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
            {interpolate(
              t('register.trialActive') || 'Your {days}-day free trial is active until {date}.',
              { days: TRIAL_DAYS, date: trialEndDate.toLocaleDateString() }
            )}
          </p>

          <div className="bg-sand rounded-lg p-4 mb-6 text-left">
            <p className="font-body text-xs text-warm-gray mb-1">{t('register.yourApiKey') || 'Your API Key'}</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-white border border-[rgba(138,130,120,0.15)] rounded-md px-3 py-2 font-mono text-sm text-charcoal break-all">
                {regData.apiKey}
              </code>
              <button
                onClick={handleCopyApiKey}
                className="flex-shrink-0 p-2 rounded-md border border-[rgba(138,130,120,0.2)] hover:border-terracotta hover:text-terracotta transition-colors"
                title={t('register.copy') || 'Copy'}
              >
                {copied ? <CheckCircle size={18} className="text-[#2D6A4F]" /> : <Copy size={18} />}
              </button>
            </div>
            <p className="font-body text-[11px] text-warm-gray mt-2">
              {t('register.apiKeyDesc') || 'Use this key to embed the booking widget on your website.'}
            </p>
            {copied && (
              <p className="font-body text-[11px] text-[#2D6A4F] mt-1 font-medium">
                {t('register.copied') || 'Copied!'}
              </p>
            )}
          </div>

          <button
            onClick={() => window.location.href = '/login'}
            className="w-full py-3 bg-terracotta text-white rounded-lg font-body font-semibold hover:bg-terracotta-dark transition-colors"
          >
            {t('register.goToDashboard') || 'Go to Dashboard'}
          </button>
        </div>
      </div>
    );
  }

  // --- Stripe not configured ---
  if (!stripePromise) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          {/* Logo */}
          <div className="mb-8">
            <h1 className="font-display text-3xl font-bold text-charcoal tracking-tight">Reser<span className="text-terracotta">Vamos</span></h1>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-[rgba(138,130,120,0.08)] p-8">
            <div className="w-14 h-14 rounded-full bg-[rgba(199,94,58,0.1)] flex items-center justify-center mx-auto mb-4">
              <Warning size={28} className="text-terracotta" />
            </div>

            <h2 className="font-display text-xl font-bold text-charcoal mb-2">
              Payment Setup in Progress
            </h2>

            <p className="font-body text-sm text-warm-gray mb-2">
              We are currently configuring our secure payment system. Registration will be available shortly.
            </p>

            <p className="font-body text-xs text-warm-gray/70 mb-6">
              Reference: <code className="font-mono text-[10px] bg-sand px-1.5 py-0.5 rounded">STRIPE_PK_MISSING</code>
            </p>

            <a
              href="https://wa.me/526243551663?text=Hi!%20I%20want%20to%20register%20for%20ReserVamos%20but%20payments%20are%20not%20configured.%20Can%20you%20help%20me?"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-terracotta text-white px-6 py-3 rounded-full font-body font-semibold text-sm hover:bg-terracotta-dark transition-colors mb-3"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              Contact us on WhatsApp
            </a>

            <div className="mt-2">
              <a href="/" className="inline-flex items-center gap-1 font-body text-xs text-warm-gray hover:text-terracotta transition-colors">
                <ArrowCounterClockwise size={14} /> Back to homepage
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- Main Register Form ---
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
          {/* ===== Step 1: Company Info ===== */}
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="bg-white rounded-xl shadow-sm border border-[rgba(138,130,120,0.08)] p-6">
                <h2 className="font-display text-xl font-bold text-charcoal mb-4">
                  {t('register.companyInfo') || 'Company Information'}
                </h2>

                <div className="space-y-4">
                  {/* Company Name */}
                  <div>
                    <label className="font-body text-xs font-medium text-warm-gray uppercase tracking-wide mb-1.5 block">
                      {t('register.companyName') || 'Company Name'}
                    </label>
                    <input
                      type="text"
                      value={form.companyName}
                      onChange={e => { setForm(p => ({ ...p, companyName: e.target.value })); if (errors.companyName) setErrors(p => ({ ...p, companyName: undefined })); }}
                      placeholder={t('register.enterCompanyName') || 'Enter your company name'}
                      className={`w-full h-11 bg-[#FAFAF8] border rounded-md px-3 font-body text-sm text-charcoal outline-none transition-colors ${
                        errors.companyName ? 'border-[#B23A2F] focus:border-[#B23A2F]' : 'border-[rgba(138,130,120,0.2)] focus:border-terracotta'
                      }`}
                    />
                    {errors.companyName && (
                      <p className="font-body text-[11px] text-[#B23A2F] mt-1 flex items-center gap-1"><X size={12} />{errors.companyName}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="font-body text-xs font-medium text-warm-gray uppercase tracking-wide mb-1.5 block">
                      {t('register.email') || 'Email'}
                    </label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={e => { setForm(p => ({ ...p, email: e.target.value })); if (errors.email) setErrors(p => ({ ...p, email: undefined })); }}
                      placeholder={t('register.enterEmail') || 'Enter your email'}
                      className={`w-full h-11 bg-[#FAFAF8] border rounded-md px-3 font-body text-sm text-charcoal outline-none transition-colors ${
                        errors.email ? 'border-[#B23A2F] focus:border-[#B23A2F]' : 'border-[rgba(138,130,120,0.2)] focus:border-terracotta'
                      }`}
                    />
                    {errors.email && (
                      <p className="font-body text-[11px] text-[#B23A2F] mt-1 flex items-center gap-1"><X size={12} />{errors.email}</p>
                    )}
                  </div>

                  {/* Password */}
                  <div>
                    <label className="font-body text-xs font-medium text-warm-gray uppercase tracking-wide mb-1.5 block">
                      {t('register.password') || 'Password'}
                    </label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-gray pointer-events-none" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={form.password}
                        onChange={e => { setForm(p => ({ ...p, password: e.target.value })); if (errors.password) setErrors(p => ({ ...p, password: undefined })); }}
                        placeholder={t('register.enterPassword') || 'Enter a password'}
                        className={`w-full h-11 bg-[#FAFAF8] border rounded-md pl-10 pr-10 font-body text-sm text-charcoal outline-none transition-colors ${
                          errors.password ? 'border-[#B23A2F] focus:border-[#B23A2F]' : 'border-[rgba(138,130,120,0.2)] focus:border-terracotta'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-warm-gray hover:text-charcoal transition-colors"
                        title={showPassword ? (t('register.hidePassword') || 'Hide password') : (t('register.showPassword') || 'Show password')}
                      >
                        {showPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="font-body text-[11px] text-[#B23A2F] mt-1 flex items-center gap-1"><X size={12} />{errors.password}</p>
                    )}

                    {/* Password strength bar */}
                    {form.password && (
                      <div className="mt-2">
                        <div className="h-1.5 bg-[rgba(138,130,120,0.15)] rounded-full overflow-hidden mb-1">
                          <div className={`h-full ${strength.color} transition-all duration-300 rounded-full`} style={{ width: strength.width }} />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className={`font-body text-[11px] font-medium ${strength.score >= 3 ? 'text-[#2D6A4F]' : strength.score >= 2 ? 'text-[#E89005]' : 'text-[#B23A2F]'}`}>
                            {t(strength.label) || strength.label.replace('register.', '')}
                          </span>
                        </div>
                        {/* Requirements checklist */}
                        <div className="mt-1.5 space-y-0.5">
                          <div className="flex items-center gap-1">
                            {hasLength ? <CheckCircle size={12} className="text-[#2D6A4F]" /> : <div className="w-3 h-3 rounded-full border border-[rgba(138,130,120,0.3)]" />}
                            <span className={`font-body text-[11px] ${hasLength ? 'text-[#2D6A4F]' : 'text-warm-gray'}`}>{t('register.passwordMinLength') || 'At least 8 characters'}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            {hasUpper ? <CheckCircle size={12} className="text-[#2D6A4F]" /> : <div className="w-3 h-3 rounded-full border border-[rgba(138,130,120,0.3)]" />}
                            <span className={`font-body text-[11px] ${hasUpper ? 'text-[#2D6A4F]' : 'text-warm-gray'}`}>{t('register.passwordUppercase') || 'One uppercase letter'}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            {hasNumber ? <CheckCircle size={12} className="text-[#2D6A4F]" /> : <div className="w-3 h-3 rounded-full border border-[rgba(138,130,120,0.3)]" />}
                            <span className={`font-body text-[11px] ${hasNumber ? 'text-[#2D6A4F]' : 'text-warm-gray'}`}>{t('register.passwordNumber') || 'One number'}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="font-body text-xs font-medium text-warm-gray uppercase tracking-wide mb-1.5 block">
                      {t('register.confirmPassword') || 'Confirm Password'}
                    </label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-gray pointer-events-none" />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={form.confirmPassword}
                        onChange={e => { setForm(p => ({ ...p, confirmPassword: e.target.value })); if (errors.confirmPassword) setErrors(p => ({ ...p, confirmPassword: undefined })); }}
                        placeholder={t('register.confirmYourPassword') || 'Confirm your password'}
                        className={`w-full h-11 bg-[#FAFAF8] border rounded-md pl-10 pr-10 font-body text-sm text-charcoal outline-none transition-colors ${
                          errors.confirmPassword ? 'border-[#B23A2F] focus:border-[#B23A2F]' : 'border-[rgba(138,130,120,0.2)] focus:border-terracotta'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-warm-gray hover:text-charcoal transition-colors"
                        title={showConfirmPassword ? (t('register.hidePassword') || 'Hide password') : (t('register.showPassword') || 'Show password')}
                      >
                        {showConfirmPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="font-body text-[11px] text-[#B23A2F] mt-1 flex items-center gap-1"><X size={12} />{errors.confirmPassword}</p>
                    )}
                  </div>

                  {/* Terms Checkbox */}
                  <div className="pt-1">
                    <label className="flex items-start gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={acceptedTerms}
                        onChange={e => { setAcceptedTerms(e.target.checked); if (errors.terms) setErrors(p => ({ ...p, terms: undefined })); }}
                        className="mt-0.5 w-4 h-4 rounded border-[rgba(138,130,120,0.3)] text-terracotta focus:ring-terracotta accent-terracotta"
                      />
                      <span className="font-body text-xs text-warm-gray leading-relaxed">
                        {t('register.acceptTerms') || 'I accept the'}{' '}
                        <a href="#" className="text-terracotta hover:underline font-medium">{t('register.termsOfService') || 'Terms of Service'}</a>{' '}
                        {t('register.and') || 'and'}{' '}
                        <a href="#" className="text-terracotta hover:underline font-medium">{t('register.privacyPolicy') || 'Privacy Policy'}</a>
                      </span>
                    </label>
                    {errors.terms && (
                      <p className="font-body text-[11px] text-[#B23A2F] mt-1 flex items-center gap-1"><X size={12} />{errors.terms}</p>
                    )}
                  </div>
                </div>

                <button
                  onClick={handleNext}
                  className="w-full mt-6 py-3 bg-terracotta text-white rounded-lg font-body font-semibold hover:bg-terracotta-dark transition-colors flex items-center justify-center gap-2"
                >
                  {t('common.next') || 'Next'} <ArrowRight size={16} />
                </button>
              </div>
            </motion.div>
          )}

          {/* ===== Step 2: Plan + Coupon ===== */}
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
                    <span className="font-body text-xs">{interpolate(t('register.trialIncluded') || '{days}-day free trial included', { days: TRIAL_DAYS })}</span>
                  </div>
                  {discountPercent > 0 && (
                    <p className="font-body text-xs text-[#2D6A4F] mt-1">
                      {interpolate(t('register.discountApplied') || '{percent}% discount applied', { percent: discountPercent })}
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
                    className="flex-1 py-3 border border-[rgba(138,130,120,0.2)] text-warm-gray rounded-lg font-body text-sm font-medium hover:border-terracotta hover:text-terracotta transition-colors flex items-center justify-center gap-1">
                    <ArrowLeft size={16} /> {t('common.back') || 'Back'}
                  </button>
                  <button onClick={() => setStep(3)}
                    className="flex-[2] py-3 bg-terracotta text-white rounded-lg font-body font-semibold hover:bg-terracotta-dark transition-colors flex items-center justify-center gap-2">
                    {t('register.continue') || 'Continue'} <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* ===== Step 3: Payment ===== */}
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

        {/* Footer link to login */}
        <p className="text-center font-body text-xs text-warm-gray mt-6">
          {t('register.alreadyAccount') || 'Already have an account?'}{' '}
          <a href="/login" className="text-terracotta hover:underline">{t('register.login') || 'Log in'}</a>
        </p>
      </div>
    </div>
  );
}
