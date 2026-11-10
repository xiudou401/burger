import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  fetchAdminOrders,
  updateOrderStatus,
  type AdminOrdersView,
} from '../../api/orders';
import { connectAdminRealtime } from '../../api/realtime';
import { HTTP_STATUS } from '../../api/http-status';
import { ApiError } from '../../api/request';
import { useAuth } from '../../store/auth/hooks/useAuth';
import type { CancellationReason, Order, OrderStatus } from '../../types/order';
import { getNextStatusesByUser } from '../utils/admin-order-status-permissions';

const ORDER_PAGE_LIMIT = 50;
const REALTIME_FALLBACK_POLL_MS = 30_000;

export const useAdminOrdersPage = (
  view: AdminOrdersView = 'kitchen',
  range: { from?: string; to?: string } = {},
) => {
  const { from, to } = range;
  const user = useAuth((ctx) => ctx.user);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [updatingOrderIds, setUpdatingOrderIds] = useState<string[]>([]);
  const updatesInFlightRef = useRef(new Set<string>());
  const [connectionStatus, setConnectionStatus] = useState<
    'connecting' | 'live' | 'reconnecting' | 'offline'
  >(navigator.onLine ? 'connecting' : 'offline');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const queryKey = `${view}:${from ?? ''}:${to ?? ''}`;
  const viewRef = useRef(queryKey);
  viewRef.current = queryKey;
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
          view,
          ...(from ? { from } : {}),
          ...(to ? { to } : {}),
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
    [view, from, to],
  );

  useEffect(() => {
    setOrders([]);
    setNextCursor(null);
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
    setConnectionStatus(navigator.onLine ? 'connecting' : 'offline');

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
      if (isDisposed) return;
      if (refreshTimeout !== null) {
        window.clearTimeout(refreshTimeout);
      }

      refreshTimeout = window.setTimeout(() => {
        void loadOrders();
      }, 300);
    };

    const socket = connectAdminRealtime({
      onOrderEvent: () => {
        if (isDisposed) return;
        // Refresh full records, including version and cancellation metadata.
        loadRequestIdRef.current += 1;
        loadControllerRef.current?.abort();
        scheduleRefresh();
      },
      onConnected: () => {
        if (isDisposed) return;
        clearFallbackPolling();
        setConnectionStatus('live');
        void loadOrders();
      },
      onDisconnected: () => {
        if (isDisposed) return;
        setConnectionStatus(navigator.onLine ? 'reconnecting' : 'offline');
        startFallbackPolling();
      },
    });

    const onOffline = () => {
      setIsOnline(false);
      setConnectionStatus('offline');
    };
    const onOnline = () => {
      setIsOnline(true);
      setConnectionStatus(socket?.connected ? 'live' : 'reconnecting');
      void loadOrders();
    };
    window.addEventListener('offline', onOffline);
    window.addEventListener('online', onOnline);

    if (!socket) {
      setConnectionStatus(navigator.onLine ? 'reconnecting' : 'offline');
      startFallbackPolling();
    }

    return () => {
      isDisposed = true;

      if (refreshTimeout !== null) {
        window.clearTimeout(refreshTimeout);
      }

      clearFallbackPolling();
      window.removeEventListener('offline', onOffline);
      window.removeEventListener('online', onOnline);
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
    if (updatesInFlightRef.current.has(orderId) || !navigator.onLine) return;
    updatesInFlightRef.current.add(orderId);
    const submittedView = queryKey;
    setUpdatingOrderIds((current) => [...current, orderId]);
    setError(null);

    try {
      await updateOrderStatus(orderId, status, version, cancellationReason);
      if (viewRef.current === submittedView) await loadOrders();
    } catch (err) {
      if (viewRef.current !== submittedView) return;
      await loadOrders();

      const requestId =
        err instanceof ApiError && err.requestId
          ? ` Reference: ${err.requestId}`
          : '';
      const message =
        err instanceof ApiError && err.statusCode === HTTP_STATUS.CONFLICT
          ? `This order changed. Review its latest status before trying again.${requestId}`
          : err instanceof Error
            ? `${err.message}${requestId}`
            : 'Could not update order';

      setError(message);
    } finally {
      updatesInFlightRef.current.delete(orderId);
      setUpdatingOrderIds((current) => current.filter((id) => id !== orderId));
    }
  };

  const nextStatuses = useMemo(() => getNextStatusesByUser(user), [user]);

  return {
    orders,
    isLoading,
    isLoadingMore,
    error,
    updatingOrderIds,
    connectionStatus,
    isOnline,
    hasMoreOrders: nextCursor !== null,
    nextStatuses,
    refresh,
    loadMore,
    changeStatus,
  };
};
