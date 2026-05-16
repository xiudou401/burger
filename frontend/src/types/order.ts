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
  createdAt: string;
  updatedAt: string;
}

export type OrderStatus =
  | 'paid'
  | 'preparing'
  | 'ready'
  | 'completed'
  | 'cancelled';
