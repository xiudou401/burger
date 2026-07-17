import AccountBar from '../Auth/AccountBar';
import classes from './BrandHero.module.css';

interface BrandHeroProps {
  labelledBy?: string;
  className?: string;
  as?: 'header' | 'section';
}

const BrandHero = ({
  labelledBy,
  className,
  as: Component = 'section',
}: BrandHeroProps) => {
  const heroClassName = className
    ? `${classes.Hero} ${className}`
    : classes.Hero;

  return (
    <Component className={heroClassName} aria-labelledby={labelledBy}>
      <AccountBar variant="hero" />

      <div className={classes.HeroCopy}>
        <div className={classes.HeroLine}>
          <h1 id={labelledBy} className={classes.Title}>
            Grillhouse burgers, loaded chips, and thickshakes
          </h1>
          <div className={classes.StoreStatus}>
            <span className={classes.StatusDot} aria-hidden="true" />
            <span>Open today · Surry Hills · 10:30 AM - 9:30 PM</span>
          </div>
        </div>
      </div>
    </Component>
  );
};

export default BrandHero;
