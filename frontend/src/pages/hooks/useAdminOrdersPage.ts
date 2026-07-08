import { useEffect, useMemo, useState } from 'react';
import { fetchAdminOrders, updateOrderStatus } from '../../api/orders';
import { useAuth } from '../../store/auth/hooks/useAuth';
import type { Order, OrderStatus } from '../../types/order';
import { getNextStatusesByRole } from './admin-order-status-permissions';

export const useAdminOrdersPage = () => {
  const role = useAuth((ctx) => ctx.user?.role);
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

  const nextStatuses = useMemo(() => getNextStatusesByRole(role), [role]);

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
