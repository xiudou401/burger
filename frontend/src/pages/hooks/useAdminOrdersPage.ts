import { useEffect, useMemo, useState } from 'react';
import { fetchAdminOrders, updateOrderStatus } from '../../api/orders';
import type { Order, OrderStatus } from '../../types/order';

const nextStatusesByStatus: Record<OrderStatus, OrderStatus[]> = {
  pending_payment: ['paid', 'cancelled'],
  paid: ['preparing', 'cancelled'],
  preparing: ['ready', 'cancelled'],
  ready: ['completed'],
  completed: [],
  cancelled: [],
};

export const useAdminOrdersPage = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  const loadOrders = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetchAdminOrders(50);
      setOrders(res.orders);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load orders');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const changeStatus = async (orderId: string, status: OrderStatus) => {
    setUpdatingOrderId(orderId);
    setError(null);

    try {
      const res = await updateOrderStatus(orderId, status);
      setOrders((current) =>
        current.map((order) => (order.id === orderId ? res.order : order)),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update order');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const nextStatuses = useMemo(() => nextStatusesByStatus, []);

  return {
    orders,
    isLoading,
    error,
    updatingOrderId,
    nextStatuses,
    refresh: loadOrders,
    changeStatus,
  };
};
