import { StripeWebhookEventModel } from '../models/stripe-webhook-event.model';
import { stripeWebhookEventRepository } from './stripe-webhook-event.repository';

jest.mock('../models/stripe-webhook-event.model', () => ({
  StripeWebhookEventModel: {
    create: jest.fn(),
    findOneAndUpdate: jest.fn(),
  },
}));

describe('stripe webhook event repository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('claims new Stripe events for processing', async () => {
    jest.mocked(StripeWebhookEventModel.findOneAndUpdate).mockReturnValue({
      exec: jest.fn().mockResolvedValue(null),
    } as never);
    jest.mocked(StripeWebhookEventModel.create).mockResolvedValue({} as never);

    await expect(
      stripeWebhookEventRepository.claim(
        'evt_test_123',
        'checkout.session.completed',
      ),
    ).resolves.toEqual({ shouldProcess: true, isDuplicate: false });

    expect(StripeWebhookEventModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        stripeEventId: 'evt_test_123',
        eventType: 'checkout.session.completed',
        status: 'processing',
        attempts: 1,
      }),
    );
  });

  test('skips already recorded events that cannot be reclaimed', async () => {
    jest.mocked(StripeWebhookEventModel.findOneAndUpdate).mockReturnValue({
      exec: jest.fn().mockResolvedValue(null),
    } as never);
    jest
      .mocked(StripeWebhookEventModel.create)
      .mockRejectedValue({ code: 11000 } as never);

    await expect(
      stripeWebhookEventRepository.claim(
        'evt_test_123',
        'checkout.session.completed',
      ),
    ).resolves.toEqual({ shouldProcess: false, isDuplicate: true });
  });

  test('atomically reclaims failed Stripe events', async () => {
    jest.mocked(StripeWebhookEventModel.findOneAndUpdate).mockReturnValue({
      exec: jest.fn().mockResolvedValue({
        stripeEventId: 'evt_test_123',
        status: 'processing',
      }),
    } as never);

    await expect(
      stripeWebhookEventRepository.claim(
        'evt_test_123',
        'checkout.session.completed',
      ),
    ).resolves.toEqual({ shouldProcess: true, isDuplicate: true });

    expect(StripeWebhookEventModel.findOneAndUpdate).toHaveBeenCalledWith(
      {
        stripeEventId: 'evt_test_123',
        $or: [
          { status: 'failed' },
          {
            status: 'processing',
            updatedAt: { $lt: expect.any(Date) },
          },
        ],
      },
      expect.objectContaining({
        $set: expect.objectContaining({
          eventType: 'checkout.session.completed',
          status: 'processing',
          lastReceivedAt: expect.any(Date),
        }),
        $inc: {
          attempts: 1,
        },
        $unset: {
          lastError: '',
          processedAt: '',
        },
      }),
      { new: true },
    );
    expect(StripeWebhookEventModel.create).not.toHaveBeenCalled();
  });

  test('allows stale processing Stripe events to be reclaimed by lease timeout', async () => {
    jest.mocked(StripeWebhookEventModel.findOneAndUpdate).mockReturnValue({
      exec: jest.fn().mockResolvedValue({
        stripeEventId: 'evt_test_123',
        status: 'processing',
      }),
    } as never);

    await expect(
      stripeWebhookEventRepository.claim(
        'evt_test_123',
        'checkout.session.completed',
      ),
    ).resolves.toEqual({ shouldProcess: true, isDuplicate: true });

    const [query] = jest.mocked(StripeWebhookEventModel.findOneAndUpdate).mock
      .calls[0];

    expect(query).toEqual(
      expect.objectContaining({
        stripeEventId: 'evt_test_123',
        $or: expect.arrayContaining([
          {
            status: 'processing',
            updatedAt: { $lt: expect.any(Date) },
          },
        ]),
      }),
    );
  });

  test('marks Stripe events processed with their order id', async () => {
    jest.mocked(StripeWebhookEventModel.findOneAndUpdate).mockReturnValue({
      exec: jest.fn().mockResolvedValue({}),
    } as never);

    await stripeWebhookEventRepository.markProcessed(
      'evt_test_123',
      '507f1f77bcf86cd799439012',
    );

    expect(StripeWebhookEventModel.findOneAndUpdate).toHaveBeenCalledWith(
      { stripeEventId: 'evt_test_123' },
      {
        $set: {
          status: 'processed',
          processedAt: expect.any(Date),
          orderId: '507f1f77bcf86cd799439012',
        },
        $unset: {
          lastError: '',
        },
      },
    );
  });
});
