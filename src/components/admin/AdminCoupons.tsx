import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  Plus, Pencil, Trash, X, Check, Ticket,
  ToggleLeft, ToggleRight, Copy,
} from '@phosphor-icons/react';
import { trpc } from '@/providers/trpc';

export default function AdminCoupons() {
  const { t } = useTranslation();
  const utils = trpc.useUtils();

  const { data: couponsList, isLoading } = trpc.coupon.list.useQuery();
  const createCoupon = trpc.coupon.create.useMutation({
    onSuccess: () => { utils.coupon.list.invalidate(); setShowAdd(false); resetForm(); setSaved(true); setTimeout(() => setSaved(false), 2000); },
    onError: (err) => setSaveError(err.message),
  });
  const toggleCoupon = trpc.coupon.toggle.useMutation({
    onSuccess: () => utils.coupon.list.invalidate(),
  });
  const deleteCoupon = trpc.coupon.delete.useMutation({
    onSuccess: () => utils.coupon.list.invalidate(),
  });

  const [showAdd, setShowAdd] = useState(false);
  const [code, setCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState('10');
  const [maxUses, setMaxUses] = useState('1');
  const [description, setDescription] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [copiedCode, setCopiedCode] = useState('');

  const resetForm = () => {
    setCode('');
    setDiscountPercent('10');
    setMaxUses('1');
    setDescription('');
    setValidUntil('');
    setSaveError('');
  };

  const handleCopy = (codeStr: string) => {
    navigator.clipboard.writeText(codeStr).then(() => {
      setCopiedCode(codeStr);
      setTimeout(() => setCopiedCode(''), 2000);
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
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-display text-xl font-semibold text-charcoal">{t('admin.coupons') || 'Coupons'}</h2>
          <p className="font-body text-sm text-warm-gray mt-1">{t('admin.couponsDesc') || 'Manage discount codes for annual subscriptions'}</p>
        </div>
        <button
          onClick={() => { setShowAdd(true); setSaveError(''); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-terracotta text-white rounded-lg font-body text-sm font-medium hover:bg-terracotta-dark transition-colors"
        >
          <Plus size={16} /> {t('common.add') || 'Add Coupon'}
        </button>
      </div>

      {saved && (
        <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-3 bg-[rgba(45,106,79,0.08)] border border-[rgba(45,106,79,0.2)] rounded-lg">
          <p className="font-body text-sm text-[#2D6A4F] flex items-center gap-2">
            <Check size={16} /> {t('admin.couponCreated') || 'Coupon created successfully'}
          </p>
        </motion.div>
      )}

<<<<<<< HEAD
=======
      {/* Add Coupon Form */}
>>>>>>> 6688a34e810e9ce150c1cc87b0709d5780c1b305
      {showAdd && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-sm border border-[rgba(199,94,58,0.15)] p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-body text-sm font-semibold text-charcoal">{t('admin.newCoupon') || 'New Coupon'}</h3>
            <button onClick={() => { setShowAdd(false); resetForm(); }} className="text-warm-gray hover:text-charcoal">
              <X size={18} />
            </button>
          </div>

          {saveError && (
            <div className="mb-4 p-3 bg-[rgba(178,58,47,0.08)] border border-[rgba(178,58,47,0.2)] rounded-lg">
              <p className="font-body text-xs text-[#B23A2F]">{saveError}</p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="font-body text-xs font-medium text-warm-gray uppercase tracking-wide mb-1.5 block">
                {t('admin.couponCode') || 'Code'}
              </label>
              <input
                type="text" value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                placeholder="WELCOME50"
                className="w-full h-10 bg-[#FAFAF8] border border-[rgba(138,130,120,0.2)] rounded-md px-3 font-body text-sm text-charcoal focus:border-terracotta outline-none uppercase"
              />
            </div>
            <div>
              <label className="font-body text-xs font-medium text-warm-gray uppercase tracking-wide mb-1.5 block">
                {t('admin.discountPercent') || 'Discount %'}
              </label>
              <input
                type="number" value={discountPercent}
                onChange={e => setDiscountPercent(e.target.value)}
                min="1" max="100"
                className="w-full h-10 bg-[#FAFAF8] border border-[rgba(138,130,120,0.2)] rounded-md px-3 font-body text-sm text-charcoal focus:border-terracotta outline-none"
              />
            </div>
            <div>
              <label className="font-body text-xs font-medium text-warm-gray uppercase tracking-wide mb-1.5 block">
                {t('admin.maxUses') || 'Max Uses'}
              </label>
              <input
                type="number" value={maxUses}
                onChange={e => setMaxUses(e.target.value)}
                min="1"
                className="w-full h-10 bg-[#FAFAF8] border border-[rgba(138,130,120,0.2)] rounded-md px-3 font-body text-sm text-charcoal focus:border-terracotta outline-none"
              />
            </div>
            <div>
              <label className="font-body text-xs font-medium text-warm-gray uppercase tracking-wide mb-1.5 block">
                {t('admin.validUntil') || 'Valid Until'}
              </label>
              <input
                type="date" value={validUntil}
                onChange={e => setValidUntil(e.target.value)}
                className="w-full h-10 bg-[#FAFAF8] border border-[rgba(138,130,120,0.2)] rounded-md px-3 font-body text-sm text-charcoal focus:border-terracotta outline-none"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="font-body text-xs font-medium text-warm-gray uppercase tracking-wide mb-1.5 block">
              {t('admin.description') || 'Description'}
            </label>
            <input
              type="text" value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder={t('admin.couponDescPlaceholder') || 'e.g. Launch promotion 2025'}
              className="w-full h-10 bg-[#FAFAF8] border border-[rgba(138,130,120,0.2)] rounded-md px-3 font-body text-sm text-charcoal focus:border-terracotta outline-none"
            />
          </div>

<<<<<<< HEAD
=======
          {/* Preview */}
>>>>>>> 6688a34e810e9ce150c1cc87b0709d5780c1b305
          {code && discountPercent && (
            <div className="bg-[rgba(199,94,58,0.06)] border border-[rgba(199,94,58,0.15)] rounded-lg p-3 mb-4">
              <p className="font-body text-xs text-warm-gray">
                {t('admin.couponPreview') || 'Preview'}: <strong className="text-terracotta">{code}</strong> = {discountPercent}% off
                {parseInt(discountPercent) > 0 && (
                  <span className="block mt-1">
                    Annual $600 → <strong className="text-[#2D6A4F]">${(600 * (1 - parseInt(discountPercent) / 100)).toFixed(2)} USD</strong>
                  </span>
                )}
              </p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => {
                if (!code.trim() || !discountPercent) return;
                createCoupon.mutate({
                  code: code.trim(),
                  discountPercent: parseInt(discountPercent),
                  maxUses: parseInt(maxUses) || 1,
                  description: description || undefined,
                  validUntil: validUntil || undefined,
                });
              }}
              disabled={createCoupon.isPending || !code.trim()}
              className="flex items-center gap-2 px-5 py-2.5 bg-terracotta text-white rounded-md font-body text-sm font-medium hover:bg-terracotta-dark transition-colors disabled:opacity-50"
            >
              {createCoupon.isPending ? t('common.creating') || 'Creating...' : <><Plus size={16} /> {t('common.create') || 'Create'}</>}
            </button>
            <button onClick={() => { setShowAdd(false); resetForm(); }}
              className="px-4 py-2.5 border border-[rgba(138,130,120,0.3)] text-warm-gray rounded-md font-body text-sm font-medium hover:bg-[rgba(138,130,120,0.05)] transition-colors">
              {t('common.cancel') || 'Cancel'}
            </button>
          </div>
        </motion.div>
      )}

<<<<<<< HEAD
=======
      {/* Coupons Table */}
>>>>>>> 6688a34e810e9ce150c1cc87b0709d5780c1b305
      {!couponsList || couponsList.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-[rgba(138,130,120,0.08)] p-10 text-center">
          <div className="w-14 h-14 rounded-full bg-[rgba(199,94,58,0.08)] flex items-center justify-center mx-auto mb-3">
            <Ticket size={24} className="text-terracotta" />
          </div>
          <p className="font-body text-sm text-warm-gray">{t('admin.noCoupons') || 'No coupons yet. Create your first discount code.'}</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-[rgba(138,130,120,0.08)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[rgba(138,130,120,0.1)]">
                  <th className="text-left px-4 py-3 font-body text-[11px] font-semibold text-warm-gray uppercase tracking-wide">{t('admin.code') || 'Code'}</th>
                  <th className="text-left px-4 py-3 font-body text-[11px] font-semibold text-warm-gray uppercase tracking-wide">{t('admin.discount') || 'Discount'}</th>
                  <th className="text-left px-4 py-3 font-body text-[11px] font-semibold text-warm-gray uppercase tracking-wide">{t('admin.uses') || 'Uses'}</th>
                  <th className="text-left px-4 py-3 font-body text-[11px] font-semibold text-warm-gray uppercase tracking-wide">{t('admin.status') || 'Status'}</th>
                  <th className="text-left px-4 py-3 font-body text-[11px] font-semibold text-warm-gray uppercase tracking-wide">{t('admin.validUntil') || 'Valid Until'}</th>
                  <th className="text-right px-4 py-3 font-body text-[11px] font-semibold text-warm-gray uppercase tracking-wide">{t('admin.actions') || 'Actions'}</th>
                </tr>
              </thead>
              <tbody>
                {couponsList.map((c: any) => (
                  <tr key={c.id} className="border-b border-[rgba(138,130,120,0.06)] hover:bg-[rgba(138,130,120,0.02)] transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-body text-sm font-semibold text-charcoal">{c.code}</span>
                        <button onClick={() => handleCopy(c.code)} className="text-warm-gray hover:text-terracotta transition-colors">
                          <Copy size={14} />
                        </button>
                        {copiedCode === c.code && <span className="font-body text-[10px] text-[#2D6A4F]">Copied!</span>}
                      </div>
                      {c.description && <p className="font-body text-[11px] text-warm-gray">{c.description}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-body text-sm font-semibold text-terracotta">{c.discountPercent}%</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`font-body text-sm ${c.usesCount >= c.maxUses ? 'text-[#B23A2F]' : 'text-charcoal'}`}>
                        {c.usesCount} / {c.maxUses}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => toggleCoupon.mutate({ id: c.id })}
                        className="flex items-center gap-1 text-sm">
                        {c.active ? (
                          <><ToggleRight size={22} className="text-[#2D6A4F]" /><span className="font-body text-xs text-[#2D6A4F]">Active</span></>
                        ) : (
                          <><ToggleLeft size={22} className="text-warm-gray" /><span className="font-body text-xs text-warm-gray">Inactive</span></>
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-body text-sm text-charcoal">
                        {c.validUntil ? new Date(c.validUntil).toLocaleDateString() : '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => { if (confirm('Delete this coupon?')) deleteCoupon.mutate({ id: c.id }); }}
                        className="text-warm-gray hover:text-[#B23A2F] transition-colors p-1">
                        <Trash size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
<<<<<<< HEAD
}
=======
}
>>>>>>> 6688a34e810e9ce150c1cc87b0709d5780c1b305
