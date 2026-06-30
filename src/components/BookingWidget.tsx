import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  AirplaneLanding, MapTrifold, Clock,
  MapPin, Calendar, Users, Check, ShieldCheck,
  CreditCard, PaypalLogo, Money, ArrowRight, Copy,
  WifiHigh, Drop, Television, Wine, Snowflake, ArrowLeft,
  ArrowsLeftRight, Buildings,
  ShoppingCart, Suitcase, Package, AirplaneTilt, Car,
} from '@phosphor-icons/react';
import { trpc } from '@/providers/trpc.tsx';
import type { BookingData } from '@/types';
import PayPalButton from '@/components/PayPalButton';
import { useWidgetTheme } from '@/hooks/useWidgetTheme';
import StepIndicator from '@/components/StepIndicator';
import { validateStep2, validateStep5 } from '@/lib/widget-validation';

interface BookingWidgetProps {
  apiKey?: string;
}

const initialBooking: BookingData = {
  tripType: null,
  serviceId: null,
  airportId: null,
  tourId: null,
  destinationId: null,
  origin: '',
  date: '',
  time: '',
  passengers: 2,
  vehicleId: null,
  passengerName: '',
  passengerLastName: '',
  passengerEmail: '',
  passengerPhone: '',
  passengerNotes: '',
  selectedOptionalServices: [],
  luggage: 'standard',
  flightNumber: '',
  airline: '',
  departureDate: '',
  departureTime: '',
  departureAirline: '',
  departureFlightNumber: '',
  hotelPickupTime: '',
  paymentMethod: 'card',
  paymentOption: 'full',
};

