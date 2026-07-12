import { useEffect, useMemo, useState } from 'react';
import { fetchAdminOrders, updateOrderStatus } from '../../api/orders';
import { HTTP_STATUS } from '../../api/http-status';
import { ApiError } from '../../api/request';
import { useAuth } from '../../store/auth/hooks/useAuth';
import type { Order, OrderStatus } from '../../types/order';
import { getNextStatusesByUser } from '../utils/admin-order-status-permissions';

export const useAdminOrdersPage = () => {
  const user = useAuth((ctx) => ctx.user);
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

  const changeStatus = async (
    orderId: string,
    status: OrderStatus,
    version: number,
  ) => {
    const previousOrders = orders;

    setUpdatingOrderId(orderId);
    setError(null);
    setOrders((current) =>
      current.map((order) =>
        order.id === orderId
          ? {
              ...order,
              status,
              version: order.version + 1,
              updatedAt: new Date().toISOString(),
            }
          : order,
      ),
    );

    try {
      const res = await updateOrderStatus(orderId, status, version);
      setOrders((current) =>
        current.map((order) => (order.id === orderId ? res.order : order)),
      );
    } catch (err) {
      setOrders(previousOrders);

      const requestId =
        err instanceof ApiError && err.requestId
          ? ` Reference: ${err.requestId}`
          : '';
      const message =
        err instanceof ApiError && err.statusCode === HTTP_STATUS.CONFLICT
          ? `This order was updated by someone else. Refresh orders and try again.${requestId}`
          : err instanceof Error
            ? `${err.message}${requestId}`
            : 'Could not update order';

      setError(message);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const nextStatuses = useMemo(() => getNextStatusesByUser(user), [user]);

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
