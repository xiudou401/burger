import { useState } from 'react';
import { resendVerificationEmail } from '../../api/auth';
import { useCartSelector } from '../../hooks/useCartSelector';
import {
  getEstimatedTotalPrice,
  getTotalQuantity,
} from '../../store/cart/context-accessors';
import { useAuth } from '../../store/auth/hooks/useAuth';

export const useProfilePage = () => {
  const user = useAuth((ctx) => ctx.user);
  const logout = useAuth((ctx) => ctx.logout);
  const totalQuantity = useCartSelector(getTotalQuantity);
  const estimatedTotalPrice = useCartSelector(getEstimatedTotalPrice);
  const [verificationMessage, setVerificationMessage] = useState<string | null>(
    null,
  );
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [isSendingVerification, setIsSendingVerification] = useState(false);

  const initial = user?.name?.trim().charAt(0).toUpperCase() || 'B';
  const firstName = user?.name?.trim().split(/\s+/)[0] || 'Burger fan';
  const accountStatus = user?.emailVerified ? 'Ready to order' : 'Email pending';
  const hasCartItems = totalQuantity > 0;

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
    estimatedTotalPrice,
    hasCartItems,
    verificationMessage,
    verificationError,
    isSendingVerification,
    resendVerification,
    logout,
  };
};
