import classes from './AuthLoadingFallback.module.css';

const AuthLoadingFallback = () => {
  return (
    <div className={classes.Wrapper} role="status" aria-live="polite">
      <div className={classes.Status}>
        <span className={classes.Spinner} aria-hidden="true" />
        <span>Restoring your session...</span>
      </div>
    </div>
  );
};

export default AuthLoadingFallback;
