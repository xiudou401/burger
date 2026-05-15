import { useState } from 'react';
import {
  resendVerificationEmail,
  sendSmsCode,
  verifySmsCode,
} from '../../api/auth';
import { useCartSelector } from '../../hooks/useCartSelector';
import {
  getEstimatedTotalPrice,
  getTotalQuantity,
} from '../../store/cart/context-accessors';
import { useAuth } from '../../store/auth/hooks/useAuth';

export const useProfilePage = () => {
  const user = useAuth((ctx) => ctx.user);
  const login = useAuth((ctx) => ctx.login);
  const accessToken = useAuth((ctx) => ctx.accessToken);
  const logout = useAuth((ctx) => ctx.logout);
  const totalQuantity = useCartSelector(getTotalQuantity);
  const estimatedTotalPrice = useCartSelector(getEstimatedTotalPrice);
  const [verificationMessage, setVerificationMessage] = useState<string | null>(
    null,
  );
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [isSendingVerification, setIsSendingVerification] = useState(false);
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [smsCode, setSmsCode] = useState('');
  const [smsMessage, setSmsMessage] = useState<string | null>(null);
  const [smsError, setSmsError] = useState<string | null>(null);
  const [devSmsCode, setDevSmsCode] = useState<string | null>(null);
  const [isSendingSms, setIsSendingSms] = useState(false);
  const [isVerifyingSms, setIsVerifyingSms] = useState(false);

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

  const sendPhoneCode = async () => {
    setSmsMessage(null);
    setSmsError(null);
    setDevSmsCode(null);
    setIsSendingSms(true);

    try {
      const res = await sendSmsCode(phone);
      setSmsMessage(res.message);
      setDevSmsCode(res.devSmsCode ?? null);
      setSmsCode(res.devSmsCode ?? '');
    } catch (err) {
      setSmsError(err instanceof Error ? err.message : 'Could not send SMS code');
    } finally {
      setIsSendingSms(false);
    }
  };

  const verifyPhoneCode = async () => {
    setSmsMessage(null);
    setSmsError(null);
    setIsVerifyingSms(true);

    try {
      const res = await verifySmsCode(phone, smsCode);

      if (accessToken) {
        login(accessToken, res.user);
      }

      setSmsMessage('Phone verified');
      setDevSmsCode(null);
    } catch (err) {
      setSmsError(err instanceof Error ? err.message : 'Could not verify phone');
    } finally {
      setIsVerifyingSms(false);
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
    phone,
    setPhone,
    smsCode,
    setSmsCode,
    smsMessage,
    smsError,
    devSmsCode,
    isSendingSms,
    isVerifyingSms,
    resendVerification,
    sendPhoneCode,
    verifyPhoneCode,
    logout,
  };
};
