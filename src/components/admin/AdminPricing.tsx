import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Pencil, Check, X, Money, Car, ArrowRight, ArrowsLeftRight } from '@phosphor-icons/react';
import { trpc } from '@/providers/trpc.tsx';

export default function AdminPricing() {
  const { t } = useTranslation();
  const utils = trpc.useUtils();
  const [editingCell, setEditingCell] = useState<string | null>(null);
  const [editPrices, setEditPrices] = useState({ oneWay: '', roundTrip: '' });

  const { data: zones, isLoading: zonesLoading } = trpc.zone.listMine.useQuery();
  const { data: vehicles, isLoading: vehiclesLoading } = trpc.vehicle.listMine.useQuery();
  const { data: allPrices, isLoading: pricesLoading } = trpc.vehicleZonePrice.listMine.useQuery();

  const upsertPrice = trpc.vehicleZonePrice.upsert.useMutation({
    onSuccess: () => {
      utils.vehicleZonePrice.listMine.invalidate();
      setEditingCell(null);
    },
  });

  // Build price map: "zoneId-vehicleId" -> { oneWayPrice, roundTripPrice, id? }
  const priceMap: Record<string, { oneWay: string; roundTrip: string; id?: number }> = {};
  allPrices?.forEach((p: any) => {
    if (p.zoneId && p.vehicleId) {
      priceMap[`${p.zoneId}-${p.vehicleId}`] = {
        oneWay: String(p.oneWayPrice),
        roundTrip: String(p.roundTripPrice),
        id: p.id,
      };
    }
  });

  const activeZones = zones?.filter((z: any) => z.active) || [];
  const activeVehicles = vehicles?.filter((v: any) => v.active) || [];

  const startEdit = (zoneId: number, vehicleId: number) => {
    const key = `${zoneId}-${vehicleId}`;
    const existing = priceMap[key];
    setEditPrices({
      oneWay: existing?.oneWay || '',
      roundTrip: existing?.roundTrip || '',
    });
    setEditingCell(key);
  };

  const savePrice = (zoneId: number, vehicleId: number) => {
    const oneWay = editPrices.oneWay || '0.00';
    const roundTrip = editPrices.roundTrip || '0.00';
    if (!/^\d+(\.\d{2})?$/.test(oneWay) || !/^\d+(\.\d{2})?$/.test(roundTrip)) return;
    upsertPrice.mutate({ zoneId, vehicleId, oneWayPrice: oneWay, roundTripPrice: roundTrip });
  };

  if (zonesLoading || vehiclesLoading || pricesLoading) {
    return <div className="flex items-center justify-center h-64"><span className="font-body text-warm-gray">{t('common.loading')}...</span></div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-display text-xl font-semibold text-charcoal">{t('admin.pricing') || 'Pricing Matrix'}</h2>
          <p className="font-body text-sm text-warm-gray mt-1">{t('admin.pricingDesc') || 'Set One Way and Round Trip prices for each vehicle in each zone'}</p>
        </div>
      </div>

      <div className="flex gap-4 mb-4">
        <div className="flex items-center gap-1.5 font-body text-xs text-warm-gray">
          <ArrowRight size={14} className="text-terracotta" /> {t('common.oneWay') || 'One Way'}
        </div>
        <div className="flex items-center gap-1.5 font-body text-xs text-warm-gray">
          <ArrowsLeftRight size={14} className="text-[#2D6A4F]" /> {t('common.roundTrip') || 'Round Trip'}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-[rgba(138,130,120,0.08)] overflow-hidden overflow-x-auto">
        <table className="w-full min-w-[600px]">
          <thead>
            <tr className="border-b border-[rgba(138,130,120,0.1)]">
              <th className="text-left px-4 py-3 font-body text-xs font-medium text-warm-gray uppercase tracking-wide sticky left-0 bg-white z-10 min-w-[140px]">
                <div className="flex items-center gap-1"><Money size={14} className="text-terracotta" /> {t('admin.vehicle') || 'Vehicle'}</div>
              </th>
              {activeZones.map((zone: any) => (
                <th key={zone.id} className="text-center px-3 py-3 font-body text-xs font-medium text-warm-gray uppercase tracking-white min-w-[160px]">
                  {zone.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {activeVehicles.map((vehicle: any) => (
              <tr key={vehicle.id} className="border-b border-[rgba(138,130,120,0.05)] hover:bg-sand-light/30 transition-colors">
                <td className="px-4 py-3 sticky left-0 bg-white z-10">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-md bg-sand flex items-center justify-center text-terracotta">
                      <Car size={16} />
                    </div>
                    <div>
                      <span className="font-body text-sm font-medium text-charcoal block">{vehicle.name}</span>
                      <span className="font-body text-[11px] text-warm-gray">{vehicle.capacityMin}-{vehicle.capacityMax} pax</span>
                    </div>
                  </div>
                </td>
                {activeZones.map((zone: any) => {
                  const key = `${zone.id}-${vehicle.id}`;
                  const price = priceMap[key];
                  const isEditing = editingCell === key;
                  return (
                    <td key={key} className="px-3 py-3 text-center">
                      {isEditing ? (
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                          className="space-y-1.5">
                          <div className="relative">
                            <ArrowRight size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-terracotta" />
                            <input type="text" value={editPrices.oneWay}
                              onChange={e => setEditPrices(p => ({ ...p, oneWay: e.target.value }))}
                              placeholder="0.00"
                              className="w-full h-8 bg-[#FAFAF8] border border-[rgba(138,130,120,0.2)] rounded-md pl-7 pr-2 font-body text-xs text-charcoal focus:border-terracotta outline-none"
                              autoFocus />
                          </div>
                          <div className="relative">
                            <ArrowsLeftRight size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-[#2D6A4F]" />
                            <input type="text" value={editPrices.roundTrip}
                              onChange={e => setEditPrices(p => ({ ...p, roundTrip: e.target.value }))}
                              placeholder="0.00"
                              className="w-full h-8 bg-[#FAFAF8] border border-[rgba(138,130,120,0.2)] rounded-md pl-7 pr-2 font-body text-xs text-charcoal focus:border-terracotta outline-none" />
                          </div>
                          <div className="flex gap-1 justify-center">
                            <button onClick={() => savePrice(zone.id, vehicle.id)}
                              disabled={upsertPrice.isPending}
                              className="p-1 text-[#2D6A4F] hover:bg-[rgba(45,106,79,0.1)] rounded transition-colors">
                              <Check size={14} />
                            </button>
                            <button onClick={() => setEditingCell(null)}
                              className="p-1 text-[#B23A2F] hover:bg-[rgba(178,58,47,0.1)] rounded transition-colors">
                              <X size={14} />
                            </button>
                          </div>
                        </motion.div>
                      ) : (
                        <button onClick={() => startEdit(zone.id, vehicle.id)}
                          className="w-full py-2 px-2 rounded-md hover:bg-sand transition-colors group text-center">
                          {price ? (
                            <div className="space-y-0.5">
                              <div className="flex items-center justify-center gap-1">
                                <ArrowRight size={11} className="text-terracotta" />
                                <span className="font-body text-sm font-semibold text-charcoal">${price.oneWay}</span>
                              </div>
                              <div className="flex items-center justify-center gap-1">
                                <ArrowsLeftRight size={11} className="text-[#2D6A4F]" />
                                <span className="font-body text-xs text-warm-gray">${price.roundTrip}</span>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center gap-1 text-warm-gray/40 group-hover:text-terracotta">
                              <Pencil size={12} />
                              <span className="font-body text-xs">{t('common.setPrice') || 'Set price'}</span>
                            </div>
                          )}
                        </button>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        {(!activeZones.length || !activeVehicles.length) && (
          <div className="text-center py-12">
            <Money size={32} className="text-warm-gray/30 mx-auto mb-3" />
            <p className="font-body text-sm text-warm-gray">
              {!activeZones.length ? (t('admin.needZones') || 'Create zones first') : (t('admin.needVehicles') || 'Add vehicles first')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
