import { SortOrder } from 'mongoose';
import { ServiceError } from '../errors/ServiceError';
import { userRepository } from '../repositories/user.repository';
import type {
  AdminCustomerQuery,
  DisableCustomerPayload,
} from '../validation/admin-customer.schema';

export interface PublicCustomer {
  id: string;
  name: string;
  email?: string;
  status: 'active' | 'disabled';
  emailVerified: boolean;
  disabledAt?: Date;
  disabledReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const toPublicCustomer = (customer: {
  _id: unknown;
  name: string;
  email?: string;
  status?: 'active' | 'disabled';
  emailVerified: boolean;
  disabledAt?: Date;
  disabledReason?: string;
  createdAt: Date;
  updatedAt: Date;
}): PublicCustomer => ({
  id: String(customer._id),
  name: customer.name,
  email: customer.email,
  status: customer.status ?? 'active',
  emailVerified: customer.emailVerified,
  disabledAt: customer.disabledAt,
  disabledReason: customer.disabledReason,
  createdAt: customer.createdAt,
  updatedAt: customer.updatedAt,
});

export const listCustomers = async ({
  page = 1,
  limit = 20,
  search,
  status,
}: Partial<AdminCustomerQuery> = {}) => {
  const query: Record<string, unknown> = { role: 'customer' };

  if (status) {
    query.status = status;
  }

  if (search) {
    const safeSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    query.$or = [
      { name: { $regex: safeSearch, $options: 'i' } },
      { email: { $regex: safeSearch, $options: 'i' } },
    ];
  }

  const skip = (page - 1) * limit;
  const sort: Record<string, SortOrder> = { createdAt: -1 };

  const [customers, total] = await Promise.all([
    userRepository.findCustomersPage({ query, sort, skip, limit }),
    userRepository.count(query),
  ]);

  return {
    customers: customers.map(toPublicCustomer),
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
};

const findCustomerForAdmin = async (customerId: string) => {
  const customer = await userRepository.findById(customerId);

  if (!customer || customer.role !== 'customer') {
    throw new ServiceError('Customer not found', 404);
  }

  return customer;
};

export const disableCustomer = async (
  customerId: string,
  { reason }: DisableCustomerPayload = {},
) => {
  const customer = await findCustomerForAdmin(customerId);

  customer.status = 'disabled';
  customer.disabledAt = new Date();
  customer.disabledReason = reason || undefined;
  await userRepository.save(customer);

  return toPublicCustomer(customer);
};

export const enableCustomer = async (customerId: string) => {
  const customer = await findCustomerForAdmin(customerId);

  customer.status = 'active';
  customer.disabledAt = undefined;
  customer.disabledReason = undefined;
  await userRepository.save(customer);

  return toPublicCustomer(customer);
};
