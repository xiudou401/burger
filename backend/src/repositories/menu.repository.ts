import { MenuModel } from '../models/menu.model';

export const menuRepository = {
  findMainVersion() {
    return MenuModel.findById('main').select('version').lean();
  },

  async incrementMainVersion() {
    const menu = await MenuModel.findOneAndUpdate(
      { _id: 'main' },
      {
        $inc: { version: 1 },
        $set: { updatedAt: new Date() },
        $setOnInsert: { _id: 'main' },
      },
      { new: true, upsert: true, projection: { version: 1 } },
    )
      .lean()
      .exec();

    return menu?.version ?? 0;
  },
};
