import { FormEvent, useState } from 'react';
import { forgotPassword } from '../../api/auth';
import { useAuthSubmit } from './useAuthSubmit';

export const useForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [devResetToken, setDevResetToken] = useState<string | null>(null);
  const { error, setError, isSubmitting, runSubmit } =
    useAuthSubmit('Request failed');

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    setDevResetToken(null);
    setError(null);

    runSubmit(async () => {
      const res = await forgotPassword(email);
      setMessage(res.message);
      setDevResetToken(res.resetToken ?? null);
    });
  };

  return {
    email,
    setEmail,
    message,
    devResetToken,
    error,
    isSubmitting,
    submit,
  };
};
