import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { trpc } from '@/providers/trpc.tsx';
import { ChartBar, Calendar, Filter, Car, MapTrifold, ArrowsLeftRight } from '@phosphor-icons/react';

export default function AdminReports() {
  const { t } = useTranslation();
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  const { data: summary } = trpc.reports.summary.useQuery(
    dateRange.start || dateRange.end
      ? { startDate: dateRange.start || undefined, endDate: dateRange.end || undefined }
      : undefined
  );

  const { data: byZoneVehicle } = trpc.reports.byZoneVehicle.useQuery(
    dateRange.start || dateRange.end
      ? { startDate: dateRange.start || undefined, endDate: dateRange.end || undefined }
      : undefined
  );

  const { data: byServiceType } = trpc.reports.byServiceType.useQuery(
    dateRange.start || dateRange.end
      ? { startDate: dateRange.start || undefined, endDate: dateRange.end || undefined }
      : undefined
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-bold text-charcoal">
            {t('admin.reports') || 'Reports'}
          </h2>
          <p className="font-body text-sm text-warm-gray mt-1">
            {t('admin.reportsDesc') || 'Booking analytics and insights'}
          </p>
        </div>
      </div>

      {/* Date Filter */}
      <div className="bg-white rounded-xl shadow-sm border border-[rgba(138,130,120,0.08)] p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter size={16} className="text-terracotta" />
          <h3 className="font-body text-xs font-semibold text-charcoal uppercase tracking-wide">
            {t('admin.dateRange') || 'Date Range'}
          </h3>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-gray" />
            <input
              type="date"
              value={dateRange.start}
              onChange={e => setDateRange(p => ({ ...p, start: e.target.value }))}
              className="w-full h-10 bg-[#FAFAF8] border border-[rgba(138,130,120,0.2)] rounded-md pl-9 pr-3 font-body text-sm text-charcoal focus:border-terracotta outline-none transition-all"
            />
          </div>
          <span className="font-body text-sm text-warm-gray">to</span>
          <div className="relative flex-1">
            <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-gray" />
            <input
              type="date"
              value={dateRange.end}
              onChange={e => setDateRange(p => ({ ...p, end: e.target.value }))}
              className="w-full h-10 bg-[#FAFAF8] border border-[rgba(138,130,120,0.2)] rounded-md pl-9 pr-3 font-body text-sm text-charcoal focus:border-terracotta outline-none transition-all"
            />
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-[rgba(138,130,120,0.08)] p-4">
          <div className="flex items-center gap-2 mb-2">
            <ChartBar size={16} className="text-terracotta" />
            <span className="font-body text-xs text-warm-gray uppercase tracking-wide">Total Bookings</span>
          </div>
          <p className="font-display text-2xl font-bold text-charcoal">{summary?.totalBookings || 0}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-[rgba(138,130,120,0.08)] p-4">
          <div className="flex items-center gap-2 mb-2">
            <ChartBar size={16} className="text-[#2D6A4F]" />
            <span className="font-body text-xs text-warm-gray uppercase tracking-wide">Total Revenue</span>
          </div>
          <p className="font-display text-2xl font-bold text-charcoal">${Number(summary?.totalRevenue || 0).toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-[rgba(138,130,120,0.08)] p-4">
          <div className="flex items-center gap-2 mb-2">
            <ArrowsLeftRight size={16} className="text-[#B45309]" />
            <span className="font-body text-xs text-warm-gray uppercase tracking-wide">One Way</span>
          </div>
          <p className="font-display text-2xl font-bold text-charcoal">{summary?.oneWayCount || 0}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-[rgba(138,130,120,0.08)] p-4">
          <div className="flex items-center gap-2 mb-2">
            <ArrowsLeftRight size={16} className="text-[#1D4ED8]" />
            <span className="font-body text-xs text-warm-gray uppercase tracking-wide">Round Trip</span>
          </div>
          <p className="font-display text-2xl font-bold text-charcoal">{summary?.roundTripCount || 0}</p>
        </div>
      </div>

      {/* By Zone & Vehicle */}
      <div className="bg-white rounded-xl shadow-sm border border-[rgba(138,130,120,0.08)] p-6">
        <div className="flex items-center gap-2 mb-4">
          <MapTrifold size={18} className="text-terracotta" />
          <h3 className="font-body text-sm font-semibold text-charcoal uppercase tracking-wide">
            {t('admin.byZoneVehicle') || 'Bookings by Zone & Vehicle'}
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#FAFAF8] border-b border-[rgba(138,130,120,0.08)]">
                <th className="text-left px-4 py-3 font-body text-[11px] font-medium text-warm-gray uppercase tracking-wide">Zone</th>
                <th className="text-left px-4 py-3 font-body text-[11px] font-medium text-warm-gray uppercase tracking-wide">Vehicle</th>
                <th className="text-right px-4 py-3 font-body text-[11px] font-medium text-warm-gray uppercase tracking-wide">Bookings</th>
                <th className="text-right px-4 py-3 font-body text-[11px] font-medium text-warm-gray uppercase tracking-wide">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {byZoneVehicle && byZoneVehicle.length > 0 ? (
                byZoneVehicle.map((row, i) => (
                  <tr key={i} className="border-b border-[rgba(138,130,120,0.05)] last:border-0 hover:bg-[#FAFAF8]/50 transition-colors">
                    <td className="px-4 py-3 font-body text-sm text-charcoal">{row.zoneName}</td>
                    <td className="px-4 py-3 font-body text-sm text-charcoal flex items-center gap-2">
                      <Car size={14} className="text-warm-gray" />{row.vehicleName}
                    </td>
                    <td className="px-4 py-3 font-body text-sm font-medium text-charcoal text-right">{row.totalBookings}</td>
                    <td className="px-4 py-3 font-body text-sm font-medium text-[#2D6A4F] text-right">${Number(row.totalRevenue).toFixed(2)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center font-body text-sm text-warm-gray">
                    No data available for the selected date range
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* By Service Type */}
      <div className="bg-white rounded-xl shadow-sm border border-[rgba(138,130,120,0.08)] p-6">
        <div className="flex items-center gap-2 mb-4">
          <ArrowsLeftRight size={18} className="text-terracotta" />
          <h3 className="font-body text-sm font-semibold text-charcoal uppercase tracking-wide">
            {t('admin.byServiceType') || 'By Service Type (One Way / Round Trip)'}
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#FAFAF8] border-b border-[rgba(138,130,120,0.08)]">
                <th className="text-left px-4 py-3 font-body text-[11px] font-medium text-warm-gray uppercase tracking-wide">Type</th>
                <th className="text-left px-4 py-3 font-body text-[11px] font-medium text-warm-gray uppercase tracking-wide">Zone</th>
                <th className="text-left px-4 py-3 font-body text-[11px] font-medium text-warm-gray uppercase tracking-wide">Vehicle</th>
                <th className="text-right px-4 py-3 font-body text-[11px] font-medium text-warm-gray uppercase tracking-wide">Bookings</th>
                <th className="text-right px-4 py-3 font-body text-[11px] font-medium text-warm-gray uppercase tracking-wide">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {byServiceType && byServiceType.length > 0 ? (
                byServiceType.map((row, i) => (
                  <tr key={i} className="border-b border-[rgba(138,130,120,0.05)] last:border-0 hover:bg-[#FAFAF8]/50 transition-colors">
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-body text-xs font-medium ${
                        row.tripType === 'round_trip'
                          ? 'bg-[rgba(29,78,216,0.1)] text-[#1D4ED8]'
                          : 'bg-[rgba(180,83,9,0.1)] text-[#B45309]'
                      }`}>
                        {row.tripType === 'round_trip' ? 'Round Trip' : 'One Way'}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-body text-sm text-charcoal">{row.zoneName}</td>
                    <td className="px-4 py-3 font-body text-sm text-charcoal flex items-center gap-2">
                      <Car size={14} className="text-warm-gray" />{row.vehicleName}
                    </td>
                    <td className="px-4 py-3 font-body text-sm font-medium text-charcoal text-right">{row.totalBookings}</td>
                    <td className="px-4 py-3 font-body text-sm font-medium text-[#2D6A4F] text-right">${Number(row.totalRevenue).toFixed(2)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center font-body text-sm text-warm-gray">
                    No data available for the selected date range
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
