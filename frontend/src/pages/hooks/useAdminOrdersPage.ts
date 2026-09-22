import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { fetchAdminOrders, updateOrderStatus } from '../../api/orders';
import {
  connectAdminRealtime,
  type AdminRealtimeOrderEventName,
  type OrderRealtimeEvent,
} from '../../api/realtime';
import { HTTP_STATUS } from '../../api/http-status';
import { ApiError } from '../../api/request';
import { useAuth } from '../../store/auth/hooks/useAuth';
import type { CancellationReason, Order, OrderStatus } from '../../types/order';
import { getNextStatusesByUser } from '../utils/admin-order-status-permissions';

const ORDER_PAGE_LIMIT = 50;
const REALTIME_FALLBACK_POLL_MS = 30_000;

const applyRealtimeOrderEvent = (
  orders: Order[],
  eventName: AdminRealtimeOrderEventName,
  payload: OrderRealtimeEvent,
) => {
  let didUpdate = false;

  const nextOrders = orders.map((order) => {
    if (order.id !== payload.orderId) {
      return order;
    }

    didUpdate = true;

    return {
      ...order,
      status: payload.status,
      updatedAt: payload.updatedAt,
      payment: order.payment
        ? {
            ...order.payment,
            status: payload.paymentStatus ?? order.payment.status,
          }
        : order.payment,
    };
  });

  return {
    orders: nextOrders,
    needsRefresh: eventName === 'order:created' || !didUpdate,
  };
};

export const useAdminOrdersPage = () => {
  const user = useAuth((ctx) => ctx.user);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const ordersRef = useRef<Order[]>([]);
  const loadRequestIdRef = useRef(0);
  const loadControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    ordersRef.current = orders;
  }, [orders]);

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

  useEffect(() => {
    let refreshTimeout: number | null = null;
    let fallbackTimer: number | null = null;
    let isDisposed = false;
    let fallbackActive = false;

    const clearFallbackPolling = () => {
      fallbackActive = false;

      if (fallbackTimer !== null) {
        window.clearTimeout(fallbackTimer);
        fallbackTimer = null;
      }
    };

    const startFallbackPolling = () => {
      if (isDisposed || fallbackActive) return;

      fallbackActive = true;

      const tick = () => {
        if (isDisposed || !fallbackActive) return;

        void loadOrders();
        if (fallbackActive) {
          fallbackTimer = window.setTimeout(tick, REALTIME_FALLBACK_POLL_MS);
        }
      };

      fallbackTimer = window.setTimeout(tick, REALTIME_FALLBACK_POLL_MS);
    };

    const scheduleRefresh = () => {
      if (refreshTimeout !== null) {
        window.clearTimeout(refreshTimeout);
      }

      refreshTimeout = window.setTimeout(() => {
        void loadOrders();
      }, 300);
    };

    const socket = connectAdminRealtime({
      onOrderEvent: (eventName, payload) => {
        const result = applyRealtimeOrderEvent(
          ordersRef.current,
          eventName,
          payload,
        );

        ordersRef.current = result.orders;
        setOrders(result.orders);

        if (result.needsRefresh) {
          scheduleRefresh();
        }
      },
      onConnected: () => {
        clearFallbackPolling();
        void loadOrders();
      },
      onDisconnected: startFallbackPolling,
    });

    if (!socket) {
      startFallbackPolling();
    }

    return () => {
      isDisposed = true;

      if (refreshTimeout !== null) {
        window.clearTimeout(refreshTimeout);
      }

      clearFallbackPolling();
      socket?.disconnect();
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
    cancellationReason?: CancellationReason,
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
              ...(status === 'cancelled'
                ? {
                    cancellationReason: cancellationReason ?? 'staff_cancelled',
                    cancelledAt: new Date().toISOString(),
                  }
                : {}),
              version: order.version + 1,
              updatedAt: new Date().toISOString(),
            }
          : order,
      ),
    );

    try {
      const res = await updateOrderStatus(
        orderId,
        status,
        version,
        cancellationReason,
      );
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
