import type { OrderStatus, PaymentStatus } from '../models/order.model';
import type { PublicOrder } from './order.service';

export interface CheckoutOrder {
  order: PublicOrder;
  checkoutUrl: string;
}

export interface StripeCheckoutCompletedSession {
  id: string;
  payment_status?: string | null;
  amount_total?: number | null;
  currency?: string | null;
  metadata?: Record<string, string> | null;
  client_reference_id?: string | null;
}

export type CheckoutOrderDocument = {
  _id: unknown;
  userId: unknown;
  items: Array<{
    menuItemId?: unknown;
    nameAtPurchase?: string;
    imageAtPurchase?: string;
    priceCentsAtPurchase?: number;
    mealId?: unknown;
    name?: string;
    image?: string;
    priceCents?: number;
    quantity: number;
    subtotalCents: number;
  }>;
  totalCents: number;
  menuVersion: number;
  checkoutUrl?: string;
  status: OrderStatus;
  payment: {
    provider?: 'stripe';
    providerPaymentId?: string;
    status: PaymentStatus;
    amountCents: number;
    currency: string;
    paidAt?: Date;
  };
  __v?: number;
  createdAt: Date;
  updatedAt: Date;
  save: () => Promise<unknown>;
};
