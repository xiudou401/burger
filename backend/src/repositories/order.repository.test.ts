import { Types } from 'mongoose';
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
  const userId = '507f1f77bcf86cd799439011';
  const orderId = '507f1f77bcf86cd799439012';
  const menuItemId = '507f1f77bcf86cd799439013';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('lists user orders sorted newest first with a limit', async () => {
    const query = chain([]);
    jest.mocked(OrderModel.find).mockReturnValue({ sort: query.sort } as never);

    await expect(orderRepository.listForUser(userId, 5)).resolves.toEqual([]);

    expect(OrderModel.find).toHaveBeenCalledWith({ userId });
    expect(query.sort).toHaveBeenCalledWith({ createdAt: -1 });
    expect(query.limit).toHaveBeenCalledWith(5);
    expect(query.lean).toHaveBeenCalled();
    expect(query.exec).toHaveBeenCalled();
  });

  test('finds an order scoped to a user', async () => {
    const exec = jest.fn().mockResolvedValue(null);
    const lean = jest.fn().mockReturnValue({ exec });

    jest.mocked(OrderModel.findOne).mockReturnValue({ lean } as never);

    await orderRepository.findForUser(userId, orderId);

    expect(OrderModel.findOne).toHaveBeenCalledWith({
      _id: orderId,
      userId,
    });
    expect(lean).toHaveBeenCalled();
  });

  test('delegates creates and document saves', async () => {
    const order = { _id: 'order-1' };
    const doc = { save: jest.fn().mockResolvedValue(order) };

    jest.mocked(OrderModel.create).mockResolvedValue(order as never);

    await expect(
      orderRepository.create({
        userId,
        items: [
          {
            menuItemId,
            nameAtPurchase: 'Classic Burger',
            priceCentsAtPurchase: 1200,
            quantity: 2,
            subtotalCents: 2400,
          },
        ],
        totalCents: 2400,
        menuVersion: 7,
        status: 'pending_payment',
        payment: {
          status: 'unpaid',
          amountCents: 2400,
          currency: 'aud',
        },
      }),
    ).resolves.toBe(order);
    await orderRepository.save(doc);

    expect(OrderModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: expect.any(Types.ObjectId),
        items: [
          expect.objectContaining({
            menuItemId: expect.any(Types.ObjectId),
            nameAtPurchase: 'Classic Burger',
            priceCentsAtPurchase: 1200,
          }),
        ],
      }),
    );
    expect(doc.save).toHaveBeenCalled();
  });
});
