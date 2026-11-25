import type { ClientSession } from 'mongoose';
import { OutboxEventModel } from '../models/outbox-event.model';
import { outboxEventRepository } from './outbox-event.repository';

jest.mock('../models/outbox-event.model', () => ({
  OutboxEventModel: { create: jest.fn(), updateOne: jest.fn() },
}));

describe('outbox enqueue', () => {
  const data = {
    eventType: 'order.paid' as const,
    eventKey: 'order.paid:A',
    aggregateId: 'A',
    payload: { orderId: 'A', userId: 'U' },
  };
  beforeEach(() => jest.clearAllMocks());

  test('ensures existence inside the supplied transaction without resetting an existing event', async () => {
    const session = {} as ClientSession;
    const exec = jest.fn().mockResolvedValue({ matchedCount: 1 });
    jest.mocked(OutboxEventModel.updateOne).mockReturnValue({ exec } as never);
    await outboxEventRepository.enqueue(data, session);
    expect(OutboxEventModel.updateOne).toHaveBeenCalledWith(
      { eventKey: data.eventKey },
      {
        $setOnInsert: {
          ...data,
          status: 'pending',
          attempts: 0,
          availableAt: expect.any(Date),
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
        },
      },
      { upsert: true, session, timestamps: false },
    );
    expect(OutboxEventModel.create).not.toHaveBeenCalled();
  });

  test('does not swallow transaction write errors', async () => {
    const error = Object.assign(new Error('Write failed'), { code: 11000 });
    jest
      .mocked(OutboxEventModel.updateOne)
      .mockReturnValue({ exec: jest.fn().mockRejectedValue(error) } as never);
    await expect(
      outboxEventRepository.enqueue(data, {} as ClientSession),
    ).rejects.toBe(error);
  });

  test('still ignores duplicate tasks outside a transaction but propagates other failures', async () => {
    jest
      .mocked(OutboxEventModel.create)
      .mockRejectedValueOnce({ code: 11000 } as never);
    await expect(outboxEventRepository.enqueue(data)).resolves.toBeUndefined();
    const error = new Error('Database unavailable');
    jest.mocked(OutboxEventModel.create).mockRejectedValueOnce(error as never);
    await expect(outboxEventRepository.enqueue(data)).rejects.toBe(error);
  });
});
