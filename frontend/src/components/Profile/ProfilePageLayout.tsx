import { ReactNode } from 'react';
import BrandHero from '../BrandHero/BrandHero';
import classes from './ProfilePageLayout.module.css';

interface ProfilePageLayoutProps {
  main: ReactNode;
  side?: ReactNode;
}

const ProfilePageLayout = ({ main, side }: ProfilePageLayoutProps) => {
  const gridClassName = side
    ? classes.Grid
    : `${classes.Grid} ${classes.GridSingle}`;

  return (
    <div className={classes.ProfilePage}>
      <BrandHero as="header" labelledBy="profile-title" />

      <main className={classes.Shell}>
        <div className={gridClassName}>
          <div className={classes.Stack}>{main}</div>
          {side && <aside className={classes.Stack}>{side}</aside>}
        </div>
      </main>
    </div>
  );
};

export default ProfilePageLayout;
