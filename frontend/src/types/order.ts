export interface OrderItem {
  menuItemId: string;
  name: string;
  image?: string;
  priceCents: number;
  quantity: number;
  subtotalCents: number;
}

export interface Order {
  id: string;
  items: OrderItem[];
  totalCents: number;
  menuVersion: number;
  status: OrderStatus;
  cancellationReason?: CancellationReason;
  cancelledAt?: string;
  version: number;
  payment?: {
    provider?: 'stripe';
    providerPaymentId?: string;
    status: PaymentStatus;
    amountCents: number;
    currency: string;
    paidAt?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export type OrderStatus =
  | 'pending_payment'
  | 'paid'
  | 'preparing'
  | 'ready'
  | 'completed'
  | 'cancelled';

export type CancellationReason =
  | 'payment_failed'
  | 'customer_abandoned_checkout'
  | 'staff_cancelled'
  | 'item_unavailable'
  | 'duplicate_order'
  | 'other';

export type PaymentStatus =
  | 'unpaid'
  | 'requires_payment'
  | 'paid'
  | 'failed'
  | 'cancelled'
  | 'refunded';
