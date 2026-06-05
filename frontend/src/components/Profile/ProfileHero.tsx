import classes from './ProfileHero.module.css';

interface ProfileHeroProps {
  initial: string;
  firstName: string;
  accountStatus: string;
  contact?: string;
}

const ProfileHero = ({
  initial,
  firstName,
  accountStatus,
  contact,
}: ProfileHeroProps) => {
  return (
    <section className={classes.Hero}>
      <div className={classes.HeroMain}>
        <div className={classes.Avatar}>{initial}</div>
        <div className={classes.HeroCopy}>
          <p className={classes.Eyebrow}>Burger Club</p>
          <h1 className={classes.Title}>Hi, {firstName}</h1>
          <p className={classes.Subtitle}>
            Track your account, keep checkout ready, and jump back into your next
            Sydney pickup or delivery order.
          </p>
        </div>
      </div>

      <aside className={classes.HeroPanel}>
        <span className={classes.StatusLabel}>Account status</span>
        <span className={classes.StatusValue}>{accountStatus}</span>
        <span className={classes.MetaLabel}>{contact}</span>
      </aside>
    </section>
  );
};

export default ProfileHero;
