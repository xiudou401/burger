import AdminButton from './AdminButton';
import classes from './AdminLoadMore.module.css';

interface AdminLoadMoreProps {
  hasMore: boolean;
  isLoading: boolean;
  onLoadMore: () => void;
}

const AdminLoadMore = ({
  hasMore,
  isLoading,
  onLoadMore,
}: AdminLoadMoreProps) => {
  if (!hasMore) return null;

  return (
    <div className={classes.LoadMore}>
      <AdminButton
        type="button"
        disabled={isLoading}
        onClick={onLoadMore}
        fullWidthOnMobile
      >
        {isLoading ? 'Loading...' : 'Load more'}
      </AdminButton>
    </div>
  );
};

export default AdminLoadMore;
