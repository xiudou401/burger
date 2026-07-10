import { StripeWebhookEventModel } from '../models/stripe-webhook-event.model';
import { stripeWebhookEventRepository } from './stripe-webhook-event.repository';

jest.mock('../models/stripe-webhook-event.model', () => ({
  StripeWebhookEventModel: {
    create: jest.fn(),
    findOne: jest.fn(),
    findOneAndUpdate: jest.fn(),
  },
}));

describe('stripe webhook event repository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('claims new Stripe events for processing', async () => {
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

  test('skips already recorded non-failed Stripe events', async () => {
    jest
      .mocked(StripeWebhookEventModel.create)
      .mockRejectedValue({ code: 11000 } as never);
    jest.mocked(StripeWebhookEventModel.findOne).mockReturnValue({
      exec: jest.fn().mockResolvedValue({
        stripeEventId: 'evt_test_123',
        status: 'processed',
      }),
    } as never);

    await expect(
      stripeWebhookEventRepository.claim(
        'evt_test_123',
        'checkout.session.completed',
      ),
    ).resolves.toEqual({ shouldProcess: false, isDuplicate: true });
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
