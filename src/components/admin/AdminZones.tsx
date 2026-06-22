import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Plus, Pencil, Trash, X, Check, MapPin } from '@phosphor-icons/react';
import { trpc } from '@/providers/trpc';

interface Props {
  clientId: number;
}

export default function AdminZones({ clientId }: Props) {
  const { t } = useTranslation();
  const utils = trpc.useUtils();
  const [editing, setEditing] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');

  const { data: zones, isLoading } = trpc.zone.listMine.useQuery();
  const createZone = trpc.zone.create.useMutation({
    onSuccess: () => { utils.zone.listMine.invalidate(); setShowAdd(false); setNewName(''); },
  });
  const updateZone = trpc.zone.update.useMutation({
    onSuccess: () => { utils.zone.listMine.invalidate(); setEditing(null); },
  });
  const deleteZone = trpc.zone.delete.useMutation({
    onSuccess: () => utils.zone.listMine.invalidate(),
  });

  if (isLoading) return <div className="flex items-center justify-center h-64"><span className="font-body text-warm-gray">{t('common.loading')}...</span></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-display text-xl font-semibold text-charcoal">{t('admin.zones') || 'Zones'}</h2>
          <p className="font-body text-sm text-warm-gray mt-1">{t('admin.zonesDesc') || 'Manage pricing zones for your service area'}</p>
        </div>
        <button onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-terracotta text-white rounded-lg font-body text-sm font-medium hover:bg-terracotta-dark transition-colors">
          <Plus size={16} /> {t('common.add') || 'Add'}
        </button>
      </div>

      {showAdd && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-sm border border-[rgba(138,130,120,0.12)] p-4 mb-4">
          <div className="flex items-center gap-3">
            <MapPin size={18} className="text-terracotta" />
            <input type="text" value={newName} onChange={e => setNewName(e.target.value)}
              placeholder={t('admin.zone') || 'Zone name...'}
              className="flex-1 h-10 bg-[#FAFAF8] border border-[rgba(138,130,120,0.2)] rounded-md px-3 font-body text-sm text-charcoal focus:border-terracotta outline-none transition-all"
              autoFocus />
            <button onClick={() => createZone.mutate({ name: newName })}
              disabled={!newName.trim() || createZone.isPending}
              className="flex items-center gap-1 px-4 py-2 bg-terracotta text-white rounded-md font-body text-sm disabled:opacity-50 hover:bg-terracotta-dark transition-colors">
              <Check size={16} /> {t('common.save') || 'Save'}
            </button>
            <button onClick={() => { setShowAdd(false); setNewName(''); }}
              className="p-2 text-warm-gray hover:text-charcoal transition-colors"><X size={18} /></button>
          </div>
        </motion.div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-[rgba(138,130,120,0.08)] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[rgba(138,130,120,0.1)]">
              <th className="text-left px-6 py-3 font-body text-xs font-medium text-warm-gray uppercase tracking-wide">{t('admin.zone') || 'Zone'}</th>
              <th className="text-left px-6 py-3 font-body text-xs font-medium text-warm-gray uppercase tracking-wide">{t('common.status') || 'Status'}</th>
              <th className="text-right px-6 py-3 font-body text-xs font-medium text-warm-gray uppercase tracking-wide"></th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {zones?.map((zone: any) => (
                <motion.tr key={zone.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="border-b border-[rgba(138,130,120,0.05)] hover:bg-sand-light/50 transition-colors">
                  <td className="px-6 py-4">
                    {editing === zone.id ? (
                      <div className="flex items-center gap-2">
                        <input type="text" value={editName} onChange={e => setEditName(e.target.value)}
                          className="h-9 bg-[#FAFAF8] border border-[rgba(138,130,120,0.2)] rounded-md px-3 font-body text-sm text-charcoal focus:border-terracotta outline-none"
                          autoFocus />
                        <button onClick={() => updateZone.mutate({ id: zone.id, name: editName })}
                          className="p-1.5 text-[#2D6A4F] hover:bg-[rgba(45,106,79,0.1)] rounded transition-colors"><Check size={16} /></button>
                        <button onClick={() => setEditing(null)}
                          className="p-1.5 text-[#B23A2F] hover:bg-[rgba(178,58,47,0.1)] rounded transition-colors"><X size={16} /></button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <MapPin size={16} className="text-terracotta" />
                        <span className="font-body text-sm font-medium text-charcoal">{zone.name}</span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <button onClick={() => updateZone.mutate({ id: zone.id, active: !zone.active })}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-body text-xs font-medium transition-all ${zone.active ? 'bg-[rgba(45,106,79,0.1)] text-[#2D6A4F]' : 'bg-[rgba(138,130,120,0.1)] text-warm-gray'}`}>
                      {zone.active ? <Check size={12} weight="bold" /> : <X size={12} weight="bold" />}
                      {zone.active ? (t('common.active') || 'Active') : (t('common.inactive') || 'Inactive')}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => { setEditing(zone.id); setEditName(zone.name); }}
                        className="p-2 text-warm-gray hover:text-terracotta hover:bg-sand rounded transition-colors"><Pencil size={16} /></button>
                      <button onClick={() => { if (confirm(t('admin.confirmDelete') || 'Delete this zone?')) deleteZone.mutate({ id: zone.id }); }}
                        className="p-2 text-warm-gray hover:text-[#B23A2F] hover:bg-[rgba(178,58,47,0.1)] rounded transition-colors"><Trash size={16} /></button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
        {(!zones || zones.length === 0) && (
          <div className="text-center py-12">
            <MapPin size={32} className="text-warm-gray/30 mx-auto mb-3" />
            <p className="font-body text-sm text-warm-gray">{t('admin.noZones') || 'No zones created yet'}</p>
          </div>
        )}
      </div>
    </div>
  );
}
