import { Document, model, Schema } from 'mongoose';

export interface MealDocument extends Document {
  name: string;
  description?: string; // 餐品描述（可选）
  price: number; // 价格（必填）
  image?: string;
}

const mealSchema = new Schema<MealDocument>({
  name: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true },
  image: String,
});

export default model<MealDocument>('Meal', mealSchema);
