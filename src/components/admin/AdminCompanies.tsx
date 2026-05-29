import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  Buildings, Timer,
  MagnifyingGlass, CreditCard,
  Tag, CheckCircle, XCircle, Clock,
  ShieldWarning,
} from '@phosphor-icons/react';
import { trpc } from '@/providers/trpc';

type StatusFilter = 'all' | 'trial' | 'active' | 'expired' | 'cancelled';

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  trial: { label: 'Trial', color: '#C75E3A', bg: 'rgba(199,94,58,0.08)' },
  active: { label: 'Active', color: '#2D6A4F', bg: 'rgba(45,106,79,0.08)' },
  expired: { label: 'Expired', color: '#B23A2F', bg: 'rgba(178,58,47,0.08)' },
  cancelled: { label: 'Cancelled', color: '#8A8278', bg: 'rgba(138,130,120,0.08)' },
};

export default function AdminCompanies() {
  const { t } = useTranslation();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');

  // Get all clients with subscription info via raw query
  const { data: companies, isLoading } = trpc.companyProfile.get.useQuery(undefined, {
    // We'll use a different approach - get from client list endpoint
    enabled: false,
  });

  // For now, show a placeholder with the structure
  // In production, this would query the subscription data

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

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {(['trial', 'active', 'expired', 'cancelled'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status === statusFilter ? 'all' : status)}
            className={`rounded-lg p-4 text-left transition-all ${
              statusFilter === status ? 'ring-2 ring-offset-1' : ''
            }`}
            style={{
              backgroundColor: statusConfig[status].bg,
              ringColor: statusConfig[status].color,
            }}
          >
            <p className="font-body text-xs font-medium mb-1" style={{ color: statusConfig[status].color }}>
              {statusConfig[status].label}
            </p>
            <p className="font-display text-2xl font-bold text-charcoal">
              {/* Would show count from API */} —
            </p>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-gray" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={t('admin.searchCompanies') || 'Search companies...'}
          className="w-full h-10 bg-white border border-[rgba(138,130,120,0.15)] rounded-lg pl-9 pr-3 font-body text-sm text-charcoal focus:border-terracotta outline-none"
        />
      </div>

      {/* Placeholder - API endpoint needed */}
      <div className="bg-white rounded-lg shadow-sm border border-[rgba(138,130,120,0.08)] p-10 text-center">
        <div className="w-14 h-14 rounded-full bg-[rgba(199,94,58,0.08)] flex items-center justify-center mx-auto mb-3">
          <Buildings size={24} className="text-terracotta" />
        </div>
        <h3 className="font-body text-sm font-semibold text-charcoal mb-1">
          {t('admin.companiesTitle') || 'Company Management'}
        </h3>
        <p className="font-body text-xs text-warm-gray max-w-md mx-auto">
          {t('admin.companiesPlaceholder') || 'This section will display all registered companies with their trial status, plan dates, and subscription details once companies begin registering through the Stripe checkout flow.'}
        </p>
        <div className="mt-4 flex items-center justify-center gap-4 text-xs text-warm-gray">
          <span className="flex items-center gap-1"><CheckCircle size={14} /> {t('admin.trialPeriod') || '7-day trial'}</span>
          <span className="flex items-center gap-1"><Timer size={14} /> {t('admin.annualPlan') || 'Annual plan'}</span>
          <span className="flex items-center gap-1"><XCircle size={14} /> {t('admin.autoRenewal') || 'Auto-renewal'}</span>
        </div>
      </div>
    </div>
  );
}
