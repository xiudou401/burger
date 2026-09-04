import { useEffect, useState } from 'react';
import { fetchOrder } from '../../api/orders';
import type { Order } from '../../types/order';

const PAYMENT_CONFIRMATION_POLL_ATTEMPTS = 5;
const PAYMENT_CONFIRMATION_POLL_DELAY_MS = 1500;

const wait = (ms: number) =>
  new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });

export const isConfirmedStripeOrder = (order: Order) =>
  order.status === 'paid' || order.payment?.status === 'paid';

export const useOrderDetailsPage = (
  orderId: string,
  { confirmPayment = false }: { confirmPayment?: boolean } = {},
) => {
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) {
      setError('Order not found');
      return;
    }

    let cancelled = false;

    const loadOrder = async () => {
      setIsLoading(true);
      setError(null);

      try {
        for (
          let attempt = 0;
          attempt < PAYMENT_CONFIRMATION_POLL_ATTEMPTS;
          attempt++
        ) {
          if (attempt > 0) {
            await wait(PAYMENT_CONFIRMATION_POLL_DELAY_MS);
          }

          const res = await fetchOrder(orderId);

          if (cancelled) return;

          setOrder(res.order);

          if (!confirmPayment || isConfirmedStripeOrder(res.order)) {
            return;
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Could not load order');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    loadOrder();

    return () => {
      cancelled = true;
    };
  }, [confirmPayment, orderId]);

  return {
    order,
    isLoading,
    error,
  };
};
