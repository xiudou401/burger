import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signup } from '../../api/auth';
import { useAuth } from '../../store/auth/hooks/useAuth';
import {
  PASSWORD_POLICY_MESSAGE,
  validatePasswordPolicy,
} from '../../utils/password-policy';
import { useAuthSubmit } from './useAuthSubmit';

export const useSignupPage = () => {
  const navigate = useNavigate();
  const loginFn = useAuth((ctx) => ctx.login);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [devVerificationToken, setDevVerificationToken] = useState<string | null>(
    null,
  );
  const { error, setError, isSubmitting, runSubmit } =
    useAuthSubmit('Signup failed');

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setDevVerificationToken(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!validatePasswordPolicy(password)) {
      setError(PASSWORD_POLICY_MESSAGE);
      return;
    }

    runSubmit(async () => {
      const res = await signup(name, email, password);

      loginFn(res.accessToken, res.user);

      if (res.emailVerificationToken) {
        navigate(`/verify-email?token=${res.emailVerificationToken}`);
        return;
      }

      setDevVerificationToken(null);
      navigate('/verify-email');
    });
  };

  return {
    name,
    setName,
    email,
    setEmail,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    error,
    devVerificationToken,
    isSubmitting,
    submit,
  };
};
