import { FormEvent, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { adminLogin } from '../../api/auth';
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
  const { error, isSubmitting, runSubmit } =
    useAuthSubmit('Admin login failed');

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    runSubmit(async () => {
      const res = await adminLogin(email, password);

      loginFn(res.accessToken, res.user);

      const state = location.state as LoginLocationState | null;
      const from = state?.from;
      const redirectTo = `${from?.pathname ?? '/admin/dashboard'}${from?.search ?? ''}`;

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