const stepVariants = {
  enter: (direction: number) => ({ x: direction > 0 ? 40 : -40, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({ x: direction > 0 ? -40 : 40, opacity: 0 }),
};

const featureIcons: Record<string, React.ReactNode> = {
  WiFi: <WifiHigh size={12} weight="fill" />, 'A/C': <Snowflake size={12} weight="fill" />,
  Agua: <Drop size={12} weight="fill" />, TV: <Television size={12} weight="fill" />,
  Bar: <Wine size={12} weight="fill" />,
};

const serviceIcons: Record<string, React.ReactNode> = {
  'airport-transfer': <AirplaneLanding size={28} />,
  'private-tour': <MapTrifold size={28} />,
  'hourly': <Clock size={28} />,
};

const airlines = [
  'American Airlines', 'Delta', 'United Airlines', 'Southwest', 'JetBlue',
  'Air Canada', 'British Airways', 'Lufthansa', 'Aeromexico', 'Volaris',
  'VivaAerobus', 'WestJet', 'Sunwing', 'Air Transat', 'Frontier',
  'Spirit Airlines', 'Alaska Airlines', 'KLM', 'Air France', 'Other'
];

const timeSlots = ['05:00 AM','05:30 AM','06:00 AM','06:30 AM','07:00 AM','07:30 AM','08:00 AM','08:30 AM','09:00 AM','09:30 AM','10:00 AM','10:30 AM','11:00 AM','11:30 AM','12:00 PM','12:30 PM','01:00 PM','01:30 PM','02:00 PM','02:30 PM','03:00 PM','03:30 PM','04:00 PM','04:30 PM','05:00 PM','05:30 PM','06:00 PM','06:30 PM','07:00 PM','07:30 PM','08:00 PM','08:30 PM','09:00 PM','09:30 PM','10:00 PM'];

export default function BookingWidget({ apiKey = 'rv_demo_client_12345' }: BookingWidgetProps) {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [booking, setBooking] = useState<BookingData>(initialBooking);
  const [confirmed, setConfirmed] = useState(false);
  const [reservationCode, setReservationCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [destSearch, setDestSearch] = useState('');
  const [showDestSearch, setShowDestSearch] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [paypalOrderId, setPaypalOrderId] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Query client config from apiKey
  const { data: clientConfig } = trpc.widget.config.useQuery(
    { apiKey },
    { enabled: !!apiKey }
  );

  const effectiveClientId = clientConfig?.id || 0;
  const isReady = effectiveClientId > 0;

  // Dynamic theme
  const theme = useWidgetTheme(clientConfig?.primaryColor);
  const cssVariables = {
    '--terracotta': theme.primary,
    '--terracotta-dark': theme.primaryDark,
    '--terracotta-rgb': theme.primaryRgb,
  } as React.CSSProperties;

  const { data: servicesList, isLoading: servicesLoading } = trpc.widget.listServices.useQuery(
    { clientId: effectiveClientId },
    { enabled: isReady }
  );
  const { data: destinationsList, isLoading: destsLoading } = trpc.widget.listDestinations.useQuery(
    { clientId: effectiveClientId },
    { enabled: isReady }
  );
  const { data: optionalServicesList } = trpc.widget.listOptionalServices.useQuery(
    { clientId: effectiveClientId },
    { enabled: isReady }
  );
  const { data: vehiclesList } = trpc.widget.listVehicles.useQuery(
    { clientId: effectiveClientId, destinationId: Number(booking.destinationId) || 0, tripType: booking.tripType || 'one_way' },
    { enabled: isReady && !!booking.destinationId && currentStep >= 3 }
  );
  const { data: airportsList } = trpc.widget.listAirports.useQuery(
    { clientId: effectiveClientId },
    { enabled: isReady }
  );
  const { data: toursList } = trpc.widget.listTours.useQuery(
    { clientId: effectiveClientId },
    { enabled: isReady }
  );

  const createBooking = trpc.widget.createBooking.useMutation({
    onSuccess: (data) => {
      setBookingError('');
      if (data?.code) {
        setReservationCode(data.code);
        setConfirmed(true);
      }
    },
    onError: (err) => {
      const msg = err.message || 'Booking failed. Please try again.';
      // Make error messages user-friendly
      if (msg.includes('pricing')) {
        setBookingError('No price configured for this vehicle and zone. Please contact the administrator.');
      } else if (msg.includes('client')) {
        setBookingError('Invalid client configuration. Please contact support.');
      } else {
        setBookingError(msg);
      }
    },
  });

  const updateBooking = useCallback((updates: Partial<BookingData>) => {
    setBooking(prev => ({ ...prev, ...updates }));
    setBookingError('');
    setFieldErrors(prev => {
      const cleared = { ...prev };
      Object.keys(updates).forEach(k => { delete cleared[k]; });
      return cleared;
    });
  }, []);

  const selectedService = servicesList?.find(s => s.id === Number(booking.serviceId));
  const selectedDestination = destinationsList?.find(d => d.id === Number(booking.destinationId));
  const selectedVehicle = vehiclesList?.find(v => v.id === Number(booking.vehicleId));

  // Tax rate from client config
  const taxRate = clientConfig?.taxRate ? parseFloat(String(clientConfig.taxRate)) : 16;
  const taxRateDecimal = taxRate / 100;

  // Deposit config
  const depositEnabled = clientConfig?.depositEnabled ?? false;
  const depositPercentage = clientConfig?.depositPercentage ? parseFloat(String(clientConfig.depositPercentage)) : 30;

  const basePrice = selectedVehicle ? parseFloat(String(selectedVehicle.price)) : 0;

  // Calculate optional services total
  const optionalServicesTotal = booking.selectedOptionalServices.reduce((sum, svcId) => {
    const svc = optionalServicesList?.find(s => s.id === svcId);
    if (!svc) return sum;
    const svcPrice = parseFloat(String(svc.price));
    return sum + (svc.perPassenger ? svcPrice * booking.passengers : svcPrice);
  }, 0);

  const subtotal = basePrice + optionalServicesTotal;
  const tax = Math.round(subtotal * taxRateDecimal * 100) / 100;
  const total = Math.round((subtotal + tax) * 100) / 100;

  // Deposit calculations
  const depositAmount = depositEnabled ? Math.round(total * (depositPercentage / 100) * 100) / 100 : 0;
  const amountToPayNow = booking.paymentOption === 'deposit' && depositEnabled ? depositAmount : total;
  const balanceDue = booking.paymentOption === 'deposit' && depositEnabled ? Math.round((total - depositAmount) * 100) / 100 : 0;

  const isAirportService = selectedService?.slug === 'airport-transfer';
  const isTourService = selectedService?.slug === 'private-tour';
  const isHourlyService = selectedService?.slug === 'hourly';
  const isRoundTrip = booking.tripType === 'round_trip';

  const totalSteps = isRoundTrip ? 6 : 5;

  const canProceed = () => {
    switch (currentStep) {
      case 1: {
        const hasServices = servicesList && servicesList.length > 0;
        return !!booking.tripType && (hasServices ? !!booking.serviceId : true);
      }
      case 2: {
        if (!booking.destinationId || !booking.date || !booking.time) return false;
        if (isAirportService && (!booking.flightNumber || !booking.airline)) return false;
        return true;
      }
      case 3: {
        if (!isRoundTrip) return !!booking.vehicleId;
        return !!booking.departureDate && !!booking.departureTime && !!booking.hotelPickupTime;
      }
      case 4: return !!booking.vehicleId;
      case 5: return true;
      case 6: return booking.passengerName && booking.passengerLastName && booking.passengerEmail;
      default: return false;
    }
  };

  const handleNext = () => {
    setBookingError('');

    // Validate step 2
    if (currentStep === 2) {
      setFieldErrors({});
      const result = validateStep2({
        origin: booking.origin,
        date: booking.date,
        time: booking.time,
        destinationId: booking.destinationId,
        flightNumber: booking.flightNumber,
        airline: booking.airline,
        isAirportService,
        isRoundTrip,
        departureDate: booking.departureDate,
        departureTime: booking.departureTime,
        hotelPickupTime: booking.hotelPickupTime,
      });
      if (!result.valid) {
        const errs: Record<string, string> = {};
        result.errors.forEach(e => { errs[e.field] = e.message; });
        setFieldErrors(errs);
        return;
      }
    }

    // Validate step 5 (payment step - passenger details)
    const paymentStepNumber = isRoundTrip ? 6 : 5;
    if (currentStep === paymentStepNumber) {
      setFieldErrors({});
      const result = validateStep5({
        passengerName: booking.passengerName,
        passengerLastName: booking.passengerLastName,
        passengerEmail: booking.passengerEmail,
        passengerPhone: booking.passengerPhone,
      });
      if (!result.valid) {
        const errs: Record<string, string> = {};
        result.errors.forEach(e => { errs[e.field] = e.message; });
        setFieldErrors(errs);
        return;
      }
    }

    if (currentStep < totalSteps) {
      setDirection(1);
      setCurrentStep(s => s + 1);
    } else if (clientConfig?.id && selectedDestination && selectedVehicle && apiKey) {
      createBooking.mutate({
        apiKey,
        serviceId: Number(booking.serviceId),
        destinationId: Number(booking.destinationId),
        tripType: booking.tripType || 'one_way',
        origin: booking.origin || (isAirportService ? 'Cancun International Airport (CUN)' : ''),
        destination: selectedDestination.name,
        date: booking.date,
        time: booking.time,
        passengers: booking.passengers,
        vehicleId: Number(booking.vehicleId),
        passengerName: booking.passengerName,
        passengerLastName: booking.passengerLastName,
        passengerEmail: booking.passengerEmail,
        passengerPhone: booking.passengerPhone || undefined,
        passengerNotes: booking.passengerNotes || undefined,
        selectedOptionalServices: booking.selectedOptionalServices.length > 0 ? booking.selectedOptionalServices : undefined,
        luggage: booking.luggage,
        flightNumber: booking.flightNumber || undefined,
        airline: booking.airline || undefined,
        departureDate: booking.departureDate || undefined,
        departureTime: booking.departureTime || undefined,
        departureAirline: booking.departureAirline || undefined,
        departureFlightNumber: booking.departureFlightNumber || undefined,
        hotelPickupTime: booking.hotelPickupTime || undefined,
        paymentMethod: booking.paymentMethod,
        paymentOption: booking.paymentOption,
      });
    }
  };

  const handleBack = () => { if (currentStep > 1) { setDirection(-1); setCurrentStep(s => s - 1); setBookingError(''); } };
  const handleReset = () => { setBooking(initialBooking); setCurrentStep(1); setConfirmed(false); setReservationCode(''); setDestSearch(''); setShowDestSearch(false); setBookingError(''); setFieldErrors({}); };
  const handleCopyCode = () => { navigator.clipboard.writeText(reservationCode); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  const filteredDestinations = destinationsList?.filter(d =>
    d.name.toLowerCase().includes(destSearch.toLowerCase())
  ) || [];

  if (confirmed) return (
    <div className="w-full" style={cssVariables}>
      <div className="w-full bg-white rounded-2xl border border-[rgba(138,130,120,0.12)] shadow-lg overflow-hidden">
        <div className="h-14 flex items-center justify-between px-5" style={{ backgroundColor: theme.primary }}>
          <span className="font-body text-white font-semibold text-base">{t('widget.title')}</span>
          <div className="flex items-center gap-1.5 text-white/80">
            <ShieldCheck size={14} weight="fill" />
            <span className="font-body text-[11px]">{t('common.securePayment')}</span>
          </div>
        </div>
        <div className="flex items-center justify-center py-10 px-6">
          <div className="text-center">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className="w-16 h-16 rounded-full bg-[rgba(45,106,79,0.1)] flex items-center justify-center mx-auto mb-5">
              <Check size={32} weight="bold" className="text-[#2D6A4F]" />
            </motion.div>
            <h3 className="font-display text-2xl font-bold text-charcoal mb-2">{t('widget.confirmation.title')}</h3>
            <p className="font-body text-sm text-warm-gray mb-5">{t('widget.confirmation.message')}</p>
            <div className="bg-sand rounded-lg p-3 mb-4 flex items-center justify-between">
              <span className="font-body text-sm font-semibold text-charcoal">{reservationCode}</span>
              <button onClick={handleCopyCode} className="flex items-center gap-1 text-terracotta hover:text-terracotta-dark transition-colors">
                {copied ? <Check size={16} /> : <Copy size={16} />}
                <span className="font-body text-xs">{copied ? t('common.copied') : t('common.copy')}</span>
              </button>
            </div>
            <div className="bg-[#FAFAF8] rounded-lg p-4 mb-4 text-left space-y-2">
              <div className="flex justify-between"><span className="font-body text-xs text-warm-gray">{t('admin.service')}</span><span className="font-body text-xs font-medium text-charcoal">{selectedService?.name}</span></div>
              <div className="flex justify-between"><span className="font-body text-xs text-warm-gray">{t('widget.step2.destination')}</span><span className="font-body text-xs font-medium text-charcoal">{selectedDestination?.name}</span></div>
              <div className="flex justify-between"><span className="font-body text-xs text-warm-gray">{t('admin.vehicle')}</span><span className="font-body text-xs font-medium text-charcoal">{selectedVehicle?.name}</span></div>
              <div className="border-t border-[rgba(138,130,120,0.15)] my-1" />
              <div className="flex justify-between"><span className="font-body text-xs text-warm-gray">{t('common.subtotal')}</span><span className="font-body text-xs text-charcoal">${subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="font-body text-xs text-warm-gray">{t('common.iva', { rate: taxRate })}</span><span className="font-body text-xs text-charcoal">${tax.toFixed(2)}</span></div>
              {booking.paymentOption === 'deposit' && depositEnabled && (
                <>
                  <div className="flex justify-between"><span className="font-body text-xs text-warm-gray">{t('widget.step5.amountPaid') || 'Amount Paid'}</span><span className="font-body text-xs font-semibold text-[#2D6A4F]">${amountToPayNow.toFixed(2)}</span></div>
                  <div className="flex justify-between"><span className="font-body text-xs text-warm-gray">{t('widget.step5.balanceDue') || 'Balance Due'}</span><span className="font-body text-xs font-semibold text-terracotta">${balanceDue.toFixed(2)}</span></div>
                </>
              )}
              <div className="flex justify-between border-t border-[rgba(138,130,120,0.15)] pt-1"><span className="font-body text-xs text-warm-gray">{t('common.total')}</span><span className="font-body text-sm font-bold text-terracotta">${total.toFixed(2)} {t('common.usd')}</span></div>
            </div>
            <button onClick={handleReset} className="w-full h-12 border-2 border-terracotta text-terracotta rounded-lg font-body font-semibold text-sm hover:bg-terracotta hover:text-white transition-all">
              {t('widget.confirmation.newBooking')}
            </button>
          </div>
        </div>
      </div>
    </div>
    </div>
  );

  return (
    <div className="w-full" style={cssVariables}>
      {/* Main widget */}
      <div className="w-full bg-white rounded-2xl border border-[rgba(138,130,120,0.12)] shadow-lg overflow-hidden">
        <div className="h-14 flex items-center justify-between px-5" style={{ backgroundColor: theme.primary }}>
          <span className="font-body text-white font-semibold text-base">{t('widget.title')}</span>
          <div className="flex items-center gap-1.5 text-white/80">
            <ShieldCheck size={14} weight="fill" />
            <span className="font-body text-[11px]">{t('common.securePayment')}</span>
          </div>
        </div>
        {/* Step Indicator */}
        <div className="px-4 py-3 border-b border-[rgba(138,130,120,0.08)]">
          <StepIndicator
            currentStep={currentStep}
            totalSteps={totalSteps}
            palette={{ primary: theme.primary, primary15: theme.primary15, primary50: theme.primary50 }}
            labels={isRoundTrip
              ? [t('widget.stepLabels.service'), t('widget.stepLabels.arrival'), t('widget.stepLabels.departure'), t('widget.stepLabels.vehicle'), t('widget.stepLabels.summary'), t('widget.stepLabels.payment')]
              : [t('widget.stepLabels.service'), t('widget.stepLabels.details'), t('widget.stepLabels.vehicle'), t('widget.stepLabels.summary'), t('widget.stepLabels.payment')]
            }
          />
        </div>
        <div className="relative min-h-[420px]">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div key={currentStep} custom={direction} variants={stepVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3, ease: 'easeInOut' }} className="p-6">

              {/* Step 1 - Trip Type + Service */}
              {currentStep === 1 && (
                <div>
                  <h2 className="font-display text-[22px] font-bold text-charcoal mb-1">{t('widget.step1.title')}</h2>
                  <p className="font-body text-[13px] text-warm-gray mb-4">{t('widget.step1.subtitle')}</p>
                  <div className="flex gap-2 mb-5 p-1 bg-[#FAFAF8] rounded-lg">
                    <button onClick={() => updateBooking({ tripType: 'one_way' })}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md font-body text-sm font-medium transition-all ${booking.tripType === 'one_way' ? 'bg-white text-terracotta shadow-sm' : 'text-warm-gray hover:text-charcoal'}`}>
                      <ArrowRight size={18} /> {t('widget.tripType.oneWay')}
                    </button>
                    <button onClick={() => updateBooking({ tripType: 'round_trip' })}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md font-body text-sm font-medium transition-all ${booking.tripType === 'round_trip' ? 'bg-white text-terracotta shadow-sm' : 'text-warm-gray hover:text-charcoal'}`}>
                      <ArrowsLeftRight size={18} /> {t('widget.tripType.roundTrip')}
                    </button>
                  </div>

                  {/* Services - loading, empty, or list */}
                  {servicesLoading || destsLoading ? (
                    <div className="flex items-center justify-center h-32 mb-6">
                      <span className="font-body text-sm text-warm-gray animate-pulse">{t('common.loading') || 'Loading...'}</span>
                    </div>
                  ) : servicesList && servicesList.length > 0 ? (
                    <div className="grid grid-cols-1 gap-3 mb-6">
                      {servicesList.map(service => (
                        <button key={service.id} onClick={() => updateBooking({ serviceId: String(service.id) })}
                          className={`p-4 rounded-lg border-2 text-left transition-all duration-200 hover:shadow-sm hover:-translate-y-0.5 flex items-center gap-4 ${Number(booking.serviceId) === service.id ? 'border-terracotta bg-[rgba(199,94,58,0.04)]' : 'border-[rgba(138,130,120,0.15)] bg-white'}`}>
                          <div className={`${Number(booking.serviceId) === service.id ? 'text-terracotta' : 'text-warm-gray'}`}>
                            {serviceIcons[service.slug] || <MapPin size={28} />}
                          </div>
                          <div>
                            <span className="font-body text-[15px] font-medium text-charcoal block">{service.name}</span>
                            <span className="font-body text-xs text-warm-gray">{service.description}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-[#FAFAF8] rounded-lg p-5 mb-6 border border-[rgba(138,130,120,0.15)]">
                      <p className="font-body text-sm text-warm-gray text-center">
                        {'No services configured yet. Go to Admin Panel > Services to add your first service.'}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2">
                    <span className="font-body text-sm text-warm-gray">
                      {servicesList && servicesList.length > 0 ? (t('widget.step1.priceFrom') || '') : ''}
                    </span>
                    <button onClick={handleNext} disabled={!canProceed()}
                      className={`flex items-center gap-2 px-6 py-3 rounded-full font-body font-semibold text-sm transition-all ${canProceed() ? 'bg-terracotta text-white shadow-button hover:bg-terracotta-dark hover:-translate-y-0.5' : 'bg-terracotta/50 text-white/70 cursor-not-allowed'}`}>
                      {t('common.continue')} <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              )}

              {/* Step 2 - Arrival Information */}
              {currentStep === 2 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <button onClick={handleBack} className="text-warm-gray hover:text-charcoal transition-colors"><ArrowLeft size={20} /></button>
                    <h2 className="font-display text-[22px] font-bold text-charcoal">{t('widget.step2.arrivalTitle') || 'Arrival Information'}</h2>
                  </div>
                  <p className="font-body text-[13px] text-warm-gray mb-4">{t('widget.step2.arrivalSubtitle') || 'Enter your arrival and destination details'}</p>
                  <div className="space-y-4 mb-6">

                    {/* Pickup Location (Origin Airport) */}
                    <div>
                      <label className="font-body text-xs font-medium text-warm-gray uppercase tracking-wide mb-1.5 block">
                        {t('widget.step2.pickupLocation') || 'Pickup Location'}
                        <span className="text-[#B23A2F] ml-0.5">*</span>
                      </label>
                      <div className="relative">
                        <AirplaneTilt size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-gray" />
                        <select value={booking.origin} onChange={e => updateBooking({ origin: e.target.value })}
                          className={`w-full h-12 bg-[#FAFAF8] border rounded-md pl-10 pr-4 font-body text-sm text-charcoal focus:border-terracotta focus:ring-[3px] focus:ring-[rgba(199,94,58,0.1)] outline-none transition-all appearance-none ${fieldErrors.origin ? 'border-[rgba(178,58,47,0.5)]' : 'border-[rgba(138,130,120,0.2)]'}`}>
                          <option value="">{t('widget.step2.selectAirport') || 'Select airport'}</option>
                          {airportsList && airportsList.length > 0 ? (
                            airportsList.map((apt: any) => (
                              <option key={apt.id} value={`${apt.name} (${apt.code})`}>{apt.name} ({apt.code}){apt.city ? ` - ${apt.city}` : ''}</option>
                            ))
                          ) : (
                            <>
                              <option value="Cancun International Airport (CUN)">Cancun International Airport (CUN)</option>
                              <option value="Tulum Airport (TQO)">Tulum Airport (TQO)</option>
                            </>
                          )}
                          <option value="Other">{t('widget.step2.otherLocation') || 'Other'}</option>
                        </select>
                      </div>
                      {fieldErrors.origin && <p className="font-body text-[11px] text-[#B23A2F] mt-1">{t(fieldErrors.origin)}</p>}
                      {(booking.origin === 'Other' || !airportsList || airportsList.length === 0) && (
                        <input type="text" value={booking.origin === 'Other' ? '' : booking.origin}
                          onChange={e => updateBooking({ origin: e.target.value })}
                          placeholder={t('widget.step2.enterLocation') || 'Enter pickup location'}
                          className={`w-full h-10 mt-2 bg-[#FAFAF8] border rounded-md px-3 font-body text-sm text-charcoal placeholder:text-warm-gray/50 focus:border-terracotta outline-none transition-all ${fieldErrors.origin ? 'border-[rgba(178,58,47,0.5)]' : 'border-[rgba(138,130,120,0.2)]'}`} />
                      )}
                    </div>

                    {/* Date & Time */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="font-body text-xs font-medium text-warm-gray uppercase tracking-wide mb-1.5 block">
                          {t('widget.step2.date')}
                          <span className="text-[#B23A2F] ml-0.5">*</span>
                        </label>
                        <div className="relative">
                          <Calendar size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-gray" />
                          <input type="date" value={booking.date} min={new Date().toISOString().split('T')[0]}
                            onChange={e => updateBooking({ date: e.target.value })}
                            className={`w-full h-12 bg-[#FAFAF8] border rounded-md pl-10 pr-4 font-body text-sm text-charcoal focus:border-terracotta focus:ring-[3px] focus:ring-[rgba(199,94,58,0.1)] outline-none transition-all ${fieldErrors.date ? 'border-[rgba(178,58,47,0.5)]' : 'border-[rgba(138,130,120,0.2)]'}`} />
                        </div>
                        {fieldErrors.date && <p className="font-body text-[11px] text-[#B23A2F] mt-1">{t(fieldErrors.date)}</p>}
                      </div>
                      <div>
                        <label className="font-body text-xs font-medium text-warm-gray uppercase tracking-wide mb-1.5 block">
                          {t('widget.step2.time')}
                          <span className="text-[#B23A2F] ml-0.5">*</span>
                        </label>
                        <div className="relative">
                          <Clock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-gray" />
                          <select value={booking.time} onChange={e => updateBooking({ time: e.target.value })}
                            className={`w-full h-12 bg-[#FAFAF8] border rounded-md pl-10 pr-4 font-body text-sm text-charcoal focus:border-terracotta focus:ring-[3px] focus:ring-[rgba(199,94,58,0.1)] outline-none transition-all appearance-none ${fieldErrors.time ? 'border-[rgba(178,58,47,0.5)]' : 'border-[rgba(138,130,120,0.2)]'}`}>
                            <option value="">{t('widget.step2.selectTime')}</option>
                            {timeSlots.map(o => <option key={o} value={o}>{o}</option>)}
                          </select>
                        </div>
                        {fieldErrors.time && <p className="font-body text-[11px] text-[#B23A2F] mt-1">{t(fieldErrors.time)}</p>}
                      </div>
                    </div>

                    {/* Flight Info - Airline & Flight Number */}
                    {isAirportService && (
                      <div>
                        <h3 className="font-body text-xs font-medium text-warm-gray uppercase tracking-wide mb-1.5 flex items-center gap-2">
                          <AirplaneLanding size={14} />{t('widget.flight.flightInfo') || 'Flight Information'}
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="font-body text-[11px] text-warm-gray mb-1 block">
                              {t('widget.flight.airline')}
                              <span className="text-[#B23A2F] ml-0.5">*</span>
                            </label>
                            <select value={booking.airline} onChange={e => updateBooking({ airline: e.target.value })}
                              className={`w-full h-11 bg-[#FAFAF8] border rounded-md px-3 font-body text-sm text-charcoal focus:border-terracotta outline-none transition-all appearance-none ${fieldErrors.airline ? 'border-[rgba(178,58,47,0.5)]' : 'border-[rgba(138,130,120,0.2)]'}`}>
                              <option value="">{t('widget.flight.selectAirline') || 'Select airline'}</option>
                              {airlines.map(a => <option key={a} value={a}>{a}</option>)}
                            </select>
                            {fieldErrors.airline && <p className="font-body text-[11px] text-[#B23A2F] mt-1">{t(fieldErrors.airline)}</p>}
                          </div>
                          <div>
                            <label className="font-body text-[11px] text-warm-gray mb-1 block">
                              {t('widget.flight.flightNumber')}
                              <span className="text-[#B23A2F] ml-0.5">*</span>
                            </label>
                            <input type="text" value={booking.flightNumber} onChange={e => updateBooking({ flightNumber: e.target.value })}
                              placeholder="AA1234" className={`w-full h-11 bg-[#FAFAF8] border rounded-md px-3 font-body text-sm text-charcoal placeholder:text-warm-gray/50 focus:border-terracotta outline-none transition-all ${fieldErrors.flightNumber ? 'border-[rgba(178,58,47,0.5)]' : 'border-[rgba(138,130,120,0.2)]'}`} />
                            {fieldErrors.flightNumber && <p className="font-body text-[11px] text-[#B23A2F] mt-1">{t(fieldErrors.flightNumber)}</p>}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Hotel Destination - Collapsible Search */}
                    <div>
                      <label className="font-body text-xs font-medium text-warm-gray uppercase tracking-wide mb-1.5 block">
                        {t('widget.step2.destination') || 'Hotel / Destination'}
                        <span className="text-[#B23A2F] ml-0.5">*</span>
                      </label>

                      {/* Selected destination badge */}
                      {booking.destinationId && (
                        <div className="mb-2 flex items-center justify-between bg-[rgba(199,94,58,0.06)] border border-[rgba(199,94,58,0.15)] rounded-md px-3 py-2.5">
                          <div className="flex items-center gap-2">
                            <Check size={14} className="text-terracotta" />
                            <span className="font-body text-sm font-medium text-charcoal">{selectedDestination?.name || t('common.loading')}</span>
                          </div>
                          <button onClick={() => { updateBooking({ destinationId: null }); setDestSearch(''); setShowDestSearch(true); }} className="text-warm-gray hover:text-[#B23A2F] transition-colors"><ArrowLeft size={14} className="rotate-45" /></button>
                        </div>
                      )}

                      {/* Search input */}
                      {(!booking.destinationId || showDestSearch) && (
                        <div className="relative">
                          <Buildings size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-gray" />
                          <input type="text" value={destSearch}
                            onChange={e => { setDestSearch(e.target.value); if (booking.destinationId) updateBooking({ destinationId: null }); }}
                            onFocus={() => setShowDestSearch(true)}
                            placeholder={t('widget.step2.searchDestination') || 'Click to search hotels and destinations...'}
                            className={`w-full h-12 bg-[#FAFAF8] border rounded-md pl-10 pr-4 font-body text-sm text-charcoal placeholder:text-warm-gray/50 focus:border-terracotta focus:ring-[3px] focus:ring-[rgba(199,94,58,0.1)] outline-none transition-all ${fieldErrors.destinationId ? 'border-[rgba(178,58,47,0.5)]' : 'border-[rgba(138,130,120,0.2)]'}`} />
                        </div>
                      )}
                      {fieldErrors.destinationId && <p className="font-body text-[11px] text-[#B23A2F] mt-1">{t(fieldErrors.destinationId)}</p>}

                      {/* Dropdown results */}
                      {showDestSearch && (!booking.destinationId || destSearch) && (
                        <div className="mt-2 max-h-40 overflow-y-auto border border-[rgba(138,130,120,0.12)] rounded-md bg-white shadow-sm">
                          {filteredDestinations.length > 0 ? (
                            filteredDestinations.slice(0, 10).map(dest => (
                              <button key={dest.id}
                                onClick={() => { updateBooking({ destinationId: String(dest.id) }); setDestSearch(''); setShowDestSearch(false); }}
                                className="w-full text-left px-3 py-2.5 font-body text-sm text-charcoal hover:bg-sand transition-colors border-b border-[rgba(138,130,120,0.05)] last:border-0 flex items-center gap-2">
                                <Buildings size={14} className="text-warm-gray flex-shrink-0" />{dest.name}
                              </button>
                            ))
                          ) : destSearch ? (
                            <div className="px-3 py-3 font-body text-sm text-warm-gray text-center">{t('widget.step2.noResults') || 'No results found'}</div>
                          ) : (
                            <div className="px-3 py-3 font-body text-sm text-warm-gray text-center">{t('widget.step2.typeToSearch') || 'Type to search destinations'}</div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Tour Selection for Private Tour service */}
                    {isTourService && toursList && toursList.length > 0 && (
                      <div>
                        <label className="font-body text-xs font-medium text-warm-gray uppercase tracking-wide mb-1.5 block">Select Tour</label>
                        <div className="relative">
                          <MapTrifold size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-gray" />
                          <select value={booking.tourId || ''} onChange={e => updateBooking({ tourId: e.target.value })}
                            className="w-full h-12 bg-[#FAFAF8] border border-[rgba(138,130,120,0.2)] rounded-md pl-10 pr-4 font-body text-sm text-charcoal focus:border-terracotta focus:ring-[3px] focus:ring-[rgba(199,94,58,0.1)] outline-none transition-all appearance-none">
                            <option value="">Select a tour</option>
                            {toursList.map((tour: any) => (
                              <option key={tour.id} value={String(tour.id)}>{tour.name}{tour.duration ? ` (${tour.duration})` : ''} - ${tour.price}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}

                    {/* Passengers */}
                    <div>
                      <label className="font-body text-xs font-medium text-warm-gray uppercase tracking-wide mb-1.5 block">{t('widget.step2.passengers')}</label>
                      <div className="relative">
                        <Users size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-gray" />
                        <div className="flex items-center h-12 bg-[#FAFAF8] border border-[rgba(138,130,120,0.2)] rounded-md pl-10 pr-3">
                          <button onClick={() => updateBooking({ passengers: Math.max(1, booking.passengers - 1) })}
                            className="w-8 h-8 rounded-md bg-white border border-[rgba(138,130,120,0.2)] flex items-center justify-center font-body font-semibold text-charcoal hover:border-terracotta transition-colors">-</button>
                          <span className="flex-1 text-center font-body text-sm font-medium text-charcoal">{booking.passengers} {t('common.passenger')}{booking.passengers > 1 ? 's' : ''}</span>
                          <button onClick={() => updateBooking({ passengers: Math.min(16, booking.passengers + 1) })}
                            className="w-8 h-8 rounded-md bg-white border border-[rgba(138,130,120,0.2)] flex items-center justify-center font-body font-semibold text-charcoal hover:border-terracotta transition-colors">+</button>
                        </div>
                      </div>
                    </div>

                    {/* Luggage */}
                    <div>
                      <label className="font-body text-xs font-medium text-warm-gray uppercase tracking-wide mb-1.5 block">{t('widget.step2.luggage')}</label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { id: 'standard' as const, label: t('widget.step2.luggageStandard'), icon: <Suitcase size={18} /> },
                          { id: 'oversized' as const, label: t('widget.step2.luggageOversized'), icon: <Package size={18} /> },
                          { id: 'extra' as const, label: t('widget.step2.luggageExtra'), icon: <ShoppingCart size={18} /> },
                        ].map(opt => (
                          <button key={opt.id} onClick={() => updateBooking({ luggage: opt.id })}
                            className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all ${booking.luggage === opt.id ? 'border-terracotta bg-[rgba(199,94,58,0.04)]' : 'border-[rgba(138,130,120,0.15)] bg-white hover:border-[rgba(138,130,120,0.3)]'}`}>
                            <span className={booking.luggage === opt.id ? 'text-terracotta' : 'text-warm-gray'}>{opt.icon}</span>
                            <span className={`font-body text-[11px] font-medium ${booking.luggage === opt.id ? 'text-terracotta' : 'text-charcoal'}`}>{opt.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <button onClick={handleNext} disabled={!canProceed()}
                    className={`w-full flex items-center justify-center gap-2 h-12 rounded-full font-body font-semibold text-sm transition-all ${canProceed() ? 'bg-terracotta text-white shadow-button hover:bg-terracotta-dark hover:-translate-y-0.5' : 'bg-terracotta/50 text-white/70 cursor-not-allowed'}`}>
                    {t('common.continue')} <ArrowRight size={16} />
                  </button>
                </div>
              )}

              {/* Step 3 - Departure Information (round trip only) */}
              {currentStep === 3 && isRoundTrip && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <button onClick={handleBack} className="text-warm-gray hover:text-charcoal transition-colors"><ArrowLeft size={20} /></button>
                    <h2 className="font-display text-[22px] font-bold text-charcoal">{t('widget.flight.departureTitle') || 'Departure Information'}</h2>
                  </div>
                  <p className="font-body text-[13px] text-warm-gray mb-4">{t('widget.flight.departureSubtitle') || 'Enter your departure flight details'}</p>
                  <div className="space-y-4 mb-6">

                    {/* Departure Date & Departure Flight Time */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="font-body text-[11px] text-warm-gray mb-1 block">
                          {t('widget.flight.departureDate')}
                          <span className="text-[#B23A2F] ml-0.5">*</span>
                        </label>
                        <div className="relative">
                          <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-gray" />
                          <input type="date" value={booking.departureDate} min={booking.date || new Date().toISOString().split('T')[0]}
                            onChange={e => updateBooking({ departureDate: e.target.value })}
                            className={`w-full h-11 bg-[#FAFAF8] border rounded-md pl-9 pr-3 font-body text-sm text-charcoal focus:border-terracotta outline-none transition-all ${fieldErrors.departureDate ? 'border-[rgba(178,58,47,0.5)]' : 'border-[rgba(138,130,120,0.2)]'}`} />
                        </div>
                        {fieldErrors.departureDate && <p className="font-body text-[11px] text-[#B23A2F] mt-1">{t(fieldErrors.departureDate)}</p>}
                      </div>
                      <div>
                        <label className="font-body text-[11px] text-warm-gray mb-1 block">
                          {t('widget.flight.departureTime') || 'Departure Flight Time'}
                          <span className="text-[#B23A2F] ml-0.5">*</span>
                        </label>
                        <div className="relative">
                          <Clock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-gray" />
                          <select value={booking.departureTime} onChange={e => updateBooking({ departureTime: e.target.value })}
                            className={`w-full h-11 bg-[#FAFAF8] border rounded-md pl-9 pr-3 font-body text-sm text-charcoal focus:border-terracotta outline-none transition-all appearance-none ${fieldErrors.departureTime ? 'border-[rgba(178,58,47,0.5)]' : 'border-[rgba(138,130,120,0.2)]'}`}>
                            <option value="">{t('widget.step2.selectTime')}</option>
                            {timeSlots.map(o => <option key={o} value={o}>{o}</option>)}
                          </select>
                        </div>
                        {fieldErrors.departureTime && <p className="font-body text-[11px] text-[#B23A2F] mt-1">{t(fieldErrors.departureTime)}</p>}
                      </div>
                    </div>

                    {/* Departure Airline & Flight Number */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="font-body text-[11px] text-warm-gray mb-1 block">{t('widget.flight.departureAirline') || 'Airline'}</label>
                        <select value={booking.departureAirline} onChange={e => updateBooking({ departureAirline: e.target.value })}
                          className="w-full h-11 bg-[#FAFAF8] border border-[rgba(138,130,120,0.2)] rounded-md px-3 font-body text-sm text-charcoal focus:border-terracotta outline-none transition-all appearance-none">
                          <option value="">{t('widget.flight.selectAirline') || 'Select airline'}</option>
                          {airlines.map(a => <option key={a} value={a}>{a}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="font-body text-[11px] text-warm-gray mb-1 block">{t('widget.flight.departureFlightNumber') || 'Flight Number'}</label>
                        <input type="text" value={booking.departureFlightNumber} onChange={e => updateBooking({ departureFlightNumber: e.target.value })}
                          placeholder="AA1234" className="w-full h-11 bg-[#FAFAF8] border border-[rgba(138,130,120,0.2)] rounded-md px-3 font-body text-sm text-charcoal placeholder:text-warm-gray/50 focus:border-terracotta outline-none transition-all" />
                      </div>
                    </div>

                    {/* Hotel Pickup Time */}
                    <div>
                      <label className="font-body text-[11px] text-warm-gray mb-1 block">
                        {t('widget.flight.hotelPickupTime') || 'Hotel Pickup Time'}
                        <span className="text-[#B23A2F] ml-0.5">*</span>
                      </label>
                      <div className="relative">
                        <Clock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-gray" />
                        <select value={booking.hotelPickupTime} onChange={e => updateBooking({ hotelPickupTime: e.target.value })}
                          className={`w-full h-11 bg-[#FAFAF8] border rounded-md pl-9 pr-3 font-body text-sm text-charcoal focus:border-terracotta outline-none transition-all appearance-none ${fieldErrors.hotelPickupTime ? 'border-[rgba(178,58,47,0.5)]' : 'border-[rgba(138,130,120,0.2)]'}`}>
                          <option value="">{t('widget.step2.selectTime')}</option>
                          {timeSlots.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                      </div>
                      {fieldErrors.hotelPickupTime && <p className="font-body text-[11px] text-[#B23A2F] mt-1">{t(fieldErrors.hotelPickupTime)}</p>}
                    </div>

                    {/* Recommendation comment */}
                    <p className="font-body text-[11px] text-terracotta/80 italic mt-1">
                      * {t('widget.flight.pickupRecommendation') || 'Se recomienda agendar la reserva 3 horas antes de su vuelo'}
                    </p>
                  </div>
                  <button onClick={handleNext} disabled={!canProceed()}
                    className={`w-full flex items-center justify-center gap-2 h-12 rounded-full font-body font-semibold text-sm transition-all ${canProceed() ? 'bg-terracotta text-white shadow-button hover:bg-terracotta-dark hover:-translate-y-0.5' : 'bg-terracotta/50 text-white/70 cursor-not-allowed'}`}>
                    {t('common.continue')} <ArrowRight size={16} />
                  </button>
                </div>
              )}

              {/* Step 3 (one way) / Step 4 (round trip) - Vehicle Selection */}
              {((currentStep === 3 && !isRoundTrip) || (currentStep === 4 && isRoundTrip)) && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <button onClick={handleBack} className="text-warm-gray hover:text-charcoal transition-colors"><ArrowLeft size={20} /></button>
                    <h2 className="font-display text-[22px] font-bold text-charcoal">{t('widget.step3.title')}</h2>
                  </div>
                  <div className="bg-sand rounded-lg p-3 mb-4">
                    <div className="flex items-center justify-between">
                      <span className="font-body text-xs font-medium text-charcoal">{selectedDestination?.name}</span>
                      <button onClick={() => { setDirection(-1); setCurrentStep(2); }} className="font-body text-xs text-terracotta font-medium hover:underline">{t('common.edit')}</button>
                    </div>
                    <div className="font-body text-[11px] text-warm-gray mt-1">{booking.date} &middot; {booking.time} &middot; {booking.passengers} {t('common.passengers')}</div>
                  </div>
                  <div className="space-y-3 mb-4">
                    {vehiclesList?.map((vehicle: any) => {
                      const vPrice = parseFloat(String(vehicle.price));
                      const vTax = Math.round(vPrice * taxRateDecimal * 100) / 100;
                      const vTotal = Math.round((vPrice + vTax) * 100) / 100;
                      return (
                      <button key={vehicle.id} onClick={() => updateBooking({ vehicleId: String(vehicle.id) })}
                        className={`w-full flex gap-4 p-4 rounded-lg border-2 text-left transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${Number(booking.vehicleId) === vehicle.id ? 'border-terracotta bg-[rgba(199,94,58,0.03)]' : 'border-[rgba(138,130,120,0.12)] bg-white'}`}>
                        <img src={vehicle.image || '/vehicle-suburban.jpg'} alt={vehicle.name} className="w-20 h-[60px] object-cover rounded-md flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-body text-[15px] font-semibold text-charcoal">{vehicle.name}</span>
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${Number(booking.vehicleId) === vehicle.id ? 'border-terracotta' : 'border-warm-gray'}`}>
                              {Number(booking.vehicleId) === vehicle.id && <div className="w-2.5 h-2.5 rounded-full bg-terracotta" />}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 mb-2">
                            <Users size={12} className="text-warm-gray" />
                            <span className="font-body text-xs text-warm-gray">{vehicle.capacityMin}-{vehicle.capacityMax} {t('widget.step3.passengers')}</span>
                          </div>
                          <div className="flex flex-wrap gap-1 mb-1">
                            {(vehicle.features || []).map((f: string) => (
                              <span key={f} className="inline-flex items-center gap-0.5 bg-sand rounded-full px-2 py-0.5 font-body text-[11px] text-warm-gray">{featureIcons[f] || null}{f}</span>
                            ))}
                          </div>
                          <span className="font-body text-lg font-bold text-terracotta">${vPrice} {t('common.usd')}</span>
                          <span className="font-body text-xs text-warm-gray ml-2">({t('common.iva', { rate: taxRate })} + {t('common.total')}: ${vTotal} USD)</span>
                        </div>
                      </button>
                      );
                    })}
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <div className="font-body text-sm text-warm-gray">{t('common.total')}: <span className="font-bold text-terracotta text-base">${total.toFixed(2)} {t('common.usd')}</span></div>
                    <button onClick={handleNext} disabled={!canProceed()}
                      className={`flex items-center gap-2 px-6 py-3 rounded-full font-body font-semibold text-sm transition-all ${canProceed() ? 'bg-terracotta text-white shadow-button hover:bg-terracotta-dark hover:-translate-y-0.5' : 'bg-terracotta/50 text-white/70 cursor-not-allowed'}`}>
                      {t('common.continue')} <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              )}

              {/* Step 4 (one way) / Step 5 (round trip) - Summary + Optional Services */}
              {((currentStep === 4 && !isRoundTrip) || (currentStep === 5 && isRoundTrip)) && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <button onClick={handleBack} className="text-warm-gray hover:text-charcoal transition-colors"><ArrowLeft size={20} /></button>
                    <h2 className="font-display text-[22px] font-bold text-charcoal">{t('widget.step4.title') || 'Order Summary'}</h2>
                  </div>
                  <p className="font-body text-[13px] text-warm-gray mb-4">{t('widget.step4.subtitle') || 'Review your booking and add optional services'}</p>

                  {/* Service Summary */}
                  <div className="bg-sand rounded-lg p-4 mb-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="font-body text-sm text-charcoal">{selectedService?.name} — {selectedDestination?.name}</span>
                      <span className="font-body text-sm font-medium text-charcoal">${basePrice.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-body text-sm text-charcoal">{selectedVehicle?.name}</span>
                      <span className="font-body text-sm text-warm-gray">{isRoundTrip ? t('common.roundTrip') : t('common.oneWay')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-body text-sm text-warm-gray">{t('common.passengers')}</span>
                      <span className="font-body text-sm text-charcoal">{booking.passengers}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-body text-sm text-warm-gray">{t('widget.step2.luggage')}</span>
                      <span className="font-body text-sm text-charcoal capitalize">{booking.luggage}</span>
                    </div>
                    <div className="border-t border-[rgba(138,130,120,0.15)] my-1" />
                    <div className="flex justify-between">
                      <span className="font-body text-sm text-warm-gray">{t('common.subtotal')}</span>
                      <span className="font-body text-sm text-charcoal">${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-body text-sm text-warm-gray">{t('common.iva', { rate: taxRate })}</span>
                      <span className="font-body text-sm text-charcoal">${tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-body text-base font-semibold text-charcoal">{t('common.total')}</span>
                      <span className="font-body text-base font-bold text-terracotta">${total.toFixed(2)} {t('common.usd')}</span>
                    </div>
                  </div>

                  {/* Optional Services */}
                  {optionalServicesList && optionalServicesList.length > 0 && (
                    <div className="mb-5">
                      <h3 className="font-body text-sm font-semibold text-charcoal mb-3 flex items-center gap-2">
                        <ShoppingCart size={16} className="text-terracotta" />
                        {t('widget.step4.optionalServices') || 'Optional Services'}
                      </h3>
                      <div className="space-y-2">
                        {optionalServicesList.map((svc: any) => {
                          const isSelected = booking.selectedOptionalServices.includes(svc.id);
                          const svcPrice = parseFloat(String(svc.price));
                          const displayPrice = svc.perPassenger ? svcPrice * booking.passengers : svcPrice;
                          return (
                            <button key={svc.id}
                              onClick={() => {
                                const newSelection = isSelected
                                  ? booking.selectedOptionalServices.filter(id => id !== svc.id)
                                  : [...booking.selectedOptionalServices, svc.id];
                                updateBooking({ selectedOptionalServices: newSelection });
                              }}
                              className={`w-full flex items-center justify-between p-3 rounded-lg border-2 text-left transition-all ${isSelected ? 'border-terracotta bg-[rgba(199,94,58,0.04)]' : 'border-[rgba(138,130,120,0.12)] bg-white hover:border-[rgba(138,130,120,0.25)]'}`}>
                              <div className="flex items-center gap-3">
                                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${isSelected ? 'border-terracotta bg-terracotta' : 'border-warm-gray'}`}>
                                  {isSelected && <Check size={12} weight="bold" className="text-white" />}
                                </div>
                                <div>
                                  <span className={`font-body text-sm font-medium block ${isSelected ? 'text-terracotta' : 'text-charcoal'}`}>{svc.name}</span>
                                  {svc.description && <span className="font-body text-[11px] text-warm-gray">{svc.description}</span>}
                                </div>
                              </div>
                              <div className="text-right">
                                <span className={`font-body text-sm font-semibold ${isSelected ? 'text-terracotta' : 'text-charcoal'}`}>
                                  {svcPrice > 0 ? `$${displayPrice.toFixed(2)}` : t('common.free') || 'Free'}
                                </span>
                                {svc.perPassenger && svcPrice > 0 && (
                                  <span className="font-body text-[10px] text-warm-gray block">{t('widget.step4.perPassenger') || 'per passenger'}</span>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                      {/* Recalculated total with optionals */}
                      <div className="mt-3 bg-[rgba(199,94,58,0.04)] border border-[rgba(199,94,58,0.15)] rounded-lg p-3">
                        <div className="flex justify-between">
                          <span className="font-body text-sm text-charcoal">{t('common.subtotal')}</span>
                          <span className="font-body text-sm text-charcoal">${subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-body text-sm text-warm-gray">{t('common.iva', { rate: taxRate })}</span>
                          <span className="font-body text-sm text-warm-gray">${tax.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between mt-1 pt-1 border-t border-[rgba(138,130,120,0.1)]">
                          <span className="font-body text-base font-semibold text-charcoal">{t('common.total')}</span>
                          <span className="font-body text-lg font-bold text-terracotta">${total.toFixed(2)} {t('common.usd')}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <button onClick={handleNext} disabled={!canProceed()}
                    className={`w-full flex items-center justify-center gap-2 h-12 rounded-full font-body font-semibold text-sm transition-all ${canProceed() ? 'bg-terracotta text-white shadow-button hover:bg-terracotta-dark hover:-translate-y-0.5' : 'bg-terracotta/50 text-white/70 cursor-not-allowed'}`}>
                    {t('widget.step4.continueToPayment') || 'Continue to Payment'} <ArrowRight size={16} />
                  </button>
                </div>
              )}

              {/* Step 5 (one way) / Step 6 (round trip) - Payment: Passenger Data + Payment Option + Method */}
              {((currentStep === 5 && !isRoundTrip) || (currentStep === 6 && isRoundTrip)) && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <button onClick={handleBack} className="text-warm-gray hover:text-charcoal transition-colors"><ArrowLeft size={20} /></button>
                    <h2 className="font-display text-[22px] font-bold text-charcoal">{t('widget.step5.title') || 'Payment'}</h2>
                  </div>

                  {/* Passenger Data */}
                  <div className="border-b border-[rgba(138,130,120,0.1)] pb-5 mb-5">
                    <h3 className="font-body text-sm font-semibold text-charcoal mb-3">{t('widget.step4.passengerData')}</h3>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <label className="font-body text-[11px] text-warm-gray mb-1 block">
                          {t('widget.step4.firstName')}
                          <span className="text-[#B23A2F] ml-0.5">*</span>
                        </label>
                        <input type="text" value={booking.passengerName} onChange={e => updateBooking({ passengerName: e.target.value })}
                          className={`w-full h-11 bg-[#FAFAF8] border rounded-md px-3 font-body text-sm text-charcoal focus:border-terracotta outline-none transition-all ${fieldErrors.passengerName ? 'border-[rgba(178,58,47,0.5)]' : 'border-[rgba(138,130,120,0.2)]'}`} />
                        {fieldErrors.passengerName && <p className="font-body text-[11px] text-[#B23A2F] mt-1">{t(fieldErrors.passengerName)}</p>}
                      </div>
                      <div>
                        <label className="font-body text-[11px] text-warm-gray mb-1 block">
                          {t('widget.step4.lastName')}
                          <span className="text-[#B23A2F] ml-0.5">*</span>
                        </label>
                        <input type="text" value={booking.passengerLastName} onChange={e => updateBooking({ passengerLastName: e.target.value })}
                          className={`w-full h-11 bg-[#FAFAF8] border rounded-md px-3 font-body text-sm text-charcoal focus:border-terracotta outline-none transition-all ${fieldErrors.passengerLastName ? 'border-[rgba(178,58,47,0.5)]' : 'border-[rgba(138,130,120,0.2)]'}`} />
                        {fieldErrors.passengerLastName && <p className="font-body text-[11px] text-[#B23A2F] mt-1">{t(fieldErrors.passengerLastName)}</p>}
                      </div>
                    </div>
                    <div className="mb-3">
                      <label className="font-body text-[11px] text-warm-gray mb-1 block">
                        {t('widget.step4.email')}
                        <span className="text-[#B23A2F] ml-0.5">*</span>
                      </label>
                      <input type="email" value={booking.passengerEmail} onChange={e => updateBooking({ passengerEmail: e.target.value })}
                        className={`w-full h-11 bg-[#FAFAF8] border rounded-md px-3 font-body text-sm text-charcoal focus:border-terracotta outline-none transition-all ${fieldErrors.passengerEmail ? 'border-[rgba(178,58,47,0.5)]' : 'border-[rgba(138,130,120,0.2)]'}`} />
                      {fieldErrors.passengerEmail && <p className="font-body text-[11px] text-[#B23A2F] mt-1">{t(fieldErrors.passengerEmail)}</p>}
                    </div>
                    <div className="mb-3">
                      <label className="font-body text-[11px] text-warm-gray mb-1 block">{t('widget.step4.phone')}</label>
                      <div className="flex gap-2">
                        <select className="h-11 bg-[#FAFAF8] border border-[rgba(138,130,120,0.2)] rounded-md px-2 font-body text-sm text-charcoal focus:border-terracotta outline-none w-20 flex-shrink-0">
                          <option>+52</option><option>+1</option><option>+44</option>
                        </select>
                        <input type="tel" value={booking.passengerPhone} onChange={e => updateBooking({ passengerPhone: e.target.value })}
                          className={`flex-1 h-11 bg-[#FAFAF8] border rounded-md px-3 font-body text-sm text-charcoal placeholder:text-warm-gray/50 focus:border-terracotta outline-none transition-all ${fieldErrors.passengerPhone ? 'border-[rgba(178,58,47,0.5)]' : 'border-[rgba(138,130,120,0.2)]'}`} />
                      </div>
                      {fieldErrors.passengerPhone && <p className="font-body text-[11px] text-[#B23A2F] mt-1">{t(fieldErrors.passengerPhone)}</p>}
                    </div>
                    <div>
                      <label className="font-body text-[11px] text-warm-gray mb-1 block">{t('widget.step4.specialNotes')}</label>
                      <textarea value={booking.passengerNotes} onChange={e => updateBooking({ passengerNotes: e.target.value })}
                        placeholder={t('widget.step4.notesPlaceholder')} rows={2}
                        className="w-full bg-[#FAFAF8] border border-[rgba(138,130,120,0.2)] rounded-md px-3 py-2 font-body text-sm text-charcoal placeholder:text-warm-gray/50 focus:border-terracotta outline-none transition-all resize-none" />
                    </div>
                  </div>

                  {/* Payment Option: Full vs Deposit */}
                  {depositEnabled && (
                    <div className="mb-5">
                      <h3 className="font-body text-sm font-semibold text-charcoal mb-3">{t('widget.step5.paymentOption') || 'Payment Option'}</h3>
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <button onClick={() => updateBooking({ paymentOption: 'full' })}
                          className={`p-4 rounded-lg border-2 text-center transition-all ${booking.paymentOption === 'full' ? 'border-terracotta bg-[rgba(199,94,58,0.04)]' : 'border-[rgba(138,130,120,0.15)] bg-white'}`}>
                          <span className={`font-body text-sm font-semibold block ${booking.paymentOption === 'full' ? 'text-terracotta' : 'text-charcoal'}`}>{t('widget.step5.payFull') || 'Pay Full Amount'}</span>
                          <span className="font-body text-xs text-warm-gray">${total.toFixed(2)} USD</span>
                        </button>
                        <button onClick={() => updateBooking({ paymentOption: 'deposit' })}
                          className={`p-4 rounded-lg border-2 text-center transition-all ${booking.paymentOption === 'deposit' ? 'border-terracotta bg-[rgba(199,94,58,0.04)]' : 'border-[rgba(138,130,120,0.15)] bg-white'}`}>
                          <span className={`font-body text-sm font-semibold block ${booking.paymentOption === 'deposit' ? 'text-terracotta' : 'text-charcoal'}`}>{t('widget.step5.payDeposit') || 'Pay Deposit'}</span>
                          <span className="font-body text-xs text-warm-gray">${depositAmount.toFixed(2)} USD ({depositPercentage}%)</span>
                        </button>
                      </div>
                      {booking.paymentOption === 'deposit' && (
                        <div className="bg-[rgba(199,94,58,0.06)] border border-[rgba(199,94,58,0.15)] rounded-lg p-3">
                          <div className="flex justify-between mb-1">
                            <span className="font-body text-xs text-warm-gray">{t('widget.step5.depositAmount') || 'Deposit to pay now'}</span>
                            <span className="font-body text-sm font-semibold text-[#2D6A4F]">${depositAmount.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-body text-xs text-warm-gray">{t('widget.step5.balanceDue') || 'Balance due at service'}</span>
                            <span className="font-body text-sm font-semibold text-terracotta">${balanceDue.toFixed(2)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Payment Method */}
                  <div className="mb-5">
                    <h3 className="font-body text-sm font-semibold text-charcoal mb-3">{t('widget.step4.paymentMethod')}</h3>
                    <div className="flex gap-2 mb-4">
                      {[
                        { id: 'card' as const, label: t('widget.step4.creditCard'), icon: <CreditCard size={18} />, badge: t('widget.step4.badgeRecommended') },
                        { id: 'paypal' as const, label: t('widget.step4.paypal'), icon: <PaypalLogo size={18} />, badge: null },
                        { id: 'cash' as const, label: t('widget.step4.cash'), icon: <Money size={18} />, badge: null },
                      ].map(method => (
                        <button key={method.id} onClick={() => updateBooking({ paymentMethod: method.id })}
                          className={`flex-1 flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all ${booking.paymentMethod === method.id ? 'border-terracotta' : 'border-[rgba(138,130,120,0.15)]'}`}>
                          <span className={booking.paymentMethod === method.id ? 'text-terracotta' : 'text-warm-gray'}>{method.icon}</span>
                          <span className="font-body text-[11px] font-medium text-charcoal">{method.label}</span>
                          {method.badge && <span className="font-body text-[9px] bg-[rgba(45,106,79,0.1)] text-[#2D6A4F] rounded-full px-1.5 py-0.5">{method.badge}</span>}
                        </button>
                      ))}
                    </div>
                    {booking.paymentMethod === 'card' && (
                      <div className="space-y-3">
                        <div>
                          <label className="font-body text-[11px] text-warm-gray mb-1 block">{t('widget.step4.cardNumber')}</label>
                          <div className="relative">
                            <CreditCard size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-gray" />
                            <input type="text" placeholder={t('widget.step4.cardPlaceholder')}
                              className="w-full h-11 bg-[#FAFAF8] border border-[rgba(138,130,120,0.2)] rounded-md pl-10 pr-3 font-body text-sm text-charcoal placeholder:text-warm-gray/50 focus:border-terracotta outline-none transition-all" />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="font-body text-[11px] text-warm-gray mb-1 block">{t('widget.step4.expiration')}</label>
                            <input type="text" placeholder={t('widget.step4.expirationPlaceholder')}
                              className="w-full h-11 bg-[#FAFAF8] border border-[rgba(138,130,120,0.2)] rounded-md px-3 font-body text-sm text-charcoal placeholder:text-warm-gray/50 focus:border-terracotta outline-none transition-all" />
                          </div>
                          <div>
                            <label className="font-body text-[11px] text-warm-gray mb-1 block">{t('widget.step4.cvv')}</label>
                            <input type="text" placeholder={t('widget.step4.cvvPlaceholder')}
                              className="w-full h-11 bg-[#FAFAF8] border border-[rgba(138,130,120,0.2)] rounded-md px-3 font-body text-sm text-charcoal placeholder:text-warm-gray/50 focus:border-terracotta outline-none transition-all" />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Final Summary */}
                  <div className="bg-sand rounded-lg p-4 mb-4">
                    <div className="flex justify-between mb-1">
                      <span className="font-body text-sm text-charcoal">{selectedService?.name} — {selectedDestination?.name}</span>
                      <span className="font-body text-sm font-medium text-charcoal">${basePrice.toFixed(2)}</span>
                    </div>
                    {booking.selectedOptionalServices.length > 0 && optionalServicesList?.filter((s: any) => booking.selectedOptionalServices.includes(s.id)).map((svc: any) => {
                      const svcPrice = parseFloat(String(svc.price));
                      const displayPrice = svc.perPassenger ? svcPrice * booking.passengers : svcPrice;
                      return (
                        <div key={svc.id} className="flex justify-between mb-1">
                          <span className="font-body text-sm text-charcoal">+ {svc.name}</span>
                          <span className="font-body text-sm text-warm-gray">${displayPrice.toFixed(2)}</span>
                        </div>
                      );
                    })}
                    <div className="border-t border-[rgba(138,130,120,0.15)] my-2" />
                    <div className="flex justify-between mb-1">
                      <span className="font-body text-sm text-warm-gray">{t('common.subtotal')}</span>
                      <span className="font-body text-sm text-charcoal">${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span className="font-body text-sm text-warm-gray">{t('common.iva', { rate: taxRate })}</span>
                      <span className="font-body text-sm text-warm-gray">${tax.toFixed(2)}</span>
                    </div>
                    {/* Amount to pay now */}
                    <div className="border-t border-[rgba(138,130,120,0.2)] pt-2 flex justify-between items-center">
                      <div>
                        <span className="font-body text-base font-semibold text-charcoal">{t('widget.step5.amountToPay') || 'Amount to Pay'}</span>
                        {booking.paymentOption === 'deposit' && depositEnabled && (
                          <span className="font-body text-[11px] text-warm-gray block">{t('widget.step5.deposit') || 'Deposit'} ({depositPercentage}%)</span>
                        )}
                      </div>
                      <span className="font-body text-xl font-bold text-terracotta">${amountToPayNow.toFixed(2)} {t('common.usd')}</span>
                    </div>
                    {booking.paymentOption === 'deposit' && depositEnabled && balanceDue > 0 && (
                      <div className="flex justify-between mt-1">
                        <span className="font-body text-xs text-warm-gray">{t('widget.step5.balanceDue') || 'Balance due at service'}</span>
                        <span className="font-body text-sm font-semibold text-terracotta">${balanceDue.toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                  {bookingError && (
                    <div className="mb-3 p-3 bg-[rgba(178,58,47,0.08)] border border-[rgba(178,58,47,0.2)] rounded-lg">
                      <p className="font-body text-xs text-[#B23A2F] text-center">{bookingError}</p>
                    </div>
                  )}

                  {/* PayPal Button */}
                  {booking.paymentMethod === 'paypal' ? (
                    <PayPalButton
                      apiKey={apiKey}
                      amount={amountToPayNow.toFixed(2)}
                      description={`${selectedService?.name} — ${selectedDestination?.name}`}
                      onApproved={(orderId) => {
                        setPaypalOrderId(orderId);
                        setBookingError('');
                        // Create booking after PayPal payment is approved
                        if (clientConfig?.id && selectedDestination && selectedVehicle && apiKey) {
                          createBooking.mutate({
                            apiKey,
                            serviceId: Number(booking.serviceId),
                            destinationId: Number(booking.destinationId),
                            tripType: booking.tripType || 'one_way',
                            origin: booking.origin || (isAirportService ? 'Cancun International Airport (CUN)' : ''),
                            destination: selectedDestination.name,
                            date: booking.date,
                            time: booking.time,
                            passengers: booking.passengers,
                            vehicleId: Number(booking.vehicleId),
                            passengerName: booking.passengerName,
                            passengerLastName: booking.passengerLastName,
                            passengerEmail: booking.passengerEmail,
                            passengerPhone: booking.passengerPhone || undefined,
                            passengerNotes: booking.passengerNotes || undefined,
                            selectedOptionalServices: booking.selectedOptionalServices.length > 0 ? booking.selectedOptionalServices : undefined,
                            luggage: booking.luggage,
                            flightNumber: booking.flightNumber || undefined,
                            airline: booking.airline || undefined,
                            departureDate: booking.departureDate || undefined,
                            departureTime: booking.departureTime || undefined,
                            departureAirline: booking.departureAirline || undefined,
                            departureFlightNumber: booking.departureFlightNumber || undefined,
                            hotelPickupTime: booking.hotelPickupTime || undefined,
                            paymentMethod: booking.paymentMethod,
                            paymentOption: booking.paymentOption,
                          });
                        }
                      }}
                      onError={(error) => {
                        setBookingError(error);
                      }}
                    />
                  ) : (
                    <button onClick={handleNext} disabled={!canProceed() || createBooking.isPending}
                      className={`w-full h-[52px] rounded-lg font-body font-semibold text-base transition-all ${canProceed() && !bookingError ? 'bg-terracotta text-white shadow-button hover:bg-terracotta-dark hover:-translate-y-0.5' : 'bg-terracotta/50 text-white/70 cursor-not-allowed'}`}>
                      {createBooking.isPending ? t('widget.step4.processing') : `${t('widget.step5.payNow') || 'Pay'} $${amountToPayNow.toFixed(2)} USD`}
                    </button>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
    </div>
    </div>
    </div>
  );
}
