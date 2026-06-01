import { MenuModel } from '../models/menu.model';

export const menuRepository = {
  findMainVersion() {
    return MenuModel.findById('main').select('version').lean();
  },
};
