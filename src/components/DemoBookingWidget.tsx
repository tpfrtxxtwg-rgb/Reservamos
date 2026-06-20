import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '../hooks/useTranslation';
import {
  AirplaneLanding, MapPin, Calendar, Clock,
  Users, Check, ArrowRight, ArrowLeft,
  Suitcase, Package, ShoppingCart,
  CreditCard, ShieldCheck,
  ArrowsLeftRight, AirplaneTilt, Buildings,
  WifiHigh, Snowflake, Drop, Television,
} from '@phosphor-icons/react';

type TripType = 'one_way' | 'round_trip' | null;
type LuggageType = 'standard' | 'oversized' | 'extra';
type VehicleType = 'suburban' | 'van' | 'sprinter' | null;

interface DemoState {
  step: number;
  tripType: TripType;
  origin: string;
  destination: string;
  date: string;
  time: string;
  passengers: number;
  luggage: LuggageType;
  vehicle: VehicleType;
  flightNumber: string;
  airline: string;
  departureDate: string;
  departureTime: string;
  hotelPickupTime: string;
  name: string;
  lastName: string;
  email: string;
  phone: string;
  notes: string;
}

const stepVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 40 : -40, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -40 : 40, opacity: 0 }),
};

const timeSlots = ['06:00 AM','07:00 AM','08:00 AM','09:00 AM','10:00 AM','11:00 AM','12:00 PM','01:00 PM','02:00 PM','03:00 PM','04:00 PM','05:00 PM','06:00 PM','07:00 PM','08:00 PM'];

const airports = [
  'Cancun International Airport (CUN)',
  'Los Cabos International Airport (SJD)',
  'Puerto Vallarta International Airport (PVR)',
];

const destinations = [
  'Hotel Zone - Cancun',
  'Playa del Carmen',
  'Tulum Centro',
  'Puerto Morelos',
  'Puerto Aventuras',
  'Akumal',
  'Downtown Cancun',
];

const vehicles = [
  {
    id: 'suburban' as VehicleType,
    name: 'Suburban SUV',
    capacity: '1-6',
    price: 85,
    features: ['WiFi', 'A/C', 'Agua'],
    image: '/vehicle-suburban.jpg',
  },
  {
    id: 'van' as VehicleType,
    name: 'Passenger Van',
    capacity: '7-10',
    price: 120,
    features: ['WiFi', 'A/C', 'TV'],
    image: '/vehicle-van.jpg',
  },
  {
    id: 'sprinter' as VehicleType,
    name: 'Sprinter',
    capacity: '11-16',
    price: 180,
    features: ['WiFi', 'A/C', 'Bar'],
    image: '/vehicle-sprinter.jpg',
  },
];

const featureIcons: Record<string, React.ReactNode> = {
  WiFi: <WifiHigh size={12} weight="fill" />,
  'A/C': <Snowflake size={12} weight="fill" />,
  Agua: <Drop size={12} weight="fill" />,
  TV: <Television size={12} weight="fill" />,
  Bar: <Wine size={12} weight="fill" />,
};

import { Wine } from '@phosphor-icons/react';

const TAX_RATE = 0.16;

