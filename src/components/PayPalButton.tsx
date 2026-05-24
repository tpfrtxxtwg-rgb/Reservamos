import { useEffect, useRef, useState } from 'react';
import { trpc } from '@/providers/trpc';

interface Props {
  apiKey: string;
  amount: string;
  description?: string;
  onApproved: (orderId: string, captureId?: string) => void;
  onError: (error: string) => void;
}

// Load PayPal SDK script dynamically
function loadPayPalScript(clientId: string, isSandbox: boolean): Promise<void> {
  return new Promise((resolve, reject) => {
    // Check if already loaded
    const existing = document.getElementById('paypal-sdk') as HTMLScriptElement;
    if (existing) {
      if ((window as any).paypal) resolve();
      else existing.onload = () => resolve();
      return;
    }

    const script = document.createElement('script');
    script.id = 'paypal-sdk';
    script.src = `https://www.${isSandbox ? 'sandbox.' : ''}paypal.com/sdk/js?client-id=${clientId}&currency=USD&intent=capture`;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load PayPal SDK'));
    document.head.appendChild(script);
  });
}

export default function PayPalButton({ apiKey, amount, description, onApproved, onError }: Props) {
  const paypalRef = useRef<HTMLDivElement>(null);
  const [sdkReady, setSdkReady] = useState(false);
  const [sdkError, setSdkError] = useState('');

  const { data: paypalConfig } = trpc.paypal.getConfig.useQuery({ apiKey });
  const createOrderMutation = trpc.paypal.createOrder.useMutation();
  const captureOrderMutation = trpc.paypal.captureOrder.useMutation();

  // Load PayPal SDK
  useEffect(() => {
    if (!paypalConfig?.enabled || !paypalConfig.clientId) return;

    loadPayPalScript(paypalConfig.clientId, paypalConfig.testMode)
      .then(() => setSdkReady(true))
      .catch((err) => {
        const msg = err instanceof Error ? err.message : 'Failed to load PayPal';
        setSdkError(msg);
        onError(msg);
      });
  }, [paypalConfig?.enabled, paypalConfig?.clientId, paypalConfig?.testMode]);

  // Render PayPal button
  useEffect(() => {
    if (!sdkReady || !paypalRef.current || !(window as any).paypal) return;
    if (!paypalConfig?.enabled) return;

    const container = paypalRef.current;
    container.innerHTML = ''; // Clear previous

    try {
      (window as any).paypal.Buttons({
        style: {
          layout: 'vertical',
          color: 'gold',
          shape: 'rect',
          label: 'pay',
        },
        createOrder: async () => {
          try {
            const result = await createOrderMutation.mutateAsync({
              apiKey,
              amount,
              description: description || 'ReserVamos Booking',
            });
            return result.orderId;
          } catch (err: any) {
            const msg = err?.message || 'Failed to create PayPal order';
            onError(msg);
            throw new Error(msg);
          }
        },
        onApprove: async (data: any) => {
          try {
            const result = await captureOrderMutation.mutateAsync({
              apiKey,
              orderId: data.orderID,
            });
            onApproved(data.orderID, result.captureId);
          } catch (err: any) {
            const msg = err?.message || 'Payment capture failed';
            onError(msg);
          }
        },
        onError: (err: any) => {
          const msg = typeof err === 'string' ? err : err?.message || 'PayPal error';
          onError(msg);
        },
        onCancel: () => {
          onError('Payment cancelled by user');
        },
      }).render(container);
    } catch (err: any) {
      onError(err?.message || 'Failed to render PayPal button');
    }
  }, [sdkReady, apiKey, amount, description]);

  if (!paypalConfig?.enabled) {
    return (
      <div className="p-4 bg-[rgba(178,58,47,0.08)] border border-[rgba(178,58,47,0.2)] rounded-lg">
        <p className="font-body text-sm text-[#B23A2F] text-center">PayPal is not enabled for this account</p>
      </div>
    );
  }

  if (sdkError) {
    return (
      <div className="p-4 bg-[rgba(178,58,47,0.08)] border border-[rgba(178,58,47,0.2)] rounded-lg">
        <p className="font-body text-sm text-[#B23A2F] text-center">{sdkError}</p>
      </div>
    );
  }

  if (!sdkReady) {
    return (
      <div className="flex items-center justify-center py-4">
        <span className="font-body text-sm text-warm-gray animate-pulse">Loading PayPal...</span>
      </div>
    );
  }

  return <div ref={paypalRef} className="min-h-[45px]" />;
}
