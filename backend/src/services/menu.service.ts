import { MenuModel } from '../models/menu.model';

export const getMenuVersion = async (): Promise<number> => {
  const menuDoc = await MenuModel.findById('main').select('version').lean();

  return menuDoc?.version ?? 0;
};
