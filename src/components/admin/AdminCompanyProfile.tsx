import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { trpc } from '@/providers/trpc.tsx';
import {
  Buildings, Globe, Phone, EnvelopeSimple,
  Image, Check, ArrowCounterClockwise, Warning,
} from '@phosphor-icons/react';

interface AdminCompanyProfileProps {
  clientId: number;
}

export default function AdminCompanyProfile({ clientId }: AdminCompanyProfileProps) {
  const { t } = useTranslation();
  const utils = trpc.useUtils();

  const { data: profile, isLoading } = trpc.companyProfile.get.useQuery();

  const updateProfile = trpc.companyProfile.update.useMutation({
    onSuccess: () => {
      utils.companyProfile.get.invalidate();
      setSaved(true);
      setError(null);
      setTimeout(() => setSaved(false), 3000);
    },
    onError: (err) => {
      setError(err.message || 'Failed to save. Please try again.');
      setSaved(false);
    },
  });

  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [phone, setPhone] = useState('');
  const [description, setDescription] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setEmail(profile.email || '');
      setWebsite(profile.website || '');
      setPhone(profile.phone || '');
      setDescription(profile.description || '');
      setLogoUrl(profile.logoUrl || '');
    }
  }, [profile]);

  const handleSaveProfile = () => {
    setError(null);
    setSaved(false);
    updateProfile.mutate({
      name,
      email,
      website: website || null,
      phone: phone || null,
      description: description || null,
      logoUrl: logoUrl || null,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <ArrowCounterClockwise size={24} className="text-terracotta animate-spin" />
        <span className="ml-3 font-body text-sm text-warm-gray">{t('common.loading') || 'Loading...'}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-bold text-charcoal">
            {t('admin.companyProfile') || 'Company Profile'}
          </h2>
          <p className="font-body text-sm text-warm-gray mt-1">
            {t('admin.companyProfileDesc') || 'Manage your company information'}
          </p>
        </div>
        <button
          onClick={handleSaveProfile}
          disabled={updateProfile.isPending}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-body text-sm font-medium transition-all ${
            saved
              ? 'bg-[#2D6A4F] text-white'
              : 'bg-terracotta text-white hover:bg-terracotta-dark'
          } disabled:opacity-60`}
        >
          {updateProfile.isPending ? (
            <ArrowCounterClockwise size={16} className="animate-spin" />
          ) : saved ? (
            <Check size={16} />
          ) : null}
          {saved
            ? (t('common.saved') || 'Saved!')
            : updateProfile.isPending
              ? (t('common.saving') || 'Saving...')
              : (t('common.save') || 'Save Changes')}
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-[rgba(178,58,47,0.08)] border border-[rgba(178,58,47,0.2)] rounded-lg px-4 py-3 flex items-start gap-2">
          <Warning size={16} className="text-[#B23A2F] flex-shrink-0 mt-0.5" />
          <p className="font-body text-sm text-[#B23A2F]">{error}</p>
        </div>
      )}

      {/* Success message */}
      {saved && !error && (
        <div className="bg-[rgba(45,106,79,0.08)] border border-[rgba(45,106,79,0.2)] rounded-lg px-4 py-3 flex items-center gap-2">
          <Check size={16} className="text-[#2D6A4F]" />
          <p className="font-body text-sm text-[#2D6A4F]">
            {t('admin.profileSaved') || 'Profile saved successfully'}
          </p>
        </div>
      )}

      {/* Company Info */}
      <div className="bg-white rounded-xl shadow-sm border border-[rgba(138,130,120,0.08)] p-6">
        <div className="flex items-center gap-2 mb-5">
          <Buildings size={18} className="text-terracotta" />
          <h3 className="font-body text-sm font-semibold text-charcoal uppercase tracking-wide">
            {t('admin.companyInfo') || 'Company Information'}
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Company Name */}
          <div>
            <label className="font-body text-xs font-medium text-warm-gray uppercase tracking-wide mb-1.5 block">
              {t('admin.companyName') || 'Company Name'} *
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Transportes Riviera Maya"
              className="w-full h-11 bg-[#FAFAF8] border border-[rgba(138,130,120,0.2)] rounded-md px-3 font-body text-sm text-charcoal placeholder:text-warm-gray/50 focus:border-terracotta focus:ring-[3px] focus:ring-[rgba(199,94,58,0.1)] outline-none transition-all"
            />
          </div>

          {/* Admin Email */}
          <div>
            <label className="font-body text-xs font-medium text-warm-gray uppercase tracking-wide mb-1.5 block">
              {t('admin.adminEmail') || 'Admin Email'} *
            </label>
            <div className="relative">
              <EnvelopeSimple size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-gray" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@company.com"
                className="w-full h-11 bg-[#FAFAF8] border border-[rgba(138,130,120,0.2)] rounded-md pl-10 pr-3 font-body text-sm text-charcoal placeholder:text-warm-gray/50 focus:border-terracotta outline-none transition-all"
              />
            </div>
          </div>

          {/* Website */}
          <div>
            <label className="font-body text-xs font-medium text-warm-gray uppercase tracking-wide mb-1.5 block">
              {t('admin.website') || 'Website'}
            </label>
            <div className="relative">
              <Globe size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-gray" />
              <input
                type="url"
                value={website}
                onChange={e => setWebsite(e.target.value)}
                placeholder="https://company.com"
                className="w-full h-11 bg-[#FAFAF8] border border-[rgba(138,130,120,0.2)] rounded-md pl-10 pr-3 font-body text-sm text-charcoal placeholder:text-warm-gray/50 focus:border-terracotta outline-none transition-all"
              />
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="font-body text-xs font-medium text-warm-gray uppercase tracking-wide mb-1.5 block">
              {t('admin.phone') || 'Phone Number'}
            </label>
            <div className="relative">
              <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-gray" />
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+52 998 123 4567"
                className="w-full h-11 bg-[#FAFAF8] border border-[rgba(138,130,120,0.2)] rounded-md pl-10 pr-3 font-body text-sm text-charcoal placeholder:text-warm-gray/50 focus:border-terracotta outline-none transition-all"
              />
            </div>
          </div>

          {/* Description - full width */}
          <div className="md:col-span-2">
            <label className="font-body text-xs font-medium text-warm-gray uppercase tracking-wide mb-1.5 block">
              {t('admin.description') || 'Company Description'}
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe your transportation services..."
              rows={3}
              className="w-full bg-[#FAFAF8] border border-[rgba(138,130,120,0.2)] rounded-md px-3 py-2 font-body text-sm text-charcoal placeholder:text-warm-gray/50 focus:border-terracotta focus:ring-[3px] focus:ring-[rgba(199,94,58,0.1)] outline-none transition-all resize-none"
            />
          </div>

          {/* Logo URL - full width */}
          <div className="md:col-span-2">
            <label className="font-body text-xs font-medium text-warm-gray uppercase tracking-wide mb-1.5 block">
              {t('admin.logoUrl') || 'Logo URL'}
            </label>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Image size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-gray" />
                <input
                  type="url"
                  value={logoUrl}
                  onChange={e => setLogoUrl(e.target.value)}
                  placeholder="https://your-cdn.com/logo.png"
                  className="w-full h-11 bg-[#FAFAF8] border border-[rgba(138,130,120,0.2)] rounded-md pl-10 pr-3 font-body text-sm text-charcoal placeholder:text-warm-gray/50 focus:border-terracotta outline-none transition-all"
                />
              </div>
              {logoUrl && (
                <div className="w-11 h-11 rounded-md border border-[rgba(138,130,120,0.15)] overflow-hidden flex-shrink-0 bg-white">
                  <img
                    src={logoUrl}
                    alt="Logo preview"
                    className="w-full h-full object-contain"
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
