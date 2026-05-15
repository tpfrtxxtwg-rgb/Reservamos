import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  Check,
  Envelope,
  EnvelopeSimple,
  Gear,
  Globe,
  Phone,
  PaperPlaneRight,
  FileText,
  Info,
  ToggleLeft,
  ToggleRight,
} from '@phosphor-icons/react';
import { trpc } from '@/providers/trpc.tsx';

interface Props {
  clientId: number;
}

export default function AdminEmailSettings({ clientId }: Props) {
  const { t } = useTranslation();
  const utils = trpc.useUtils();

  const { data: settings, isLoading } = trpc.emailSettings.get.useQuery();
  const [saveError, setSaveError] = useState<string | null>(null);

  const updateSettings = trpc.emailSettings.update.useMutation({
    onSuccess: () => {
      utils.emailSettings.get.invalidate();
      setSaved(true);
      setSaveError(null);
      setTimeout(() => setSaved(false), 2000);
    },
    onError: (err) => {
      console.error("[EmailSettings] Save failed:", err);
      setSaveError(err.message || "Failed to save settings");
    },
  });

  const [enabled, setEnabled] = useState(true);
  const [subject, setSubject] = useState('Your Reservation Confirmation');
  const [message, setMessage] = useState('Thank you for your reservation. We look forward to serving you.');
  const [pickupInstructions, setPickupInstructions] = useState('');
  const [companyPhone, setCompanyPhone] = useState('');
  const [companyWebsite, setCompanyWebsite] = useState('');
  // Email provider: only sendgrid or resend
  const [emailProvider, setEmailProvider] = useState<'sendgrid' | 'resend'>('sendgrid');
  // API keys
  const [sendgridApiKey, setSendgridApiKey] = useState('');
  const [resendApiKey, setResendApiKey] = useState('');
  // From email (required for both providers)
  const [fromEmail, setFromEmail] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (settings) {
      setEnabled(settings.enabled ?? true);
      setSubject(settings.subject || 'Your Reservation Confirmation');
      setMessage(settings.message || 'Thank you for your reservation. We look forward to serving you.');
      setPickupInstructions(settings.pickupInstructions || '');
      setCompanyPhone(settings.companyPhone || '');
      setCompanyWebsite(settings.companyWebsite || '');
      setEmailProvider((settings.emailProvider as any) === 'resend' ? 'resend' : 'sendgrid');
      setFromEmail(settings.smtpFrom || '');
      setSendgridApiKey(settings.sendgridApiKey || '');
      setResendApiKey(settings.resendApiKey || '');
    }
  }, [settings]);

  const handleSave = () => {
    updateSettings.mutate({
      enabled,
      subject,
      message,
      pickupInstructions,
      emailProvider,
      smtpFrom: fromEmail || null,
      sendgridApiKey: sendgridApiKey || null,
      resendApiKey: resendApiKey || null,
      companyPhone: companyPhone || null,
      companyWebsite: companyWebsite || null,
    });
  };

  const isConfigured = emailProvider === 'sendgrid'
    ? (sendgridApiKey && fromEmail)
    : (resendApiKey && fromEmail);

  const testSmtp = trpc.emailSettings.testSmtp.useMutation({
    onSuccess: (result) => {
      setSmtpTestResult(result);
    },
    onError: (err) => {
      setSmtpTestResult({ success: false, message: err.message });
    },
  });

  const [smtpTestResult, setSmtpTestResult] = useState<{ success: boolean; message: string } | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="font-body text-warm-gray">{t('common.loading')}...</span>
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-[rgba(199,94,58,0.1)] flex items-center justify-center">
            <EnvelopeSimple size={22} className="text-terracotta" />
          </div>
          <div>
            <h2 className="font-display text-xl font-semibold text-charcoal">{t('admin.emailSettings') || 'Email Configuration'}</h2>
            <p className="font-body text-sm text-warm-gray mt-0.5">{t('admin.emailSettingsDesc') || 'Configure confirmation emails sent to your customers'}</p>
          </div>
        </div>
      </div>

      {/* Status Banner */}
      <div className={`rounded-lg p-4 mb-6 flex items-start gap-3 ${isConfigured ? 'bg-[rgba(45,106,79,0.08)]' : 'bg-[rgba(199,140,58,0.08)]'}`}>
        <Info size={20} className={isConfigured ? 'text-[#2D6A4F] mt-0.5' : 'text-[#C78C3A] mt-0.5'} />
        <div>
          <p className={`font-body text-sm font-medium ${isConfigured ? 'text-[#2D6A4F]' : 'text-[#C78C3A]'}`}>
            {isConfigured
              ? (t('admin.emailConfigured') || `${emailProvider === 'smtp' ? 'SMTP' : emailProvider === 'sendgrid' ? 'SendGrid' : 'Resend'} is configured — confirmation emails will be sent automatically`)
              : (t('admin.emailNotConfigured') || 'Email not configured — add your email provider details below')}
          </p>
          <p className="font-body text-xs text-warm-gray mt-1">
            {t('admin.emailStatusInfo') || 'When enabled, every new booking triggers an automatic email with a PDF voucher to the customer and a notification to you.'}
          </p>
        </div>
      </div>

      {/* Enable/Disable Toggle */}
      <div className="bg-white rounded-lg shadow-sm border border-[rgba(138,130,120,0.08)] p-6 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[rgba(199,94,58,0.1)] flex items-center justify-center">
              {enabled ? <ToggleRight size={20} className="text-terracotta" /> : <ToggleLeft size={20} className="text-warm-gray" />}
            </div>
            <div>
              <h3 className="font-body text-base font-semibold text-charcoal">{t('admin.emailEnabled') || 'Send Confirmation Emails'}</h3>
              <p className="font-body text-xs text-warm-gray">{t('admin.emailEnabledDesc') || 'Automatically send confirmation emails when a booking is created'}</p>
            </div>
          </div>
          <button
            onClick={() => setEnabled(!enabled)}
            className="relative w-14 h-8 rounded-full transition-colors duration-200 flex items-center"
            style={{ backgroundColor: enabled ? '#C75E3A' : 'rgba(138,130,120,0.3)' }}
          >
            <motion.div
              className="w-6 h-6 bg-white rounded-full shadow-sm"
              animate={{ x: enabled ? 30 : 4 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            />
          </button>
        </div>
      </div>

      {/* Email Content */}
      <div className="bg-white rounded-lg shadow-sm border border-[rgba(138,130,120,0.08)] p-6 mb-4">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-8 h-8 rounded-lg bg-[rgba(199,94,58,0.1)] flex items-center justify-center">
            <FileText size={18} className="text-terracotta" />
          </div>
          <h3 className="font-body text-base font-semibold text-charcoal">{t('admin.emailContent') || 'Email Content'}</h3>
        </div>

        {/* Subject */}
        <div className="mb-5">
          <label className="font-body text-sm font-medium text-charcoal mb-2 block flex items-center gap-2">
            <Envelope size={16} className="text-terracotta" />
            {t('admin.emailSubject') || 'Email Subject'}
          </label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Your Reservation Confirmation"
            className="w-full h-11 bg-[#FAFAF8] border border-[rgba(138,130,120,0.2)] rounded-md px-3 font-body text-sm text-charcoal focus:border-terracotta outline-none transition-all"
          />
          <p className="font-body text-xs text-warm-gray mt-1">{t('admin.emailSubjectDesc') || 'The booking code will be appended automatically'}</p>
        </div>

        {/* Message */}
        <div className="mb-5">
          <label className="font-body text-sm font-medium text-charcoal mb-2 block flex items-center gap-2">
            <FileText size={16} className="text-terracotta" />
            {t('admin.emailMessage') || 'Welcome Message'}
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            placeholder="Thank you for your reservation. We look forward to serving you."
            className="w-full bg-[#FAFAF8] border border-[rgba(138,130,120,0.2)] rounded-md px-3 py-2 font-body text-sm text-charcoal focus:border-terracotta outline-none transition-all resize-none"
          />
          <p className="font-body text-xs text-warm-gray mt-1">{t('admin.emailMessageDesc') || 'This message appears at the top of the confirmation email'}</p>
        </div>

        {/* Pickup Instructions */}
        <div className="mb-2">
          <label className="font-body text-sm font-medium text-charcoal mb-2 block flex items-center gap-2">
            <Info size={16} className="text-terracotta" />
            {t('admin.pickupInstructions') || 'Pickup Instructions'}
          </label>
          <textarea
            value={pickupInstructions}
            onChange={(e) => setPickupInstructions(e.target.value)}
            rows={5}
            placeholder="Once you land, please proceed to the exit door where you will find our representative holding a sign with your name. If you cannot locate your driver, please call our emergency number."
            className="w-full bg-[#FAFAF8] border border-[rgba(138,130,120,0.2)] rounded-md px-3 py-2 font-body text-sm text-charcoal focus:border-terracotta outline-none transition-all resize-none"
          />
          <p className="font-body text-xs text-warm-gray mt-1">{t('admin.pickupInstructionsDesc') || 'Instructions for the customer on how to find their driver at the airport. Shown in both the email and the PDF voucher.'}</p>
        </div>
      </div>

      {/* Company Info */}
      <div className="bg-white rounded-lg shadow-sm border border-[rgba(138,130,120,0.08)] p-6 mb-4">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-8 h-8 rounded-lg bg-[rgba(199,94,58,0.1)] flex items-center justify-center">
            <Globe size={18} className="text-terracotta" />
          </div>
          <h3 className="font-body text-base font-semibold text-charcoal">{t('admin.companyContactInfo') || 'Company Contact Info'}</h3>
        </div>
        <p className="font-body text-xs text-warm-gray mb-4">{t('admin.companyContactDesc') || 'Shown in the PDF voucher sent to customers'}</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="font-body text-sm font-medium text-charcoal mb-2 block flex items-center gap-2">
              <Phone size={14} className="text-terracotta" />
              {t('admin.companyPhone') || 'Phone Number'}
            </label>
            <input
              type="text"
              value={companyPhone}
              onChange={(e) => setCompanyPhone(e.target.value)}
              placeholder="+1 (555) 123-4567"
              className="w-full h-11 bg-[#FAFAF8] border border-[rgba(138,130,120,0.2)] rounded-md px-3 font-body text-sm text-charcoal focus:border-terracotta outline-none transition-all"
            />
          </div>
          <div>
            <label className="font-body text-sm font-medium text-charcoal mb-2 block flex items-center gap-2">
              <Globe size={14} className="text-terracotta" />
              {t('admin.companyWebsite') || 'Website'}
            </label>
            <input
              type="text"
              value={companyWebsite}
              onChange={(e) => setCompanyWebsite(e.target.value)}
              placeholder="https://www.yourcompany.com"
              className="w-full h-11 bg-[#FAFAF8] border border-[rgba(138,130,120,0.2)] rounded-md px-3 font-body text-sm text-charcoal focus:border-terracotta outline-none transition-all"
            />
          </div>
        </div>
      </div>

      {/* Email Provider Configuration */}
      <div className="bg-white rounded-lg shadow-sm border border-[rgba(138,130,120,0.08)] p-6 mb-4">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-8 h-8 rounded-lg bg-[rgba(199,94,58,0.1)] flex items-center justify-center">
            <Gear size={18} className="text-terracotta" />
          </div>
          <h3 className="font-body text-base font-semibold text-charcoal">{t('admin.emailProvider') || 'Email Provider'}</h3>
        </div>
        <p className="font-body text-xs text-warm-gray mb-4">
          {t('admin.emailProviderDesc') || 'Choose how emails are sent. SendGrid and Resend work from Railway hosting (no port 587 needed). SMTP requires your hosting to allow outbound email.'}
        </p>

        {/* Provider Selector */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button
            onClick={() => setEmailProvider('sendgrid')}
            className={`p-3 rounded-lg border text-center transition-all ${
              emailProvider === 'sendgrid'
                ? 'border-terracotta bg-[rgba(199,94,58,0.08)]'
                : 'border-[rgba(138,130,120,0.15)] bg-[#FAFAF8] hover:border-[rgba(138,130,120,0.3)]'
            }`}
          >
            <p className={`font-body text-sm font-semibold ${emailProvider === 'sendgrid' ? 'text-terracotta' : 'text-charcoal'}`}>SendGrid</p>
            <p className="font-body text-xs text-warm-gray mt-0.5">Free 100 emails/day</p>
          </button>
          <button
            onClick={() => setEmailProvider('resend')}
            className={`p-3 rounded-lg border text-center transition-all ${
              emailProvider === 'resend'
                ? 'border-terracotta bg-[rgba(199,94,58,0.08)]'
                : 'border-[rgba(138,130,120,0.15)] bg-[#FAFAF8] hover:border-[rgba(138,130,120,0.3)]'
            }`}
          >
            <p className={`font-body text-sm font-semibold ${emailProvider === 'resend' ? 'text-terracotta' : 'text-charcoal'}`}>Resend</p>
            <p className="font-body text-xs text-warm-gray mt-0.5">Free 100 emails/day</p>
          </button>
        </div>

        {/* From Email */}
        <div className="mb-5">
          <label className="font-body text-sm font-medium text-charcoal mb-2 block flex items-center gap-2">
            <Envelope size={14} className="text-terracotta" />
            From Email Address
          </label>
          <input
            type="email"
            value={fromEmail}
            onChange={(e) => setFromEmail(e.target.value)}
            placeholder="bookings@yourcompany.com"
            className="w-full h-11 bg-[#FAFAF8] border border-[rgba(138,130,120,0.2)] rounded-md px-3 font-body text-sm text-charcoal focus:border-terracotta outline-none transition-all"
          />
          <p className="font-body text-xs text-warm-gray mt-1">This is the sender address your customers will see. Must be verified in your provider.</p>
        </div>

        {/* SendGrid Fields */}
        {emailProvider === 'sendgrid' && (
          <>
            <div className="bg-[#FAFAF8] rounded-lg p-4 mb-4">
              <p className="font-body text-xs text-warm-gray mb-3">
                <strong>1.</strong> Create a free account at <a href="https://signup.sendgrid.com" target="_blank" rel="noopener noreferrer" className="text-terracotta hover:underline">signup.sendgrid.com</a><br />
                <strong>2.</strong> Verify your sender email (Settings → Sender Authentication)<br />
                <strong>3.</strong> Create an API key (Settings → API Keys → Create API Key → Full Access)
              </p>
            </div>
            <div>
              <label className="font-body text-sm font-medium text-charcoal mb-2 block">SendGrid API Key</label>
              <input
                type="password"
                value={sendgridApiKey}
                onChange={(e) => setSendgridApiKey(e.target.value)}
                placeholder="SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                className="w-full h-11 bg-[#FAFAF8] border border-[rgba(138,130,120,0.2)] rounded-md px-3 font-body text-sm text-charcoal focus:border-terracotta outline-none transition-all"
              />
              <p className="font-body text-xs text-warm-gray mt-1">Your API key. Starts with SG.</p>
            </div>
          </>
        )}

        {/* Resend Fields */}
        {emailProvider === 'resend' && (
          <>
            <div className="bg-[#FAFAF8] rounded-lg p-4 mb-4">
              <p className="font-body text-xs text-warm-gray mb-3">
                <strong>1.</strong> Create a free account at <a href="https://resend.com/signup" target="_blank" rel="noopener noreferrer" className="text-terracotta hover:underline">resend.com/signup</a><br />
                <strong>2.</strong> Verify your domain (Domains → Add Domain)<br />
                <strong>3.</strong> Copy your API key (Settings → API Keys)
              </p>
            </div>
            <div>
              <label className="font-body text-sm font-medium text-charcoal mb-2 block">Resend API Key</label>
              <input
                type="password"
                value={resendApiKey}
                onChange={(e) => setResendApiKey(e.target.value)}
                placeholder="re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                className="w-full h-11 bg-[#FAFAF8] border border-[rgba(138,130,120,0.2)] rounded-md px-3 font-body text-sm text-charcoal focus:border-terracotta outline-none transition-all"
              />
              <p className="font-body text-xs text-warm-gray mt-1">Your API key. Starts with re_</p>
            </div>
          </>
        )}
      </div>

      {/* Error Message */}
      {saveError && (
        <div className="bg-[rgba(178,58,47,0.08)] border border-[rgba(178,58,47,0.2)] rounded-lg p-4 mb-4">
          <p className="font-body text-sm text-[#B23A2F]"><strong>Error:</strong> {saveError}</p>
          <p className="font-body text-xs text-warm-gray mt-1">
            This usually means the database table does not exist. Run <code className="bg-white px-1 rounded">npm run db:push</code> or contact support.
          </p>
        </div>
      )}

      {/* Save & Test Buttons */}
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={handleSave}
          disabled={updateSettings.isPending}
          className="flex items-center gap-2 px-6 py-3 bg-terracotta text-white rounded-lg font-body text-sm font-semibold hover:bg-terracotta-dark transition-colors disabled:opacity-50"
        >
          {updateSettings.isPending ? (
            <span>{t('common.saving') || 'Saving...'}</span>
          ) : saved ? (
            <>
              <Check size={16} weight="bold" />
              <span>{t('common.saved') || 'Saved!'}</span>
            </>
          ) : (
            <>
              <PaperPlaneRight size={16} weight="bold" />
              <span>{t('common.saveChanges') || 'Save Changes'}</span>
            </>
          )}
        </button>
        <button
          onClick={() => {
            if (emailProvider === 'sendgrid' && !sendgridApiKey) {
              setSmtpTestResult({ success: false, message: "Please enter your SendGrid API key" });
              return;
            }
            if (emailProvider === 'resend' && !resendApiKey) {
              setSmtpTestResult({ success: false, message: "Please enter your Resend API key" });
              return;
            }
            setSmtpTestResult(null);
            testSmtp.mutate({
              emailProvider,
              smtpHost: null,
              smtpPort: null,
              smtpUser: null,
              smtpPass: null,
              sendgridApiKey: sendgridApiKey || null,
              resendApiKey: resendApiKey || null,
            });
          }}
          disabled={testSmtp.isPending}
          className="flex items-center gap-2 px-4 py-3 bg-[#FAFAF8] border border-[rgba(138,130,120,0.2)] text-charcoal rounded-lg font-body text-sm font-semibold hover:border-terracotta hover:text-terracotta transition-colors disabled:opacity-50"
        >
          {testSmtp.isPending ? 'Testing...' : 'Test Connection'}
        </button>
        {saved && (
          <motion.span
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="font-body text-sm text-[#2D6A4F]"
          >
            {t('admin.settingsSaved') || 'Settings saved successfully'}
          </motion.span>
        )}
      </div>

      {/* Provider Test Result */}
      {smtpTestResult && (
        <div className={`rounded-lg p-4 mt-4 ${smtpTestResult.success ? 'bg-[rgba(45,106,79,0.08)] border border-[rgba(45,106,79,0.2)]' : 'bg-[rgba(178,58,47,0.08)] border border-[rgba(178,58,47,0.2)]'}`}>
          <p className={`font-body text-sm font-medium ${smtpTestResult.success ? 'text-[#2D6A4F]' : 'text-[#B23A2F]'}`}>
            {smtpTestResult.success
              ? `${emailProvider === 'smtp' ? 'SMTP' : emailProvider === 'sendgrid' ? 'SendGrid' : 'Resend'} Connection OK`
              : `${emailProvider === 'smtp' ? 'SMTP' : emailProvider === 'sendgrid' ? 'SendGrid' : 'Resend'} Connection Failed`}
          </p>
          <p className={`font-body text-xs mt-1 ${smtpTestResult.success ? 'text-[#2D6A4F]' : 'text-[#B23A2F]'}`}>
            {smtpTestResult.message}
          </p>
        </div>
      )}
    </div>
  );
}
