import { FormEvent, useState } from 'react';
import AdminLayout from '../components/Admin/AdminLayout';
import AdminRefreshButton from '../components/Admin/AdminRefreshButton';
import { useAdminCustomersPage } from './hooks/useAdminCustomersPage';
import type { AdminCustomer } from '../types/admin-customer';
import AdminCustomerDisableDialog from './AdminCustomerDisableDialog';
import AdminCustomerListCard from './AdminCustomerListCard';

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
        <AdminCustomerDisableDialog
          customer={customerToDisable}
          reason={disableReason}
          isBusy={busyCustomerId === customerToDisable.id}
          onReasonChange={setDisableReason}
          onSubmit={submitDisableCustomer}
          onClose={closeDisableDialog}
        />
      )}

      <AdminCustomerListCard
        customers={customers}
        search={search}
        isLoading={isLoading}
        isLoadingMore={isLoadingMore}
        hasMoreCustomers={hasMoreCustomers}
        busyCustomerId={busyCustomerId}
        error={error}
        message={message}
        onSearch={setSearch}
        onEnable={enableCustomer}
        onDisable={openDisableDialog}
        onLoadMore={loadMore}
      />
    </AdminLayout>
  );
};

export default AdminCustomers;
