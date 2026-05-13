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
  const updateSettings = trpc.emailSettings.update.useMutation({
    onSuccess: () => {
      utils.emailSettings.get.invalidate();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  const [enabled, setEnabled] = useState(true);
  const [subject, setSubject] = useState('Your Reservation Confirmation');
  const [message, setMessage] = useState('Thank you for your reservation. We look forward to serving you.');
  const [pickupInstructions, setPickupInstructions] = useState('');
  const [companyPhone, setCompanyPhone] = useState('');
  const [companyWebsite, setCompanyWebsite] = useState('');
  const [smtpHost, setSmtpHost] = useState('');
  const [smtpPort, setSmtpPort] = useState(587);
  const [smtpUser, setSmtpUser] = useState('');
  const [smtpPass, setSmtpPass] = useState('');
  const [smtpFrom, setSmtpFrom] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (settings) {
      setEnabled(settings.enabled ?? true);
      setSubject(settings.subject || 'Your Reservation Confirmation');
      setMessage(settings.message || 'Thank you for your reservation. We look forward to serving you.');
      setPickupInstructions(settings.pickupInstructions || '');
      setCompanyPhone(settings.companyPhone || '');
      setCompanyWebsite(settings.companyWebsite || '');
      setSmtpHost(settings.smtpHost || '');
      setSmtpPort(settings.smtpPort || 587);
      setSmtpUser(settings.smtpUser || '');
      setSmtpPass(settings.smtpPass || '');
      setSmtpFrom(settings.smtpFrom || '');
    }
  }, [settings]);

  const handleSave = () => {
    updateSettings.mutate({
      enabled,
      subject,
      message,
      pickupInstructions,
      companyPhone: companyPhone || null,
      companyWebsite: companyWebsite || null,
      smtpHost: smtpHost || null,
      smtpPort: smtpPort || null,
      smtpUser: smtpUser || null,
      smtpPass: smtpPass || null,
      smtpFrom: smtpFrom || null,
    });
  };

  const isConfigured = smtpHost && smtpUser && smtpPass && smtpFrom;

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
              ? (t('admin.emailConfigured') || 'SMTP is configured — confirmation emails will be sent automatically')
              : (t('admin.emailNotConfigured') || 'SMTP not configured — add your email server details below')}
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

      {/* SMTP Configuration */}
      <div className="bg-white rounded-lg shadow-sm border border-[rgba(138,130,120,0.08)] p-6 mb-4">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-8 h-8 rounded-lg bg-[rgba(199,94,58,0.1)] flex items-center justify-center">
            <Gear size={18} className="text-terracotta" />
          </div>
          <h3 className="font-body text-base font-semibold text-charcoal">{t('admin.smtpSettings') || 'SMTP Server Settings'}</h3>
        </div>
        <p className="font-body text-xs text-warm-gray mb-4">
          {t('admin.smtpDesc') || 'Configure your email server. We recommend using SendGrid, Mailgun, AWS SES, or Gmail SMTP.'}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="font-body text-sm font-medium text-charcoal mb-2 block">{t('admin.smtpHost') || 'SMTP Host'}</label>
            <input
              type="text"
              value={smtpHost}
              onChange={(e) => setSmtpHost(e.target.value)}
              placeholder="smtp.gmail.com"
              className="w-full h-11 bg-[#FAFAF8] border border-[rgba(138,130,120,0.2)] rounded-md px-3 font-body text-sm text-charcoal focus:border-terracotta outline-none transition-all"
            />
          </div>
          <div>
            <label className="font-body text-sm font-medium text-charcoal mb-2 block">{t('admin.smtpPort') || 'SMTP Port'}</label>
            <input
              type="number"
              value={smtpPort}
              onChange={(e) => setSmtpPort(parseInt(e.target.value) || 587)}
              placeholder="587"
              className="w-full h-11 bg-[#FAFAF8] border border-[rgba(138,130,120,0.2)] rounded-md px-3 font-body text-sm text-charcoal focus:border-terracotta outline-none transition-all"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="font-body text-sm font-medium text-charcoal mb-2 block">{t('admin.smtpUser') || 'SMTP Username'}</label>
            <input
              type="text"
              value={smtpUser}
              onChange={(e) => setSmtpUser(e.target.value)}
              placeholder="your-email@gmail.com"
              className="w-full h-11 bg-[#FAFAF8] border border-[rgba(138,130,120,0.2)] rounded-md px-3 font-body text-sm text-charcoal focus:border-terracotta outline-none transition-all"
            />
          </div>
          <div>
            <label className="font-body text-sm font-medium text-charcoal mb-2 block">{t('admin.smtpPass') || 'SMTP Password'}</label>
            <input
              type="password"
              value={smtpPass}
              onChange={(e) => setSmtpPass(e.target.value)}
              placeholder="••••••••"
              className="w-full h-11 bg-[#FAFAF8] border border-[rgba(138,130,120,0.2)] rounded-md px-3 font-body text-sm text-charcoal focus:border-terracotta outline-none transition-all"
            />
          </div>
        </div>

        <div>
          <label className="font-body text-sm font-medium text-charcoal mb-2 block flex items-center gap-2">
            <Envelope size={14} className="text-terracotta" />
            {t('admin.smtpFrom') || 'From Email Address'}
          </label>
          <input
            type="email"
            value={smtpFrom}
            onChange={(e) => setSmtpFrom(e.target.value)}
            placeholder="bookings@yourcompany.com"
            className="w-full h-11 bg-[#FAFAF8] border border-[rgba(138,130,120,0.2)] rounded-md px-3 font-body text-sm text-charcoal focus:border-terracotta outline-none transition-all"
          />
          <p className="font-body text-xs text-warm-gray mt-1">{t('admin.smtpFromDesc') || 'This is the sender address customers will see'}</p>
        </div>

        {/* SMTP Providers Help */}
        <div className="mt-4 bg-[#FAFAF8] rounded-lg p-4">
          <p className="font-body text-xs font-medium text-charcoal mb-2">{t('admin.smtpProviders') || 'Popular SMTP Providers:'}</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { name: 'Gmail', host: 'smtp.gmail.com', port: '587' },
              { name: 'SendGrid', host: 'smtp.sendgrid.net', port: '587' },
              { name: 'Mailgun', host: 'smtp.mailgun.org', port: '587' },
              { name: 'Outlook', host: 'smtp.office365.com', port: '587' },
            ].map((provider) => (
              <button
                key={provider.name}
                onClick={() => { setSmtpHost(provider.host); setSmtpPort(parseInt(provider.port)); }}
                className="px-3 py-2 bg-white border border-[rgba(138,130,120,0.15)] rounded-md font-body text-xs text-charcoal hover:border-terracotta hover:text-terracotta transition-all text-center"
              >
                {provider.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center gap-3">
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
    </div>
  );
}
