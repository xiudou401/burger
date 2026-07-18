import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { fetchAdminOrders, updateOrderStatus } from '../../api/orders';
import { HTTP_STATUS } from '../../api/http-status';
import { ApiError } from '../../api/request';
import { useAuth } from '../../store/auth/hooks/useAuth';
import type { Order, OrderStatus } from '../../types/order';
import { getNextStatusesByUser } from '../utils/admin-order-status-permissions';

const ORDER_PAGE_LIMIT = 20;

export const useAdminOrdersPage = () => {
  const user = useAuth((ctx) => ctx.user);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const loadRequestIdRef = useRef(0);
  const loadControllerRef = useRef<AbortController | null>(null);

  const loadOrders = useCallback(
    async ({
      cursor,
      append = false,
    }: {
      cursor?: string | null;
      append?: boolean;
    } = {}) => {
      loadControllerRef.current?.abort();

      const controller = new AbortController();
      const requestId = loadRequestIdRef.current + 1;
      loadRequestIdRef.current = requestId;
      loadControllerRef.current = controller;

      if (append) {
        setIsLoading(false);
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
        setIsLoadingMore(false);
      }

      setError(null);

      try {
        const res = await fetchAdminOrders({
          limit: ORDER_PAGE_LIMIT,
          cursor,
          signal: controller.signal,
        });

        if (requestId !== loadRequestIdRef.current) return;

        setOrders((current) =>
          append ? [...current, ...res.orders] : res.orders,
        );
        setNextCursor(res.nextCursor);
      } catch (err) {
        if (requestId !== loadRequestIdRef.current) return;

        setError(err instanceof Error ? err.message : 'Could not load orders');
      } finally {
        if (loadControllerRef.current === controller) {
          loadControllerRef.current = null;
        }

        if (requestId !== loadRequestIdRef.current) return;

        if (append) {
          setIsLoadingMore(false);
        } else {
          setIsLoading(false);
        }
      }
    },
    [],
  );

  useEffect(() => {
    void loadOrders();

    return () => {
      loadRequestIdRef.current += 1;
      loadControllerRef.current?.abort();
      loadControllerRef.current = null;
    };
  }, [loadOrders]);

  const loadMore = () => {
    if (!nextCursor || isLoadingMore) return;

    void loadOrders({ cursor: nextCursor, append: true });
  };

  const refresh = () => {
    void loadOrders();
  };

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
    isLoadingMore,
    error,
    updatingOrderId,
    hasMoreOrders: nextCursor !== null,
    nextStatuses,
    refresh,
    loadMore,
    changeStatus,
  };
};
