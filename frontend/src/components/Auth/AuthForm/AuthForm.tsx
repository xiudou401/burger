import {
  ButtonHTMLAttributes,
  FormHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
} from 'react';
import classes from './AuthForm.module.css';

interface AuthCardProps {
  children: ReactNode;
}

interface AuthHeaderProps {
  title: string;
  subtitle: string;
}

interface AuthFieldProps {
  label: string;
  inputProps: InputHTMLAttributes<HTMLInputElement>;
}

interface AuthSubmitButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
}

interface AuthStatusProps {
  tone: 'error' | 'info' | 'success';
  children: ReactNode;
}

interface AuthSwitchProps {
  children: ReactNode;
}

interface AuthSocialButtonsProps {
  googleLabel: string;
  onGoogle: () => void;
}

interface AuthTextLinkProps {
  children: ReactNode;
  align?: 'start' | 'end';
}

interface AuthTabsProps {
  value: string;
  options: Array<{
    value: string;
    label: string;
  }>;
  onChange: (value: string) => void;
}

export const AuthCard = ({ children }: AuthCardProps) => {
  return <div className={classes.FormCard}>{children}</div>;
};

export const AuthHeader = ({ title, subtitle }: AuthHeaderProps) => {
  return (
    <header className={classes.FormHeader}>
      <h1>{title}</h1>
      <p>{subtitle}</p>
    </header>
  );
};

export const AuthFormElement = ({
  children,
  ...formProps
}: FormHTMLAttributes<HTMLFormElement>) => {
  return (
    <form className={classes.Form} {...formProps}>
      {children}
    </form>
  );
};

export const AuthField = ({ label, inputProps }: AuthFieldProps) => {
  return (
    <label className={classes.Field}>
      {label}
      <input className={classes.Input} {...inputProps} />
    </label>
  );
};

export const AuthSubmitButton = ({
  children,
  ...buttonProps
}: AuthSubmitButtonProps) => {
  return (
    <button className={classes.Submit} type="submit" {...buttonProps}>
      {children}
    </button>
  );
};

export const AuthStatus = ({ tone, children }: AuthStatusProps) => {
  const className =
    tone === 'error'
      ? classes.Error
      : tone === 'success'
        ? classes.Success
        : classes.Info;

  return <p className={className}>{children}</p>;
};

export const AuthSwitch = ({ children }: AuthSwitchProps) => {
  return <p className={classes.Switch}>{children}</p>;
};

export const AuthSocialButtons = ({
  googleLabel,
  onGoogle,
}: AuthSocialButtonsProps) => {
  return (
    <>
      <div className={classes.SocialStack}>
        <button
          className={classes.GoogleButton}
          type="button"
          onClick={onGoogle}
        >
          <span className={classes.GoogleIcon}>G</span>
          {googleLabel}
        </button>
      </div>

      <div className={classes.Divider}>
        <span>or</span>
      </div>
    </>
  );
};

export const AuthTextLink = ({
  children,
  align = 'start',
}: AuthTextLinkProps) => {
  const className =
    align === 'end'
      ? `${classes.TextLink} ${classes.TextLinkEnd}`
      : classes.TextLink;

  return <span className={className}>{children}</span>;
};

export const AuthTabs = ({ value, options, onChange }: AuthTabsProps) => {
  return (
    <div className={classes.Tabs} role="tablist" aria-label="Login method">
      {options.map((option) => (
        <button
          key={option.value}
          className={
            option.value === value
              ? `${classes.Tab} ${classes.TabActive}`
              : classes.Tab
          }
          type="button"
          role="tab"
          aria-selected={option.value === value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
};
