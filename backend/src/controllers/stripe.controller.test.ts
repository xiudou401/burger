import type { NextFunction, Request, Response } from 'express';
import { env } from '../config/env';
import { ServiceError } from '../errors/ServiceError';
import {
  markStripeCheckoutFailed,
  markStripeCheckoutPaid,
  markStripeOrderFailed,
} from '../services/checkout.service';
import { stripeWebhookEventRepository } from '../repositories/stripe-webhook-event.repository';
import { stripeWebhookHandler } from './stripe.controller';

const mockConstructEvent = jest.fn();

jest.mock('stripe', () =>
  jest.fn().mockImplementation(() => ({
    webhooks: {
      constructEvent: mockConstructEvent,
    },
  })),
);

jest.mock('../services/checkout.service', () => ({
  markStripeCheckoutFailed: jest.fn(),
  markStripeCheckoutPaid: jest.fn(),
  markStripeOrderFailed: jest.fn(),
}));

jest.mock('../repositories/stripe-webhook-event.repository', () => ({
  stripeWebhookEventRepository: {
    claim: jest.fn(),
    markProcessed: jest.fn(),
    markFailed: jest.fn(),
  },
}));

const mockResponse = () => {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  } as unknown as Response;

  return res;
};

describe('stripe webhook controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    env.STRIPE_SECRET_KEY = 'sk_test_123';
    env.STRIPE_WEBHOOK_SECRET = 'whsec_123';
    jest.mocked(stripeWebhookEventRepository.claim).mockResolvedValue({
      shouldProcess: true,
      isDuplicate: false,
    });
    jest
      .mocked(stripeWebhookEventRepository.markProcessed)
      .mockResolvedValue(null);
    jest
      .mocked(stripeWebhookEventRepository.markFailed)
      .mockResolvedValue(null);
  });

  test('verifies signatures before marking checkout sessions paid', async () => {
    mockConstructEvent.mockReturnValue({
      id: 'evt_test_123',
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test_123',
          payment_status: 'paid',
          amount_total: 2400,
          currency: 'aud',
          metadata: {
            orderId: '507f1f77bcf86cd799439012',
          },
          client_reference_id: '507f1f77bcf86cd799439012',
        },
      },
    });

    const req = {
      body: Buffer.from('{}'),
      headers: {
        'stripe-signature': 'valid-signature',
      },
    } as unknown as Request;
    const res = mockResponse();
    const next = jest.fn() as NextFunction;

    await stripeWebhookHandler(req, res, next);

    expect(mockConstructEvent).toHaveBeenCalledWith(
      req.body,
      'valid-signature',
      'whsec_123',
    );
    expect(stripeWebhookEventRepository.claim).toHaveBeenCalledWith(
      'evt_test_123',
      'checkout.session.completed',
    );
    expect(markStripeCheckoutPaid).toHaveBeenCalledWith({
      id: 'cs_test_123',
      payment_status: 'paid',
      amount_total: 2400,
      currency: 'aud',
      metadata: {
        orderId: '507f1f77bcf86cd799439012',
      },
      client_reference_id: '507f1f77bcf86cd799439012',
    });
    expect(stripeWebhookEventRepository.markProcessed).toHaveBeenCalledWith(
      'evt_test_123',
      '507f1f77bcf86cd799439012',
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ received: true });
    expect(next).not.toHaveBeenCalled();
  });

  test('rejects invalid webhook signatures', async () => {
    mockConstructEvent.mockImplementation(() => {
      throw new Error('bad signature');
    });

    const req = {
      body: Buffer.from('{}'),
      headers: {
        'stripe-signature': 'invalid-signature',
      },
    } as unknown as Request;
    const res = mockResponse();
    const next = jest.fn() as NextFunction;

    await stripeWebhookHandler(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(ServiceError));
    expect(markStripeCheckoutPaid).not.toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  test('marks expired checkout sessions cancelled', async () => {
    mockConstructEvent.mockReturnValue({
      id: 'evt_test_123',
      type: 'checkout.session.expired',
      data: {
        object: {
          id: 'cs_test_123',
          metadata: {
            orderId: '507f1f77bcf86cd799439012',
          },
        },
      },
    });

    const req = {
      body: Buffer.from('{}'),
      headers: {
        'stripe-signature': 'valid-signature',
      },
    } as unknown as Request;
    const res = mockResponse();
    const next = jest.fn() as NextFunction;

    await stripeWebhookHandler(req, res, next);

    expect(markStripeCheckoutFailed).toHaveBeenCalledWith(
      'cs_test_123',
      'cancelled',
    );
    expect(stripeWebhookEventRepository.markProcessed).toHaveBeenCalledWith(
      'evt_test_123',
      '507f1f77bcf86cd799439012',
    );
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('marks failed payment intents failed by order id', async () => {
    mockConstructEvent.mockReturnValue({
      id: 'evt_test_123',
      type: 'payment_intent.payment_failed',
      data: {
        object: {
          metadata: {
            orderId: '507f1f77bcf86cd799439012',
          },
        },
      },
    });

    const req = {
      body: Buffer.from('{}'),
      headers: {
        'stripe-signature': 'valid-signature',
      },
    } as unknown as Request;
    const res = mockResponse();
    const next = jest.fn() as NextFunction;

    await stripeWebhookHandler(req, res, next);

    expect(markStripeOrderFailed).toHaveBeenCalledWith(
      '507f1f77bcf86cd799439012',
    );
    expect(stripeWebhookEventRepository.markProcessed).toHaveBeenCalledWith(
      'evt_test_123',
      '507f1f77bcf86cd799439012',
    );
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('skips duplicate webhook events after signature verification', async () => {
    jest.mocked(stripeWebhookEventRepository.claim).mockResolvedValue({
      shouldProcess: false,
      isDuplicate: true,
    });
    mockConstructEvent.mockReturnValue({
      id: 'evt_test_123',
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test_123',
        },
      },
    });

    const req = {
      body: Buffer.from('{}'),
      headers: {
        'stripe-signature': 'valid-signature',
      },
    } as unknown as Request;
    const res = mockResponse();
    const next = jest.fn() as NextFunction;

    await stripeWebhookHandler(req, res, next);

    expect(stripeWebhookEventRepository.claim).toHaveBeenCalledWith(
      'evt_test_123',
      'checkout.session.completed',
    );
    expect(markStripeCheckoutPaid).not.toHaveBeenCalled();
    expect(stripeWebhookEventRepository.markProcessed).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      received: true,
      duplicate: true,
    });
  });

  test('marks webhook events failed when order processing fails', async () => {
    const error = new Error('Order update failed');
    jest.mocked(markStripeCheckoutPaid).mockRejectedValue(error);
    mockConstructEvent.mockReturnValue({
      id: 'evt_test_123',
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test_123',
        },
      },
    });

    const req = {
      body: Buffer.from('{}'),
      headers: {
        'stripe-signature': 'valid-signature',
      },
    } as unknown as Request;
    const res = mockResponse();
    const next = jest.fn() as NextFunction;

    await stripeWebhookHandler(req, res, next);

    expect(stripeWebhookEventRepository.markFailed).toHaveBeenCalledWith(
      'evt_test_123',
      error,
    );
    expect(stripeWebhookEventRepository.markProcessed).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(error);
  });
});
