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

export const useLoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const loginFn = useAuth((ctx) => ctx.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { error, isSubmitting, runSubmit } = useAuthSubmit('Login failed');

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    runSubmit(async () => {
      const res = await login(email, password);

      loginFn(res.accessToken, res.user);

      const state = location.state as LoginLocationState | null;
      const from = state?.from;
      const redirectTo = `${from?.pathname ?? '/'}${from?.search ?? ''}`;

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
