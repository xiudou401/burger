import { model, Schema, Types } from 'mongoose';

export type OrderStatus =
  | 'paid'
  | 'preparing'
  | 'ready'
  | 'completed'
  | 'cancelled';

export interface OrderItem {
  mealId: Types.ObjectId;
  name: string;
  image?: string;
  price: number;
  quantity: number;
  subtotal: number;
}

export interface Order {
  userId: Types.ObjectId;
  items: OrderItem[];
  total: number;
  menuVersion: number;
  status: OrderStatus;
  createdAt: Date;
  updatedAt: Date;
}

const orderItemSchema = new Schema<OrderItem>(
  {
    mealId: {
      type: Schema.Types.ObjectId,
      ref: 'Meal',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    image: String,
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
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
    total: {
      type: Number,
      required: true,
      min: 0,
    },
    menuVersion: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['paid', 'preparing', 'ready', 'completed', 'cancelled'],
      required: true,
      default: 'paid',
    },
  },
  { timestamps: true },
);

orderSchema.index({ userId: 1, createdAt: -1 });

export const OrderModel = model<Order>('Order', orderSchema);
