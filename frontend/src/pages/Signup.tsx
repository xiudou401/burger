import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signup } from '../api/auth';
import { useAuth } from '../store/auth/hooks/useAuth';
import classes from './Auth.module.css';

const Signup = () => {
  const navigate = useNavigate();
  const loginFn = useAuth((ctx) => ctx.login);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await signup(name, email, password);

      loginFn(res.accessToken, res.user);

      navigate('/');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Signup failed';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className={classes.Page}>
      <section className={classes.BrandPanel}>
        <div className={classes.Logo}>M</div>
        <div className={classes.BrandCopy}>
          <p className={classes.Eyebrow}>Burger Club</p>
          <h1 className={classes.Title}>Join the crave-worthy side.</h1>
          <p className={classes.Subtitle}>
            Create an account and your next burger run starts a little faster.
          </p>
        </div>
        <div className={classes.FoodRow}>
          <div className={classes.FoodTile}>
            <img src="/img/meals/4.png" alt="" />
          </div>
          <div className={classes.FoodTile}>
            <img src="/img/meals/5.png" alt="" />
          </div>
          <div className={classes.FoodTile}>
            <img src="/img/meals/6.png" alt="" />
          </div>
        </div>
      </section>

      <section className={classes.FormPanel}>
        <div className={classes.FormCard}>
          <header className={classes.FormHeader}>
            <h1>Sign up</h1>
            <p>Save your details and get back to the menu in seconds.</p>
          </header>

          <form className={classes.Form} onSubmit={submit}>
            <label className={classes.Field}>
              Name
              <input
                className={classes.Input}
                value={name}
                onChange={(event) => setName(event.target.value)}
                type="text"
                autoComplete="name"
                required
              />
            </label>
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
            <label className={classes.Field}>
              Password
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
            {error && <p className={classes.Error}>{error}</p>}
            <button
              className={classes.Submit}
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <p className={classes.Switch}>
            Already have an account? <Link to="/login">Log in</Link>
          </p>
        </div>
      </section>
    </main>
  );
};

export default Signup;
