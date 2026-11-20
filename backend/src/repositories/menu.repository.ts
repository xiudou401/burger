import { MenuModel } from '../models/menu.model';
import type { ClientSession } from 'mongoose';

export const menuRepository = {
  findMainVersion(session?: ClientSession) {
    const query = MenuModel.findById('main');
    if (session) query.session(session);
    return query.select('version').lean();
  },

  async incrementMainVersion(session?: ClientSession) {
    const menu = await MenuModel.findOneAndUpdate(
      { _id: 'main' },
      {
        $inc: { version: 1 },
        $set: { updatedAt: new Date() },
        $setOnInsert: { _id: 'main' },
      },
      {
        returnDocument: 'after',
        upsert: true,
        projection: { version: 1 },
        session,
      },
    )
      .lean()
      .exec();

    return menu?.version ?? 0;
  },
};
