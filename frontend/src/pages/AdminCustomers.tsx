import { FormEvent, useState } from 'react';
import AdminLayout from '../components/Admin/AdminLayout';
import AdminButton from '../components/Admin/AdminButton';
import AdminCard from '../components/Admin/AdminCard';
import AdminDialog from '../components/Admin/AdminDialog';
import AdminFormField from '../components/Admin/AdminFormField';
import AdminLoadMore from '../components/Admin/AdminLoadMore';
import AdminRefreshButton from '../components/Admin/AdminRefreshButton';
import AdminStatusBadge from '../components/Admin/AdminStatusBadge';
import AdminStatusText from '../components/Admin/AdminStatusText';
import formControls from '../components/Admin/AdminFormControls.module.css';
import MenuSearch from '../components/Menu/MenuSearch/MenuSearch';
import classes from './AdminCustomers.module.css';
import { useAdminCustomersPage } from './hooks/useAdminCustomersPage';
import { formatOptionalShortDateTime } from '../utils/date';
import type { AdminCustomer } from '../types/admin-customer';

const AdminCustomers = () => {
  const [customerToDisable, setCustomerToDisable] =
    useState<AdminCustomer | null>(null);
  const [disableReason, setDisableReason] = useState('');
  const {
    customers,
    search,
    setSearch,
    isLoading,
    isLoadingMore,
    hasMoreCustomers,
    busyCustomerId,
    error,
    message,
    disableCustomer,
    enableCustomer,
    refresh,
    loadMore,
  } = useAdminCustomersPage();

  const openDisableDialog = (customer: AdminCustomer) => {
    setCustomerToDisable(customer);
    setDisableReason('');
  };

  const closeDisableDialog = () => {
    if (busyCustomerId) return;

    setCustomerToDisable(null);
    setDisableReason('');
  };

  const submitDisableCustomer = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!customerToDisable) return;

    await disableCustomer(customerToDisable, disableReason);
    setCustomerToDisable(null);
    setDisableReason('');
  };

  return (
    <AdminLayout
      title="Customers"
      action={<AdminRefreshButton onClick={refresh} />}
    >
      {customerToDisable && (
        <AdminDialog
          title="Disable customer"
          description={customerToDisable.email ?? customerToDisable.name}
          onClose={closeDisableDialog}
          closeDisabled={Boolean(busyCustomerId)}
        >
          <form
            className={classes.DisableForm}
            onSubmit={submitDisableCustomer}
          >
            <AdminFormField label="Reason" htmlFor="disable-customer-reason">
              <textarea
                id="disable-customer-reason"
                className={formControls.Textarea}
                value={disableReason}
                placeholder="Optional note for the account record"
                onChange={(event) => setDisableReason(event.target.value)}
              />
            </AdminFormField>

            <div className={classes.DialogActions}>
              <AdminButton
                variant="secondary"
                type="button"
                disabled={busyCustomerId === customerToDisable.id}
                onClick={closeDisableDialog}
                fullWidthOnMobile
              >
                Cancel
              </AdminButton>
              <AdminButton
                variant="danger"
                disabled={busyCustomerId === customerToDisable.id}
                fullWidthOnMobile
              >
                Disable
              </AdminButton>
            </div>
          </form>
        </AdminDialog>
      )}

      <AdminCard>
        <div className={classes.SearchToolbar}>
          <div className={classes.AdminSearch}>
            <MenuSearch
              value={search}
              onSearch={setSearch}
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
                    onClick={() => enableCustomer(customer)}
                  >
                    Enable
                  </AdminButton>
                ) : (
                  <AdminButton
                    variant="danger"
                    size="compact"
                    type="button"
                    disabled={busyCustomerId === customer.id}
                    onClick={() => openDisableDialog(customer)}
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
          onLoadMore={loadMore}
        />
      </AdminCard>
    </AdminLayout>
  );
};

export default AdminCustomers;
