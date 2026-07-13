import { ReactNode } from 'react';
import classes from './AuthLayout.module.css';

interface AuthSplitPageProps {
  title: string;
  subtitle: string;
  children: ReactNode;
}

interface AuthCenteredPageProps {
  children: ReactNode;
}

export const AuthLogo = () => {
  return <div className={classes.Logo}>S</div>;
};

export const AuthSplitPage = ({
  title,
  subtitle,
  children,
}: AuthSplitPageProps) => {
  return (
    <main className={classes.Page}>
      <section className={classes.BrandPanel}>
        <AuthLogo />
        <div className={classes.BrandCopy}>
          <p className={classes.Eyebrow}>Sydney Burger</p>
          <h1 className={classes.Title}>{title}</h1>
          <p className={classes.Subtitle}>{subtitle}</p>
        </div>
      </section>

      <section className={classes.FormPanel}>{children}</section>
    </main>
  );
};

export const AuthCenteredPage = ({ children }: AuthCenteredPageProps) => {
  return (
    <main className={classes.CenterPage}>
      <section className={classes.SimpleCard}>
        <AuthLogo />
        {children}
      </section>
    </main>
  );
};
