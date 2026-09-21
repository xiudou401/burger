import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchOrder } from '../../api/orders';
import { connectCustomerRealtime } from '../../api/realtime';
import type { Order } from '../../types/order';
import { isObjectId } from '../../utils/object-id';

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
  const loadRequestIdRef = useRef(0);

  const loadOrder = useCallback(
    async ({ showLoading = true }: { showLoading?: boolean } = {}) => {
      const requestId = loadRequestIdRef.current + 1;
      loadRequestIdRef.current = requestId;

      if (showLoading) {
        setIsLoading(true);
      }

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

          if (requestId !== loadRequestIdRef.current) return;

          setOrder(res.order);

          if (!confirmPayment || isConfirmedStripeOrder(res.order)) {
            return;
          }
        }
      } catch (err) {
        if (requestId === loadRequestIdRef.current) {
          setError(err instanceof Error ? err.message : 'Could not load order');
        }
      } finally {
        if (requestId === loadRequestIdRef.current && showLoading) {
          setIsLoading(false);
        }
      }
    },
    [confirmPayment, orderId],
  );

  useEffect(() => {
    if (!isObjectId(orderId)) {
      setError('Order not found');
      return;
    }

    void loadOrder();

    return () => {
      loadRequestIdRef.current += 1;
    };
  }, [loadOrder, orderId]);

  useEffect(() => {
    if (!isObjectId(orderId)) {
      return undefined;
    }

    const socket = connectCustomerRealtime({
      onOrderEvent: (_eventName, payload) => {
        if (payload.orderId !== orderId) {
          return;
        }

        void loadOrder({ showLoading: false });
      },
    });

    return () => {
      socket?.disconnect();
    };
  }, [loadOrder, orderId]);

  return {
    order,
    isLoading,
    error,
  };
};
