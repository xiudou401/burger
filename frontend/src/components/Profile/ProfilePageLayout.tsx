import { ReactNode } from 'react';
import AccountBar from '../Auth/AccountBar';
import classes from './ProfilePageLayout.module.css';

interface ProfilePageLayoutProps {
  main: ReactNode;
  side: ReactNode;
}

const ProfilePageLayout = ({ main, side }: ProfilePageLayoutProps) => {
  return (
    <div className={classes.ProfilePage}>
      <AccountBar />

      <main className={classes.Shell}>
        <div className={classes.Grid}>
          <div className={classes.Stack}>{main}</div>
          <aside className={classes.Stack}>{side}</aside>
        </div>
      </main>
    </div>
  );
};

export default ProfilePageLayout;
