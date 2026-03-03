import { Document, model, Schema } from 'mongoose';

export interface MealDocument extends Document {
  name: string;
  description?: string;
  price: number;
  image?: string;

  // ✅ timestamps
  createdAt: Date;
  updatedAt: Date;
}

const mealSchema = new Schema<MealDocument>(
  {
    name: { type: String, required: true },
    description: { type: String },
    price: { type: Number, required: true },
    image: String,
  },
  { timestamps: true },
);

export default model<MealDocument>('Meal', mealSchema);
