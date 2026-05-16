import { FormEvent, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { login } from '../../api/auth';
import { useAuth } from '../../store/auth/hooks/useAuth';
import { useAuthSubmit } from './useAuthSubmit';

interface LoginLocationState {
  from?: {
    pathname: string;
    search?: string;
  };
}

export const useAdminLoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const loginFn = useAuth((ctx) => ctx.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { error, isSubmitting, runSubmit } = useAuthSubmit('Admin login failed');

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    runSubmit(async () => {
      const res = await login(email, password);

      if (res.user.role !== 'admin' && res.user.role !== 'staff') {
        throw new Error('Admin access required');
      }

      loginFn(res.accessToken, res.user);

      const state = location.state as LoginLocationState | null;
      const from = state?.from;
      const redirectTo = `${from?.pathname ?? '/admin/orders'}${from?.search ?? ''}`;

      navigate(redirectTo, { replace: true });
    });
  };

  return {
    email,
    setEmail,
    password,
    setPassword,
    error,
    isSubmitting,
    submit,
  };
};
