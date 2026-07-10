import AdminLayout from '../components/Admin/AdminLayout';
import classes from './AdminCustomers.module.css';
import { useAdminCustomersPage } from './hooks/useAdminCustomersPage';

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
  const {
    customers,
    search,
    setSearch,
    status,
    setStatus,
    page,
    totalPages,
    isLoading,
    busyCustomerId,
    error,
    message,
    submitSearch,
    disableCustomer,
    enableCustomer,
    refresh,
    nextPage,
    previousPage,
  } = useAdminCustomersPage();

  return (
    <AdminLayout
      title="Customers"
      action={
        <button
          className={classes.SecondaryButton}
          type="button"
          onClick={refresh}
        >
          Refresh
        </button>
      }
    >
      <section className={classes.Card}>
        <form className={classes.Filters} onSubmit={submitSearch}>
          <label className={classes.Field}>
            Search
            <input
              className={classes.Input}
              type="search"
              value={search}
              placeholder="Name or email"
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>

          <label className={classes.Field}>
            Status
            <select
              className={classes.Input}
              value={status}
              onChange={(event) =>
                setStatus(event.target.value as typeof status)
              }
            >
              <option value="">All</option>
              <option value="active">Active</option>
              <option value="disabled">Disabled</option>
            </select>
          </label>

          <button className={classes.PrimaryButton} type="submit">
            Search
          </button>
        </form>

        {message && <p className={classes.Success}>{message}</p>}
        {error && <p className={classes.Error}>{error}</p>}
      </section>

      <section className={classes.Card}>
        <h2 className={classes.CardTitle}>Customer accounts</h2>

        {isLoading && <p className={classes.StateText}>Loading customers...</p>}
        {!isLoading && customers.length === 0 && (
          <p className={classes.StateText}>No customers found.</p>
        )}

        <div className={classes.CustomerList}>
          {customers.map((customer) => (
            <article className={classes.CustomerRow} key={customer.id}>
              <div>
                <strong className={classes.Name}>{customer.name}</strong>
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
                <span
                  className={
                    customer.status === 'disabled'
                      ? `${classes.StatusBadge} ${classes.DisabledBadge}`
                      : classes.StatusBadge
                  }
                >
                  {customer.status}
                </span>

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
                    onClick={() => disableCustomer(customer)}
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
