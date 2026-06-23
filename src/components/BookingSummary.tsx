import { useTranslation } from 'react-i18next';
import {
  AirplaneLanding, MapTrifold, Clock, MapPin,
  Calendar, Users, Check, CreditCard, PaypalLogo,
  Money, ShieldCheck, Suitcase, ShoppingCart,
  ArrowsLeftRight, ArrowRight,
} from '@phosphor-icons/react';
import type { BookingData } from '@/types';
import type { WidgetPalette } from '@/hooks/useWidgetTheme';

interface BookingSummaryProps {
  booking: BookingData;
  selectedService?: { name: string; slug: string } | null;
  selectedDestination?: { name: string } | null;
  selectedVehicle?: { name: string; price: string | number; image?: string } | null;
  optionalServicesList?: Array<{ id: number; name: string; price: string | number; perPassenger?: boolean }> | null;
  palette: WidgetPalette;
  subtotal: number;
  tax: number;
  total: number;
  amountToPayNow: number;
  depositAmount: number;
  balanceDue: number;
  depositEnabled: boolean;
  depositPercentage: number;
  taxRate: number;
  isRoundTrip: boolean;
}

const serviceIcons: Record<string, React.ReactNode> = {
  'airport-transfer': <AirplaneLanding size={16} />,
  'private-tour': <MapTrifold size={16} />,
  'hourly': <Clock size={16} />,
};

const paymentIcons: Record<string, React.ReactNode> = {
  card: <CreditCard size={14} />,
  paypal: <PaypalLogo size={14} />,
  cash: <Money size={14} />,
};

