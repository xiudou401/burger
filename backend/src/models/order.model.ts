import { model, Schema, Types } from 'mongoose';

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

export interface OrderItem {
  menuItemId: Types.ObjectId;
  nameAtPurchase: string;
  imageAtPurchase?: string;
  priceCentsAtPurchase: number;
  quantity: number;
  subtotalCents: number;
}

export interface Order {
  userId: Types.ObjectId;
  items: OrderItem[];
  totalCents: number;
  menuVersion: number;
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
}

const orderItemSchema = new Schema<OrderItem>(
  {
    menuItemId: {
      type: Schema.Types.ObjectId,
      ref: 'MenuItem',
      required: true,
    },
    nameAtPurchase: {
      type: String,
      required: true,
      trim: true,
    },
    imageAtPurchase: String,
    priceCentsAtPurchase: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator: Number.isSafeInteger,
        message: 'Order item priceCentsAtPurchase must be an integer',
      },
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    subtotalCents: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator: Number.isSafeInteger,
        message: 'Order item subtotalCents must be an integer',
      },
    },
  },
  { _id: false },
);

const orderSchema = new Schema<Order>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    items: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator: (items: OrderItem[]) => items.length > 0,
        message: 'Order must include at least one item',
      },
    },
    totalCents: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator: Number.isSafeInteger,
        message: 'Order totalCents must be an integer',
      },
    },
    menuVersion: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: [
        'pending_payment',
        'paid',
        'preparing',
        'ready',
        'completed',
        'cancelled',
      ],
      required: true,
      default: 'pending_payment',
    },
    payment: {
      provider: {
        type: String,
        enum: ['stripe'],
      },
      providerPaymentId: {
        type: String,
        trim: true,
        index: true,
      },
      status: {
        type: String,
        enum: [
          'unpaid',
          'requires_payment',
          'paid',
          'failed',
          'cancelled',
          'refunded',
        ],
        required: true,
        default: 'unpaid',
      },
      amountCents: {
        type: Number,
        required: true,
        min: 0,
        validate: {
          validator: Number.isSafeInteger,
          message: 'Payment amountCents must be an integer',
        },
      },
      currency: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        default: 'aud',
      },
      paidAt: Date,
    },
  },
  { timestamps: true, optimisticConcurrency: true },
);

orderSchema.index({ userId: 1, createdAt: -1 });

export const OrderModel = model<Order>('Order', orderSchema);
