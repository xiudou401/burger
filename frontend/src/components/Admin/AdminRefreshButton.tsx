import classes from './AdminRefreshButton.module.css';

interface AdminRefreshButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

const AdminRefreshButton = ({
  onClick,
  disabled = false,
}: AdminRefreshButtonProps) => {
  return (
    <button
      className={classes.RefreshButton}
      type="button"
      disabled={disabled}
      onClick={onClick}
    >
      Refresh
    </button>
  );
};

export default AdminRefreshButton;
