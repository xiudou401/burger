import { MenuModel } from './menu.model';
import { model, Schema } from 'mongoose';

export interface Meal {
  name: string;
  description?: string;
  price: number;
  image?: string;
  createdAt: Date;
  updatedAt: Date;
}

const mealSchema = new Schema<Meal>(
  {
    name: { type: String, required: true },
    description: String,
    price: { type: Number, required: true },
    image: String,
  },
  { timestamps: true },
);

mealSchema.post(
  [
    'save',
    'updateOne',
    'updateMany',
    'findOneAndUpdate',
    'deleteOne',
    'findOneAndDelete',
  ],
  async () => {
    await updateMenuVersion();
  },
);

// 通用方法：更新Menu集合的版本号为当前时间戳
async function updateMenuVersion() {
  const newVersion = String(Date.now());
  // upsert: true 表示如果"main"这条记录不存在，就自动创建
  await MenuModel.updateOne(
    { _id: 'main' },
    { $set: { version: newVersion, updatedAt: new Date() } },
    { upsert: true },
  );
}

export const MealModel = model<Meal>('Meal', mealSchema);
