import { getAdminOrderPaymentNotice } from './order';
import type { Order } from '../types/order';

const order: Order = {
  id: 'order-1',
  items: [],
  totalCents: 1200,
  menuVersion: 1,
  status: 'pending_payment',
  version: 0,
  createdAt: '2026-06-05T00:00:00Z',
  updatedAt: '2026-06-05T00:00:00Z',
  payment: { status: 'requires_payment', currency: 'aud' },
};

test('shows late Stripe payment review even without local paid status', () => {
  expect(
    getAdminOrderPaymentNotice({
      ...order,
      status: 'cancelled',
      payment: { status: 'cancelled', currency: 'aud', requiresReview: true },
    }),
  ).toMatch(/Stripe recorded a payment/);
});

test('distinguishes unverified Stripe payment from ordinary pending payment', () => {
  expect(
    getAdminOrderPaymentNotice({
      ...order,
      payment: {
        status: 'requires_payment',
        currency: 'aud',
        requiresReview: true,
        reviewReason: 'stripe_paid_charge_unverified',
      },
    }),
  ).toBe('Stripe reports payment - charge verification pending');
});

test('does not suggest a refund for an archived test payment', () => {
  expect(
    getAdminOrderPaymentNotice({
      ...order,
      status: 'cancelled',
      cancellationReason: 'archived_test_checkout',
      payment: { status: 'paid', currency: 'aud' },
    }),
  ).toMatch(/no real charge/);
});

test('flags an old pending order without a real Stripe Session but not a fresh order', () => {
  expect(
    getAdminOrderPaymentNotice(order, Date.parse('2026-06-05T00:15:00Z')),
  ).toMatch(/review payment/);
  expect(
    getAdminOrderPaymentNotice(order, Date.parse('2026-06-05T00:01:00Z')),
  ).toBeNull();
});
