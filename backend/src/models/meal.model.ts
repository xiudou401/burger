import { MenuModel } from './menu.model';
import { model, Schema } from 'mongoose';

export interface Meal {
  name: string;
  description?: string;
  priceCents: number;
  image?: string;
  createdAt: Date;
  updatedAt: Date;
}

const mealSchema = new Schema<Meal>(
  {
    name: { type: String, required: true },
    description: String,
    priceCents: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator: Number.isSafeInteger,
        message: 'Meal priceCents must be an integer',
      },
    },
    image: String,
  },
  { timestamps: true },
);

// let versionUpdateTimer: NodeJS.Timeout | null = null;

// function scheduleMenuVersionUpdate() {
//   if (versionUpdateTimer) return;

//   versionUpdateTimer = setTimeout(async () => {
//     try {
//       await updateMenuVersion();
//     } catch (err) {
//       console.error('updateMenuVersion failed', err);
//     } finally {
//       versionUpdateTimer = null;
//     }
//   }, 50);

// }

let versionUpdatePromise: Promise<void> | null = null;

function scheduleMenuVersionUpdate() {
  if (versionUpdatePromise) return;

  versionUpdatePromise = (async () => {
    try {
      await updateMenuVersion();
    } catch (err) {
      console.error('updateMenuVersion failed', err);
    } finally {
      versionUpdatePromise = null;
    }
  })();
}
mealSchema.post(
  [
    'save',
    'updateOne',
    'updateMany',
    'findOneAndUpdate',
    'deleteOne',
    'findOneAndDelete',
    'deleteMany',
  ],
  scheduleMenuVersionUpdate,
);

async function updateMenuVersion() {
  const newVersion = Date.now();
  await MenuModel.updateOne(
    { _id: 'main' },
    { $set: { version: newVersion, updatedAt: new Date() } },
    { upsert: true },
  );
}

export const MealModel = model<Meal>('Meal', mealSchema);
