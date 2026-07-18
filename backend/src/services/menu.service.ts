import { menuRepository } from '../repositories/menu.repository';

export const getMenuVersion = async (): Promise<number> => {
  const menuDoc = await menuRepository.findMainVersion();

  return menuDoc?.version ?? 0;
};

export const bumpMenuVersion = async (): Promise<number> => {
  return menuRepository.incrementMainVersion();
};
