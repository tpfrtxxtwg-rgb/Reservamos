import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { trpc } from '@/providers/trpc.tsx';
import {
  Buildings, Globe, Phone, EnvelopeSimple,
  Image, Check, ArrowCounterClockwise,
<<<<<<< HEAD
  Lock, UserCircle, Warning,
=======
>>>>>>> 6688a34e810e9ce150c1cc87b0709d5780c1b305
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
      setTimeout(() => setSaved(false), 2000);
    },
  });

<<<<<<< HEAD
  const updateLoginEmail = trpc.companyProfile.updateLoginEmail.useMutation({
    onSuccess: () => {
      setAccountSuccess(t('admin.emailUpdated') || 'Login email updated successfully');
      setAccountError('');
      setCurrentPasswordForEmail('');
      utils.companyProfile.get.invalidate();
      utils.clientAuth.me.invalidate();
      setTimeout(() => setAccountSuccess(''), 4000);
    },
    onError: (err) => {
      setAccountError(err.message);
      setAccountSuccess('');
    },
  });

  const updatePassword = trpc.companyProfile.updatePassword.useMutation({
    onSuccess: () => {
      setAccountSuccess(t('admin.passwordUpdated') || 'Password updated successfully');
      setAccountError('');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setAccountSuccess(''), 4000);
    },
    onError: (err) => {
      setAccountError(err.message);
      setAccountSuccess('');
    },
  });

=======
>>>>>>> 6688a34e810e9ce150c1cc87b0709d5780c1b305
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [phone, setPhone] = useState('');
  const [description, setDescription] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [saved, setSaved] = useState(false);

<<<<<<< HEAD
  // Account Security state
  const [showAccountSection, setShowAccountSection] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [currentPasswordForEmail, setCurrentPasswordForEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [accountError, setAccountError] = useState('');
  const [accountSuccess, setAccountSuccess] = useState('');
  const [activeTab, setActiveTab] = useState<'email' | 'password'>('email');

=======
>>>>>>> 6688a34e810e9ce150c1cc87b0709d5780c1b305
  // Sync form fields with server data whenever profile changes
  useEffect(() => {
    if (profile) {
      setName(profile.name ?? '');
      setEmail(profile.email ?? '');
      setWebsite(profile.website ?? '');
      setPhone(profile.phone ?? '');
      setDescription(profile.description ?? '');
      setLogoUrl(profile.logoUrl ?? '');
<<<<<<< HEAD
      setLoginEmail(profile.email ?? '');
    }
  }, [profile]);

  // Fetch current auth user to display login email
  const { data: authUser } = trpc.clientAuth.me.useQuery();

=======
    }
  }, [profile]);

>>>>>>> 6688a34e810e9ce150c1cc87b0709d5780c1b305
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

