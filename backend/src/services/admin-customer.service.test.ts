import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import { ServiceError } from '../errors/ServiceError';
import { userRepository } from '../repositories/user.repository';
import {
  disableCustomer,
  enableCustomer,
  listCustomers,
} from './admin-customer.service';

jest.mock('../repositories/user.repository', () => ({
  userRepository: {
    count: jest.fn(),
    findById: jest.fn(),
    findCustomersPage: jest.fn(),
    save: jest.fn(),
  },
}));

const customerDoc = {
  _id: '507f1f77bcf86cd799439011',
  name: 'Pat',
  email: 'pat@example.com',
  role: 'customer' as const,
  status: 'active' as const,
  emailVerified: true,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-02T00:00:00.000Z'),
};

describe('admin customer service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('lists customers with escaped search and pagination', async () => {
    jest
      .mocked(userRepository.findCustomersPage)
      .mockResolvedValue([customerDoc] as never);
    jest.mocked(userRepository.count).mockResolvedValue(1);

    const result = await listCustomers({
      page: 2,
      limit: 20,
      search: 'pat@example.com',
      status: 'active',
    });

    expect(userRepository.findCustomersPage).toHaveBeenCalledWith({
      query: {
        role: 'customer',
        status: 'active',
        $or: [
          { name: { $regex: 'pat@example\\.com', $options: 'i' } },
          { email: { $regex: 'pat@example\\.com', $options: 'i' } },
        ],
      },
      sort: { createdAt: -1 },
      skip: 20,
      limit: 20,
    });
    expect(result.customers).toEqual([
      expect.objectContaining({
        id: customerDoc._id,
        email: customerDoc.email,
        status: 'active',
      }),
    ]);
    expect(result.totalPages).toBe(1);
  });

  test('disables customer accounts', async () => {
    const user: typeof customerDoc & {
      disabledAt?: Date;
      disabledReason?: string;
      save: jest.Mock;
    } = { ...customerDoc, save: jest.fn() };
    jest.mocked(userRepository.findById).mockResolvedValue(user as never);

    const result = await disableCustomer(customerDoc._id, {
      reason: 'Chargeback review',
    });

    expect(user.status).toBe('disabled');
    expect(user.disabledAt).toBeInstanceOf(Date);
    expect(user.disabledReason).toBe('Chargeback review');
    expect(userRepository.save).toHaveBeenCalledWith(user);
    expect(result.status).toBe('disabled');
  });

  test('enables disabled customer accounts', async () => {
    const user = {
      ...customerDoc,
      status: 'disabled' as const,
      disabledAt: new Date(),
      disabledReason: 'Chargeback review',
      save: jest.fn(),
    };
    jest.mocked(userRepository.findById).mockResolvedValue(user as never);

    const result = await enableCustomer(customerDoc._id);

    expect(user.status).toBe('active');
    expect(user.disabledAt).toBeUndefined();
    expect(user.disabledReason).toBeUndefined();
    expect(userRepository.save).toHaveBeenCalledWith(user);
    expect(result.status).toBe('active');
  });

  test('rejects attempts to manage non-customer accounts', async () => {
    jest.mocked(userRepository.findById).mockResolvedValue({
      ...customerDoc,
      role: 'admin',
    } as never);

    await expect(disableCustomer(customerDoc._id)).rejects.toBeInstanceOf(
      ServiceError,
    );
    expect(userRepository.save).not.toHaveBeenCalled();
  });
});
