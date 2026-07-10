export interface OrderItem {
  menuItemId: string;
  nameAtPurchase: string;
  imageAtPurchase?: string;
  priceCentsAtPurchase: number;
  mealId: string;
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

export type PaymentStatus =
  | 'unpaid'
  | 'requires_payment'
  | 'paid'
  | 'failed'
  | 'cancelled'
  | 'refunded';
