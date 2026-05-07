import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Plus, Pencil, Trash, Check, ShoppingCart, Users, Money } from '@phosphor-icons/react';
import { trpc } from '@/providers/trpc';

interface Props {
  clientId: number;
}

export default function AdminOptionalServices({ clientId }: Props) {
  const { t } = useTranslation();
  const utils = trpc.useUtils();
  const [editing, setEditing] = useState<number | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [formData, setFormData] = useState({ name: '', slug: '', description: '', price: '0.00', perPassenger: false, sortOrder: 0 });
  const [editData, setEditData] = useState({ name: '', description: '', price: '0.00', perPassenger: false, sortOrder: 0 });

  const { data: services, isLoading } = trpc.optionalService.list.useQuery({ clientId });
  const createSvc = trpc.optionalService.create.useMutation({
    onSuccess: () => { utils.optionalService.list.invalidate(); setShowAdd(false); resetForm(); },
  });
  const updateSvc = trpc.optionalService.update.useMutation({
    onSuccess: () => { utils.optionalService.list.invalidate(); setEditing(null); },
  });
  const deleteSvc = trpc.optionalService.delete.useMutation({
    onSuccess: () => utils.optionalService.list.invalidate(),
  });

  const resetForm = () => setFormData({ name: '', slug: '', description: '', price: '0.00', perPassenger: false, sortOrder: 0 });

  const generateSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  if (isLoading) return <div className="flex items-center justify-center h-64"><span className="font-body text-warm-gray">{t('common.loading')}...</span></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-display text-xl font-semibold text-charcoal">{t('admin.optionalServices') || 'Optional Services'}</h2>
          <p className="font-body text-sm text-warm-gray mt-1">{t('admin.optionalServicesDesc') || 'Manage add-on services your customers can select during booking'}</p>
        </div>
        <button onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-terracotta text-white rounded-lg font-body text-sm font-medium hover:bg-terracotta-dark transition-colors">
          <Plus size={16} /> {t('common.add') || 'Add Service'}
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-sm border border-[rgba(138,130,120,0.12)] p-5 mb-4">
          <h3 className="font-body text-sm font-semibold text-charcoal mb-4">{t('admin.addOptionalService') || 'Add New Service'}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <div>
              <label className="font-body text-[11px] text-warm-gray mb-1 block">{t('admin.serviceName') || 'Service Name'}</label>
              <input type="text" value={formData.name}
                onChange={e => setFormData(p => ({ ...p, name: e.target.value, slug: generateSlug(e.target.value) }))}
                placeholder="e.g. Shopping Stop"
                className="w-full h-10 bg-[#FAFAF8] border border-[rgba(138,130,120,0.2)] rounded-md px-3 font-body text-sm text-charcoal focus:border-terracotta outline-none transition-all" />
            </div>
            <div>
              <label className="font-body text-[11px] text-warm-gray mb-1 block">{t('admin.price') || 'Price (USD)'}</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-body text-sm text-warm-gray">$</span>
                <input type="text" value={formData.price}
                  onChange={e => setFormData(p => ({ ...p, price: e.target.value }))}
                  placeholder="0.00"
                  className="w-full h-10 bg-[#FAFAF8] border border-[rgba(138,130,120,0.2)] rounded-md pl-7 pr-3 font-body text-sm text-charcoal focus:border-terracotta outline-none transition-all" />
              </div>
            </div>
          </div>
          <div className="mb-3">
            <label className="font-body text-[11px] text-warm-gray mb-1 block">{t('admin.description') || 'Description'}</label>
            <input type="text" value={formData.description}
              onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
              placeholder={t('admin.descriptionPlaceholder') || 'Brief description for customers...'}
              className="w-full h-10 bg-[#FAFAF8] border border-[rgba(138,130,120,0.2)] rounded-md px-3 font-body text-sm text-charcoal focus:border-terracotta outline-none transition-all" />
          </div>
          <div className="flex items-center gap-4 mb-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={formData.perPassenger}
                onChange={e => setFormData(p => ({ ...p, perPassenger: e.target.checked }))}
                className="w-4 h-4 accent-terracotta" />
              <span className="font-body text-sm text-charcoal">{t('admin.perPassenger') || 'Price is per passenger'}</span>
              <Users size={14} className="text-warm-gray" />
            </label>
          </div>
          <div className="flex gap-2">
            <button onClick={() => createSvc.mutate({ clientId, ...formData })}
              disabled={!formData.name.trim() || createSvc.isPending}
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

      {/* Services grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {services?.map((svc: any) => (
          <motion.div key={svc.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="bg-white rounded-lg shadow-sm border border-[rgba(138,130,120,0.08)] p-4">
            {editing === svc.id ? (
              <div>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <input type="text" value={editData.name}
                    onChange={e => setEditData(p => ({ ...p, name: e.target.value }))}
                    className="h-9 bg-[#FAFAF8] border border-[rgba(138,130,120,0.2)] rounded-md px-3 font-body text-sm text-charcoal focus:border-terracotta outline-none" />
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 font-body text-xs text-warm-gray">$</span>
                    <input type="text" value={editData.price}
                      onChange={e => setEditData(p => ({ ...p, price: e.target.value }))}
                      className="h-9 bg-[#FAFAF8] border border-[rgba(138,130,120,0.2)] rounded-md pl-6 pr-3 font-body text-sm text-charcoal focus:border-terracotta outline-none" />
                  </div>
                </div>
                <input type="text" value={editData.description}
                  onChange={e => setEditData(p => ({ ...p, description: e.target.value }))}
                  className="w-full h-9 bg-[#FAFAF8] border border-[rgba(138,130,120,0.2)] rounded-md px-3 font-body text-sm text-charcoal focus:border-terracotta outline-none mb-3" />
                <label className="flex items-center gap-2 cursor-pointer mb-3">
                  <input type="checkbox" checked={editData.perPassenger}
                    onChange={e => setEditData(p => ({ ...p, perPassenger: e.target.checked }))}
                    className="w-4 h-4 accent-terracotta" />
                  <span className="font-body text-xs text-charcoal">{t('admin.perPassenger') || 'Per passenger'}</span>
                </label>
                <div className="flex gap-2">
                  <button onClick={() => updateSvc.mutate({ id: svc.id, ...editData })}
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
                    <ShoppingCart size={20} />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-body text-sm font-semibold text-charcoal">{svc.name}</h4>
                    {svc.description && <p className="font-body text-xs text-warm-gray mt-0.5 line-clamp-2">{svc.description}</p>}
                    <div className="flex items-center gap-2 mt-2">
                      <span className="font-body text-sm font-bold text-terracotta flex items-center gap-1">
                        <Money size={14} />{parseFloat(svc.price) > 0 ? `$${parseFloat(svc.price).toFixed(2)}` : t('common.free') || 'Free'}
                      </span>
                      {svc.perPassenger && (
                        <span className="inline-flex items-center gap-1 bg-[rgba(199,94,58,0.08)] text-terracotta rounded-full px-2 py-0.5 font-body text-[10px] font-medium">
                          <Users size={10} /> {t('admin.perPassenger') || 'per pax'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => { setEditing(svc.id); setEditData({ name: svc.name, description: svc.description || '', price: String(svc.price), perPassenger: svc.perPassenger, sortOrder: svc.sortOrder }); }}
                    className="p-2 text-warm-gray hover:text-terracotta hover:bg-sand rounded transition-colors"><Pencil size={16} /></button>
                  <button onClick={() => { if (confirm(t('admin.confirmDelete') || 'Delete?')) deleteSvc.mutate({ id: svc.id }); }}
                    className="p-2 text-warm-gray hover:text-[#B23A2F] hover:bg-[rgba(178,58,47,0.1)] rounded transition-colors"><Trash size={16} /></button>
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>
      {(!services || services.length === 0) && (
        <div className="text-center py-12">
          <ShoppingCart size={32} className="text-warm-gray/30 mx-auto mb-3" />
          <p className="font-body text-sm text-warm-gray">{t('admin.noOptionalServices') || 'No optional services yet'}</p>
          <p className="font-body text-xs text-warm-gray mt-1">{t('admin.noOptionalServicesDesc') || 'Add services like shopping stops, car seats, etc.'}</p>
        </div>
      )}
    </div>
  );
}
