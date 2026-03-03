import { MealModel } from '../model/meal.model';

interface CartStoredItem {
  id: string;
  quantity: number;
}

export const validateCart = async (items: CartStoredItem[]) => {
  // 1. 收集所有 meal id
  const ids = items.map((i) => i.id);

  // 2. 查数据库拿最新 meal
  const meals = await MealModel.find({ _id: { $in: ids } }).lean();

  // 3. 组装 CartMeal（最新价格 + 前端数量）
  const mealMap = new Map(meals.map((meal) => [meal._id.toString(), meal]));

  const result = items
    .map((item) => {
      const meal = mealMap.get(item.id);
      if (!meal) return null; // 商品已下架
      return {
        id: meal._id.toString(),
        name: meal.name,
        description: meal.description,
        price: meal.price, // ✅ 最新价格
        image: meal.image,
        quantity: item.quantity,
      };
    })
    .filter(Boolean);

  return result;
};
