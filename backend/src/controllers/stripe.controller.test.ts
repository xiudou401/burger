import type { NextFunction, Request, Response } from 'express';
import { env } from '../config/env';
import { ServiceError } from '../errors/ServiceError';
import {
  markStripeCheckoutFailed,
  markStripeCheckoutPaid,
  markStripeOrderFailed,
} from '../services/order.service';
import { stripeWebhookHandler } from './stripe.controller';

const mockConstructEvent = jest.fn();

jest.mock('stripe', () =>
  jest.fn().mockImplementation(() => ({
    webhooks: {
      constructEvent: mockConstructEvent,
    },
  })),
);

jest.mock('../services/order.service', () => ({
  markStripeCheckoutFailed: jest.fn(),
  markStripeCheckoutPaid: jest.fn(),
  markStripeOrderFailed: jest.fn(),
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
  });

  test('verifies signatures before marking checkout sessions paid', async () => {
    mockConstructEvent.mockReturnValue({
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

    expect(mockConstructEvent).toHaveBeenCalledWith(
      req.body,
      'valid-signature',
      'whsec_123',
    );
    expect(markStripeCheckoutPaid).toHaveBeenCalledWith('cs_test_123');
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
      type: 'checkout.session.expired',
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

    expect(markStripeCheckoutFailed).toHaveBeenCalledWith(
      'cs_test_123',
      'cancelled',
    );
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('marks failed payment intents failed by order id', async () => {
    mockConstructEvent.mockReturnValue({
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
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
