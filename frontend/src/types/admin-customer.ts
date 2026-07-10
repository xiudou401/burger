export type CustomerStatus = 'active' | 'disabled';

export interface AdminCustomer {
  id: string;
  name: string;
  email?: string;
  status: CustomerStatus;
  emailVerified: boolean;
  disabledAt?: string;
  disabledReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedAdminCustomers {
  customers: AdminCustomer[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
