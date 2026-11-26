import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchOrder } from '../../api/orders';
import { connectCustomerRealtime } from '../../api/realtime';
import type { Order } from '../../types/order';
import { isObjectId } from '../../utils/object-id';
import { createFallbackPolling } from '../../utils/fallback-polling';

const PAYMENT_CONFIRMATION_POLL_ATTEMPTS = 5;
const PAYMENT_CONFIRMATION_POLL_DELAY_MS = 1500;

const wait = (ms: number, signal: AbortSignal) =>
  new Promise<void>((resolve) => {
    if (signal.aborted) {
      resolve();
      return;
    }
    const finish = () => {
      window.clearTimeout(timer);
      signal.removeEventListener('abort', finish);
      resolve();
    };
    const timer = window.setTimeout(finish, ms);
    signal.addEventListener('abort', finish, { once: true });
  });

export const isConfirmedStripeOrder = (order: Order) =>
  order.status === 'confirmed' || order.payment?.status === 'paid';

export const useOrderDetailsPage = (
  orderId: string,
  { confirmPayment = false }: { confirmPayment?: boolean } = {},
) => {
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadRequestIdRef = useRef(0);
  const controllerRef = useRef<AbortController | null>(null);

  const loadOrder = useCallback(
    async ({
      showLoading = true,
      signal,
      retryPayment = confirmPayment,
    }: {
      showLoading?: boolean;
      signal?: AbortSignal;
      retryPayment?: boolean;
    } = {}) => {
      if (signal?.aborted) return;
      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;
      const abort = () => controller.abort();
      signal?.addEventListener('abort', abort, { once: true });
      const requestId = loadRequestIdRef.current + 1;
      loadRequestIdRef.current = requestId;
      const isActive = () =>
        !controller.signal.aborted && requestId === loadRequestIdRef.current;

      setIsLoading(showLoading);

      setError(null);

      try {
        for (
          let attempt = 0;
          attempt < (retryPayment ? PAYMENT_CONFIRMATION_POLL_ATTEMPTS : 1);
          attempt++
        ) {
          if (attempt > 0) {
            await wait(PAYMENT_CONFIRMATION_POLL_DELAY_MS, controller.signal);
          }
          if (!isActive()) return;

          const res = await fetchOrder(orderId, controller.signal);

          if (!isActive()) return;

          setOrder(res.order);

          if (
            !retryPayment ||
            isConfirmedStripeOrder(res.order) ||
            res.order.status === 'cancelled'
          ) {
            return;
          }
        }
      } catch (err) {
        if (isActive()) {
          setError(err instanceof Error ? err.message : 'Could not load order');
        }
      } finally {
        signal?.removeEventListener('abort', abort);
        if (controllerRef.current === controller) controllerRef.current = null;
        if (requestId === loadRequestIdRef.current) {
          setIsLoading(false);
        }
      }
    },
    [confirmPayment, orderId],
  );

  useEffect(() => {
    setOrder(null);
    setError(null);
    setIsLoading(false);
    if (!isObjectId(orderId)) {
      setError('Order not found');
      return;
    }

    void loadOrder();

    return () => {
      loadRequestIdRef.current += 1;
      controllerRef.current?.abort();
    };
  }, [loadOrder, orderId]);

  useEffect(() => {
    if (!isObjectId(orderId)) {
      return undefined;
    }

    let disposed = false;
    const polling = createFallbackPolling((signal) =>
      loadOrder({ showLoading: false, signal, retryPayment: false }),
    );
    const socket = connectCustomerRealtime({
      onConnected: () => {
        if (disposed) return;
        polling.stop();
        void loadOrder({ showLoading: false });
      },
      onDisconnected: () => {
        if (!disposed) polling.start();
      },
      onOrderEvent: (_eventName, payload) => {
        if (disposed || payload.orderId !== orderId) {
          return;
        }

        // Fetch authoritative details instead of applying partial or out-of-order events.
        void loadOrder({ showLoading: false });
      },
    });
    if (!socket) polling.start();

    return () => {
      disposed = true;
      polling.dispose();
      socket?.disconnect();
    };
  }, [loadOrder, orderId]);

  return {
    order,
    isLoading,
    error,
  };
};
