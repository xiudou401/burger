import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { forgotPassword } from '../api/auth';
import classes from './Auth.module.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [devResetToken, setDevResetToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    setDevResetToken(null);
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await forgotPassword(email);
      setMessage(res.message);
      setDevResetToken(res.resetToken ?? null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Request failed';
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
          <h1>Reset password</h1>
          <p>Enter your email and we will send a reset link.</p>
        </header>

        <form className={classes.Form} onSubmit={submit}>
          <label className={classes.Field}>
            Email
            <input
              className={classes.Input}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              autoComplete="email"
              required
            />
          </label>
          {message && <p className={classes.Success}>{message}</p>}
          {devResetToken && (
            <Link
              className={classes.DevLink}
              to={`/reset-password?token=${devResetToken}`}
            >
              Open local reset link
            </Link>
          )}
          {error && <p className={classes.Error}>{error}</p>}
          <button
            className={classes.Submit}
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Sending...' : 'Send reset link'}
          </button>
        </form>

        <p className={classes.Switch}>
          Remembered it? <Link to="/login">Log in</Link>
        </p>
      </section>
    </main>
  );
};

export default ForgotPassword;
