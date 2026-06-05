import { NextFunction, Request, Response } from 'express';
import Stripe from 'stripe';
import { env } from '../config/env';
import { ServiceError } from '../errors/ServiceError';
import {
  markStripeCheckoutFailed,
  markStripeCheckoutPaid,
  markStripeOrderFailed,
} from '../services/order.service';

const getStripe = () => {
  if (!env.STRIPE_SECRET_KEY) {
    throw new ServiceError('Stripe is not configured', 503);
  }

  return new Stripe(env.STRIPE_SECRET_KEY);
};

export const stripeWebhookHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const signature = req.headers['stripe-signature'];

  if (!env.STRIPE_WEBHOOK_SECRET) {
    return next(new ServiceError('Stripe webhook secret is not configured', 503));
  }

  if (typeof signature !== 'string') {
    return next(new ServiceError('Missing Stripe signature', 400));
  }

  try {
    let event: {
      type: string;
      data: { object: any };
    };

    try {
      event = getStripe().webhooks.constructEvent(
        req.body,
        signature,
        env.STRIPE_WEBHOOK_SECRET,
      );
    } catch {
      throw new ServiceError('Invalid Stripe signature', 400);
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as { id: string };
      await markStripeCheckoutPaid(session.id);
    }

    if (event.type === 'checkout.session.expired') {
      const session = event.data.object as { id: string };
      await markStripeCheckoutFailed(session.id, 'cancelled');
    }

    if (event.type === 'checkout.session.async_payment_failed') {
      const session = event.data.object as { id: string };
      await markStripeCheckoutFailed(session.id, 'failed');
    }

    if (event.type === 'payment_intent.payment_failed') {
      const paymentIntent = event.data.object as {
        metadata?: Record<string, string>;
      };
      const orderId =
        typeof paymentIntent.metadata?.orderId === 'string'
          ? paymentIntent.metadata.orderId
          : undefined;

      if (orderId) {
        await markStripeOrderFailed(orderId);
      }
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    next(error);
  }
};
