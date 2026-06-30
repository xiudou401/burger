import type { SortOrder } from 'mongoose';
import { MealModel, type Meal } from '../models/meal.model';

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
    return MealModel.find(query).sort(sort).skip(skip).limit(limit).lean();
  },

  count(query: MenuItemQuery) {
    return MealModel.countDocuments(query);
  },

  findByIds(ids: string[]) {
    return MealModel.find({
      _id: { $in: ids },
    }).lean();
  },

  create(
    data: Pick<
      Meal,
      | 'name'
      | 'description'
      | 'priceCents'
      | 'image'
      | 'category'
      | 'isAvailable'
      | 'isFeatured'
    >,
  ) {
    return MealModel.create(data);
  },

  updateById(
    menuItemId: string,
    data: Pick<
      Meal,
      | 'name'
      | 'description'
      | 'priceCents'
      | 'image'
      | 'category'
      | 'isAvailable'
      | 'isFeatured'
    >,
  ) {
    return MealModel.findByIdAndUpdate(menuItemId, data, {
      new: true,
      runValidators: true,
    }).exec();
  },

  deleteById(menuItemId: string) {
    return MealModel.findByIdAndDelete(menuItemId).exec();
  },
};
