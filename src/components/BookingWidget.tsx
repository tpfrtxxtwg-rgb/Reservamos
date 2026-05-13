import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AirplaneLanding,
  AirplaneTakeoff,
  MapTrifold,
  Clock,
  MapPin,
  Calendar,
  Users,
  Check,
  ShieldCheck,
  CreditCard,
  PaypalLogo,
  Money,
  ArrowRight,
  Copy,
  WifiHigh,
  Drop,
  Television,
  Wine,
  Snowflake,
  ArrowLeft,
} from '@phosphor-icons/react';
import type { BookingData } from '@/types';
import { services, vehicles, timeSlots, destinations } from '@/data/mock';

const initialBooking: BookingData = {
  serviceId: null,
  origin: '',
  destination: '',
  date: '',
  time: '',
  passengers: 2,
  vehicleId: null,
  passengerName: '',
  passengerLastName: '',
  passengerEmail: '',
  passengerPhone: '',
  passengerNotes: '',
  paymentMethod: 'card',
};

const stepVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 40 : -40,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -40 : 40,
    opacity: 0,
  }),
};

const featureIcons: Record<string, React.ReactNode> = {
  WiFi: <WifiHigh size={12} weight="fill" />,
  'A/C': <Snowflake size={12} weight="fill" />,
  Agua: <Drop size={12} weight="fill" />,
  TV: <Television size={12} weight="fill" />,
  Bar: <Wine size={12} weight="fill" />,
};

const serviceIcons: Record<string, React.ReactNode> = {
  'airport-to-hotel': <AirplaneLanding size={28} />,
  'hotel-to-airport': <AirplaneTakeoff size={28} />,
  'private-tour': <MapTrifold size={28} />,
  hourly: <Clock size={28} />,
};

