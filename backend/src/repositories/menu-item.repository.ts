import type { SortOrder } from 'mongoose';
import { MenuItemModel, type MenuItem } from '../models/menu-item.model';

type MenuItemQuery = Record<string, unknown>;

export const menuItemRepository = {
  findPage({
    query,
    sort,
    skip,
    limit,
  }: {
    query: MenuItemQuery;
    sort: Record<string, SortOrder>;
    skip: number;
    limit: number;
  }) {
    return MenuItemModel.find(query).sort(sort).skip(skip).limit(limit).lean();
  },

  count(query: MenuItemQuery) {
    return MenuItemModel.countDocuments(query);
  },

  findByIds(ids: string[]) {
    return MenuItemModel.find({
      _id: { $in: ids },
    }).lean();
  },

  create(
    data: Pick<
      MenuItem,
      | 'name'
      | 'description'
      | 'priceCents'
      | 'image'
      | 'category'
      | 'isAvailable'
      | 'isFeatured'
    >,
  ) {
    return MenuItemModel.create(data);
  },

  updateById(
    menuItemId: string,
    data: Pick<
      MenuItem,
      | 'name'
      | 'description'
      | 'priceCents'
      | 'image'
      | 'category'
      | 'isAvailable'
      | 'isFeatured'
    >,
  ) {
    return MenuItemModel.findByIdAndUpdate(menuItemId, data, {
      new: true,
      runValidators: true,
    }).exec();
  },

  deleteById(menuItemId: string) {
    return MenuItemModel.findByIdAndDelete(menuItemId).exec();
  },
};
