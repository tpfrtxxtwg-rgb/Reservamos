import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  Plus, Pencil, Trash, Check, X, MapPin, MagnifyingGlass,
} from '@phosphor-icons/react';
import { trpc } from '@/providers/trpc';

const serviceIcons = [
  { value: 'AirplaneLanding', label: 'Airplane' },
  { value: 'MapTrifold', label: 'Tour' },
  { value: 'Clock', label: 'Clock' },
  { value: 'MapPin', label: 'Location' },
  { value: 'Car', label: 'Car' },
  { value: 'Boat', label: 'Boat' },
  { value: 'Bus', label: 'Bus' },
  { value: 'Star', label: 'Star' },
];

export default function AdminServices() {
  const { t } = useTranslation();
  const utils = trpc.useUtils();
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<number | null>(null);
  const [newName, setNewName] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [newIcon, setNewIcon] = useState('AirplaneLanding');
  const [newDesc, setNewDesc] = useState('');
  const [search, setSearch] = useState('');

  const { data: servicesList, isLoading } = trpc.service.listMine.useQuery();
  const createSvc = trpc.service.create.useMutation({
    onSuccess: () => { utils.service.listMine.invalidate(); setShowAdd(false); resetForm(); },
  });
  const updateSvc = trpc.service.update.useMutation({
    onSuccess: () => { utils.service.listMine.invalidate(); setEditing(null); },
  });
  const deleteSvc = trpc.service.delete.useMutation({
    onSuccess: () => utils.service.listMine.invalidate(),
  });

  const resetForm = () => {
    setNewName('');
    setNewSlug('');
    setNewIcon('AirplaneLanding');
    setNewDesc('');
  };

  const filteredServices = servicesList?.filter((s: any) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  ) || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="font-body text-warm-gray animate-pulse">{t('common.loading')}...</span>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-display text-xl font-semibold text-charcoal">{t('admin.services') || 'Services'}</h2>
          <p className="font-body text-sm text-warm-gray mt-1">{t('admin.servicesDesc') || 'Manage your service types (Airport Transfer, Tours, etc.)'}</p>
        </div>
        {!showAdd && (
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-terracotta text-white rounded-lg font-body text-sm font-medium hover:bg-terracotta-dark transition-colors shadow-sm">
            <Plus size={18} /> {t('common.add') || 'Add'}
          </button>
        )}
      </div>

      {/* Add Form */}
      {showAdd && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-sm border border-[rgba(138,130,120,0.12)] p-5 mb-6">
          <h3 className="font-body text-sm font-semibold text-charcoal mb-4">{t('admin.addService') || 'New Service'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="font-body text-xs font-medium text-warm-gray uppercase tracking-wide mb-1.5 block">{t('common.name')}</label>
              <input value={newName} onChange={e => { setNewName(e.target.value); setNewSlug(e.target.value.toLowerCase().replace(/\s+/g, '-')); }}
                placeholder="e.g. Airport Transfer" className="w-full h-10 bg-[#FAFAF8] border border-[rgba(138,130,120,0.2)] rounded-md px-3 font-body text-sm text-charcoal focus:border-terracotta outline-none" />
            </div>
            <div>
              <label className="font-body text-xs font-medium text-warm-gray uppercase tracking-wide mb-1.5 block">Slug</label>
              <input value={newSlug} onChange={e => setNewSlug(e.target.value)}
                placeholder="e.g. airport-transfer" className="w-full h-10 bg-[#FAFAF8] border border-[rgba(138,130,120,0.2)] rounded-md px-3 font-body text-sm text-charcoal focus:border-terracotta outline-none" />
            </div>
            <div>
              <label className="font-body text-xs font-medium text-warm-gray uppercase tracking-wide mb-1.5 block">Icon</label>
              <select value={newIcon} onChange={e => setNewIcon(e.target.value)}
                className="w-full h-10 bg-[#FAFAF8] border border-[rgba(138,130,120,0.2)] rounded-md px-3 font-body text-sm text-charcoal focus:border-terracotta outline-none">
                {serviceIcons.map(i => <option key={i.value} value={i.value}>{i.label}</option>)}
              </select>
            </div>
            <div>
              <label className="font-body text-xs font-medium text-warm-gray uppercase tracking-wide mb-1.5 block">Description</label>
              <input value={newDesc} onChange={e => setNewDesc(e.target.value)}
                placeholder="e.g. Private airport pickup and drop-off" className="w-full h-10 bg-[#FAFAF8] border border-[rgba(138,130,120,0.2)] rounded-md px-3 font-body text-sm text-charcoal focus:border-terracotta outline-none" />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => { setShowAdd(false); resetForm(); }}
              className="px-4 py-2 text-warm-gray font-body text-sm hover:text-charcoal transition-colors">{t('common.cancel')}</button>
            <button onClick={() => {
              if (!newName.trim() || !newSlug.trim()) return;
              createSvc.mutate({ name: newName, slug: newSlug, icon: newIcon, description: newDesc || undefined });
            }} disabled={createSvc.isPending || !newName.trim() || !newSlug.trim()}
              className="flex items-center gap-1 px-5 py-2 bg-terracotta text-white rounded-md font-body text-sm disabled:opacity-50 hover:bg-terracotta-dark transition-colors">
              <Check size={16} /> {t('common.save')}
            </button>
          </div>
        </motion.div>
      )}

      {/* Search */}
      <div className="relative mb-4">
        <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-gray" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder={t('admin.searchServices') || 'Search services...'}
          className="w-full md:w-80 h-10 bg-[#FAFAF8] border border-[rgba(138,130,120,0.15)] rounded-md pl-9 pr-4 font-body text-sm text-charcoal focus:border-terracotta outline-none" />
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-[rgba(138,130,120,0.08)] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[rgba(138,130,120,0.1)]">
              <th className="text-left px-6 py-3 font-body text-xs font-medium text-warm-gray uppercase tracking-wide">{t('common.name')}</th>
              <th className="text-left px-6 py-3 font-body text-xs font-medium text-warm-gray uppercase tracking-wide">Slug</th>
              <th className="text-left px-6 py-3 font-body text-xs font-medium text-warm-gray uppercase tracking-wide hidden md:table-cell">Description</th>
              <th className="text-center px-6 py-3 font-body text-xs font-medium text-warm-gray uppercase tracking-wide">Status</th>
              <th className="text-right px-6 py-3 font-body text-xs font-medium text-warm-gray uppercase tracking-wide">{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {filteredServices.map((svc: any) => (
              <tr key={svc.id} className="border-b border-[rgba(138,130,120,0.05)] hover:bg-sand-light/50 transition-colors">
                {editing === svc.id ? (
                  <>
                    <td colSpan={3} className="px-6 py-3">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <input defaultValue={svc.name} id={`edit-name-${svc.id}`}
                          className="w-full h-9 bg-[#FAFAF8] border border-[rgba(138,130,120,0.2)] rounded-md px-3 font-body text-sm" />
                        <input defaultValue={svc.slug} id={`edit-slug-${svc.id}`}
                          className="w-full h-9 bg-[#FAFAF8] border border-[rgba(138,130,120,0.2)] rounded-md px-3 font-body text-sm" />
                        <input defaultValue={svc.description || ''} id={`edit-desc-${svc.id}`}
                          className="w-full h-9 bg-[#FAFAF8] border border-[rgba(138,130,120,0.2)] rounded-md px-3 font-body text-sm" />
                      </div>
                    </td>
                    <td className="px-6 py-3 text-center">
                      <button onClick={() => updateSvc.mutate({ id: svc.id, active: !svc.active })}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-body text-xs font-medium ${svc.active ? 'bg-[rgba(45,106,79,0.1)] text-[#2D6A4F]' : 'bg-[rgba(178,58,47,0.1)] text-[#B23A2F]'}`}>
                        {svc.active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-6 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => {
                          const name = (document.getElementById(`edit-name-${svc.id}`) as HTMLInputElement)?.value;
                          const slug = (document.getElementById(`edit-slug-${svc.id}`) as HTMLInputElement)?.value;
                          const desc = (document.getElementById(`edit-desc-${svc.id}`) as HTMLInputElement)?.value;
                          updateSvc.mutate({ id: svc.id, name, slug, description: desc });
                        }} className="p-1.5 text-[#2D6A4F] hover:bg-[rgba(45,106,79,0.1)] rounded"><Check size={16} /></button>
                        <button onClick={() => setEditing(null)} className="p-1.5 text-[#B23A2F] hover:bg-[rgba(178,58,47,0.1)] rounded"><X size={16} /></button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-md bg-sand flex items-center justify-center text-terracotta">
                          <MapPin size={16} />
                        </div>
                        <span className="font-body text-sm font-medium text-charcoal">{svc.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-body text-xs text-warm-gray font-mono">{svc.slug}</td>
                    <td className="px-6 py-4 font-body text-xs text-warm-gray hidden md:table-cell max-w-[300px] truncate">{svc.description || '-'}</td>
                    <td className="px-6 py-4 text-center">
                      <button onClick={() => updateSvc.mutate({ id: svc.id, active: !svc.active })}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-body text-xs font-medium transition-all ${svc.active ? 'bg-[rgba(45,106,79,0.1)] text-[#2D6A4F]' : 'bg-[rgba(178,58,47,0.1)] text-[#B23A2F]'}`}>
                        {svc.active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => setEditing(svc.id)} className="p-1.5 text-warm-gray hover:text-terracotta transition-colors rounded"><Pencil size={16} /></button>
                        <button onClick={() => { if (confirm('Delete this service?')) deleteSvc.mutate({ id: svc.id }); }}
                          className="p-1.5 text-warm-gray hover:text-[#B23A2F] transition-colors rounded"><Trash size={16} /></button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {filteredServices.length === 0 && (
          <div className="text-center py-12">
            <MapPin size={32} className="text-warm-gray/30 mx-auto mb-3" />
            <p className="font-body text-sm text-warm-gray">{search ? 'No services match your search' : (t('admin.noServices') || 'No services yet. Add your first one!')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
