import { Link } from 'react-router-dom';
import classes from './QuickActionsCard.module.css';

interface QuickActionsCardProps {
  onLogout: () => void;
}

const QuickActionsCard = ({ onLogout }: QuickActionsCardProps) => {
  return (
    <section className={classes.Card}>
      <div className={classes.CardHeader}>
        <h2 className={classes.CardTitle}>Quick actions</h2>
      </div>

      <div className={classes.Actions}>
        <Link className={classes.PrimaryAction} to="/">
          Menu
        </Link>
        <button
          className={classes.DangerAction}
          type="button"
          onClick={onLogout}
        >
          Log out
        </button>
      </div>
    </section>
  );
};

export default QuickActionsCard;
