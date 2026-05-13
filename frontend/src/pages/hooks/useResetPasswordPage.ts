import { FormEvent, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { resetPassword } from '../../api/auth';
import {
  PASSWORD_POLICY_MESSAGE,
  validatePasswordPolicy,
} from '../../utils/password-policy';
import { useAuthSubmit } from './useAuthSubmit';

export const useResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const { error, setError, isSubmitting, runSubmit } =
    useAuthSubmit('Reset failed');

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!validatePasswordPolicy(password)) {
      setError(PASSWORD_POLICY_MESSAGE);
      return;
    }

    runSubmit(async () => {
      const res = await resetPassword(token, password);
      setMessage(res.message);
    });
  };

  return {
    token,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    message,
    error,
    isSubmitting,
    submit,
  };
};