export default function BookingSummary({
  booking,
  selectedService,
  selectedDestination,
  selectedVehicle,
  optionalServicesList,
  palette,
  subtotal,
  tax,
  total,
  amountToPayNow,
  depositAmount,
  balanceDue,
  depositEnabled,
  depositPercentage,
  taxRate,
  isRoundTrip,
}: BookingSummaryProps) {
  const { t } = useTranslation();

  const hasData = selectedService || selectedDestination || booking.date;

  const selectedOptionalServices = optionalServicesList?.filter(s =>
    booking.selectedOptionalServices.includes(s.id)
  ) || [];

  if (!hasData) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-6">
        <div className="w-14 h-14 rounded-full flex items-center justify-center mb-3" style={{ backgroundColor: palette.primary08 }}>
          <ShoppingCart size={24} style={{ color: palette.primary }} />
        </div>
        <h3 className="font-display text-base font-semibold text-charcoal mb-1">{t('widget.summary.title') || 'Your Booking'}</h3>
        <p className="font-body text-xs text-warm-gray">{t('widget.summary.empty') || 'Complete the steps to see your booking summary.'}</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-5 py-4 border-b border-[rgba(138,130,120,0.1)]">
        <h3 className="font-display text-base font-semibold text-charcoal flex items-center gap-2">
          <ShoppingCart size={18} style={{ color: palette.primary }} />
          {t('widget.summary.title') || 'Booking Summary'}
        </h3>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

        {/* Service */}
        {selectedService && (
          <div className="flex items-start gap-3">
            <span style={{ color: palette.primary }}>{serviceIcons[selectedService.slug] || <MapPin size={16} />}</span>
            <div>
              <span className="font-body text-[11px] text-warm-gray uppercase tracking-wide">{t('admin.service')}</span>
              <p className="font-body text-sm font-medium text-charcoal">{selectedService.name}</p>
              <p className="font-body text-[11px] text-warm-gray flex items-center gap-1">
                {isRoundTrip ? <><ArrowsLeftRight size={12} /> {t('common.roundTrip')}</> : <><ArrowRight size={12} /> {t('common.oneWay')}</>}
              </p>
            </div>
          </div>
        )}

        {/* Route */}
        {selectedDestination && (
          <div className="flex items-start gap-3">
            <MapPin size={16} style={{ color: palette.primary }} />
            <div>
              <span className="font-body text-[11px] text-warm-gray uppercase tracking-wide">{t('widget.step2.destination')}</span>
              <p className="font-body text-sm font-medium text-charcoal">{selectedDestination.name}</p>
            </div>
          </div>
        )}

        {/* Date & Time */}
        {booking.date && (
          <div className="flex items-start gap-3">
            <Calendar size={16} style={{ color: palette.primary }} />
            <div>
              <span className="font-body text-[11px] text-warm-gray uppercase tracking-wide">{t('widget.step2.date')}</span>
              <p className="font-body text-sm font-medium text-charcoal">{booking.date} &middot; {booking.time}</p>
            </div>
          </div>
        )}

        {/* Passengers */}
        {booking.passengers > 0 && (
          <div className="flex items-start gap-3">
            <Users size={16} style={{ color: palette.primary }} />
            <div>
              <span className="font-body text-[11px] text-warm-gray uppercase tracking-wide">{t('widget.step2.passengers')}</span>
              <p className="font-body text-sm font-medium text-charcoal">{booking.passengers} {t('common.passenger')}{booking.passengers > 1 ? 's' : ''}</p>
            </div>
          </div>
        )}

        {/* Luggage */}
        {booking.luggage && (
          <div className="flex items-start gap-3">
            <Suitcase size={16} style={{ color: palette.primary }} />
            <div>
              <span className="font-body text-[11px] text-warm-gray uppercase tracking-wide">{t('widget.step2.luggage')}</span>
              <p className="font-body text-sm font-medium text-charcoal capitalize">{booking.luggage}</p>
            </div>
          </div>
        )}

        {/* Vehicle */}
        {selectedVehicle && (
          <div className="rounded-lg p-3 border" style={{ backgroundColor: palette.primary04, borderColor: palette.primary15 }}>
            <div className="flex items-start gap-3">
              {selectedVehicle.image && (
                <img src={selectedVehicle.image} alt={selectedVehicle.name} className="w-14 h-10 object-cover rounded-md flex-shrink-0" />
              )}
              <div className="flex-1">
                <span className="font-body text-[11px] text-warm-gray uppercase tracking-wide">{t('admin.vehicle')}</span>
                <p className="font-body text-sm font-semibold text-charcoal">{selectedVehicle.name}</p>
                <p className="font-body text-sm font-bold" style={{ color: palette.primary }}>
                  ${typeof selectedVehicle.price === 'string' ? parseFloat(selectedVehicle.price).toFixed(2) : selectedVehicle.price.toFixed(2)} {t('common.usd')}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Optional Services */}
        {selectedOptionalServices.length > 0 && (
          <div>
            <span className="font-body text-[11px] text-warm-gray uppercase tracking-wide">{t('widget.step4.optionalServices')}</span>
            <div className="mt-1 space-y-1">
              {selectedOptionalServices.map(svc => {
                const svcPrice = parseFloat(String(svc.price));
                const displayPrice = svc.perPassenger ? svcPrice * booking.passengers : svcPrice;
                return (
                  <div key={svc.id} className="flex justify-between font-body text-sm">
                    <span className="text-charcoal">+ {svc.name}</span>
                    <span className="text-warm-gray">${displayPrice.toFixed(2)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Payment Method */}
        {booking.paymentMethod && (
          <div className="flex items-center gap-2">
            <span style={{ color: palette.primary }}>{paymentIcons[booking.paymentMethod]}</span>
            <span className="font-body text-xs text-warm-gray capitalize">{booking.paymentMethod === 'card' ? t('widget.step4.creditCard') : booking.paymentMethod}</span>
          </div>
        )}

        {/* Divider */}
        <div className="border-t border-[rgba(138,130,120,0.12)]" />

        {/* Pricing */}
        <div className="space-y-1.5">
          <div className="flex justify-between font-body text-sm">
            <span className="text-warm-gray">{t('common.subtotal')}</span>
            <span className="text-charcoal">${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-body text-sm">
            <span className="text-warm-gray">{t('common.iva', { rate: taxRate })}</span>
            <span className="text-charcoal">${tax.toFixed(2)}</span>
          </div>
          {depositEnabled && booking.paymentOption === 'deposit' && (
            <>
              <div className="flex justify-between font-body text-sm">
                <span className="text-warm-gray">{t('widget.step5.depositAmount') || 'Deposit'}</span>
                <span className="text-[#2D6A4F] font-medium">${depositAmount.toFixed(2)}</span>
              </div>
              {balanceDue > 0 && (
                <div className="flex justify-between font-body text-sm">
                  <span className="text-warm-gray">{t('widget.step5.balanceDue') || 'Balance Due'}</span>
                  <span className="font-medium" style={{ color: palette.primary }}>${balanceDue.toFixed(2)}</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Total */}
        <div className="rounded-lg p-3" style={{ backgroundColor: palette.primary06, border: `1px solid ${palette.primary15}` }}>
          <div className="flex justify-between items-center">
            <span className="font-body text-sm font-semibold text-charcoal">
              {depositEnabled && booking.paymentOption === 'deposit' ? (t('widget.step5.amountToPay') || 'Amount to Pay') : t('common.total')}
            </span>
            <span className="font-body text-lg font-bold" style={{ color: palette.primary }}>
              ${amountToPayNow.toFixed(2)} {t('common.usd')}
            </span>
          </div>
        </div>

        {/* Trust badges */}
        <div className="flex items-center gap-3 text-[#8A8278] pt-1">
          <div className="flex items-center gap-1">
            <ShieldCheck size={12} />
            <span className="font-body text-[10px]">{t('common.securePayment')}</span>
          </div>
          <div className="flex items-center gap-1">
            <Check size={12} />
            <span className="font-body text-[10px]">{t('widget.summary.freeCancellation') || 'Free cancellation'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}