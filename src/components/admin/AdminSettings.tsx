import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Check, Percent, Money, PaintBrush, Receipt, Trash, Warning } from '@phosphor-icons/react';
import { trpc } from '@/providers/trpc';

interface Props {
  clientId: number;
}

export default function AdminSettings({ clientId }: Props) {
  const { t } = useTranslation();
  const utils = trpc.useUtils();

  const { data: settings, isLoading } = trpc.clientSettings.get.useQuery();
  const updateSettings = trpc.clientSettings.update.useMutation({
    onSuccess: () => {
      utils.clientSettings.get.invalidate();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  const [depositEnabled, setDepositEnabled] = useState(false);
  const [depositPercentage, setDepositPercentage] = useState('50.00');
  const [taxRate, setTaxRate] = useState('16.00');
  const [primaryColor, setPrimaryColor] = useState('#C75E3A');
  const [saved, setSaved] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const clearAllBookings = trpc.booking.clearAll.useMutation({
    onSuccess: (data) => {
      utils.booking.list.invalidate();
      utils.booking.stats.invalidate();
      setShowClearConfirm(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
  });

  useEffect(() => {
    if (settings) {
      setDepositEnabled(settings.depositEnabled ?? false);
      setDepositPercentage(String(settings.depositPercentage ?? '50.00'));
      setTaxRate(String(settings.taxRate ?? '16.00'));
      setPrimaryColor(settings.primaryColor ?? '#C75E3A');
    }
  }, [settings]);

  const handleSave = () => {
    updateSettings.mutate({
      depositEnabled,
      depositPercentage,
      taxRate,
      primaryColor,
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
        <h2 className="font-display text-xl font-semibold text-charcoal">{t('admin.settings') || 'Settings'}</h2>
        <p className="font-body text-sm text-warm-gray mt-1">{t('admin.settingsDesc') || 'Configure your booking engine preferences'}</p>
      </div>

      {/* Payment Settings */}
      <div className="bg-white rounded-lg shadow-sm border border-[rgba(138,130,120,0.08)] p-6 mb-4">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-8 h-8 rounded-lg bg-[rgba(199,94,58,0.1)] flex items-center justify-center">
            <Receipt size={18} className="text-terracotta" />
          </div>
          <h3 className="font-body text-base font-semibold text-charcoal">{t('admin.paymentSettings') || 'Payment Settings'}</h3>
        </div>

        {/* Tax Rate */}
        <div className="mb-5">
          <label className="font-body text-sm font-medium text-charcoal mb-2 block flex items-center gap-2">
            <Percent size={16} className="text-terracotta" />
            {t('admin.taxRate') || 'Tax Rate (IVA)'}
          </label>
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-[140px]">
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value)}
                className="w-full h-11 bg-[#FAFAF8] border border-[rgba(138,130,120,0.2)] rounded-md px-3 pr-8 font-body text-sm text-charcoal focus:border-terracotta outline-none transition-all"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 font-body text-sm text-warm-gray">%</span>
            </div>
            <span className="font-body text-sm text-warm-gray">{t('admin.taxRateDesc') || 'Applied to all bookings'}</span>
          </div>
        </div>

        {/* Deposit Toggle */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-3">
            <label className="font-body text-sm font-medium text-charcoal flex items-center gap-2">
              <Money size={16} className="text-terracotta" />
              {t('admin.depositOption') || 'Allow Deposit Payments'}
            </label>
            <button
              onClick={() => setDepositEnabled(!depositEnabled)}
              className="relative w-12 h-7 rounded-full transition-colors duration-200 flex items-center"
              style={{ backgroundColor: depositEnabled ? '#C75E3A' : 'rgba(138,130,120,0.3)' }}
            >
              <motion.div
                className="w-5 h-5 bg-white rounded-full shadow-sm"
                animate={{ x: depositEnabled ? 24 : 4 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            </button>
          </div>
          <p className="font-body text-xs text-warm-gray mb-3">
            {t('admin.depositOptionDesc') || 'Let customers pay a deposit instead of the full amount. The balance is due at service time.'}
          </p>
        </div>

        {/* Deposit Fixed Amount */}
        {depositEnabled && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-2"
          >
            <label className="font-body text-sm font-medium text-charcoal mb-2 block">
              {t('admin.depositFixedAmount') || 'Deposit Amount (USD)'}
            </label>
            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-[160px]">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-body text-sm text-warm-gray">$</span>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={depositPercentage}
                  onChange={(e) => setDepositPercentage(e.target.value)}
                  className="w-full h-11 bg-[#FAFAF8] border border-[rgba(138,130,120,0.2)] rounded-md pl-7 pr-3 font-body text-sm text-charcoal focus:border-terracotta outline-none transition-all"
                />
              </div>
              <span className="font-body text-sm text-warm-gray">
                {t('admin.depositFixedAmountDesc') || 'Fixed amount customer pays as deposit'}
              </span>
            </div>
            {/* Preview */}
            <div className="mt-3 bg-sand rounded-md p-3">
              <div className="flex justify-between mb-1">
                <span className="font-body text-xs text-warm-gray">{t('admin.exampleBooking') || 'Example: $100 booking'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-body text-xs text-charcoal">{t('admin.customerPays') || 'Customer pays now'}</span>
                <span className="font-body text-sm font-semibold text-[#2D6A4F]">${Math.min(parseFloat(depositPercentage || '0'), 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-body text-xs text-charcoal">{t('admin.balanceDue') || 'Balance due at service'}</span>
                <span className="font-body text-sm font-semibold text-terracotta">${Math.max(0, 100 - parseFloat(depositPercentage || '0')).toFixed(2)}</span>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Appearance */}
      <div className="bg-white rounded-lg shadow-sm border border-[rgba(138,130,120,0.08)] p-6 mb-4">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-8 h-8 rounded-lg bg-[rgba(199,94,58,0.1)] flex items-center justify-center">
            <PaintBrush size={18} className="text-terracotta" />
          </div>
          <h3 className="font-body text-base font-semibold text-charcoal">{t('admin.appearance') || 'Appearance'}</h3>
        </div>

        <div className="mb-2">
          <label className="font-body text-sm font-medium text-charcoal mb-2 block">
            {t('admin.primaryColor') || 'Primary Color'}
          </label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              className="w-12 h-12 rounded-lg border border-[rgba(138,130,120,0.2)] cursor-pointer"
            />
            <input
              type="text"
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              className="flex-1 h-11 bg-[#FAFAF8] border border-[rgba(138,130,120,0.2)] rounded-md px-3 font-body text-sm text-charcoal focus:border-terracotta outline-none transition-all"
            />
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
            <span>{t('common.saveChanges') || 'Save Changes'}</span>
          )}
        </button>
        {saved && !showClearConfirm && (
          <motion.span
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="font-body text-sm text-[#2D6A4F]"
          >
            {t('admin.settingsSaved') || 'Settings saved successfully'}
          </motion.span>
        )}
      </div>

      {/* Danger Zone - Clear Test Data */}
      <div className="bg-white rounded-lg shadow-sm border border-[rgba(199,94,58,0.2)] p-6 mt-8">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-8 h-8 rounded-lg bg-[rgba(199,94,58,0.1)] flex items-center justify-center">
            <Warning size={18} className="text-terracotta" />
          </div>
          <h3 className="font-body text-base font-semibold text-charcoal">{t('admin.dangerZone') || 'Danger Zone'}</h3>
        </div>

        <p className="font-body text-sm text-warm-gray mb-4">
          {t('admin.clearTestDataDesc') || 'Permanently delete all booking records for your account. This action cannot be undone.'}
        </p>

        {!showClearConfirm ? (
          <button
            onClick={() => setShowClearConfirm(true)}
            className="flex items-center gap-2 px-5 py-2.5 border-2 border-terracotta text-terracotta rounded-lg font-body text-sm font-semibold hover:bg-[rgba(199,94,58,0.05)] transition-colors"
          >
            <Trash size={16} weight="bold" />
            <span>{t('admin.clearTestData') || 'Clear Test Data'}</span>
          </button>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[rgba(199,94,58,0.05)] border border-terracotta rounded-lg p-4"
          >
            <p className="font-body text-sm font-semibold text-terracotta mb-1">
              {t('admin.clearTestDataConfirm') || 'Are you sure?'}
            </p>
            <p className="font-body text-xs text-warm-gray mb-4">
              {t('admin.clearTestDataWarning') || 'This will permanently delete all your bookings. This action cannot be undone.'}
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => clearAllBookings.mutate()}
                disabled={clearAllBookings.isPending}
                className="flex items-center gap-2 px-5 py-2.5 bg-terracotta text-white rounded-lg font-body text-sm font-semibold hover:bg-terracotta-dark transition-colors disabled:opacity-50"
              >
                {clearAllBookings.isPending ? (
                  <span>{t('common.deleting') || 'Deleting...'}</span>
                ) : (
                  <>
                    <Trash size={16} weight="bold" />
                    <span>{t('admin.confirmClear') || 'Yes, Delete All Bookings'}</span>
                  </>
                )}
              </button>
              <button
                onClick={() => setShowClearConfirm(false)}
                disabled={clearAllBookings.isPending}
                className="px-5 py-2.5 border border-[rgba(138,130,120,0.3)] text-warm-gray rounded-lg font-body text-sm font-medium hover:bg-[rgba(138,130,120,0.05)] transition-colors disabled:opacity-50"
              >
                {t('common.cancel') || 'Cancel'}
              </button>
            </div>
            {clearAllBookings.isSuccess && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="font-body text-sm text-[#2D6A4F] mt-3"
              >
                {t('admin.bookingsDeleted', { count: clearAllBookings.data?.deleted }) || `${clearAllBookings.data?.deleted || 0} bookings deleted successfully`}
              </motion.p>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
