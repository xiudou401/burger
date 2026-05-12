import { FormEvent, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { resetPassword } from '../api/auth';
import classes from './Auth.module.css';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await resetPassword(token, password);
      setMessage(res.message);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Reset failed';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className={classes.CenterPage}>
      <section className={classes.SimpleCard}>
        <div className={classes.Logo}>M</div>
        <header className={classes.FormHeader}>
          <h1>Choose new password</h1>
          <p>Use at least 6 characters.</p>
        </header>

        <form className={classes.Form} onSubmit={submit}>
          <label className={classes.Field}>
            New password
            <input
              className={classes.Input}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              autoComplete="new-password"
              minLength={6}
              required
            />
          </label>
          <label className={classes.Field}>
            Confirm password
            <input
              className={classes.Input}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              type="password"
              autoComplete="new-password"
              minLength={6}
              required
            />
          </label>
          {message && <p className={classes.Success}>{message}</p>}
          {error && <p className={classes.Error}>{error}</p>}
          <button
            className={classes.Submit}
            type="submit"
            disabled={isSubmitting || !token}
          >
            {isSubmitting ? 'Saving...' : 'Save password'}
          </button>
        </form>

        <p className={classes.Switch}>
          Back to <Link to="/login">log in</Link>
        </p>
      </section>
    </main>
  );
};

export default ResetPassword;
