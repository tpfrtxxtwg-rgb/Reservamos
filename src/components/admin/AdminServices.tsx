import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  Plus, Pencil, Trash, Check, X, Airplane, MapTrifold, Clock,
  AirplaneLanding, Buildings, CheckCircle,
} from '@phosphor-icons/react';
import { trpc } from '@/providers/trpc';

type ServiceType = 'airport' | 'tour' | 'hourly';

export default function AdminServices() {
  const { t } = useTranslation();
  const utils = trpc.useUtils();
  const [activeType, setActiveType] = useState<ServiceType>('airport');

  // Services CRUD
  const [showAddService, setShowAddService] = useState(false);
  const [editingService, setEditingService] = useState<number | null>(null);
  const [svcName, setSvcName] = useState('');
  const [svcSlug, setSvcSlug] = useState('');
  const [svcDesc, setSvcDesc] = useState('');

  const { data: servicesList } = trpc.service.listMine.useQuery();
  const hourlySvc = servicesList?.find((s: any) => s.slug === 'hourly');
  const hourlyService = hourlySvc && hourlySvc.active ? hourlySvc : null;

  const createSvc = trpc.service.create.useMutation({
    onSuccess: () => { utils.service.listMine.invalidate(); resetSvcForm(); setShowAddService(false); },
  });
  const updateSvc = trpc.service.update.useMutation({
    onSuccess: () => { utils.service.listMine.invalidate(); setEditingService(null); },
  });
  const deleteSvc = trpc.service.delete.useMutation({
    onSuccess: () => utils.service.listMine.invalidate(),
  });

  // Airports CRUD
  const [showAddAirport, setShowAddAirport] = useState(false);
  const [editingAirport, setEditingAirport] = useState<number | null>(null);
  const [aptName, setAptName] = useState('');
  const [aptCode, setAptCode] = useState('');
  const [aptCity, setAptCity] = useState('');

  const { data: airportsList } = trpc.serviceAirport.listMine.useQuery();
  const createApt = trpc.serviceAirport.create.useMutation({
    onSuccess: () => { utils.serviceAirport.listMine.invalidate(); resetAptForm(); setShowAddAirport(false); },
  });
  const updateApt = trpc.serviceAirport.update.useMutation({
    onSuccess: () => { utils.serviceAirport.listMine.invalidate(); setEditingAirport(null); },
  });
  const deleteApt = trpc.serviceAirport.delete.useMutation({
    onSuccess: () => utils.serviceAirport.listMine.invalidate(),
  });

  // Tours CRUD
  const [showAddTour, setShowAddTour] = useState(false);
  const [editingTour, setEditingTour] = useState<number | null>(null);
  const [tourName, setTourName] = useState('');
  const [tourPrice, setTourPrice] = useState('');
  const [tourDesc, setTourDesc] = useState('');
  const [tourDuration, setTourDuration] = useState('');
  const [tourHighlights, setTourHighlights] = useState('');

  const { data: toursList } = trpc.serviceTour.listMine.useQuery();
  const createTour = trpc.serviceTour.create.useMutation({
    onSuccess: () => { utils.serviceTour.listMine.invalidate(); resetTourForm(); setShowAddTour(false); },
  });
  const updateTour = trpc.serviceTour.update.useMutation({
    onSuccess: () => { utils.serviceTour.listMine.invalidate(); setEditingTour(null); },
  });
  const deleteTour = trpc.serviceTour.delete.useMutation({
    onSuccess: () => utils.serviceTour.listMine.invalidate(),
  });

  const resetSvcForm = () => { setSvcName(''); setSvcSlug(''); setSvcDesc(''); };
  const resetAptForm = () => { setAptName(''); setAptCode(''); setAptCity(''); };
  const resetTourForm = () => { setTourName(''); setTourPrice(''); setTourDesc(''); setTourDuration(''); setTourHighlights(''); };

  // Tab config
  const tabs: { id: ServiceType; labelKey: string; icon: React.ReactNode; descKey: string }[] = [
    { id: 'airport', labelKey: 'admin.airportTransfers', icon: <Airplane size={18} />, descKey: 'admin.airportTransfersDesc' },
    { id: 'tour', labelKey: 'admin.privateTours', icon: <MapTrifold size={18} />, descKey: 'admin.privateToursDesc' },
    { id: 'hourly', labelKey: 'admin.byTheHour', icon: <Clock size={18} />, descKey: 'admin.byTheHourDesc' },
  ];

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-display text-xl font-semibold text-charcoal">{t('admin.services') || 'Services'}</h2>
        <p className="font-body text-sm text-warm-gray mt-1">{t('admin.configureServiceTypes') || 'Configure your service types and their options'}</p>
      </div>

      {/* Type Tabs */}
      <div className="flex gap-2 mb-6">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveType(tab.id)}
            className={`flex items-center gap-2 px-5 py-3 rounded-lg font-body text-sm font-medium transition-all ${
              activeType === tab.id
                ? 'bg-[#C75E3A] text-white shadow-sm'
                : 'bg-white text-warm-gray hover:text-charcoal border border-[rgba(138,130,120,0.12)]'
            }`}>
            {tab.icon} {t(tab.labelKey) || tab.id}
          </button>
        ))}
      </div>

      {/* AIRPORT TRANSFER TAB */}
      {activeType === 'airport' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-body text-base font-semibold text-charcoal">{t('admin.availableAirports') || 'Available Airports'}</h3>
              <p className="font-body text-xs text-warm-gray">{t('admin.airportDesc') || 'These airports will appear in the booking widget for customers to select'}</p>
            </div>
            {!showAddAirport && (
              <button onClick={() => setShowAddAirport(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-[#C75E3A] text-white rounded-lg font-body text-sm hover:bg-[#a84d2f] transition-colors">
                <Plus size={18} /> {t('admin.addAirport') || 'Add Airport'}
              </button>
            )}
          </div>

          {showAddAirport && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg shadow-sm border border-[rgba(138,130,120,0.12)] p-5 mb-6">
              <h4 className="font-body text-sm font-semibold text-charcoal mb-4">{t('admin.newAirport') || 'New Airport'}</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="font-body text-xs font-medium text-warm-gray uppercase mb-1.5 block">{t('admin.airportName') || 'Airport Name'}</label>
                  <input value={aptName} onChange={e => setAptName(e.target.value)}
                    placeholder={t('admin.airportNamePlaceholder') || 'e.g. Cancun International'} className="w-full h-10 bg-[#FAFAF8] border border-[rgba(138,130,120,0.2)] rounded-md px-3 font-body text-sm" />
                </div>
                <div>
                  <label className="font-body text-xs font-medium text-warm-gray uppercase mb-1.5 block">{t('admin.iataCode') || 'IATA Code'}</label>
                  <input value={aptCode} onChange={e => setAptCode(e.target.value.toUpperCase())}
                    placeholder={t('admin.iataCodePlaceholder') || 'e.g. CUN'} maxLength={10} className="w-full h-10 bg-[#FAFAF8] border border-[rgba(138,130,120,0.2)] rounded-md px-3 font-body text-sm" />
                </div>
                <div>
                  <label className="font-body text-xs font-medium text-warm-gray uppercase mb-1.5 block">{t('admin.city') || 'City'}</label>
                  <input value={aptCity} onChange={e => setAptCity(e.target.value)}
                    placeholder={t('admin.cityPlaceholder') || 'e.g. Cancun'} className="w-full h-10 bg-[#FAFAF8] border border-[rgba(138,130,120,0.2)] rounded-md px-3 font-body text-sm" />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={() => { setShowAddAirport(false); resetAptForm(); }} className="px-4 py-2 text-warm-gray font-body text-sm">{t('common.cancel') || 'Cancel'}</button>
                <button onClick={() => { if (!aptName.trim() || !aptCode.trim()) return; createApt.mutate({ name: aptName, code: aptCode, city: aptCity || undefined }); }}
                  disabled={createApt.isPending} className="flex items-center gap-1 px-5 py-2 bg-[#C75E3A] text-white rounded-md font-body text-sm disabled:opacity-50">
                  <Check size={16} /> {t('common.save') || 'Save'}
                </button>
              </div>
            </motion.div>
          )}

          {/* Airports Table */}
          <div className="bg-white rounded-lg shadow-sm border border-[rgba(138,130,120,0.08)] overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[rgba(138,130,120,0.1)]">
                  <th className="text-left px-6 py-3 font-body text-xs font-medium text-warm-gray uppercase">{t('admin.airport') || 'Airport'}</th>
                  <th className="text-left px-6 py-3 font-body text-xs font-medium text-warm-gray uppercase">{t('admin.code') || 'Code'}</th>
                  <th className="text-left px-6 py-3 font-body text-xs font-medium text-warm-gray uppercase">{t('admin.city') || 'City'}</th>
                  <th className="text-center px-6 py-3 font-body text-xs font-medium text-warm-gray uppercase">{t('admin.status') || 'Status'}</th>
                  <th className="text-right px-6 py-3 font-body text-xs font-medium text-warm-gray uppercase">{t('common.actions') || 'Actions'}</th>
                </tr>
              </thead>
              <tbody>
                {airportsList?.map((apt: any) => (
                  <tr key={apt.id} className="border-b border-[rgba(138,130,120,0.05)] hover:bg-sand-light/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-md bg-[rgba(199,94,58,0.1)] flex items-center justify-center text-[#C75E3A]">
                          <AirplaneLanding size={16} />
                        </div>
                        <span className="font-body text-sm font-medium text-charcoal">{apt.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-body text-sm font-mono text-warm-gray">{apt.code}</td>
                    <td className="px-6 py-4 font-body text-sm text-warm-gray">{apt.city || '-'}</td>
                    <td className="px-6 py-4 text-center">
                      <button onClick={() => updateApt.mutate({ id: apt.id, active: !apt.active })}
                        className={`px-2.5 py-1 rounded-full font-body text-xs font-medium ${apt.active ? 'bg-[rgba(45,106,79,0.1)] text-[#2D6A4F]' : 'bg-[rgba(178,58,47,0.1)] text-[#B23A2F]'}`}>
                        {apt.active ? (t('common.active') || 'Active') : (t('common.inactive') || 'Inactive')}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => deleteApt.mutate({ id: apt.id })} className="p-1.5 text-warm-gray hover:text-[#B23A2F]"><Trash size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(!airportsList || airportsList.length === 0) && (
              <div className="text-center py-12">
                <AirplaneLanding size={32} className="text-warm-gray/30 mx-auto mb-3" />
                <p className="font-body text-sm text-warm-gray">{t('admin.noAirports') || 'No airports yet. Add your first airport above.'}</p>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* PRIVATE TOURS TAB */}
      {activeType === 'tour' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-body text-base font-semibold text-charcoal">{t('admin.availableTours') || 'Available Tours'}</h3>
              <p className="font-body text-xs text-warm-gray">{t('admin.toursDesc') || 'These tours will appear for customers when they select Private Tour service'}</p>
            </div>
            {!showAddTour && (
              <button onClick={() => setShowAddTour(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-[#C75E3A] text-white rounded-lg font-body text-sm hover:bg-[#a84d2f] transition-colors">
                <Plus size={18} /> {t('admin.addTour') || 'Add Tour'}
              </button>
            )}
          </div>

          {showAddTour && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg shadow-sm border border-[rgba(138,130,120,0.12)] p-5 mb-6">
              <h4 className="font-body text-sm font-semibold text-charcoal mb-4">{t('admin.newTour') || 'New Tour'}</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="font-body text-xs font-medium text-warm-gray uppercase mb-1.5 block">{t('admin.tourName') || 'Tour Name'}</label>
                  <input value={tourName} onChange={e => setTourName(e.target.value)}
                    placeholder={t('admin.tourNamePlaceholder') || 'e.g. Tulum Ruins & Cenote'} className="w-full h-10 bg-[#FAFAF8] border border-[rgba(138,130,120,0.2)] rounded-md px-3 font-body text-sm" />
                </div>
                <div>
                  <label className="font-body text-xs font-medium text-warm-gray uppercase mb-1.5 block">{t('admin.price') || 'Price (USD)'}</label>
                  <input value={tourPrice} onChange={e => setTourPrice(e.target.value)}
                    placeholder={t('admin.pricePlaceholder') || 'e.g. 120.00'} className="w-full h-10 bg-[#FAFAF8] border border-[rgba(138,130,120,0.2)] rounded-md px-3 font-body text-sm" />
                </div>
                <div>
                  <label className="font-body text-xs font-medium text-warm-gray uppercase mb-1.5 block">{t('admin.duration') || 'Duration'}</label>
                  <input value={tourDuration} onChange={e => setTourDuration(e.target.value)}
                    placeholder={t('admin.durationPlaceholder') || 'e.g. 6 hours'} className="w-full h-10 bg-[#FAFAF8] border border-[rgba(138,130,120,0.2)] rounded-md px-3 font-body text-sm" />
                </div>
                <div>
                  <label className="font-body text-xs font-medium text-warm-gray uppercase mb-1.5 block">{t('admin.description') || 'Description'}</label>
                  <input value={tourDesc} onChange={e => setTourDesc(e.target.value)}
                    placeholder={t('admin.descriptionPlaceholder') || 'e.g. Visit the ancient Mayan ruins'} className="w-full h-10 bg-[#FAFAF8] border border-[rgba(138,130,120,0.2)] rounded-md px-3 font-body text-sm" />
                </div>
                <div className="md:col-span-2">
                  <label className="font-body text-xs font-medium text-warm-gray uppercase mb-1.5 block">{t('admin.highlights') || 'Highlights'}</label>
                  <input value={tourHighlights} onChange={e => setTourHighlights(e.target.value)}
                    placeholder={t('admin.highlightsPlaceholder') || 'e.g. Mayan ruins, Cenote swim, Beach time (comma separated)'} className="w-full h-10 bg-[#FAFAF8] border border-[rgba(138,130,120,0.2)] rounded-md px-3 font-body text-sm" />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={() => { setShowAddTour(false); resetTourForm(); }} className="px-4 py-2 text-warm-gray font-body text-sm">{t('common.cancel') || 'Cancel'}</button>
                <button onClick={() => { if (!tourName.trim()) return; createTour.mutate({ name: tourName, price: tourPrice || '0.00', description: tourDesc || undefined, duration: tourDuration || undefined, highlights: tourHighlights || undefined }); }}
                  disabled={createTour.isPending} className="flex items-center gap-1 px-5 py-2 bg-[#C75E3A] text-white rounded-md font-body text-sm disabled:opacity-50">
                  <Check size={16} /> {t('common.save') || 'Save'}
                </button>
              </div>
            </motion.div>
          )}

          {/* Tours Cards */}
          {toursList && toursList.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {toursList.map((tour: any) => (
                <div key={tour.id} className="bg-white rounded-lg shadow-sm border border-[rgba(138,130,120,0.08)] p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[rgba(45,106,79,0.1)] flex items-center justify-center text-[#2D6A4F]">
                        <MapTrifold size={20} />
                      </div>
                      <div>
                        <h4 className="font-body text-sm font-semibold text-charcoal">{tour.name}</h4>
                        {tour.duration && <span className="font-body text-xs text-warm-gray">{tour.duration}</span>}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => deleteTour.mutate({ id: tour.id })} className="p-1.5 text-warm-gray hover:text-[#B23A2F]"><Trash size={16} /></button>
                    </div>
                  </div>
                  {tour.description && <p className="font-body text-xs text-warm-gray mt-3">{tour.description}</p>}
                  {tour.highlights && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {tour.highlights.split(',').map((h: string, i: number) => (
                        <span key={i} className="font-body text-[10px] bg-sand text-warm-gray px-2 py-0.5 rounded-full">{h.trim()}</span>
                      ))}
                    </div>
                  )}
                  <div className="mt-3 flex items-center gap-2">
                    <button onClick={() => updateTour.mutate({ id: tour.id, active: !tour.active })}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-full font-body text-xs font-medium ${tour.active ? 'bg-[rgba(45,106,79,0.1)] text-[#2D6A4F]' : 'bg-[rgba(178,58,47,0.1)] text-[#B23A2F]'}`}>
                      {tour.active ? <CheckCircle size={12} /> : <X size={12} />} {tour.active ? (t('common.active') || 'Active') : (t('common.inactive') || 'Inactive')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-[rgba(138,130,120,0.08)] p-12 text-center">
              <MapTrifold size={32} className="text-warm-gray/30 mx-auto mb-3" />
              <p className="font-body text-sm text-warm-gray">{t('admin.noTours') || 'No tours yet. Add your first tour above.'}</p>
            </div>
          )}
        </motion.div>
      )}

      {/* BY THE HOUR TAB */}
      {activeType === 'hourly' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="bg-white rounded-lg shadow-sm border border-[rgba(138,130,120,0.08)] p-8 max-w-lg">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-lg bg-[rgba(199,94,58,0.1)] flex items-center justify-center text-[#C75E3A]">
                <Clock size={24} />
              </div>
              <div>
                <h3 className="font-body text-base font-semibold text-charcoal">{t('admin.hourlyService') || 'Hourly Service'}</h3>
                <p className="font-body text-sm text-warm-gray">{t('admin.hourlyServiceDesc') || "Vehicle and driver at customer's disposal"}</p>
              </div>
            </div>

            {hourlyService ? (
              <>
                <div className="flex items-center gap-3 mb-4 p-3 bg-[rgba(45,106,79,0.06)] rounded-lg">
                  <CheckCircle size={20} className="text-[#2D6A4F]" weight="fill" />
                  <span className="font-body text-sm font-medium text-[#2D6A4F]">{t('admin.hourlyServiceActive') || 'This service is currently active and visible to customers'}</span>
                </div>
                <button onClick={() => updateSvc.mutate({ id: hourlyService.id, active: false })}
                  className="px-5 py-2.5 bg-[#B23A2F] text-white rounded-lg font-body text-sm hover:bg-[#8f2d25] transition-colors">
                  {t('admin.deactivateHourly') || 'Deactivate Hourly Service'}
                </button>
              </>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-4 p-3 bg-[rgba(178,58,47,0.06)] rounded-lg">
                  <X size={20} className="text-[#B23A2F]" />
                  <span className="font-body text-sm font-medium text-[#B23A2F]">{t('admin.hourlyServiceInactive') || 'This service is currently inactive'}</span>
                </div>
                <p className="font-body text-xs text-warm-gray mb-4">
                  {t('admin.hourlyServiceInfo') || 'When activated, customers will see "By the Hour" as a booking option. Pricing is based on your vehicle hourly rates.'}
                </p>
                <button onClick={() => {
                  createSvc.mutate({ name: t('admin.byTheHour') || 'By the Hour', slug: 'hourly', icon: 'Clock', description: t('admin.hourlyServiceDesc') || 'Vehicle and driver at your disposal' });
                }} className="px-5 py-2.5 bg-[#2D6A4F] text-white rounded-lg font-body text-sm hover:bg-[#235442] transition-colors">
                  {t('admin.activateHourly') || 'Activate Hourly Service'}
                </button>
              </>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}