export default function BookingWidget() {
  const [currentStep, setCurrentStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [booking, setBooking] = useState<BookingData>(initialBooking);
  const [confirmed, setConfirmed] = useState(false);
  const [reservationCode, setReservationCode] = useState('');
  const [copied, setCopied] = useState(false);

  const updateBooking = useCallback((updates: Partial<BookingData>) => {
    setBooking(prev => ({ ...prev, ...updates }));
  }, []);

  const canProceed = () => {
    switch (currentStep) {
      case 1: return !!booking.serviceId;
      case 2: return booking.origin && booking.destination && booking.date && booking.time;
      case 3: return !!booking.vehicleId;
      case 4: return booking.passengerName && booking.passengerLastName && booking.passengerEmail;
      default: return false;
    }
  };

  const handleNext = () => {
    if (currentStep < 4) {
      setDirection(1);
      setCurrentStep(s => s + 1);
    } else {
      // Submit
      const code = `RSV-2025-${String(Math.floor(Math.random() * 90000) + 10000)}`;
      setReservationCode(code);
      setConfirmed(true);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setDirection(-1);
      setCurrentStep(s => s - 1);
    }
  };

  const handleReset = () => {
    setBooking(initialBooking);
    setCurrentStep(1);
    setConfirmed(false);
    setReservationCode('');
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(reservationCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const selectedVehicle = vehicles.find(v => v.id === booking.vehicleId);
  const selectedService = services.find(s => s.id === booking.serviceId);
  const progressWidth = currentStep === 4 ? 100 : ((currentStep - 1) / 3) * 100;
  const taxRate = 0.08;
  const subtotal = selectedVehicle?.basePrice || 0;
  const tax = Math.round(subtotal * taxRate);
  const total = subtotal + tax;

  if (confirmed) {
    return (
      <div className="w-full max-w-[420px] bg-white rounded-2xl border border-[rgba(138,130,120,0.12)] shadow-lg overflow-hidden">
        <div className="h-14 bg-terracotta flex items-center justify-between px-5">
          <span className="font-body text-white font-semibold text-base">ReserVamos</span>
          <div className="flex items-center gap-1.5 text-white/80">
            <ShieldCheck size={14} weight="fill" />
            <span className="font-body text-[11px]">Pago Seguro</span>
          </div>
        </div>
        <div className="flex items-center justify-center py-10 px-6">
          <div className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className="w-16 h-16 rounded-full bg-[rgba(45,106,79,0.1)] flex items-center justify-center mx-auto mb-5"
            >
              <Check size={32} weight="bold" className="text-[#2D6A4F]" />
            </motion.div>
            <h3 className="font-display text-2xl font-bold text-charcoal mb-2">
              \u00a1Reserva Confirmada!
            </h3>
            <p className="font-body text-sm text-warm-gray mb-5">
              Hemos enviado los detalles a tu correo electr\u00f3nico.
            </p>

            <div className="bg-sand rounded-lg p-3 mb-4 flex items-center justify-between">
              <span className="font-body text-sm font-semibold text-charcoal">{reservationCode}</span>
              <button
                onClick={handleCopyCode}
                className="flex items-center gap-1 text-terracotta hover:text-terracotta-dark transition-colors"
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                <span className="font-body text-xs">{copied ? 'Copiado' : 'Copiar'}</span>
              </button>
            </div>

            <div className="bg-[#FAFAF8] rounded-lg p-4 mb-6 text-left">
              <div className="flex justify-between mb-2">
                <span className="font-body text-xs text-warm-gray">Servicio</span>
                <span className="font-body text-xs font-medium text-charcoal">{selectedService?.name}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="font-body text-xs text-warm-gray">Fecha</span>
                <span className="font-body text-xs font-medium text-charcoal">{booking.date}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="font-body text-xs text-warm-gray">Veh\u00edculo</span>
                <span className="font-body text-xs font-medium text-charcoal">{selectedVehicle?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-body text-xs text-warm-gray">Total</span>
                <span className="font-body text-sm font-bold text-terracotta">${total} USD</span>
              </div>
            </div>

            <button
              onClick={handleReset}
              className="w-full h-12 border-2 border-terracotta text-terracotta rounded-lg font-body font-semibold text-sm hover:bg-terracotta hover:text-white transition-all"
            >
              Hacer Otra Reserva
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[420px] bg-white rounded-2xl border border-[rgba(138,130,120,0.12)] shadow-lg overflow-hidden">
      {/* Header */}
      <div className="h-14 bg-terracotta flex items-center justify-between px-5">
        <span className="font-body text-white font-semibold text-base">ReserVamos</span>
        <div className="flex items-center gap-1.5 text-white/80">
          <ShieldCheck size={14} weight="fill" />
          <span className="font-body text-[11px]">Pago Seguro</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-[3px] bg-[rgba(199,94,58,0.15)]">
        <motion.div
          className="h-full bg-terracotta"
          initial={false}
          animate={{ width: `${progressWidth}%` }}
          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        />
      </div>

      {/* Step Content */}
      <div className="relative min-h-[420px]">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentStep}
            custom={direction}
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="p-6"
          >
            {/* Step 1: Service Selection */}
            {currentStep === 1 && (
              <div>
                <h2 className="font-display text-[22px] font-bold text-charcoal mb-1">
                  \u00bfQu\u00e9 Servicio Necesitas?
                </h2>
                <p className="font-body text-[13px] text-warm-gray mb-5">
                  Selecciona el tipo de transportaci\u00f3n
                </p>
                <div className="grid grid-cols-2 gap-3 mb-6">
                  {services.map(service => (
                    <button
                      key={service.id}
                      onClick={() => updateBooking({ serviceId: service.id })}
                      className={`p-4 rounded-lg border-2 text-left transition-all duration-200 hover:shadow-sm hover:-translate-y-0.5 ${
                        booking.serviceId === service.id
                          ? 'border-terracotta bg-[rgba(199,94,58,0.04)]'
                          : 'border-[rgba(138,130,120,0.15)] bg-white'
                      }`}
                    >
                      <div className={`mb-2 ${booking.serviceId === service.id ? 'text-terracotta' : 'text-warm-gray'}`}>
                        {serviceIcons[service.id]}
                      </div>
                      <span className="font-body text-[13px] font-medium text-charcoal">{service.name}</span>
                    </button>
                  ))}
                </div>
                <div className="flex items-center justify-between pt-2">
                  <span className="font-body text-sm text-warm-gray">Desde $45 USD</span>
                  <button
                    onClick={handleNext}
                    disabled={!canProceed()}
                    className={`flex items-center gap-2 px-6 py-3 rounded-full font-body font-semibold text-sm transition-all ${
                      canProceed()
                        ? 'bg-terracotta text-white shadow-button hover:bg-terracotta-dark hover:-translate-y-0.5'
                        : 'bg-terracotta/50 text-white/70 cursor-not-allowed'
                    }`}
                  >
                    Continuar
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Trip Details */}
            {currentStep === 2 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <button onClick={handleBack} className="text-warm-gray hover:text-charcoal transition-colors">
                    <ArrowLeft size={20} />
                  </button>
                  <h2 className="font-display text-[22px] font-bold text-charcoal">
                    Detalles de tu Viaje
                  </h2>
                </div>
                <div className="space-y-4 mb-6">
                  {/* Origin */}
                  <div>
                    <label className="font-body text-xs font-medium text-warm-gray uppercase tracking-wide mb-1.5 block">
                      Lugar de Origen
                    </label>
                    <div className="relative">
                      <MapPin size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-gray" />
                      <select
                        value={booking.origin}
                        onChange={e => updateBooking({ origin: e.target.value })}
                        className="w-full h-12 bg-[#FAFAF8] border border-[rgba(138,130,120,0.2)] rounded-md pl-10 pr-4 font-body text-sm text-charcoal focus:border-terracotta focus:ring-[3px] focus:ring-[rgba(199,94,58,0.1)] outline-none transition-all appearance-none"
                      >
                        <option value="">Seleccionar origen</option>
                        {destinations.map(d => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Destination */}
                  <div>
                    <label className="font-body text-xs font-medium text-warm-gray uppercase tracking-wide mb-1.5 block">
                      Destino
                    </label>
                    <div className="relative">
                      <MapPin size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-gray" />
                      <select
                        value={booking.destination}
                        onChange={e => updateBooking({ destination: e.target.value })}
                        className="w-full h-12 bg-[#FAFAF8] border border-[rgba(138,130,120,0.2)] rounded-md pl-10 pr-4 font-body text-sm text-charcoal focus:border-terracotta focus:ring-[3px] focus:ring-[rgba(199,94,58,0.1)] outline-none transition-all appearance-none"
                      >
                        <option value="">Seleccionar destino</option>
                        {destinations.map(d => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Date */}
                  <div>
                    <label className="font-body text-xs font-medium text-warm-gray uppercase tracking-wide mb-1.5 block">
                      Fecha del Servicio
                    </label>
                    <div className="relative">
                      <Calendar size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-gray" />
                      <input
                        type="date"
                        value={booking.date}
                        onChange={e => updateBooking({ date: e.target.value })}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full h-12 bg-[#FAFAF8] border border-[rgba(138,130,120,0.2)] rounded-md pl-10 pr-4 font-body text-sm text-charcoal focus:border-terracotta focus:ring-[3px] focus:ring-[rgba(199,94,58,0.1)] outline-none transition-all"
                      />
                    </div>
                  </div>

                  {/* Time */}
                  <div>
                    <label className="font-body text-xs font-medium text-warm-gray uppercase tracking-wide mb-1.5 block">
                      Hora de Pickup
                    </label>
                    <div className="relative">
                      <Clock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-gray" />
                      <select
                        value={booking.time}
                        onChange={e => updateBooking({ time: e.target.value })}
                        className="w-full h-12 bg-[#FAFAF8] border border-[rgba(138,130,120,0.2)] rounded-md pl-10 pr-4 font-body text-sm text-charcoal focus:border-terracotta focus:ring-[3px] focus:ring-[rgba(199,94,58,0.1)] outline-none transition-all appearance-none"
                      >
                        <option value="">Seleccionar hora</option>
                        {timeSlots.map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Passengers */}
                  <div>
                    <label className="font-body text-xs font-medium text-warm-gray uppercase tracking-wide mb-1.5 block">
                      N\u00famero de Pasajeros
                    </label>
                    <div className="relative">
                      <Users size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-gray" />
                      <div className="flex items-center h-12 bg-[#FAFAF8] border border-[rgba(138,130,120,0.2)] rounded-md pl-10 pr-3">
                        <button
                          onClick={() => updateBooking({ passengers: Math.max(1, booking.passengers - 1) })}
                          className="w-8 h-8 rounded-md bg-white border border-[rgba(138,130,120,0.2)] flex items-center justify-center font-body font-semibold text-charcoal hover:border-terracotta transition-colors"
                        >
                          -
                        </button>
                        <span className="flex-1 text-center font-body text-sm font-medium text-charcoal">
                          {booking.passengers} pasajero{booking.passengers > 1 ? 's' : ''}
                        </span>
                        <button
                          onClick={() => updateBooking({ passengers: Math.min(16, booking.passengers + 1) })}
                          className="w-8 h-8 rounded-md bg-white border border-[rgba(138,130,120,0.2)] flex items-center justify-center font-body font-semibold text-charcoal hover:border-terracotta transition-colors"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleNext}
                  disabled={!canProceed()}
                  className={`w-full flex items-center justify-center gap-2 h-12 rounded-full font-body font-semibold text-sm transition-all ${
                    canProceed()
                      ? 'bg-terracotta text-white shadow-button hover:bg-terracotta-dark hover:-translate-y-0.5'
                      : 'bg-terracotta/50 text-white/70 cursor-not-allowed'
                  }`}
                >
                  Continuar
                  <ArrowRight size={16} />
                </button>
              </div>
            )}

            {/* Step 3: Vehicle Selection */}
            {currentStep === 3 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <button onClick={handleBack} className="text-warm-gray hover:text-charcoal transition-colors">
                    <ArrowLeft size={20} />
                  </button>
                  <h2 className="font-display text-[22px] font-bold text-charcoal">
                    Selecciona tu Veh\u00edculo
                  </h2>
                </div>

                {/* Trip Summary */}
                <div className="bg-sand rounded-lg p-3 mb-4">
                  <div className="flex items-center justify-between">
                    <div className="font-body text-xs text-charcoal">
                      <span className="font-medium">{booking.origin?.split(' - ')[0] || booking.origin}</span>
                      <ArrowRight size={10} className="inline mx-1" />
                      <span className="font-medium">{booking.destination?.split(' - ')[0] || booking.destination}</span>
                    </div>
                    <button
                      onClick={() => { setDirection(-1); setCurrentStep(2); }}
                      className="font-body text-xs text-terracotta font-medium hover:underline"
                    >
                      Editar
                    </button>
                  </div>
                  <div className="font-body text-[11px] text-warm-gray mt-1">
                    {booking.date} \u00b7 {booking.time} \u00b7 {booking.passengers} pasajeros
                  </div>
                </div>

                {/* Vehicle Cards */}
                <div className="space-y-3 mb-4">
                  {vehicles
                    .filter(v => booking.passengers >= v.minPassengers && booking.passengers <= v.maxPassengers)
                    .map(vehicle => (
                    <button
                      key={vehicle.id}
                      onClick={() => updateBooking({ vehicleId: vehicle.id })}
                      className={`w-full flex gap-4 p-4 rounded-lg border-2 text-left transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${
                        booking.vehicleId === vehicle.id
                          ? 'border-terracotta bg-[rgba(199,94,58,0.03)]'
                          : 'border-[rgba(138,130,120,0.12)] bg-white'
                      }`}
                    >
                      <img
                        src={vehicle.image}
                        alt={vehicle.name}
                        className="w-20 h-[60px] object-cover rounded-md flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-body text-[15px] font-semibold text-charcoal">{vehicle.name}</span>
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            booking.vehicleId === vehicle.id
                              ? 'border-terracotta'
                              : 'border-warm-gray'
                          }`}>
                            {booking.vehicleId === vehicle.id && (
                              <div className="w-2.5 h-2.5 rounded-full bg-terracotta" />
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 mb-2">
                          <Users size={12} className="text-warm-gray" />
                          <span className="font-body text-xs text-warm-gray">{vehicle.capacity}</span>
                        </div>
                        <div className="flex flex-wrap gap-1 mb-1">
                          {vehicle.features.map(f => (
                            <span key={f} className="inline-flex items-center gap-0.5 bg-sand rounded-full px-2 py-0.5 font-body text-[11px] text-warm-gray">
                              {featureIcons[f]}
                              {f}
                            </span>
                          ))}
                        </div>
                        <span className="font-body text-lg font-bold text-terracotta">${vehicle.basePrice} USD</span>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="font-body text-sm text-warm-gray">
                    Total: <span className="font-bold text-terracotta text-base">${total} USD</span>
                  </div>
                  <button
                    onClick={handleNext}
                    disabled={!canProceed()}
                    className={`flex items-center gap-2 px-6 py-3 rounded-full font-body font-semibold text-sm transition-all ${
                      canProceed()
                        ? 'bg-terracotta text-white shadow-button hover:bg-terracotta-dark hover:-translate-y-0.5'
                        : 'bg-terracotta/50 text-white/70 cursor-not-allowed'
                    }`}
                  >
                    Continuar al Pago
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* Step 4: Passenger & Payment */}
            {currentStep === 4 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <button onClick={handleBack} className="text-warm-gray hover:text-charcoal transition-colors">
                    <ArrowLeft size={20} />
                  </button>
                  <h2 className="font-display text-[22px] font-bold text-charcoal">
                    Datos y Pago
                  </h2>
                </div>

                {/* Passenger Data */}
                <div className="border-b border-[rgba(138,130,120,0.1)] pb-5 mb-5">
                  <h3 className="font-body text-sm font-semibold text-charcoal mb-3">Datos del Pasajero</h3>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="font-body text-[11px] text-warm-gray mb-1 block">Nombre</label>
                      <input
                        type="text"
                        value={booking.passengerName}
                        onChange={e => updateBooking({ passengerName: e.target.value })}
                        placeholder="Nombre"
                        className="w-full h-11 bg-[#FAFAF8] border border-[rgba(138,130,120,0.2)] rounded-md px-3 font-body text-sm text-charcoal placeholder:text-warm-gray/50 focus:border-terracotta focus:ring-[3px] focus:ring-[rgba(199,94,58,0.1)] outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="font-body text-[11px] text-warm-gray mb-1 block">Apellido</label>
                      <input
                        type="text"
                        value={booking.passengerLastName}
                        onChange={e => updateBooking({ passengerLastName: e.target.value })}
                        placeholder="Apellido"
                        className="w-full h-11 bg-[#FAFAF8] border border-[rgba(138,130,120,0.2)] rounded-md px-3 font-body text-sm text-charcoal placeholder:text-warm-gray/50 focus:border-terracotta focus:ring-[3px] focus:ring-[rgba(199,94,58,0.1)] outline-none transition-all"
                      />
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="font-body text-[11px] text-warm-gray mb-1 block">Email</label>
                    <input
                      type="email"
                      value={booking.passengerEmail}
                      onChange={e => updateBooking({ passengerEmail: e.target.value })}
                      placeholder="correo@ejemplo.com"
                      className="w-full h-11 bg-[#FAFAF8] border border-[rgba(138,130,120,0.2)] rounded-md px-3 font-body text-sm text-charcoal placeholder:text-warm-gray/50 focus:border-terracotta focus:ring-[3px] focus:ring-[rgba(199,94,58,0.1)] outline-none transition-all"
                    />
                  </div>
                  <div className="mb-3">
                    <label className="font-body text-[11px] text-warm-gray mb-1 block">Tel\u00e9fono</label>
                    <div className="flex gap-2">
                      <select className="h-11 bg-[#FAFAF8] border border-[rgba(138,130,120,0.2)] rounded-md px-2 font-body text-sm text-charcoal focus:border-terracotta outline-none w-20 flex-shrink-0">
                        <option>+52</option>
                        <option>+1</option>
                        <option>+44</option>
                      </select>
                      <input
                        type="tel"
                        value={booking.passengerPhone}
                        onChange={e => updateBooking({ passengerPhone: e.target.value })}
                        placeholder="555 123 4567"
                        className="flex-1 h-11 bg-[#FAFAF8] border border-[rgba(138,130,120,0.2)] rounded-md px-3 font-body text-sm text-charcoal placeholder:text-warm-gray/50 focus:border-terracotta focus:ring-[3px] focus:ring-[rgba(199,94,58,0.1)] outline-none transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="font-body text-[11px] text-warm-gray mb-1 block">Notas Especiales</label>
                    <textarea
                      value={booking.passengerNotes}
                      onChange={e => updateBooking({ passengerNotes: e.target.value })}
                      placeholder="Vuelo de llegada, sillas de beb\u00e9, etc."
                      rows={3}
                      className="w-full bg-[#FAFAF8] border border-[rgba(138,130,120,0.2)] rounded-md px-3 py-2 font-body text-sm text-charcoal placeholder:text-warm-gray/50 focus:border-terracotta focus:ring-[3px] focus:ring-[rgba(199,94,58,0.1)] outline-none transition-all resize-none"
                    />
                  </div>
                </div>

                {/* Payment Method */}
                <div className="mb-5">
                  <h3 className="font-body text-sm font-semibold text-charcoal mb-3">M\u00e9todo de Pago</h3>
                  <div className="flex gap-2 mb-4">
                    {[
                      { id: 'card' as const, label: 'Tarjeta', icon: <CreditCard size={18} />, badge: 'Recomendado' },
                      { id: 'paypal' as const, label: 'PayPal', icon: <PaypalLogo size={18} />, badge: null },
                      { id: 'cash' as const, label: 'Efectivo', icon: <Money size={18} />, badge: null },
                    ].map(method => (
                      <button
                        key={method.id}
                        onClick={() => updateBooking({ paymentMethod: method.id })}
                        className={`flex-1 flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all ${
                          booking.paymentMethod === method.id
                            ? 'border-terracotta'
                            : 'border-[rgba(138,130,120,0.15)]'
                        }`}
                      >
                        <span className={booking.paymentMethod === method.id ? 'text-terracotta' : 'text-warm-gray'}>
                          {method.icon}
                        </span>
                        <span className="font-body text-[11px] font-medium text-charcoal">{method.label}</span>
                        {method.badge && (
                          <span className="font-body text-[9px] bg-[rgba(45,106,79,0.1)] text-[#2D6A4F] rounded-full px-1.5 py-0.5">
                            {method.badge}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Card Fields */}
                  {booking.paymentMethod === 'card' && (
                    <div className="space-y-3">
                      <div>
                        <label className="font-body text-[11px] text-warm-gray mb-1 block">N\u00famero de Tarjeta</label>
                        <div className="relative">
                          <CreditCard size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-gray" />
                          <input
                            type="text"
                            placeholder="4242 4242 4242 4242"
                            className="w-full h-11 bg-[#FAFAF8] border border-[rgba(138,130,120,0.2)] rounded-md pl-10 pr-3 font-body text-sm text-charcoal placeholder:text-warm-gray/50 focus:border-terracotta focus:ring-[3px] focus:ring-[rgba(199,94,58,0.1)] outline-none transition-all"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="font-body text-[11px] text-warm-gray mb-1 block">Expiraci\u00f3n</label>
                          <input
                            type="text"
                            placeholder="MM/AA"
                            className="w-full h-11 bg-[#FAFAF8] border border-[rgba(138,130,120,0.2)] rounded-md px-3 font-body text-sm text-charcoal placeholder:text-warm-gray/50 focus:border-terracotta focus:ring-[3px] focus:ring-[rgba(199,94,58,0.1)] outline-none transition-all"
                          />
                        </div>
                        <div>
                          <label className="font-body text-[11px] text-warm-gray mb-1 block">CVV</label>
                          <input
                            type="text"
                            placeholder="123"
                            className="w-full h-11 bg-[#FAFAF8] border border-[rgba(138,130,120,0.2)] rounded-md px-3 font-body text-sm text-charcoal placeholder:text-warm-gray/50 focus:border-terracotta focus:ring-[3px] focus:ring-[rgba(199,94,58,0.1)] outline-none transition-all"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Order Summary */}
                <div className="bg-sand rounded-lg p-4 mb-4">
                  <div className="flex justify-between mb-1">
                    <span className="font-body text-sm text-charcoal">{selectedService?.name}</span>
                    <span className="font-body text-sm font-medium text-charcoal">${subtotal} USD</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="font-body text-sm text-warm-gray">Impuestos</span>
                    <span className="font-body text-sm text-warm-gray">${tax} USD</span>
                  </div>
                  <div className="border-t border-[rgba(138,130,120,0.2)] pt-2 flex justify-between">
                    <span className="font-body text-base font-semibold text-charcoal">Total</span>
                    <span className="font-body text-xl font-bold text-terracotta">${total} USD</span>
                  </div>
                </div>

                <button
                  onClick={handleNext}
                  disabled={!canProceed()}
                  className={`w-full h-[52px] rounded-lg font-body font-semibold text-base transition-all ${
                    canProceed()
                      ? 'bg-terracotta text-white shadow-button hover:bg-terracotta-dark hover:-translate-y-0.5'
                      : 'bg-terracotta/50 text-white/70 cursor-not-allowed'
                  }`}
                >
                  Completar Reserva
                </button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
