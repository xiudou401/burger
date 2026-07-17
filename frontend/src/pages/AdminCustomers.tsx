import { FormEvent, useState } from 'react';
import AdminLayout from '../components/Admin/AdminLayout';
import AdminRefreshButton from '../components/Admin/AdminRefreshButton';
import Backdrop from '../components/UI/Backdrop/Backdrop';
import MenuSearch from '../components/Menu/MenuSearch/MenuSearch';
import classes from './AdminCustomers.module.css';
import { useAdminCustomersPage } from './hooks/useAdminCustomersPage';
import type { AdminCustomer } from '../types/admin-customer';

const formatDate = (value?: string) => {
  if (!value) return 'Not set';

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
};

const AdminCustomers = () => {
  const [customerToDisable, setCustomerToDisable] =
    useState<AdminCustomer | null>(null);
  const [disableReason, setDisableReason] = useState('');
  const {
    customers,
    search,
    setSearch,
    page,
    totalPages,
    isLoading,
    busyCustomerId,
    error,
    message,
    disableCustomer,
    enableCustomer,
    refresh,
    nextPage,
    previousPage,
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
        <Backdrop className={classes.DialogBackdrop}>
          <section
            className={classes.Dialog}
            role="dialog"
            aria-modal="true"
            aria-labelledby="disable-customer-title"
          >
            <h2 id="disable-customer-title" className={classes.DialogTitle}>
              Disable customer
            </h2>
            <p className={classes.DialogText}>
              {customerToDisable.email ?? customerToDisable.name}
            </p>

            <form
              className={classes.DisableForm}
              onSubmit={submitDisableCustomer}
            >
              <label className={classes.Field}>
                Reason
                <textarea
                  className={classes.Textarea}
                  value={disableReason}
                  placeholder="Optional note for the account record"
                  onChange={(event) => setDisableReason(event.target.value)}
                />
              </label>

              <div className={classes.DialogActions}>
                <button
                  className={classes.SecondaryButton}
                  type="button"
                  disabled={busyCustomerId === customerToDisable.id}
                  onClick={closeDisableDialog}
                >
                  Cancel
                </button>
                <button
                  className={classes.DangerButton}
                  disabled={busyCustomerId === customerToDisable.id}
                >
                  Disable
                </button>
              </div>
            </form>
          </section>
        </Backdrop>
      )}

      <section className={classes.Card}>
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

        {message && <p className={classes.Success}>{message}</p>}
        {error && <p className={classes.Error}>{error}</p>}

        {isLoading && <p className={classes.StateText}>Loading customers...</p>}
        {!isLoading && customers.length === 0 && (
          <p className={classes.StateText}>No customers found.</p>
        )}

        <div className={classes.CustomerList}>
          {customers.map((customer) => (
            <article className={classes.CustomerRow} key={customer.id}>
              <div>
                <div className={classes.CustomerMetaLine}>
                  <strong className={classes.Name}>{customer.name}</strong>
                  <span
                    className={
                      customer.status === 'disabled'
                        ? `${classes.StatusBadge} ${classes.DisabledBadge}`
                        : classes.StatusBadge
                    }
                  >
                    {customer.status}
                  </span>
                </div>
                <p className={classes.Meta}>{customer.email ?? 'No email'}</p>
                <p className={classes.Meta}>
                  Joined {formatDate(customer.createdAt)} · Email{' '}
                  {customer.emailVerified ? 'verified' : 'unverified'}
                </p>
                {customer.disabledReason && (
                  <p className={classes.Reason}>
                    Disabled reason: {customer.disabledReason}
                  </p>
                )}
              </div>

              <div className={classes.RowActions}>
                {customer.status === 'disabled' ? (
                  <button
                    className={classes.SecondaryButton}
                    type="button"
                    disabled={busyCustomerId === customer.id}
                    onClick={() => enableCustomer(customer)}
                  >
                    Enable
                  </button>
                ) : (
                  <button
                    className={classes.DangerButton}
                    type="button"
                    disabled={busyCustomerId === customer.id}
                    onClick={() => openDisableDialog(customer)}
                  >
                    Disable
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>

        <div className={classes.Pagination}>
          <button
            className={classes.SecondaryButton}
            type="button"
            disabled={page <= 1}
            onClick={previousPage}
          >
            Previous
          </button>
          <span className={classes.PageText}>
            Page {page} of {totalPages}
          </span>
          <button
            className={classes.SecondaryButton}
            type="button"
            disabled={page >= totalPages}
            onClick={nextPage}
          >
            Next
          </button>
        </div>
      </section>
    </AdminLayout>
  );
};

export default AdminCustomers;
