export interface OrderItem {
  mealId: string;
  name: string;
  image?: string;
  price: number;
  quantity: number;
  subtotal: number;
}

export interface Order {
  id: string;
  items: OrderItem[];
  total: number;
  menuVersion: number;
  status: OrderStatus;
  payment?: {
    provider?: 'stripe';
    providerPaymentId?: string;
    status: PaymentStatus;
    amount: number;
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
