import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  Buildings, Timer, MagnifyingGlass, CreditCard,
  Tag, CheckCircle, XCircle, Clock, ShieldWarning,
} from '@phosphor-icons/react';
import { trpc } from '@/providers/trpc';
import { useClientAuth } from '@/providers/ClientAuthProvider';

type StatusFilter = 'all' | 'trial' | 'active' | 'expired' | 'cancelled' | 'none';

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  trial: { label: 'Trial', color: '#C75E3A', bg: 'rgba(199,94,58,0.08)', icon: Timer },
  active: { label: 'Active', color: '#2D6A4F', bg: 'rgba(45,106,79,0.08)', icon: CheckCircle },
  expired: { label: 'Expired', color: '#B23A2F', bg: 'rgba(178,58,47,0.08)', icon: XCircle },
  cancelled: { label: 'Cancelled', color: '#8A8278', bg: 'rgba(138,130,120,0.08)', icon: XCircle },
  none: { label: 'No Plan', color: '#8A8278', bg: 'rgba(138,130,120,0.08)', icon: Clock },
};

export default function AdminCompanies() {
  const { t } = useTranslation();
  const { isSuperAdmin } = useClientAuth();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<number | null>(null);

  const { data: companies, isLoading } = trpc.companies.list.useQuery();
  const { data: payments } = trpc.companies.payments.useQuery(
    { clientId: selectedCompany! }, { enabled: !!selectedCompany }
  );
  const utils = trpc.useUtils();
  const toggleStatus = trpc.companies.toggleStatus.useMutation({
    onSuccess: () => utils.companies.list.invalidate(),
  });

  const filtered = (companies || []).filter((c: any) => {
    if (statusFilter !== 'all' && c.subscriptionStatus !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return c.name?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q);
    }
    return true;
  });

  const stats = {
    trial: (companies || []).filter((c: any) => c.subscriptionStatus === 'trial').length,
    active: (companies || []).filter((c: any) => c.subscriptionStatus === 'active').length,
    expired: (companies || []).filter((c: any) => c.subscriptionStatus === 'expired').length,
    cancelled: (companies || []).filter((c: any) => c.subscriptionStatus === 'cancelled').length,
  };

  if (!isSuperAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-[rgba(178,58,47,0.1)] flex items-center justify-center mx-auto mb-4">
            <ShieldWarning size={28} className="text-[#B23A2F]" />
          </div>
          <h3 className="font-display text-lg font-semibold text-charcoal mb-1">Access Denied</h3>
          <p className="font-body text-sm text-warm-gray">This section is only available for system administrators.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="font-body text-warm-gray">{t('common.loading')}...</span>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-display text-xl font-semibold text-charcoal">{t('admin.companies') || 'Registered Companies'}</h2>
        <p className="font-body text-sm text-warm-gray mt-1">{t('admin.companiesDesc') || 'Manage companies and their subscription status'}</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {(['trial', 'active', 'expired', 'cancelled'] as const).map((status) => {
          const cfg = statusConfig[status];
          const Icon = cfg.icon;
          return (
            <button key={status}
              onClick={() => setStatusFilter(statusFilter === status ? 'all' : status)}
              className={{roundedLg: 'p-4 text-left transition-all ' + (statusFilter === status ? 'ring-2 ring-offset-1' : '')}}
              style={{ backgroundColor: cfg.bg, '--tw-ring-color': cfg.color }}>
              <div className="flex items-center gap-2 mb-2">
                <Icon size={16} style={{ color: cfg.color }} />
                <p className="font-body text-xs font-medium" style={{ color: cfg.color }}>{cfg.label}</p>
              </div>
              <p className="font-display text-2xl font-bold text-charcoal">{stats[status]}</p>
            </button>
          );
        })}
      </div>

      <div className="relative mb-4">
        <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-gray" />
        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder={t('admin.searchCompanies') || 'Search companies...'}
          className="w-full h-10 bg-white border border-[rgba(138,130,120,0.15)] rounded-lg pl-9 pr-3 font-body text-sm text-charcoal focus:border-terracotta outline-none" />
      </div>
      
      {!filtered || filtered.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-[rgba(138,130,120,0.08)] p-10 text-center">
          <div className="w-14 h-14 rounded-full bg-[rgba(199,94,58,0.08)] flex items-center justify-center mx-auto mb-3">
            <Buildings size={24} className="text-terracotta" />
          </div>
          <p className="font-body text-sm text-warm-gray">
            {companies?.length === 0 ? (t('admin.noCompanies') || 'No companies registered yet.')
              : (t('admin.noCompaniesFilter') || 'No companies match your filter.')}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-[rgba(138,130,120,0.08)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[rgba(138,130,120,0.1)]">
                  <th className="text-left px-4 py-3 font-body text-[11px] font-semibold text-warm-gray uppercase tracking-wide">{t('admin.company') || 'Company'}</th>
                  <th className="text-left px-4 py-3 font-body text-[11px] font-semibold text-warm-gray uppercase tracking-wide">{t('admin.status') || 'Status'}</th>
                  <th className="text-left px-4 py-3 font-body text-[11px] font-semibold text-warm-gray uppercase tracking-wide">{t('admin.trial') || 'Trial'}</th>
                  <th className="text-left px-4 py-3 font-body text-[11px] font-semibold text-warm-gray uppercase tracking-wide">{t('admin.plan') || 'Plan'}</th>
                  <th className="text-left px-4 py-3 font-body text-[11px] font-semibold text-warm-gray uppercase tracking-wide">{t('admin.amount') || 'Amount'}</th>
                  <th className="text-right px-4 py-3 font-body text-[11px] font-semibold text-warm-gray uppercase tracking-wide">{t('admin.actions') || 'Actions'}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c: any) => {
                  const cfg = statusConfig[c.subscriptionStatus] || statusConfig.none;
                  return (
                    <tr key={c.id} className="border-b border-[rgba(138,130,120,0.06)] hover:bg-[rgba(138,130,120,0.02)] transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-body text-xs font-bold"
                            style={{ backgroundColor: c.primaryColor || '#C75E3A' }}>{c.name?.charAt(0).toUpperCase()}</div>
                          <div>
                            <p className="font-body text-sm font-semibold text-charcoal">{c.name}</p>
                            <p className="font-body text-[11px] text-warm-gray">{c.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full font-body text-[11px] font-medium"
                          style={{ backgroundColor: cfg.bg, color: cfg.color }}>
                          <cfg.icon size={12} /> {cfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">{c.trialEnd ? (<div><p className="font-body text-sm text-charcoal">{c.trialDaysLeft > 0 ? `${c.trialDaysLeft} days left` : 'Ended'}</p><p className="font-body text-[11px] text-warm-gray">{new Date(c.trialEnd).toLocaleDateString()}</p></div>) : (<span className="font-body text-sm text-warm-gray">—</span>)}</td>
                      <td className="px-4 py-3">{c.planEnd ? (<div><p className="font-body text-sm text-charcoal">{c.planDaysLeft > 0 ? `${c.planDaysLeft} days left` : 'Ended'}</p><p className="font-body text-[11px] text-warm-gray">{new Date(c.planEnd).toLocaleDateString()}</p></div>) : (<span className="font-body text-sm text-warm-gray">—</span>)}</td>
                      <td className="px-4 py-3"><div><p className="font-body text-sm font-semibold text-charcoal">${c.finalAmount || c.annualPrice || '600.00'}</p>{c.couponCode &&(<p className="font-body text-[11px] text-[#2D6A4F] flex items-center gap-1"><Tag size={10} /> {c.couponCode} ({c.discountApplied}%)</p>)}</div></td>
                      <td className="px-4 py-3 text-right"><button onClick={() => setSelectedCompany(selectedCompany === c.id ? null : c.id)} className="text-warm-gray hover:text-terracotta transition-colors p-1" title="View payments"><CreditCard size={16} /></button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedCompany && payments && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 bg-white rounded-lg shadow-sm border border-[rgba(138,130,120,0.08)] p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-body text-sm font-semibold text-charcoal">{t('admin.paymentHistory') || 'Payment History'}</h3>
            <button onClick={() => setSelectedCompany(null)} className="text-warm-gray hover:text-charcoal"><XCircle size={18} /></button>
          </div>
          {!payments || payments.length === 0 ? (<p className="font-body text-sm text-warm-gray">{t('admin.noPayments') || 'No payments recorded.'}</p>) : (
            <div className="space-y-2">
              {payments.map((p: any) => (
                <div key={p.id} className="flex items-center justify-between p-3 bg-[#FAFAF8] rounded-lg">
                  <div><p className="font-body text-sm text-charcoal">{p.description || 'Annual plan payment'}</p><p className="font-body text-[11px] text-warm-gray">{p.createdAt ? new Date(p.createdAt).toLocaleDateString() : ''}</p></div>
                  <div className="text-right"><p className="font-body text-sm font-semibold text-charcoal">${p.amount}</p><span className={`inline-block px-2 py-0.5 rounded-full font-body text-[10px] font-medium ${p.status === 'succeeded' ? 'bg-[rgba(45,106,79,0.1)] text-[#2D6A4F]' : p.status === 'failed' ? 'bg-[rgba(178,58,47,0.1)] text-[B23A2F]' : 'bg-[rgba(199,94,58,0.1)] text-terracotta'}`>}{p.status}</span></div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}