<<<<<<< HEAD
  const handleUpdateLoginEmail = () => {
    setAccountError('');
    setAccountSuccess('');
    if (!loginEmail.trim()) {
      setAccountError(t('admin.emailRequired') || 'Email is required');
      return;
    }
    if (!currentPasswordForEmail) {
      setAccountError(t('admin.passwordRequired') || 'Current password is required');
      return;
    }
    updateLoginEmail.mutate({
      currentPassword: currentPasswordForEmail,
      newEmail: loginEmail.trim(),
    });
  };

  const handleUpdatePassword = () => {
    setAccountError('');
    setAccountSuccess('');
    if (!currentPassword) {
      setAccountError(t('admin.currentPasswordRequired') || 'Current password is required');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setAccountError(t('admin.passwordMinLength') || 'New password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setAccountError(t('admin.passwordsDoNotMatch') || 'Passwords do not match');
      return;
    }
    updatePassword.mutate({
      currentPassword,
      newPassword,
    });
  };

=======
>>>>>>> 6688a34e810e9ce150c1cc87b0709d5780c1b305
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
<<<<<<< HEAD

      {/* Account Security Section */}
      <div className="mt-6 bg-white rounded-xl shadow-sm border border-[rgba(138,130,120,0.08)] overflow-hidden">
        <button
          onClick={() => setShowAccountSection(!showAccountSection)}
          className="w-full flex items-center justify-between p-6 hover:bg-[#FAFAF8] transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#F5F0EB] flex items-center justify-center">
              <Lock size={20} className="text-terracotta" />
            </div>
            <div className="text-left">
              <h3 className="font-body text-sm font-semibold text-charcoal">
                {t('admin.accountSecurity') || 'Account Security'}
              </h3>
              <p className="font-body text-xs text-warm-gray mt-0.5">
                {t('admin.accountSecurityDesc') || 'Change your login email or password'}
              </p>
            </div>
          </div>
          <svg
            className={`w-5 h-5 text-warm-gray transition-transform ${showAccountSection ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showAccountSection && (
          <div className="px-6 pb-6 border-t border-[rgba(138,130,120,0.08)]">
            {/* Current login email display */}
            <div className="mt-4 p-4 bg-[#FAFAF8] rounded-lg flex items-center gap-3">
              <UserCircle size={20} className="text-warm-gray" />
              <div>
                <p className="font-body text-xs text-warm-gray uppercase tracking-wide">
                  {t('admin.currentLoginEmail') || 'Current Login Email'}
                </p>
                <p className="font-body text-sm font-medium text-charcoal">
                  {authUser?.email || profile?.email || '—'}
                </p>
              </div>
            </div>

            {/* Alert messages */}
            {accountError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                <Warning size={16} className="text-red-500 flex-shrink-0" />
                <p className="font-body text-sm text-red-600">{accountError}</p>
              </div>
            )}
            {accountSuccess && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                <Check size={16} className="text-green-500 flex-shrink-0" />
                <p className="font-body text-sm text-green-600">{accountSuccess}</p>
              </div>
            )}

            {/* Tabs */}
            <div className="mt-4 flex gap-1 p-1 bg-[#F5F0EB] rounded-lg">
              <button
                onClick={() => { setActiveTab('email'); setAccountError(''); setAccountSuccess(''); }}
                className={`flex-1 py-2 px-4 rounded-md font-body text-sm font-medium transition-all ${
                  activeTab === 'email'
                    ? 'bg-white text-charcoal shadow-sm'
                    : 'text-warm-gray hover:text-charcoal'
                }`}
              >
                {t('admin.changeEmail') || 'Change Email'}
              </button>
              <button
                onClick={() => { setActiveTab('password'); setAccountError(''); setAccountSuccess(''); }}
                className={`flex-1 py-2 px-4 rounded-md font-body text-sm font-medium transition-all ${
                  activeTab === 'password'
                    ? 'bg-white text-charcoal shadow-sm'
                    : 'text-warm-gray hover:text-charcoal'
                }`}
              >
                {t('admin.changePassword') || 'Change Password'}
              </button>
            </div>

            {/* Change Email Form */}
            {activeTab === 'email' && (
              <div className="mt-4 space-y-4">
                <div>
                  <label className="font-body text-xs font-medium text-warm-gray uppercase tracking-wide mb-1.5 block">
                    {t('admin.newLoginEmail') || 'New Login Email'} *
                  </label>
                  <div className="relative">
                    <EnvelopeSimple size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-gray" />
                    <input
                      type="email"
                      value={loginEmail}
                      onChange={e => setLoginEmail(e.target.value)}
                      placeholder="new-email@company.com"
                      className="w-full h-11 bg-[#FAFAF8] border border-[rgba(138,130,120,0.2)] rounded-md pl-10 pr-3 font-body text-sm text-charcoal placeholder:text-warm-gray/50 focus:border-terracotta outline-none transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="font-body text-xs font-medium text-warm-gray uppercase tracking-wide mb-1.5 block">
                    {t('admin.currentPassword') || 'Current Password'} *
                  </label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-gray" />
                    <input
                      type="password"
                      value={currentPasswordForEmail}
                      onChange={e => setCurrentPasswordForEmail(e.target.value)}
                      placeholder="••••••••"
                      className="w-full h-11 bg-[#FAFAF8] border border-[rgba(138,130,120,0.2)] rounded-md pl-10 pr-3 font-body text-sm text-charcoal placeholder:text-warm-gray/50 focus:border-terracotta outline-none transition-all"
                    />
                  </div>
                </div>
                <button
                  onClick={handleUpdateLoginEmail}
                  disabled={updateLoginEmail.isPending}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-body text-sm font-medium bg-terracotta text-white hover:bg-terracotta-dark transition-all disabled:opacity-50"
                >
                  {updateLoginEmail.isPending && (
                    <ArrowCounterClockwise size={16} className="animate-spin" />
                  )}
                  {t('admin.updateEmail') || 'Update Login Email'}
                </button>
              </div>
            )}

            {/* Change Password Form */}
            {activeTab === 'password' && (
              <div className="mt-4 space-y-4">
                <div>
                  <label className="font-body text-xs font-medium text-warm-gray uppercase tracking-wide mb-1.5 block">
                    {t('admin.currentPassword') || 'Current Password'} *
                  </label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-gray" />
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={e => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full h-11 bg-[#FAFAF8] border border-[rgba(138,130,120,0.2)] rounded-md pl-10 pr-3 font-body text-sm text-charcoal placeholder:text-warm-gray/50 focus:border-terracotta outline-none transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="font-body text-xs font-medium text-warm-gray uppercase tracking-wide mb-1.5 block">
                    {t('admin.newPassword') || 'New Password'} *
                  </label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-gray" />
                    <input
                      type="password"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="Min. 6 characters"
                      className="w-full h-11 bg-[#FAFAF8] border border-[rgba(138,130,120,0.2)] rounded-md pl-10 pr-3 font-body text-sm text-charcoal placeholder:text-warm-gray/50 focus:border-terracotta outline-none transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="font-body text-xs font-medium text-warm-gray uppercase tracking-wide mb-1.5 block">
                    {t('admin.confirmNewPassword') || 'Confirm New Password'} *
                  </label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-gray" />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full h-11 bg-[#FAFAF8] border border-[rgba(138,130,120,0.2)] rounded-md pl-10 pr-3 font-body text-sm text-charcoal placeholder:text-warm-gray/50 focus:border-terracotta outline-none transition-all"
                    />
                  </div>
                </div>
                <button
                  onClick={handleUpdatePassword}
                  disabled={updatePassword.isPending}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-body text-sm font-medium bg-terracotta text-white hover:bg-terracotta-dark transition-all disabled:opacity-50"
                >
                  {updatePassword.isPending && (
                    <ArrowCounterClockwise size={16} className="animate-spin" />
                  )}
                  {t('admin.updatePassword') || 'Update Password'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
=======
    </div>
  );
}
>>>>>>> 6688a34e810e9ce150c1cc87b0709d5780c1b305
