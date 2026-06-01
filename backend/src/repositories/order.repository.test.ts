import { OrderModel } from '../models/order.model';
import { orderRepository } from './order.repository';

jest.mock('../models/order.model', () => ({
  OrderModel: {
    create: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    findById: jest.fn(),
  },
}));

const chain = (value: unknown) => {
  const exec = jest.fn().mockResolvedValue(value);
  const lean = jest.fn().mockReturnValue({ exec });
  const limit = jest.fn().mockReturnValue({ lean });
  const sort = jest.fn().mockReturnValue({ limit });

  return { exec, lean, limit, sort };
};

describe('orderRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('lists user orders sorted newest first with a limit', async () => {
    const query = chain([]);
    jest.mocked(OrderModel.find).mockReturnValue({ sort: query.sort } as never);

    await expect(orderRepository.listForUser('user-1', 5)).resolves.toEqual([]);

    expect(OrderModel.find).toHaveBeenCalledWith({ userId: 'user-1' });
    expect(query.sort).toHaveBeenCalledWith({ createdAt: -1 });
    expect(query.limit).toHaveBeenCalledWith(5);
    expect(query.lean).toHaveBeenCalled();
    expect(query.exec).toHaveBeenCalled();
  });

  test('finds an order scoped to a user', async () => {
    const exec = jest.fn().mockResolvedValue(null);
    const lean = jest.fn().mockReturnValue({ exec });

    jest.mocked(OrderModel.findOne).mockReturnValue({ lean } as never);

    await orderRepository.findForUser('user-1', 'order-1');

    expect(OrderModel.findOne).toHaveBeenCalledWith({
      _id: 'order-1',
      userId: 'user-1',
    });
    expect(lean).toHaveBeenCalled();
  });

  test('delegates creates and document saves', async () => {
    const order = { _id: 'order-1' };
    const doc = { save: jest.fn().mockResolvedValue(order) };

    jest.mocked(OrderModel.create).mockResolvedValue(order as never);

    await expect(orderRepository.create({} as never)).resolves.toBe(order);
    await orderRepository.save(doc);

    expect(OrderModel.create).toHaveBeenCalledWith({});
    expect(doc.save).toHaveBeenCalled();
  });
});
