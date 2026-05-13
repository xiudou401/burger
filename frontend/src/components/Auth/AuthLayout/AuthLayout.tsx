import { ReactNode } from 'react';
import classes from './AuthLayout.module.css';

interface AuthSplitPageProps {
  title: string;
  subtitle: string;
  imageIds: number[];
  children: ReactNode;
}

interface AuthCenteredPageProps {
  children: ReactNode;
}

export const AuthLogo = () => {
  return <div className={classes.Logo}>M</div>;
};

export const AuthSplitPage = ({
  title,
  subtitle,
  imageIds,
  children,
}: AuthSplitPageProps) => {
  return (
    <main className={classes.Page}>
      <section className={classes.BrandPanel}>
        <AuthLogo />
        <div className={classes.BrandCopy}>
          <p className={classes.Eyebrow}>Burger Club</p>
          <h1 className={classes.Title}>{title}</h1>
          <p className={classes.Subtitle}>{subtitle}</p>
        </div>
        <div className={classes.FoodRow}>
          {imageIds.map((imageId) => (
            <div className={classes.FoodTile} key={imageId}>
              <img src={`/img/meals/${imageId}.png`} alt="" />
            </div>
          ))}
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
