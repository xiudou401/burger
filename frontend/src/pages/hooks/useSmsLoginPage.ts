import { FormEvent, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { sendSmsCode, verifySmsCode } from '../../api/auth';
import { useAuth } from '../../store/auth/hooks/useAuth';
import { useAuthSubmit } from './useAuthSubmit';

interface LoginLocationState {
  from?: {
    pathname: string;
    search?: string;
  };
}

interface UseSmsLoginPageOptions {
  fallbackPath?: string;
  fallbackMessage?: string;
}

export const useSmsLoginPage = ({
  fallbackPath = '/',
  fallbackMessage = 'SMS login failed',
}: UseSmsLoginPageOptions = {}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const loginFn = useAuth((ctx) => ctx.login);
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [devSmsCode, setDevSmsCode] = useState<string | null>(null);
  const {
    error,
    setError,
    isSubmitting: isVerifying,
    runSubmit,
  } = useAuthSubmit(fallbackMessage);
  const [isSending, setIsSending] = useState(false);

  const sendCode = async () => {
    setMessage(null);
    setDevSmsCode(null);
    setError(null);
    setIsSending(true);

    try {
      const res = await sendSmsCode(phone);
      setMessage(res.message);
      setDevSmsCode(res.devSmsCode ?? null);
      setCode(res.devSmsCode ?? '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send SMS code');
    } finally {
      setIsSending(false);
    }
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);

    runSubmit(async () => {
      const res = await verifySmsCode(phone, code);
      loginFn(res.accessToken, res.user);

      const state = location.state as LoginLocationState | null;
      const from = state?.from;
      const redirectTo = `${from?.pathname ?? fallbackPath}${from?.search ?? ''}`;

      navigate(redirectTo, { replace: true });
    });
  };

  return {
    phone,
    setPhone,
    code,
    setCode,
    message,
    devSmsCode,
    error,
    isSending,
    isVerifying,
    sendCode,
    submit,
  };
};