export default function DemoBookingWidget() {
  const { t } = useTranslation();
  const [step, setStep] = useState(1);
  const [dir, setDir] = useState(1);
  const [confirmed, setConfirmed] = useState(false);

  const [s, setS] = useState<DemoState>({
    step: 1, tripType: null, origin: '', destination: '', date: '', time: '',
    passengers: 2, luggage: 'standard', vehicle: null,
    flightNumber: '', airline: '', departureDate: '', departureTime: '', hotelPickupTime: '',
    name: '', lastName: '', email: '', phone: '', notes: '',
  });

  const update = (u: Partial<DemoState>) => setS(p => ({ ...p, ...u }));

  const selectedVehicle = vehicles.find(v => v.id === s.vehicle);
  const basePrice = selectedVehicle ? selectedVehicle.price : 0;
  const tax = Math.round(basePrice * TAX_RATE * 100) / 100;
  const total = Math.round((basePrice + tax) * 100) / 100;

  const canProceed = () => {
    switch (step) {
      case 1: return !!s.tripType;
      case 2: return !!s.origin && !!s.destination && !!s.date && !!s.time && !!s.flightNumber && !!s.airline;
      case 3: return !!s.vehicle;
      case 4: return true;
      case 5: return !!s.name && !!s.lastName && !!s.email;
      default: return false;
    }
  };

  const next = () => { if (step < 5) { setDir(1); setStep(p => p + 1); } else setConfirmed(true); };
  const back = () => { if (step > 1) { setDir(-1); setStep(p => p - 1); } };
  const reset = () => { setS({ step: 1, tripType: null, origin: '', destination: '', date: '', time: '', passengers: 2, luggage: 'standard', vehicle: null, flightNumber: '', airline: '', departureDate: '', departureTime: '', hotelPickupTime: '', name: '', lastName: '', email: '', phone: '', notes: '' }); setStep(1); setConfirmed(false); };

  const progressWidth = step === 5 ? 100 : ((step - 1) / 4) * 100;

  if (confirmed) return (
    <div className="w-full max-w-[420px] bg-white rounded-2xl border border-[rgba(138,130,120,0.12)] shadow-lg overflow-hidden">
      <div className="h-14 bg-terracotta flex items-center justify-between px-5">
        <span className="font-body text-white font-semibold text-base">{t('widget.title') || 'Book Now'}</span>
        <div className="flex items-center gap-1.5 text-white/80">
          <ShieldCheck size={14} weight="fill" />
          <span className="font-body text-[11px]">{t('common.securePayment') || 'Secure'}</span>
        </div>
      </div>
      <div className="flex items-center justify-center py-10 px-6">
        <div className="text-center">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="w-16 h-16 rounded-full bg-[rgba(45,106,79,0.1)] flex items-center justify-center mx-auto mb-5">
            <Check size={32} weight="bold" className="text-[#2D6A4F]" />
          </motion.div>
          <h3 className="font-display text-2xl font-bold text-charcoal mb-2">{t('widget.confirmation.title') || 'Booking Confirmed!'}</h3>
          <p className="font-body text-sm text-warm-gray mb-5">{t('widget.confirmation.message') || 'Your reservation has been submitted.'}</p>
          <button onClick={reset} className="w-full h-12 border-2 border-terracotta text-terracotta rounded-lg font-body font-semibold text-sm hover:bg-terracotta hover:text-white transition-all">
            {t('widget.confirmation.newBooking') || 'New Booking'}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full max-w-[420px] bg-white rounded-2xl border border-[rgba(138,130,120,0.12)] shadow-lg overflow-hidden">
      <div className="h-14 bg-terracotta flex items-center justify-between px-5">
        <span className="font-body text-white font-semibold text-base">{t('widget.title') || 'Book Now'}</span>
        <div className="flex items-center gap-1.5 text-white/80">
          <ShieldCheck size={14} weight="fill" />
          <span className="font-body text-[11px]">{t('common.securePayment') || 'Secure'}</span>
        </div>
      </div>
      <div className="h-[3px] bg-[rgba(199,94,58,0.15)]">
        <motion.div className="h-full bg-terracotta" initial={false} animate={{ width: `${progressWidth}%` }} transition={{ duration: 0.4 }} />
      </div>
      <div className="relative min-h-[420px]">
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div key={step} custom={dir} variants={stepVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }} className="p-6">

            {/* STEP 1: Trip Type */}
            {step === 1 && (
              <div>
                <h2 className="font-display text-[22px] font-bold text-charcoal mb-1">{t('widget.step1.title') || 'Select Trip'}</h2>
                <p className="font-body text-[13px] text-warm-gray mb-4">{t('widget.step1.subtitle') || 'Choose your transfer type'}</p>

                <div className="flex gap-2 mb-5 p-1 bg-[#FAFAF8] rounded-lg">
                  <button onClick={() => update({ tripType: 'one_way' })}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md font-body text-sm font-medium transition-all ${s.tripType === 'one_way' ? 'bg-white text-terracotta shadow-sm' : 'text-warm-gray hover:text-charcoal'}`}>
                    <ArrowRight size={18} /> {t('widget.tripType.oneWay') || 'One Way'}
                  </button>
                  <button onClick={() => update({ tripType: 'round_trip' })}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md font-body text-sm font-medium transition-all ${s.tripType === 'round_trip' ? 'bg-white text-terracotta shadow-sm' : 'text-warm-gray hover:text-charcoal'}`}>
                    <ArrowsLeftRight size={18} /> {t('widget.tripType.roundTrip') || 'Round Trip'}
                  </button>
                </div>

                {/* Transfer service card - always selected */}
                <div className="p-4 rounded-lg border-2 border-terracotta bg-[rgba(199,94,58,0.04)] flex items-center gap-4 mb-6">
                  <div className="text-terracotta"><AirplaneLanding size={28} /></div>
                  <div>
                    <span className="font-body text-[15px] font-medium text-charcoal block">{t('widget.service.transfer') || 'Airport Transfer'}</span>
                    <span className="font-body text-xs text-warm-gray">{t('widget.service.transferDesc') || 'Private transportation to/from airport'}</span>
                  </div>
                  <Check size={20} className="text-terracotta ml-auto" weight="bold" />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="font-body text-sm text-warm-gray" />
                  <button onClick={next} disabled={!canProceed()}
                    className={`flex items-center gap-2 px-6 py-3 rounded-full font-body font-semibold text-sm transition-all ${canProceed() ? 'bg-terracotta text-white shadow-button hover:bg-terracotta-dark hover:-translate-y-0.5' : 'bg-terracotta/50 text-white/70 cursor-not-allowed'}`}>
                    {t('common.continue') || 'Continue'} <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: Details */}
            {step === 2 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <button onClick={back} className="text-warm-gray hover:text-charcoal transition-colors"><ArrowLeft size={20} /></button>
                  <h2 className="font-display text-[22px] font-bold text-charcoal">{t('widget.step2.arrivalTitle') || 'Trip Details'}</h2>
                </div>
                <p className="font-body text-[13px] text-warm-gray mb-4">{t('widget.step2.arrivalSubtitle') || 'Enter your arrival and destination details'}</p>

                <div className="space-y-4 mb-6">
                  {/* Airport */}
                  <div>
                    <label className="font-body text-xs font-medium text-warm-gray uppercase tracking-wide mb-1.5 block">{t('widget.step2.pickupLocation') || 'Airport'}</label>
                    <div className="relative">
                      <AirplaneTilt size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-gray" />
                      <select value={s.origin} onChange={e => update({ origin: e.target.value })}
                        className="w-full h-12 bg-[#FAFAF8] border border-[rgba(138,130,120,0.2)] rounded-md pl-10 pr-4 font-body text-sm text-charcoal focus:border-terracotta outline-none appearance-none">
                        <option value="">{t('widget.step2.selectAirport') || 'Select airport'}</option>
                        {airports.map(a => <option key={a} value={a}>{a}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Flight Info */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-body text-[11px] text-warm-gray mb-1 block">{t('widget.flight.airline') || 'Airline'}</label>
                      <input type="text" value={s.airline} onChange={e => update({ airline: e.target.value })}
                        placeholder="American Airlines" className="w-full h-11 bg-[#FAFAF8] border border-[rgba(138,130,120,0.2)] rounded-md px-3 font-body text-sm text-charcoal placeholder:text-warm-gray/50 focus:border-terracotta outline-none" />
                    </div>
                    <div>
                      <label className="font-body text-[11px] text-warm-gray mb-1 block">{t('widget.flight.flightNumber') || 'Flight Number'}</label>
                      <input type="text" value={s.flightNumber} onChange={e => update({ flightNumber: e.target.value })}
                        placeholder="AA1234" className="w-full h-11 bg-[#FAFAF8] border border-[rgba(138,130,120,0.2)] rounded-md px-3 font-body text-sm text-charcoal placeholder:text-warm-gray/50 focus:border-terracotta outline-none" />
                    </div>
                  </div>

                  {/* Date & Time */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-body text-xs font-medium text-warm-gray uppercase tracking-wide mb-1.5 block">{t('widget.step2.date') || 'Date'}</label>
                      <div className="relative">
                        <Calendar size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-gray" />
                        <input type="date" value={s.date} min={new Date().toISOString().split('T')[0]}
                          onChange={e => update({ date: e.target.value })}
                          className="w-full h-12 bg-[#FAFAF8] border border-[rgba(138,130,120,0.2)] rounded-md pl-10 pr-4 font-body text-sm text-charcoal focus:border-terracotta outline-none" />
                      </div>
                    </div>
                    <div>
                      <label className="font-body text-xs font-medium text-warm-gray uppercase tracking-wide mb-1.5 block">{t('widget.step2.time') || 'Time'}</label>
                      <div className="relative">
                        <Clock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-gray" />
                        <select value={s.time} onChange={e => update({ time: e.target.value })}
                          className="w-full h-12 bg-[#FAFAF8] border border-[rgba(138,130,120,0.2)] rounded-md pl-10 pr-4 font-body text-sm text-charcoal focus:border-terracotta outline-none appearance-none">
                          <option value="">{t('widget.step2.selectTime') || 'Select'}</option>
                          {timeSlots.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Destination */}
                  <div>
                    <label className="font-body text-xs font-medium text-warm-gray uppercase tracking-wide mb-1.5 block">{t('widget.step2.destination') || 'Destination'}</label>
                    <div className="relative">
                      <Buildings size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-gray" />
                      <select value={s.destination} onChange={e => update({ destination: e.target.value })}
                        className="w-full h-12 bg-[#FAFAF8] border border-[rgba(138,130,120,0.2)] rounded-md pl-10 pr-4 font-body text-sm text-charcoal focus:border-terracotta outline-none appearance-none">
                        <option value="">{t('widget.step2.selectDestination') || 'Select destination'}</option>
                        {destinations.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Passengers */}
                  <div>
                    <label className="font-body text-xs font-medium text-warm-gray uppercase tracking-wide mb-1.5 block">{t('widget.step2.passengers') || 'Passengers'}</label>
                    <div className="relative">
                      <Users size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-gray" />
                      <div className="flex items-center h-12 bg-[#FAFAF8] border border-[rgba(138,130,120,0.2)] rounded-md pl-10 pr-3">
                        <button onClick={() => update({ passengers: Math.max(1, s.passengers - 1) })}
                          className="w-8 h-8 rounded-md bg-white border border-[rgba(138,130,120,0.2)] flex items-center justify-center font-body font-semibold text-charcoal hover:border-terracotta">-</button>
                        <span className="flex-1 text-center font-body text-sm font-medium text-charcoal">{s.passengers} {s.passengers > 1 ? 'passengers' : 'passenger'}</span>
                        <button onClick={() => update({ passengers: Math.min(16, s.passengers + 1) })}
                          className="w-8 h-8 rounded-md bg-white border border-[rgba(138,130,120,0.2)] flex items-center justify-center font-body font-semibold text-charcoal hover:border-terracotta">+</button>
                      </div>
                    </div>
                  </div>

                  {/* Luggage */}
                  <div>
                    <label className="font-body text-xs font-medium text-warm-gray uppercase tracking-wide mb-1.5 block">{t('widget.step2.luggage') || 'Luggage'}</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'standard' as LuggageType, label: t('widget.step2.luggageStandard') || 'Standard', icon: <Suitcase size={18} /> },
                        { id: 'oversized' as LuggageType, label: t('widget.step2.luggageOversized') || 'Oversized', icon: <Package size={18} /> },
                        { id: 'extra' as LuggageType, label: t('widget.step2.luggageExtra') || 'Extra', icon: <ShoppingCart size={18} /> },
                      ].map(opt => (
                        <button key={opt.id} onClick={() => update({ luggage: opt.id })}
                          className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all ${s.luggage === opt.id ? 'border-terracotta bg-[rgba(199,94,58,0.04)]' : 'border-[rgba(138,130,120,0.15)] bg-white hover:border-[rgba(138,130,120,0.3)]'}`}>
                          <span className={s.luggage === opt.id ? 'text-terracotta' : 'text-warm-gray'}>{opt.icon}</span>
                          <span className={`font-body text-[11px] font-medium ${s.luggage === opt.id ? 'text-terracotta' : 'text-charcoal'}`}>{opt.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Round trip departure info */}
                  {s.tripType === 'round_trip' && (
                    <div className="border-t border-[rgba(138,130,120,0.12)] pt-4">
                      <h3 className="font-body text-sm font-semibold text-charcoal mb-3 flex items-center gap-2">
                        <ArrowsLeftRight size={16} className="text-terracotta" />{t('widget.flight.departureTitle') || 'Return Trip'}
                      </h3>
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                          <label className="font-body text-[11px] text-warm-gray mb-1 block">{t('widget.flight.departureDate') || 'Return Date'}</label>
                          <input type="date" value={s.departureDate} min={s.date || new Date().toISOString().split('T')[0]}
                            onChange={e => update({ departureDate: e.target.value })}
                            className="w-full h-11 bg-[#FAFAF8] border border-[rgba(138,130,120,0.2)] rounded-md px-3 font-body text-sm text-charcoal focus:border-terracotta outline-none" />
                        </div>
                        <div>
                          <label className="font-body text-[11px] text-warm-gray mb-1 block">{t('widget.flight.departureTime') || 'Pickup Time'}</label>
                          <select value={s.departureTime} onChange={e => update({ departureTime: e.target.value })}
                            className="w-full h-11 bg-[#FAFAF8] border border-[rgba(138,130,120,0.2)] rounded-md px-3 font-body text-sm text-charcoal focus:border-terracotta outline-none appearance-none">
                            <option value="">{t('widget.step2.selectTime') || 'Select'}</option>
                            {timeSlots.map(o => <option key={o} value={o}>{o}</option>)}
                          </select>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <button onClick={next} disabled={!canProceed()}
                  className={`w-full flex items-center justify-center gap-2 h-12 rounded-full font-body font-semibold text-sm transition-all ${canProceed() ? 'bg-terracotta text-white shadow-button hover:bg-terracotta-dark hover:-translate-y-0.5' : 'bg-terracotta/50 text-white/70 cursor-not-allowed'}`}>
                  {t('common.continue') || 'Continue'} <ArrowRight size={16} />
                </button>
              </div>
            )}

            {/* STEP 3: Vehicle */}
            {step === 3 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <button onClick={back} className="text-warm-gray hover:text-charcoal transition-colors"><ArrowLeft size={20} /></button>
                  <h2 className="font-display text-[22px] font-bold text-charcoal">{t('widget.step3.title') || 'Select Vehicle'}</h2>
                </div>

                <div className="bg-sand rounded-lg p-3 mb-4">
                  <div className="font-body text-xs text-warm-gray">{s.destination} · {s.date} · {s.passengers} passengers</div>
                </div>

                <div className="space-y-3 mb-4">
                  {vehicles.map(vehicle => {
                    const vTax = Math.round(vehicle.price * TAX_RATE * 100) / 100;
                    const vTotal = Math.round((vehicle.price + vTax) * 100) / 100;
                    return (
                      <button key={vehicle.id} onClick={() => update({ vehicle: vehicle.id })}
                        className={`w-full flex gap-4 p-4 rounded-lg border-2 text-left transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${s.vehicle === vehicle.id ? 'border-terracotta bg-[rgba(199,94,58,0.03)]' : 'border-[rgba(138,130,120,0.12)] bg-white'}`}>
                        <img src={vehicle.image} alt={vehicle.name} className="w-20 h-[60px] object-cover rounded-md flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-body text-[15px] font-semibold text-charcoal">{vehicle.name}</span>
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${s.vehicle === vehicle.id ? 'border-terracotta' : 'border-warm-gray'}`}>
                              {s.vehicle === vehicle.id && <div className="w-2.5 h-2.5 rounded-full bg-terracotta" />}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 mb-2">
                            <Users size={12} className="text-warm-gray" />
                            <span className="font-body text-xs text-warm-gray">{vehicle.capacity} passengers</span>
                          </div>
                          <div className="flex flex-wrap gap-1 mb-1">
                            {vehicle.features.map(f => (
                              <span key={f} className="inline-flex items-center gap-0.5 bg-sand rounded-full px-2 py-0.5 font-body text-[11px] text-warm-gray">{featureIcons[f] || null}{f}</span>
                            ))}
                          </div>
                          <span className="font-body text-lg font-bold text-terracotta">${vehicle.price} USD</span>
                          <span className="font-body text-xs text-warm-gray ml-2">(Total: ${vTotal} USD)</span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="font-body text-sm text-warm-gray">Total: <span className="font-bold text-terracotta text-base">${total.toFixed(2)} USD</span></div>
                  <button onClick={next} disabled={!canProceed()}
                    className={`flex items-center gap-2 px-6 py-3 rounded-full font-body font-semibold text-sm transition-all ${canProceed() ? 'bg-terracotta text-white shadow-button hover:bg-terracotta-dark hover:-translate-y-0.5' : 'bg-terracotta/50 text-white/70 cursor-not-allowed'}`}>
                    {t('common.continue') || 'Continue'} <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: Summary */}
            {step === 4 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <button onClick={back} className="text-warm-gray hover:text-charcoal transition-colors"><ArrowLeft size={20} /></button>
                  <h2 className="font-display text-[22px] font-bold text-charcoal">{t('widget.step4.title') || 'Summary'}</h2>
                </div>

                <div className="bg-sand rounded-lg p-4 mb-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="font-body text-sm text-charcoal">Airport Transfer — {s.destination}</span>
                    <span className="font-body text-sm font-medium text-charcoal">${basePrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-body text-sm text-charcoal">{selectedVehicle?.name}</span>
                    <span className="font-body text-sm text-warm-gray">{s.tripType === 'round_trip' ? 'Round Trip' : 'One Way'}</span>
                  </div>
                  <div className="border-t border-[rgba(138,130,120,0.15)] my-1" />
                  <div className="flex justify-between">
                    <span className="font-body text-sm text-warm-gray">Subtotal</span>
                    <span className="font-body text-sm text-charcoal">${basePrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-body text-sm text-warm-gray">IVA (16%)</span>
                    <span className="font-body text-sm text-charcoal">${tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-body text-base font-semibold text-charcoal">Total</span>
                    <span className="font-body text-base font-bold text-terracotta">${total.toFixed(2)} USD</span>
                  </div>
                </div>

                <button onClick={next}
                  className="w-full flex items-center justify-center gap-2 h-12 rounded-full font-body font-semibold text-sm bg-terracotta text-white shadow-button hover:bg-terracotta-dark hover:-translate-y-0.5 transition-all">
                  {t('widget.step4.continueToPayment') || 'Continue to Payment'} <ArrowRight size={16} />
                </button>
              </div>
            )}

            {/* STEP 5: Passenger Info */}
            {step === 5 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <button onClick={back} className="text-warm-gray hover:text-charcoal transition-colors"><ArrowLeft size={20} /></button>
                  <h2 className="font-display text-[22px] font-bold text-charcoal">{t('widget.step5.title') || 'Passenger Info'}</h2>
                </div>

                <div className="space-y-4 mb-6">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-body text-[11px] text-warm-gray mb-1 block">{t('widget.step4.firstName') || 'First Name'}</label>
                      <input type="text" value={s.name} onChange={e => update({ name: e.target.value })}
                        className="w-full h-11 bg-[#FAFAF8] border border-[rgba(138,130,120,0.2)] rounded-md px-3 font-body text-sm text-charcoal focus:border-terracotta outline-none" />
                    </div>
                    <div>
                      <label className="font-body text-[11px] text-warm-gray mb-1 block">{t('widget.step4.lastName') || 'Last Name'}</label>
                      <input type="text" value={s.lastName} onChange={e => update({ lastName: e.target.value })}
                        className="w-full h-11 bg-[#FAFAF8] border border-[rgba(138,130,120,0.2)] rounded-md px-3 font-body text-sm text-charcoal focus:border-terracotta outline-none" />
                    </div>
                  </div>
                  <div>
                    <label className="font-body text-[11px] text-warm-gray mb-1 block">{t('widget.step4.email') || 'Email'}</label>
                    <input type="email" value={s.email} onChange={e => update({ email: e.target.value })}
                      className="w-full h-11 bg-[#FAFAF8] border border-[rgba(138,130,120,0.2)] rounded-md px-3 font-body text-sm text-charcoal focus:border-terracotta outline-none" />
                  </div>
                  <div>
                    <label className="font-body text-[11px] text-warm-gray mb-1 block">{t('widget.step4.phone') || 'Phone'}</label>
                    <div className="flex gap-2">
                      <select className="h-11 bg-[#FAFAF8] border border-[rgba(138,130,120,0.2)] rounded-md px-2 font-body text-sm text-charcoal w-20 flex-shrink-0">
                        <option>+52</option><option>+1</option>
                      </select>
                      <input type="tel" value={s.phone} onChange={e => update({ phone: e.target.value })}
                        placeholder="6241234567" className="flex-1 h-11 bg-[#FAFAF8] border border-[rgba(138,130,120,0.2)] rounded-md px-3 font-body text-sm text-charcoal placeholder:text-warm-gray/50 focus:border-terracotta outline-none" />
                    </div>
                  </div>
                  <div>
                    <label className="font-body text-[11px] text-warm-gray mb-1 block">{t('widget.step4.specialNotes') || 'Notes'}</label>
                    <textarea value={s.notes} onChange={e => update({ notes: e.target.value })}
                      placeholder={t('widget.step4.notesPlaceholder') || 'Any special requests...'} rows={2}
                      className="w-full bg-[#FAFAF8] border border-[rgba(138,130,120,0.2)] rounded-md px-3 py-2 font-body text-sm text-charcoal placeholder:text-warm-gray/50 focus:border-terracotta outline-none resize-none" />
                  </div>

                  {/* Payment Method Selection */}
                  <div>
                    <label className="font-body text-xs font-medium text-warm-gray uppercase tracking-wide mb-2 block">{t('widget.step4.paymentMethod') || 'Payment Method'}</label>
                    <div className="flex gap-2">
                      {[
                        { id: 'card', label: t('widget.step4.creditCard') || 'Card', icon: <CreditCard size={18} /> },
                        { id: 'paypal', label: t('widget.step4.paypal') || 'PayPal', icon: <span className="font-body text-xs font-bold text-[#003087]">Pay</span> },
                        { id: 'cash', label: t('widget.step4.cash') || 'Cash', icon: <span className="font-body text-xs font-bold text-[#2D6A4F]">$</span> },
                      ].map(method => (
                        <button key={method.id}
                          className="flex-1 flex flex-col items-center gap-1 p-3 rounded-lg border-2 border-[rgba(138,130,120,0.15)] hover:border-terracotta transition-all">
                          <span className="text-warm-gray">{method.icon}</span>
                          <span className="font-body text-[11px] font-medium text-charcoal">{method.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Final total */}
                <div className="bg-sand rounded-lg p-4 mb-4">
                  <div className="flex justify-between items-center">
                    <span className="font-body text-base font-semibold text-charcoal">{t('widget.step5.amountToPay') || 'Amount to Pay'}</span>
                    <span className="font-body text-xl font-bold text-terracotta">${total.toFixed(2)} USD</span>
                  </div>
                </div>

                <button onClick={next} disabled={!canProceed()}
                  className={`w-full flex items-center justify-center gap-2 h-12 rounded-full font-body font-semibold text-sm transition-all ${canProceed() ? 'bg-terracotta text-white shadow-button hover:bg-terracotta-dark hover:-translate-y-0.5' : 'bg-terracotta/50 text-white/70 cursor-not-allowed'}`}>
                  {t('widget.step4.continueToPayment') || 'Complete Booking'} <Check size={16} />
                </button>
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
