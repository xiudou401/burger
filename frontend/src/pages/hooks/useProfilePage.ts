import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { resendVerificationEmail } from '../../api/auth';
import { fetchMyOrders, fetchOrder } from '../../api/orders';
import { useCartSelector } from '../../store/cart/hooks/useCartSelector';
import {
  getEstimatedTotalPrice,
  getTotalQuantity,
} from '../../store/cart/context-accessors';
import { useCartActions } from '../../store/cart/hooks/useCartActions';
import { useAuth } from '../../store/auth/hooks/useAuth';
import { useToast } from '../../components/UI/Toast/ToastContext';
import type { Order } from '../../types/order';

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
  const user = useAuth((ctx) => ctx.user);
  const logout = useAuth((ctx) => ctx.logout);
  const totalQuantity = useCartSelector(getTotalQuantity);
  const estimatedTotalCents = useCartSelector(getEstimatedTotalPrice);
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

  const initial = user?.name?.trim().charAt(0).toUpperCase() || 'B';
  const firstName = user?.name?.trim().split(/\s+/)[0] || 'Burger fan';
  const accountStatus = user?.email
    ? user.emailVerified
      ? 'Ready to order'
      : 'Email pending'
    : user?.phoneVerified
      ? 'Phone verified'
      : 'Phone pending';
  const hasCartItems = totalQuantity > 0;

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
  }, []);

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
            showToast({
              message: 'Order confirmed.',
              tone: 'success',
            });
            void loadOrders();
            return;
          }
        } catch (err) {
          if (!mountedRef.current) return;
          console.error('Order confirmation poll failed', err);
        }
      }

      if (mountedRef.current) {
        showToast({
          message: 'Payment received. We are still confirming your order.',
          tone: 'info',
        });
      }
    },
    [loadOrders, showToast, upsertRecentOrder],
  );

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const payment = searchParams.get('payment');
    const orderId = searchParams.get('orderId');
    const paymentKey = `${payment ?? ''}:${orderId ?? ''}`;

    if (processedPaymentRef.current === paymentKey) return;

    if (payment === 'success') {
      processedPaymentRef.current = paymentKey;
      clearCart();
      showToast({
        message: orderId
          ? 'Payment received. Confirming your order...'
          : 'Payment successful. Your order is being confirmed.',
        tone: 'success',
      });

      if (orderId) {
        void confirmRedirectedOrder(orderId);
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
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete('payment');
      nextParams.delete('orderId');
      setSearchParams(nextParams, { replace: true });
    }
  }, [
    clearCart,
    confirmRedirectedOrder,
    searchParams,
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
    initial,
    firstName,
    accountStatus,
    totalQuantity,
    estimatedTotalCents,
    hasCartItems,
    orders,
    isLoadingOrders,
    ordersError,
    verificationMessage,
    verificationError,
    isSendingVerification,
    resendVerification,
    logout,
  };
};
