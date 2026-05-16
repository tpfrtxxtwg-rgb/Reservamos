import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { trpc } from '@/providers/trpc.tsx';
import {
  Buildings, Globe, Phone, EnvelopeSimple,
  Image, Check, ArrowCounterClockwise,
} from '@phosphor-icons/react';

interface AdminCompanyProfileProps {
  clientId: number;
}

export default function AdminCompanyProfile({ clientId }: AdminCompanyProfileProps) {
  const { t } = useTranslation();
  const utils = trpc.useUtils();

  const { data: profile, isLoading } = trpc.companyProfile.get.useQuery(
    undefined,
    { refetchOnMount: 'always', staleTime: 0 }
  );

  const updateProfile = trpc.companyProfile.update.useMutation({
    onSuccess: () => {
      utils.companyProfile.get.invalidate();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [phone, setPhone] = useState('');
  const [description, setDescription] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [saved, setSaved] = useState(false);

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

  const handleSave = () => {
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
      <div className="max-w-2xl flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-[#E8E4DF] border-t-terracotta rounded-full animate-spin mx-auto mb-4" />
          <p className="font-body text-sm text-warm-gray">Loading company profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-display text-xl font-bold text-charcoal">
            {t('admin.companyProfile') || 'Company Profile'}
          </h2>
          <p className="font-body text-sm text-warm-gray mt-1">
            {t('admin.companyProfileDesc') || 'Manage your company information'}
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={updateProfile.isPending}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-body text-sm font-medium transition-all ${
            saved
              ? 'bg-[#2D6A4F] text-white'
              : 'bg-terracotta text-white hover:bg-terracotta-dark'
          }`}
        >
          {saved ? <Check size={16} /> : updateProfile.isPending
            ? <ArrowCounterClockwise size={16} className="animate-spin" />
            : null}
          {saved ? 'Saved!' : t('common.save') || 'Save Changes'}
        </button>
      </div>

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

          {/* Description */}
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

          {/* Logo URL */}
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
