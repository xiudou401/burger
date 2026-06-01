import type { SortOrder } from 'mongoose';
import { MealModel, type Meal } from '../models/meal.model';

type MealQuery = Record<string, unknown>;

export const mealRepository = {
  findPage({
    query,
    sort,
    skip,
    limit,
  }: {
    query: MealQuery;
    sort: Record<string, SortOrder>;
    skip: number;
    limit: number;
  }) {
    return MealModel.find(query).sort(sort).skip(skip).limit(limit).lean();
  },

  count(query: MealQuery) {
    return MealModel.countDocuments(query);
  },

  findByIds(ids: string[]) {
    return MealModel.find({
      _id: { $in: ids },
    }).lean();
  },

  create(data: Pick<Meal, 'name' | 'description' | 'price' | 'image'>) {
    return MealModel.create(data);
  },

  updateById(
    mealId: string,
    data: Pick<Meal, 'name' | 'description' | 'price' | 'image'>,
  ) {
    return MealModel.findByIdAndUpdate(mealId, data, {
      new: true,
      runValidators: true,
    }).exec();
  },

  deleteById(mealId: string) {
    return MealModel.findByIdAndDelete(mealId).exec();
  },
};
