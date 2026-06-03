import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { EnvelopeSimple, Check, FloppyDisk, Lightning } from '@phosphor-icons/react';
import { trpc } from '@/providers/trpc';

export default function AdminEmailSettings() {
  const { t } = useTranslation();
  const utils = trpc.useUtils();

  const { data: settings, isLoading } = trpc.emailSettings.get.useQuery();
  const updateSettings = trpc.emailSettings.update.useMutation({
    onSuccess: () => { utils.emailSettings.get.invalidate(); setSaved(true); setTimeout(() => setSaved(false), 2000); },
  });
  const testEmail = trpc.emailSettings.test.useMutation();

  const [enabled, setEnabled] = useState(true);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [pickupInstructions, setPickupInstructions] = useState('');
  const [emailProvider, setEmailProvider] = useState<'sendgrid' | 'resend'>('sendgrid');
  const [sendgridApiKey, setSendgridApiKey] = useState('');
  const [resendApiKey, setResendApiKey] = useState('');
  const [smtpFrom, setSmtpFrom] = useState('');
  const [companyPhone, setCompanyPhone] = useState('');
  const [companyWebsite, setCompanyWebsite] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (settings) {
      setEnabled(settings.enabled ?? true);
      setSubject(settings.subject ?? '');
      setMessage(settings.message ?? '');
      setPickupInstructions(settings.pickupInstructions ?? '');
      setEmailProvider((settings.emailProvider as any) ?? 'sendgrid');
      setSendgridApiKey(settings.sendgridApiKey ?? '');
      setResendApiKey(settings.resendApiKey ?? '');
      setSmtpFrom(settings.smtpFrom ?? '');
      setCompanyPhone(settings.companyPhone ?? '');
      setCompanyWebsite(settings.companyWebsite ?? '');
    }
  }, [settings]);

  const handleSave = () => {
    updateSettings.mutate({
      enabled,
      subject: subject || undefined,
      message: message || undefined,
      pickupInstructions: pickupInstructions || undefined,
      emailProvider,
      sendgridApiKey: sendgridApiKey || null,
      resendApiKey: resendApiKey || null,
      smtpFrom: smtpFrom || null,
      companyPhone: companyPhone || null,
      companyWebsite: companyWebsite || null,
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
        <h2 className="font-display text-xl font-semibold text-charcoal">{t('admin.emailSettings') || 'Email Settings'}</h2>
        <p className="font-body text-sm text-warm-gray mt-1">{t('admin.emailSettingsDesc') || 'Configure confirmation emails sent to customers'}</p>
      </div>

      {/* Enable Toggle */}
      <div className="bg-white rounded-lg shadow-sm border border-[rgba(138,130,120,0.08)] p-6 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[rgba(199,94,58,0.1)] flex items-center justify-center">
              <EnvelopeSimple size={18} className="text-terracotta" />
            </div>
            <div>
              <h3 className="font-body text-sm font-semibold text-charcoal">{t('admin.emailNotifications') || 'Email Notifications'}</h3>
              <p className="font-body text-xs text-warm-gray">{t('admin.emailNotificationsDesc') || 'Send confirmation emails after booking'}</p>
            </div>
          </div>
          <button
            onClick={() => setEnabled(!enabled)}
            className="relative w-12 h-7 rounded-full transition-colors duration-200 flex items-center"
            style={{ backgroundColor: enabled ? '#C75E3A' : 'rgba(138,130,120,0.3)' }}
          >
            <motion.div
              className="w-5 h-5 bg-white rounded-full shadow-sm"
              animate={{ x: enabled ? 24 : 4 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            />
          </button>
        </div>
      </div>

      {enabled && (
        <>
          {/* Provider Selection */}
          <div className="bg-white rounded-lg shadow-sm border border-[rgba(138,130,120,0.08)] p-6 mb-4">
            <h3 className="font-body text-sm font-semibold text-charcoal mb-4">{t('admin.emailProvider') || 'Email Provider'}</h3>
            <div className="grid grid-cols-2 gap-3 mb-5">
              <button
                onClick={() => setEmailProvider('sendgrid')}
                className={`px-4 py-3 rounded-lg border-2 font-body text-sm font-medium transition-all ${
                  emailProvider === 'sendgrid'
                    ? 'border-terracotta bg-[rgba(199,94,58,0.05)] text-terracotta'
                    : 'border-[rgba(138,130,120,0.15)] text-warm-gray hover:border-[rgba(138,130,120,0.3)]'
                }`}
              >
                SendGrid
              </button>
              <button
                onClick={() => setEmailProvider('resend')}
                className={`px-4 py-3 rounded-lg border-2 font-body text-sm font-medium transition-all ${
                  emailProvider === 'resend'
                    ? 'border-terracotta bg-[rgba(199,94,58,0.05)] text-terracotta'
                    : 'border-[rgba(138,130,120,0.15)] text-warm-gray hover:border-[rgba(138,130,120,0.3)]'
                }`}
              >
                Resend
              </button>
            </div>

            {emailProvider === 'sendgrid' && (
              <div>
                <label className="font-body text-xs font-medium text-warm-gray uppercase tracking-wide mb-2 block">SendGrid API Key</label>
                <input
                  type="password"
                  value={sendgridApiKey}
                  onChange={(e) => setSendgridApiKey(e.target.value)}
                  placeholder="SG.xxxxxxxxxx"
                  className="w-full h-11 bg-[#FAFAF8] border border-[rgba(138,130,120,0.2)] rounded-md px-3 font-body text-sm text-charcoal focus:border-terracotta outline-none transition-all"
                />
                <p className="font-body text-xs text-warm-gray mt-1.5">
                  <a href="https://app.sendgrid.com/settings/api_keys" target="_blank" rel="noopener noreferrer" className="text-terracotta hover:underline">Get your API key from SendGrid</a>
                </p>
              </div>
            )}

            {emailProvider === 'resend' && (
              <div>
                <label className="font-body text-xs font-medium text-warm-gray uppercase tracking-wide mb-2 block">Resend API Key</label>
                <input
                  type="password"
                  value={resendApiKey}
                  onChange={(e) => setResendApiKey(e.target.value)}
                  placeholder="re_xxxxxxxx"
                  className="w-full h-11 bg-[#FAFAF8] border border-[rgba(138,130,120,0.2)] rounded-md px-3 font-body text-sm text-charcoal focus:border-terracotta outline-none transition-all"
                />
                <p className="font-body text-xs text-warm-gray mt-1.5">
                  <a href="https://resend.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-terracotta hover:underline">Get your API key from Resend</a>
                </p>
              </div>
            )}

            {/* From Email */}
            <div className="mt-4">
              <label className="font-body text-xs font-medium text-warm-gray uppercase tracking-wide mb-2 block">{t('admin.fromEmail') || 'From Email'}</label>
              <input
                type="email"
                value={smtpFrom}
                onChange={(e) => setSmtpFrom(e.target.value)}
                placeholder='"Your Company" <noreply@example.com>'
                className="w-full h-11 bg-[#FAFAF8] border border-[rgba(138,130,120,0.2)] rounded-md px-3 font-body text-sm text-charcoal focus:border-terracotta outline-none transition-all"
              />
            </div>
          </div>

          {/* Email Content */}
          <div className="bg-white rounded-lg shadow-sm border border-[rgba(138,130,120,0.08)] p-6 mb-4">
            <h3 className="font-body text-sm font-semibold text-charcoal mb-4">{t('admin.emailContent') || 'Email Content'}</h3>
            <div className="space-y-4">
              <div>
                <label className="font-body text-xs font-medium text-warm-gray uppercase tracking-wide mb-2 block">{t('admin.emailSubject') || 'Subject'}</label>
                <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full h-11 bg-[#FAFAF8] border border-[rgba(138,130,120,0.2)] rounded-md px-3 font-body text-sm text-charcoal focus:border-terracotta outline-none" />
              </div>
              <div>
                <label className="font-body text-xs font-medium text-warm-gray uppercase tracking-wide mb-2 block">{t('admin.emailMessage') || 'Message'}</label>
                <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3} className="w-full bg-[#FAFAF8] border border-[rgba(138,130,120,0.2)] rounded-md px-3 py-2 font-body text-sm text-charcoal focus:border-terracotta outline-none resize-vertical" />
              </div>
              <div>
                <label className="font-body text-xs font-medium text-warm-gray uppercase tracking-wide mb-2 block">{t('admin.pickupInstructions') || 'Pickup Instructions'}</label>
                <textarea value={pickupInstructions} onChange={(e) => setPickupInstructions(e.target.value)} placeholder="Where should the driver meet the passenger?" rows={3} className="w-full bg-[#FAFAF8] border border-[rgba(138,130,120,0.2)] rounded-md px-3 py-2 font-body text-sm text-charcoal placeholder:text-warm-gray/50 placeholder:font-body placeholder:text-xs focus:border-terracotta outline-none resize-vertical" />
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="bg-white rounded-lg shadow-sm border border-[rgba(138,130,120,0.08)] p-6 mb-4">
            <h3 className="font-body text-sm font-semibold text-charcoal mb-4">{t('admin.contactInfo') || 'Contact Info in Emails'}</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="font-body text-xs font-medium text-warm-gray uppercase tracking-wide mb-2 block">{t('admin.companyPhone') || 'Phone'}</label>
                <input type="text" value={companyPhone} onChange={(e) => setCompanyPhone(e.target.value)} className="w-full h-11 bg-[#FAFAF8] border border-[rgba(138,130,120,0.2)] rounded-md px-3 font-body text-sm text-charcoal focus:border-terracotta outline-none" />
              </div>
              <div>
                <label className="font-body text-xs font-medium text-warm-gray uppercase tracking-wide mb-2 block">{t('admin.companyWebsite') || 'Website'}</label>
                <input type="text" value={companyWebsite} onChange={(e) => setCompanyWebsite(e.target.value)} className="w-full h-11 bg-[#FAFAF8] border border-[rgba(138,130,120,0.2)] rounded-md px-3 font-body text-sm text-charcoal focus:border-terracotta outline-none" />
              </div>
            </div>
          </div>

          {/* Save */}
          <div className="flex items-center gap-3">
            <button onClick={handleSave} disabled={updateSettings.isPending}
              className="flex items-center gap-2 px-6 py-3 bg-terracotta text-white rounded-lg font-body text-sm font-semibold hover:bg-terracotta-dark transition-colors disabled:opacity-50">
              {updateSettings.isPending ? <span>{t('common.saving')}</span> : saved ? <><Check size={16} /> {t('common.saved')}</> : <><FloppyDisk size={16} /> {t('common.saveChanges')}</>}
            </button>
            <button
              onClick={() => testEmail.mutate({ to: '' })}
              disabled={testEmail.isPending}
              className="flex items-center gap-2 px-4 py-3 border border-[rgba(138,130,120,0.2)] text-warm-gray rounded-lg font-body text-sm font-medium hover:border-terracotta hover:text-terracotta transition-colors disabled:opacity-50"
            >
              <Lightning size={16} /> {t('admin.testConnection') || 'Test'}
            </button>
            {testEmail.isSuccess && (
              <span className="font-body text-xs text-[#2D6A4F]">{testEmail.data?.reason}</span>
            )}
          </div>
        </>
      )}
    </div>
  );
}
