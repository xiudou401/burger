import { menuRepository } from '../repositories/menu.repository';
import { emitMenuUpdated } from './realtime.service';
import mongoose, { type ClientSession } from 'mongoose';
import { appLogger } from '../utils/logger';

export const mutateMenu = async <T>(
  write: (session: ClientSession) => Promise<T>,
): Promise<T> => {
  const committed = await mongoose.connection.transaction(async (session) => {
    const result = await write(session);
    const menuVersion = await menuRepository.incrementMainVersion(session);
    return { result, menuVersion };
  });
  try {
    emitMenuUpdated({ menuVersion: committed.menuVersion });
  } catch (error) {
    appLogger.error('menu_update_notification_failed', { error });
  }
  return committed.result;
};

export const getMenuVersion = async (): Promise<number> => {
  const menuDoc = await menuRepository.findMainVersion();

  return menuDoc?.version ?? 0;
};

export const bumpMenuVersion = async (): Promise<number> => {
  const menuVersion = await menuRepository.incrementMainVersion();

  emitMenuUpdated({ menuVersion });

  return menuVersion;
};
