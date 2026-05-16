import { useEffect, useState } from 'react';
import { fetchOrder } from '../../api/orders';
import type { Order } from '../../types/order';

export const useOrderDetailsPage = (orderId: string) => {
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
        const res = await fetchOrder(orderId);

        if (!cancelled) {
          setOrder(res.order);
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
  }, [orderId]);

  return {
    order,
    isLoading,
    error,
  };
};
