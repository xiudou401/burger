import AdminButton from './AdminButton';

interface AdminRefreshButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

const AdminRefreshButton = ({
  onClick,
  disabled = false,
}: AdminRefreshButtonProps) => {
  return (
    <AdminButton
      size="compact"
      type="button"
      disabled={disabled}
      onClick={onClick}
    >
      Refresh
    </AdminButton>
  );
};

export default AdminRefreshButton;
