import { io, type Socket } from 'socket.io-client';
import { API_ORIGIN } from './api-base';
import { getAccessToken } from './auth-token';
import type { OrderStatus, PaymentStatus } from '../types/order';

export type AdminRealtimeOrderEventName =
  | 'order:created'
  | 'order:updated'
  | 'order:paid'
  | 'order:cancelled';

export interface OrderRealtimeEvent {
  orderId: string;
  status: OrderStatus;
  paymentStatus?: PaymentStatus;
  updatedAt: string;
}

export interface MenuUpdatedEvent {
  menuVersion: number;
}

interface MenuRealtimeHandlers {
  onMenuUpdated: (payload: MenuUpdatedEvent) => void;
  onConnected?: () => void;
  onDisconnected?: () => void;
}

interface AdminRealtimeHandlers {
  onOrderEvent?: (
    eventName: AdminRealtimeOrderEventName,
    payload: OrderRealtimeEvent,
  ) => void;
  onMenuUpdated?: (payload: MenuUpdatedEvent) => void;
}

const ORDER_EVENTS: AdminRealtimeOrderEventName[] = [
  'order:created',
  'order:updated',
  'order:paid',
  'order:cancelled',
];

const getRealtimeOrigin = () => API_ORIGIN || window.location.origin;

export const connectAdminRealtime = ({
  onOrderEvent,
  onMenuUpdated,
}: AdminRealtimeHandlers = {}): Socket | null => {
  const token = getAccessToken();

  if (!token) {
    return null;
  }

  const socket = io(getRealtimeOrigin(), {
    auth: { token, scope: 'admin' },
    transports: ['websocket'],
    withCredentials: true,
  });

  ORDER_EVENTS.forEach((eventName) => {
    socket.on(eventName, (payload: OrderRealtimeEvent) => {
      onOrderEvent?.(eventName, payload);
    });
  });

  socket.on('menu:updated', (payload: MenuUpdatedEvent) => {
    onMenuUpdated?.(payload);
  });

  return socket;
};

export const connectMenuRealtime = ({
  onMenuUpdated,
  onConnected,
  onDisconnected,
}: MenuRealtimeHandlers): Socket => {
  const socket = io(getRealtimeOrigin(), {
    transports: ['websocket'],
    withCredentials: true,
  });

  socket.on('menu:updated', onMenuUpdated);
  socket.on('connect', () => {
    onConnected?.();
  });
  socket.on('disconnect', () => {
    onDisconnected?.();
  });
  socket.on('connect_error', () => {
    onDisconnected?.();
  });

  return socket;
};
