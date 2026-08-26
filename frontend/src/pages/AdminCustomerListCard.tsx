import AdminButton from '../components/Admin/AdminButton';
import AdminCard from '../components/Admin/AdminCard';
import AdminLoadMore from '../components/Admin/AdminLoadMore';
import AdminStatusBadge from '../components/Admin/AdminStatusBadge';
import AdminStatusText from '../components/Admin/AdminStatusText';
import MenuSearch from '../components/Menu/MenuSearch/MenuSearch';
import type { AdminCustomer } from '../types/admin-customer';
import { formatOptionalShortDateTime } from '../utils/date';
import classes from './AdminCustomers.module.css';

interface AdminCustomerListCardProps {
  customers: AdminCustomer[];
  search: string;
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMoreCustomers: boolean;
  busyCustomerId: string | null;
  error: string | null;
  message: string | null;
  onSearch: (query: string) => void;
  onEnable: (customer: AdminCustomer) => void;
  onDisable: (customer: AdminCustomer) => void;
  onLoadMore: () => void;
}

const AdminCustomerListCard = ({
  customers,
  search,
  isLoading,
  isLoadingMore,
  hasMoreCustomers,
  busyCustomerId,
  error,
  message,
  onSearch,
  onEnable,
  onDisable,
  onLoadMore,
}: AdminCustomerListCardProps) => {
  return (
    <AdminCard>
      <div className={classes.SearchToolbar}>
        <div className={classes.AdminSearch}>
          <MenuSearch
            value={search}
            onSearch={onSearch}
            placeholder="Search customers"
            variant="compact"
          />
        </div>
      </div>

      {message && <AdminStatusText tone="success">{message}</AdminStatusText>}
      {error && <AdminStatusText tone="error">{error}</AdminStatusText>}

      {isLoading && <AdminStatusText>Loading customers...</AdminStatusText>}
      {!isLoading && customers.length === 0 && (
        <AdminStatusText>No customers found.</AdminStatusText>
      )}

      <div className={classes.CustomerList}>
        {customers.map((customer) => (
          <article className={classes.CustomerRow} key={customer.id}>
            <div>
              <div className={classes.CustomerMetaLine}>
                <strong className={classes.Name}>{customer.name}</strong>
                <AdminStatusBadge
                  variant={
                    customer.status === 'disabled' ? 'danger' : 'success'
                  }
                >
                  {customer.status}
                </AdminStatusBadge>
              </div>
              <p className={classes.Meta}>{customer.email ?? 'No email'}</p>
              <p className={classes.Meta}>
                Joined{' '}
                {formatOptionalShortDateTime(customer.createdAt, 'Not set')} ·
                Email {customer.emailVerified ? 'verified' : 'unverified'}
              </p>
              {customer.disabledReason && (
                <p className={classes.Reason}>
                  Disabled reason: {customer.disabledReason}
                </p>
              )}
            </div>

            <div className={classes.RowActions}>
              {customer.status === 'disabled' ? (
                <AdminButton
                  variant="secondary"
                  size="compact"
                  type="button"
                  disabled={busyCustomerId === customer.id}
                  onClick={() => onEnable(customer)}
                >
                  Enable
                </AdminButton>
              ) : (
                <AdminButton
                  variant="danger"
                  size="compact"
                  type="button"
                  disabled={busyCustomerId === customer.id}
                  onClick={() => onDisable(customer)}
                >
                  Disable
                </AdminButton>
              )}
            </div>
          </article>
        ))}
      </div>

      <AdminLoadMore
        hasMore={hasMoreCustomers}
        isLoading={isLoadingMore}
        onLoadMore={onLoadMore}
      />
    </AdminCard>
  );
};

export default AdminCustomerListCard;
