import { MenuModel } from '../models/menu.model';

export const menuRepository = {
  findMainVersion() {
    return MenuModel.findById('main').select('version').lean();
  },

  updateMainVersion(version: number) {
    return MenuModel.updateOne(
      { _id: 'main' },
      { $set: { version, updatedAt: new Date() } },
      { upsert: true },
    );
  },
};
