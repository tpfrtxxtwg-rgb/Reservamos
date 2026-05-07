import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Plus, Pencil, Trash, Check, Car, Users, WifiHigh, Snowflake, Drop, Television, Wine } from '@phosphor-icons/react';
import { trpc } from '@/providers/trpc';

interface Props {
  clientId: number;
}

const featureOptions = ['WiFi', 'A/C', 'Agua', 'TV', 'Bar'];
const featureIcons: Record<string, React.ReactNode> = {
  WiFi: <WifiHigh size={14} />, 'A/C': <Snowflake size={14} />,
  Agua: <Drop size={14} />, TV: <Television size={14} />, Bar: <Wine size={14} />,
};

export default function AdminVehicles({ clientId }: Props) {
  const { t } = useTranslation();
  const utils = trpc.useUtils();
  const [editing, setEditing] = useState<number | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [formData, setFormData] = useState({
    name: '', capacityMin: 1, capacityMax: 6, features: [] as string[], sortOrder: 0,
  });
  const [editData, setEditData] = useState({ name: '', capacityMin: 1, capacityMax: 6, features: [] as string[], sortOrder: 0 });

  const { data: vehicles, isLoading } = trpc.vehicle.list.useQuery({ clientId });
  const createVeh = trpc.vehicle.create.useMutation({
    onSuccess: () => { utils.vehicle.list.invalidate(); setShowAdd(false); resetForm(); },
  });
  const updateVeh = trpc.vehicle.update.useMutation({
    onSuccess: () => { utils.vehicle.list.invalidate(); setEditing(null); },
  });
  const deleteVeh = trpc.vehicle.delete.useMutation({
    onSuccess: () => utils.vehicle.list.invalidate(),
  });

  const resetForm = () => setFormData({ name: '', capacityMin: 1, capacityMax: 6, features: [], sortOrder: 0 });

  const toggleFeature = (feat: string, isEdit: boolean) => {
    if (isEdit) {
      setEditData(prev => ({
        ...prev,
        features: prev.features.includes(feat) ? prev.features.filter(f => f !== feat) : [...prev.features, feat],
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        features: prev.features.includes(feat) ? prev.features.filter(f => f !== feat) : [...prev.features, feat],
      }));
    }
  };

  if (isLoading) return <div className="flex items-center justify-center h-64"><span className="font-body text-warm-gray">{t('common.loading')}...</span></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-display text-xl font-semibold text-charcoal">{t('admin.vehicles') || 'Vehicles'}</h2>
          <p className="font-body text-sm text-warm-gray mt-1">{t('admin.vehiclesDesc') || 'Manage your fleet. Each vehicle will have its own price table per zone.'}</p>
        </div>
        <button onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-terracotta text-white rounded-lg font-body text-sm font-medium hover:bg-terracotta-dark transition-colors">
          <Plus size={16} /> {t('common.add') || 'Add Vehicle'}
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-sm border border-[rgba(138,130,120,0.12)] p-5 mb-4">
          <h3 className="font-body text-sm font-semibold text-charcoal mb-4">{t('admin.addVehicle') || 'Add New Vehicle'}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
            <div>
              <label className="font-body text-[11px] text-warm-gray mb-1 block">{t('admin.vehicleName') || 'Vehicle Name'}</label>
              <input type="text" value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                placeholder="e.g. Suburban"
                className="w-full h-10 bg-[#FAFAF8] border border-[rgba(138,130,120,0.2)] rounded-md px-3 font-body text-sm text-charcoal focus:border-terracotta outline-none transition-all" />
            </div>
            <div>
              <label className="font-body text-[11px] text-warm-gray mb-1 block">{t('admin.capacityMin') || 'Min Passengers'}</label>
              <input type="number" min={1} max={50} value={formData.capacityMin}
                onChange={e => setFormData(p => ({ ...p, capacityMin: Number(e.target.value) }))}
                className="w-full h-10 bg-[#FAFAF8] border border-[rgba(138,130,120,0.2)] rounded-md px-3 font-body text-sm text-charcoal focus:border-terracotta outline-none transition-all" />
            </div>
            <div>
              <label className="font-body text-[11px] text-warm-gray mb-1 block">{t('admin.capacityMax') || 'Max Passengers'}</label>
              <input type="number" min={1} max={50} value={formData.capacityMax}
                onChange={e => setFormData(p => ({ ...p, capacityMax: Number(e.target.value) }))}
                className="w-full h-10 bg-[#FAFAF8] border border-[rgba(138,130,120,0.2)] rounded-md px-3 font-body text-sm text-charcoal focus:border-terracotta outline-none transition-all" />
            </div>
          </div>
          <div className="mb-4">
            <label className="font-body text-[11px] text-warm-gray mb-1.5 block">{t('admin.features') || 'Features'}</label>
            <div className="flex gap-2 flex-wrap">
              {featureOptions.map(feat => (
                <button key={feat} onClick={() => toggleFeature(feat, false)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-body text-xs font-medium transition-all ${formData.features.includes(feat) ? 'bg-terracotta text-white' : 'bg-[#FAFAF8] text-warm-gray border border-[rgba(138,130,120,0.15)] hover:text-charcoal'}`}>
                  {featureIcons[feat]} {feat}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => createVeh.mutate({ clientId, ...formData })}
              disabled={!formData.name.trim() || createVeh.isPending}
              className="flex items-center gap-1 px-4 py-2 bg-terracotta text-white rounded-md font-body text-sm disabled:opacity-50 hover:bg-terracotta-dark transition-colors">
              <Check size={16} /> {t('common.save') || 'Save'}
            </button>
            <button onClick={() => { setShowAdd(false); resetForm(); }}
              className="px-4 py-2 border border-[rgba(138,130,120,0.2)] rounded-md font-body text-sm text-warm-gray hover:text-charcoal transition-colors">
              {t('common.cancel') || 'Cancel'}
            </button>
          </div>
        </motion.div>
      )}

      {/* Vehicles grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AnimatePresence>
          {vehicles?.map((v: any) => (
            <motion.div key={v.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="bg-white rounded-lg shadow-sm border border-[rgba(138,130,120,0.08)] p-4">
              {editing === v.id ? (
                <div>
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <input type="text" value={editData.name}
                      onChange={e => setEditData(p => ({ ...p, name: e.target.value }))}
                      className="h-9 bg-[#FAFAF8] border border-[rgba(138,130,120,0.2)] rounded-md px-3 font-body text-sm text-charcoal focus:border-terracotta outline-none" />
                    <input type="number" value={editData.capacityMin}
                      onChange={e => setEditData(p => ({ ...p, capacityMin: Number(e.target.value) }))}
                      className="h-9 bg-[#FAFAF8] border border-[rgba(138,130,120,0.2)] rounded-md px-3 font-body text-sm text-charcoal focus:border-terracotta outline-none" />
                    <input type="number" value={editData.capacityMax}
                      onChange={e => setEditData(p => ({ ...p, capacityMax: Number(e.target.value) }))}
                      className="h-9 bg-[#FAFAF8] border border-[rgba(138,130,120,0.2)] rounded-md px-3 font-body text-sm text-charcoal focus:border-terracotta outline-none" />
                  </div>
                  <div className="flex gap-2 flex-wrap mb-3">
                    {featureOptions.map(feat => (
                      <button key={feat} onClick={() => toggleFeature(feat, true)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-body text-[11px] font-medium transition-all ${editData.features.includes(feat) ? 'bg-terracotta text-white' : 'bg-[#FAFAF8] text-warm-gray border border-[rgba(138,130,120,0.15)]'}`}>
                        {featureIcons[feat]} {feat}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => updateVeh.mutate({ id: v.id, ...editData })}
                      className="flex items-center gap-1 px-3 py-1.5 bg-terracotta text-white rounded-md font-body text-xs hover:bg-terracotta-dark transition-colors">
                      <Check size={14} /> {t('common.save')}
                    </button>
                    <button onClick={() => setEditing(null)}
                      className="px-3 py-1.5 border border-[rgba(138,130,120,0.2)] rounded-md font-body text-xs text-warm-gray hover:text-charcoal transition-colors">
                      {t('common.cancel')}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-sand flex items-center justify-center text-terracotta">
                      <Car size={20} />
                    </div>
                    <div>
                      <h4 className="font-body text-sm font-semibold text-charcoal">{v.name}</h4>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="flex items-center gap-1 font-body text-xs text-warm-gray"><Users size={12} /> {v.capacityMin}-{v.capacityMax}</span>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {(v.features || []).map((f: string) => (
                          <span key={f} className="inline-flex items-center gap-0.5 bg-sand rounded-full px-2 py-0.5 font-body text-[11px] text-warm-gray">{featureIcons[f] || null}{f}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => { setEditing(v.id); setEditData({ name: v.name, capacityMin: v.capacityMin, capacityMax: v.capacityMax, features: v.features || [], sortOrder: v.sortOrder }); }}
                      className="p-2 text-warm-gray hover:text-terracotta hover:bg-sand rounded transition-colors"><Pencil size={16} /></button>
                    <button onClick={() => { if (confirm(t('admin.confirmDelete') || 'Delete?')) deleteVeh.mutate({ id: v.id }); }}
                      className="p-2 text-warm-gray hover:text-[#B23A2F] hover:bg-[rgba(178,58,47,0.1)] rounded transition-colors"><Trash size={16} /></button>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      {(!vehicles || vehicles.length === 0) && (
        <div className="text-center py-12">
          <Car size={32} className="text-warm-gray/30 mx-auto mb-3" />
          <p className="font-body text-sm text-warm-gray">{t('admin.noVehicles') || 'No vehicles yet'}</p>
        </div>
      )}
    </div>
  );
}
