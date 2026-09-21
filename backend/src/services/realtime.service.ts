import type { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import { env } from '../config/env';
import type { PaymentStatus } from '../models/order.model';
import { userRepository } from '../repositories/user.repository';
import { getPermissionsForRole, hasPermission } from '../types/permissions';
import { verifyAuthToken } from '../utils/token';
import { appLogger } from '../utils/logger';
import type { PublicOrder } from './order.service';
import type { AnalyticsAlert } from './admin-alert.service';

const ADMIN_ROOM = 'admins';
const MENU_ROOM = 'menu-subscribers';

type OrderRealtimeEvent =
  | 'order:created'
  | 'order:updated'
  | 'order:paid'
  | 'order:cancelled';

interface OrderEventPayload {
  orderId: string;
  status: PublicOrder['status'];
  paymentStatus?: PaymentStatus;
  updatedAt: Date;
}

interface MenuUpdatedPayload {
  menuVersion: number;
}

let io: Server | null = null;

const getTokenFromHandshake = (socketAuth: unknown) => {
  if (!socketAuth || typeof socketAuth !== 'object') {
    return null;
  }

  const token = (socketAuth as { token?: unknown }).token;

  return typeof token === 'string' && token.trim() ? token : null;
};

const requiresAdminAccess = (socketAuth: unknown) => {
  if (!socketAuth || typeof socketAuth !== 'object') {
    return false;
  }

  return (socketAuth as { scope?: unknown }).scope === 'admin';
};

const requiresCustomerAccess = (socketAuth: unknown) => {
  if (!socketAuth || typeof socketAuth !== 'object') {
    return false;
  }

  return (socketAuth as { scope?: unknown }).scope === 'customer';
};

const getUserRoom = (userId: string) => `user:${userId}`;

export const initializeRealtimeServer = (server: HttpServer) => {
  io = new Server(server, {
    cors: {
      origin: env.TRUSTED_ORIGINS,
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    const isAdminSocket = requiresAdminAccess(socket.handshake.auth);
    const isCustomerSocket = requiresCustomerAccess(socket.handshake.auth);

    try {
      const token = getTokenFromHandshake(socket.handshake.auth);

      if (!token) {
        return isAdminSocket || isCustomerSocket
          ? next(new Error('Authorization token required'))
          : next();
      }

      const payload = await verifyAuthToken(token);
      const user = await userRepository.findLeanById(payload.sub);

      if (!user || user.status === 'disabled') {
        return next(new Error('Unauthorized'));
      }

      const socketUser = {
        id: user._id.toString(),
        role: user.role ?? 'customer',
        permissions: getPermissionsForRole(user.role ?? 'customer'),
      };

      if (isAdminSocket && !hasPermission(socketUser, 'view_orders')) {
        return next(new Error('Permission required'));
      }

      socket.data.user = socketUser;
      return next();
    } catch (error) {
      appLogger.warn('realtime_auth_failed', { error });
      return isAdminSocket || isCustomerSocket
        ? next(new Error('Unauthorized'))
        : next();
    }
  });

  io.on('connection', (socket) => {
    socket.join(MENU_ROOM);

    if (socket.data.user) {
      socket.join(getUserRoom(socket.data.user.id));
    }

    if (
      socket.data.user &&
      hasPermission(socket.data.user, 'view_orders') &&
      requiresAdminAccess(socket.handshake.auth)
    ) {
      socket.join(ADMIN_ROOM);
      appLogger.info('realtime_admin_connected', {
        socketId: socket.id,
        userId: socket.data.user.id,
      });
      return;
    }

    appLogger.info('realtime_menu_subscriber_connected', {
      socketId: socket.id,
    });
  });

  return io;
};

const toOrderPayload = (order: PublicOrder): OrderEventPayload => ({
  orderId: order.id,
  status: order.status,
  paymentStatus: order.payment?.status,
  updatedAt: order.updatedAt,
});

export const emitOrderEvent = (
  event: OrderRealtimeEvent,
  order: PublicOrder,
  userId?: string,
) => {
  if (!io) return;

  const payload = toOrderPayload(order);

  io.to(ADMIN_ROOM).emit(event, payload);

  if (userId) {
    io.to(getUserRoom(userId)).emit(event, payload);
  }
};

export const emitMenuUpdated = (payload: MenuUpdatedPayload) => {
  if (!io) return;

  io.to(MENU_ROOM).emit('menu:updated', payload);
};

export const emitAnalyticsAlert = (payload: AnalyticsAlert) => {
  if (!io) return;

  io.to(ADMIN_ROOM).emit('analytics:alert', payload);
};

export const disconnectRealtimeUser = (userId: string) => {
  if (!io) return;

  io.in(getUserRoom(userId)).disconnectSockets(true);
};
