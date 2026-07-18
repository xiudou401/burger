import { ReactNode } from 'react';
import classes from './AdminFormField.module.css';

interface AdminFormFieldProps {
  label: string;
  htmlFor: string;
  children: ReactNode;
  className?: string;
  error?: string | null;
  hint?: string;
}

const AdminFormField = ({
  label,
  htmlFor,
  children,
  className,
  error,
  hint,
}: AdminFormFieldProps) => {
  const classNames = [classes.Field, className ?? ''].filter(Boolean).join(' ');

  return (
    <div className={classNames}>
      <label className={classes.Label} htmlFor={htmlFor}>
        {label}
      </label>

      {children}

      {hint && !error && <p className={classes.Hint}>{hint}</p>}
      {error && (
        <p className={classes.Error} role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

export default AdminFormField;
