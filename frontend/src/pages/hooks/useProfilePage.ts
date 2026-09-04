import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { resendVerificationEmail } from '../../api/auth';
import { fetchMyOrders, fetchOrder } from '../../api/orders';
import { useCartSelector } from '../../store/cart/hooks/useCartSelector';
import {
  getDisplayTotalCents,
  getTotalQuantity,
} from '../../store/cart/context-accessors';
import { useCartActions } from '../../store/cart/hooks/useCartActions';
import { clearPersistedCart } from '../../store/cart/cart-reducer';
import { useAuth } from '../../store/auth/hooks/useAuth';
import { useToast } from '../../components/UI/Toast/ToastContext';
import { hasPermission } from '../../types/permissions';
import type { Order } from '../../types/order';
import { reportError } from '../../utils/error-monitoring';
import { getObjectIdOrNull } from '../../utils/object-id';

const ORDER_CONFIRMATION_POLL_ATTEMPTS = 5;
const ORDER_CONFIRMATION_POLL_DELAY_MS = 1500;

const wait = (ms: number) =>
  new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });

const isConfirmedStripeOrder = (order: Order) =>
  order.status === 'paid' || order.payment?.status === 'paid';

export const useProfilePage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const user = useAuth((ctx) => ctx.user);
  const totalQuantity = useCartSelector(getTotalQuantity);
  const displayTotalCents = useCartSelector(getDisplayTotalCents);
  const { clearCart } = useCartActions();
  const { showToast } = useToast();
  const [verificationMessage, setVerificationMessage] = useState<string | null>(
    null,
  );
  const [verificationError, setVerificationError] = useState<string | null>(
    null,
  );
  const [isSendingVerification, setIsSendingVerification] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const mountedRef = useRef(true);
  const processedPaymentRef = useRef<string | null>(null);

  const hasCartItems = totalQuantity > 0;
  const canCreateOrder = hasPermission(user, 'create_order');
  const canViewOwnOrders = hasPermission(user, 'view_own_orders');
  const payment = searchParams.get('payment');
  const orderId = getObjectIdOrNull(searchParams.get('orderId'));

  const upsertRecentOrder = useCallback((order: Order) => {
    setOrders((current) => {
      const existingIndex = current.findIndex((item) => item.id === order.id);

      if (existingIndex === -1) {
        return [order, ...current].slice(0, 5);
      }

      return current.map((item) => (item.id === order.id ? order : item));
    });
  }, []);

  const loadOrders = useCallback(async () => {
    if (!canViewOwnOrders) {
      setOrders([]);
      setOrdersError(null);
      setIsLoadingOrders(false);
      return;
    }

    setIsLoadingOrders(true);
    setOrdersError(null);

    try {
      const res = await fetchMyOrders(5);

      if (mountedRef.current) {
        setOrders(res.orders);
      }
    } catch (err) {
      if (mountedRef.current) {
        setOrdersError(
          err instanceof Error ? err.message : 'Could not load orders',
        );
      }
    } finally {
      if (mountedRef.current) {
        setIsLoadingOrders(false);
      }
    }
  }, [canViewOwnOrders]);

  const confirmRedirectedOrder = useCallback(
    async (orderId: string) => {
      for (
        let attempt = 0;
        attempt < ORDER_CONFIRMATION_POLL_ATTEMPTS;
        attempt++
      ) {
        if (attempt > 0) {
          await wait(ORDER_CONFIRMATION_POLL_DELAY_MS);
        }

        try {
          const res = await fetchOrder(orderId);

          if (!mountedRef.current) return;

          upsertRecentOrder(res.order);

          if (isConfirmedStripeOrder(res.order)) {
            clearPersistedCart();
            clearCart();
            showToast({
              message: 'Order confirmed.',
              tone: 'success',
            });
            void loadOrders();
            return;
          }
        } catch (err) {
          if (!mountedRef.current) return;
          reportError(err, {
            source: 'profile',
            operation: 'confirm-redirected-order',
          });
        }
      }

      if (mountedRef.current) {
        showToast({
          message: 'Payment received. We are still confirming your order.',
          tone: 'info',
        });
      }
    },
    [clearCart, loadOrders, showToast, upsertRecentOrder],
  );

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const paymentKey = `${payment ?? ''}:${orderId ?? ''}`;

    if (processedPaymentRef.current === paymentKey) return;

    if (payment === 'success') {
      processedPaymentRef.current = paymentKey;

      if (orderId && canViewOwnOrders) {
        void confirmRedirectedOrder(orderId);
      } else {
        showToast({
          message: 'Confirming your payment...',
          tone: 'info',
        });
      }
    }

    if (payment === 'cancelled') {
      processedPaymentRef.current = paymentKey;
      showToast({
        message: 'Payment was cancelled.',
        tone: 'info',
      });
    }

    if (payment === 'success' || payment === 'cancelled') {
      const nextParams = new URLSearchParams(location.search);
      nextParams.delete('payment');
      nextParams.delete('orderId');
      setSearchParams(nextParams, { replace: true });
    }
  }, [
    canViewOwnOrders,
    confirmRedirectedOrder,
    location.search,
    orderId,
    payment,
    setSearchParams,
    showToast,
  ]);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  const resendVerification = async () => {
    setVerificationMessage(null);
    setVerificationError(null);
    setIsSendingVerification(true);

    try {
      const res = await resendVerificationEmail();
      setVerificationMessage(res.message);
    } catch (err) {
      setVerificationError(
        err instanceof Error ? err.message : 'Could not send email',
      );
    } finally {
      setIsSendingVerification(false);
    }
  };

  return {
    user,
    canCreateOrder,
    canViewOwnOrders,
    totalQuantity,
    displayTotalCents,
    hasCartItems,
    orders,
    isLoadingOrders,
    ordersError,
    verificationMessage,
    verificationError,
    isSendingVerification,
    resendVerification,
  };
};
