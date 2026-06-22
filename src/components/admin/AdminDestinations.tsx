import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Plus, Pencil, Trash, X, Check, Buildings, MagnifyingGlass, UploadSimple, ListBullets } from '@phosphor-icons/react';
import { trpc } from '@/providers/trpc';

interface Props {
  clientId: number;
}

export default function AdminDestinations({ clientId }: Props) {
  const { t } = useTranslation();
  const utils = trpc.useUtils();
  const [selectedZone, setSelectedZone] = useState<number | 'all'>('all');
  const [editing, setEditing] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newZoneId, setNewZoneId] = useState<number>(0);
  const [search, setSearch] = useState('');
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [bulkZoneId, setBulkZoneId] = useState<number>(0);

  const { data: zones } = trpc.zone.listMine.useQuery();
  const { data: destinations, isLoading } = trpc.destination.listMine.useQuery();
  const createDest = trpc.destination.create.useMutation({
    onSuccess: () => { utils.destination.listMine.invalidate(); setShowAdd(false); setNewName(''); },
  });
  const updateDest = trpc.destination.update.useMutation({
    onSuccess: () => { utils.destination.listMine.invalidate(); setEditing(null); },
  });
  const deleteDest = trpc.destination.delete.useMutation({
    onSuccess: () => utils.destination.listMine.invalidate(),
  });
  const bulkImport = trpc.destination.bulkImport.useMutation({
    onSuccess: (data) => {
      utils.destination.listMine.invalidate();
      setBulkText('');
      setShowBulkImport(false);
      alert(t('admin.hotelsImported', { count: data.count }) || `${data.count} hotels imported successfully`);
    },
  });

  const filteredDestinations = destinations?.filter((d: any) => {
    const matchesZone = selectedZone === 'all' || d.zoneId === selectedZone;
    const matchesSearch = !search || d.name.toLowerCase().includes(search.toLowerCase());
    return matchesZone && matchesSearch;
  });

  if (isLoading) return <div className="flex items-center justify-center h-64"><span className="font-body text-warm-gray">{t('common.loading')}...</span></div>;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="font-display text-xl font-semibold text-charcoal">{t('admin.destinations') || 'Hotels & Destinations'}</h2>
          <p className="font-body text-sm text-warm-gray mt-1">{t('admin.destinationsDesc') || 'Manage hotels and destinations within each zone'}</p>
        </div>
        <div className="flex items-center gap-2 self-start">
          <button onClick={() => { setShowAdd(true); setNewZoneId(zones?.[0]?.id || 0); setShowBulkImport(false); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-terracotta text-white rounded-lg font-body text-sm font-medium hover:bg-terracotta-dark transition-colors">
            <Plus size={16} /> {t('common.add') || 'Add Hotel'}
          </button>
          <button onClick={() => { setShowBulkImport(true); setBulkZoneId(zones?.[0]?.id || 0); setShowAdd(false); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-white text-terracotta border-2 border-terracotta rounded-lg font-body text-sm font-medium hover:bg-[rgba(199,94,58,0.05)] transition-colors">
            <UploadSimple size={16} /> {t('admin.bulkImport') || 'Bulk Import'}
          </button>
        </div>
      </div>

      {/* Zone filter + Search */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setSelectedZone('all')}
            className={`px-3 py-1.5 rounded-md font-body text-xs font-medium transition-all ${selectedZone === 'all' ? 'bg-terracotta text-white' : 'bg-white text-warm-gray hover:text-charcoal border border-[rgba(138,130,120,0.15)]'}`}>
            {t('common.all') || 'All'}
          </button>
          {zones?.map((z: any) => (
            <button key={z.id} onClick={() => setSelectedZone(z.id)}
              className={`px-3 py-1.5 rounded-md font-body text-xs font-medium transition-all ${selectedZone === z.id ? 'bg-terracotta text-white' : 'bg-white text-warm-gray hover:text-charcoal border border-[rgba(138,130,120,0.15)]'}`}>
              {z.name}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-xs">
          <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-gray" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder={t('common.search') || 'Search hotels...'}
            className="w-full h-9 bg-white border border-[rgba(138,130,120,0.2)] rounded-md pl-9 pr-3 font-body text-sm text-charcoal placeholder:text-warm-gray/50 focus:border-terracotta outline-none transition-all" />
        </div>
      </div>

      {/* Add form */}
      {showAdd && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-sm border border-[rgba(138,130,120,0.12)] p-4 mb-4">
          <div className="flex items-center gap-3 flex-wrap">
            <Buildings size={18} className="text-terracotta" />
            <select value={newZoneId} onChange={e => setNewZoneId(Number(e.target.value))}
              className="h-10 bg-[#FAFAF8] border border-[rgba(138,130,120,0.2)] rounded-md px-3 font-body text-sm text-charcoal focus:border-terracotta outline-none">
              {zones?.map((z: any) => <option key={z.id} value={z.id}>{z.name}</option>)}
            </select>
            <input type="text" value={newName} onChange={e => setNewName(e.target.value)}
              placeholder={t('admin.hotelName') || 'Hotel name...'}
              className="flex-1 min-w-[200px] h-10 bg-[#FAFAF8] border border-[rgba(138,130,120,0.2)] rounded-md px-3 font-body text-sm text-charcoal focus:border-terracotta outline-none transition-all"
              autoFocus />
            <button onClick={() => createDest.mutate({ zoneId: newZoneId, name: newName })}
              disabled={!newName.trim() || createDest.isPending}
              className="flex items-center gap-1 px-4 py-2 bg-terracotta text-white rounded-md font-body text-sm disabled:opacity-50 hover:bg-terracotta-dark transition-colors">
              <Check size={16} /> {t('common.save') || 'Save'}
            </button>
            <button onClick={() => { setShowAdd(false); setNewName(''); }}
              className="p-2 text-warm-gray hover:text-charcoal transition-colors"><X size={18} /></button>
          </div>
        </motion.div>
      )}

      {/* Bulk Import Form */}
      {showBulkImport && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-sm border border-[rgba(199,94,58,0.15)] p-5 mb-4">
          <div className="flex items-center gap-2 mb-4">
            <ListBullets size={18} className="text-terracotta" />
            <h3 className="font-body text-sm font-semibold text-charcoal">{t('admin.bulkImportTitle') || 'Import Multiple Hotels'}</h3>
          </div>
          <div className="space-y-4">
            {/* Zone selector */}
            <div>
              <label className="font-body text-xs font-medium text-warm-gray uppercase tracking-wide mb-1.5 block">
                {t('admin.zone') || 'Zone'}
              </label>
              <select value={bulkZoneId} onChange={e => setBulkZoneId(Number(e.target.value))}
                className="w-full sm:w-auto h-10 bg-[#FAFAF8] border border-[rgba(138,130,120,0.2)] rounded-md px-3 font-body text-sm text-charcoal focus:border-terracotta outline-none">
                {zones?.map((z: any) => <option key={z.id} value={z.id}>{z.name}</option>)}
              </select>
            </div>
            {/* Textarea */}
            <div>
              <label className="font-body text-xs font-medium text-warm-gray uppercase tracking-wide mb-1.5 block">
                {t('admin.hotelList') || 'Hotel Names'}
              </label>
              <textarea
                value={bulkText}
                onChange={e => setBulkText(e.target.value)}
                placeholder={t('admin.bulkImportPlaceholder') || 'Enter hotel names separated by commas or one per line...\n\nExample:\nHotel Cancun, Hotel Maya, Hotel Riviera\n or:\nHotel Cancun\nHotel Maya\nHotel Riviera'}
                rows={8}
                className="w-full bg-[#FAFAF8] border border-[rgba(138,130,120,0.2)] rounded-md px-3 py-2.5 font-body text-sm text-charcoal placeholder:text-warm-gray/50 placeholder:font-body placeholder:text-xs focus:border-terracotta outline-none transition-all resize-vertical"
              />
              {bulkText.trim() && (
                <p className="font-body text-xs text-warm-gray mt-1.5">
                  {t('admin.hotelsDetected', { count: bulkText.split(/[\n,]/).filter((n: string) => n.trim()).length }) || `${bulkText.split(/[\n,]/).filter((n: string) => n.trim()).length} hotels detected`}
                </p>
              )}
            </div>
            {/* Buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  const names = bulkText
                    .split(/[\n,]/)
                    .map((n: string) => n.trim())
                    .filter((n: string) => n.length > 0);
                  if (names.length === 0) return;
                  bulkImport.mutate({ zoneId: bulkZoneId, names });
                }}
                disabled={!bulkText.trim() || bulkImport.isPending}
                className="flex items-center gap-2 px-5 py-2.5 bg-terracotta text-white rounded-md font-body text-sm font-medium disabled:opacity-50 hover:bg-terracotta-dark transition-colors"
              >
                {bulkImport.isPending ? (
                  <span>{t('common.importing') || 'Importing...'}</span>
                ) : (
                  <>
                    <UploadSimple size={16} />
                    <span>{t('common.import') || 'Import Hotels'}</span>
                  </>
                )}
              </button>
              <button onClick={() => { setShowBulkImport(false); setBulkText(''); }}
                className="px-4 py-2.5 border border-[rgba(138,130,120,0.3)] text-warm-gray rounded-md font-body text-sm font-medium hover:bg-[rgba(138,130,120,0.05)] transition-colors">
                {t('common.cancel') || 'Cancel'}
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-[rgba(138,130,120,0.08)] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[rgba(138,130,120,0.1)]">
              <th className="text-left px-6 py-3 font-body text-xs font-medium text-warm-gray uppercase tracking-wide">{t('admin.hotel') || 'Hotel'}</th>
              <th className="text-left px-6 py-3 font-body text-xs font-medium text-warm-gray uppercase tracking-wide">{t('admin.zone') || 'Zone'}</th>
              <th className="text-left px-6 py-3 font-body text-xs font-medium text-warm-gray uppercase tracking-wide">{t('common.status') || 'Status'}</th>
              <th className="text-right px-6 py-3 font-body text-xs font-medium text-warm-gray uppercase tracking-wide"></th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {filteredDestinations?.map((dest: any) => (
                <motion.tr key={dest.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="border-b border-[rgba(138,130,120,0.05)] hover:bg-sand-light/50 transition-colors">
                  <td className="px-6 py-4">
                    {editing === dest.id ? (
                      <div className="flex items-center gap-2">
                        <input type="text" value={editName} onChange={e => setEditName(e.target.value)}
                          className="h-9 bg-[#FAFAF8] border border-[rgba(138,130,120,0.2)] rounded-md px-3 font-body text-sm text-charcoal focus:border-terracotta outline-none"
                          autoFocus />
                        <button onClick={() => updateDest.mutate({ id: dest.id, name: editName })}
                          className="p-1.5 text-[#2D6A4F] hover:bg-[rgba(45,106,79,0.1)] rounded transition-colors"><Check size={16} /></button>
                        <button onClick={() => setEditing(null)}
                          className="p-1.5 text-[#B23A2F] hover:bg-[rgba(178,58,47,0.1)] rounded transition-colors"><X size={16} /></button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Buildings size={16} className="text-warm-gray" />
                        <span className="font-body text-sm font-medium text-charcoal">{dest.name}</span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-body text-sm text-warm-gray">{dest.zone?.name || 'Zone'}</span>
                  </td>
                  <td className="px-6 py-4">
                    <button onClick={() => updateDest.mutate({ id: dest.id, active: !dest.active })}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-body text-xs font-medium transition-all ${dest.active ? 'bg-[rgba(45,106,79,0.1)] text-[#2D6A4F]' : 'bg-[rgba(138,130,120,0.1)] text-warm-gray'}`}>
                      {dest.active ? <Check size={12} weight="bold" /> : <X size={12} weight="bold" />}
                      {dest.active ? (t('common.active') || 'Active') : (t('common.inactive') || 'Inactive')}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => { setEditing(dest.id); setEditName(dest.name); }}
                        className="p-2 text-warm-gray hover:text-terracotta hover:bg-sand rounded transition-colors"><Pencil size={16} /></button>
                      <button onClick={() => { if (confirm(t('admin.confirmDelete') || 'Delete this hotel?')) deleteDest.mutate({ id: dest.id }); }}
                        className="p-2 text-warm-gray hover:text-[#B23A2F] hover:bg-[rgba(178,58,47,0.1)] rounded transition-colors"><Trash size={16} /></button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
        {(!filteredDestinations || filteredDestinations.length === 0) && (
          <div className="text-center py-12">
            <Buildings size={32} className="text-warm-gray/30 mx-auto mb-3" />
            <p className="font-body text-sm text-warm-gray">{t('admin.noDestinations') || 'No hotels found'}</p>
          </div>
        )}
      </div>
    </div>
  );
}
