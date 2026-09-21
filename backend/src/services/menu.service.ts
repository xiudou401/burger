import { menuRepository } from '../repositories/menu.repository';
import { emitMenuUpdated } from './realtime.service';

export const getMenuVersion = async (): Promise<number> => {
  const menuDoc = await menuRepository.findMainVersion();

  return menuDoc?.version ?? 0;
};

export const bumpMenuVersion = async (): Promise<number> => {
  const menuVersion = await menuRepository.incrementMainVersion();

  emitMenuUpdated({ menuVersion });

  return menuVersion;
};
