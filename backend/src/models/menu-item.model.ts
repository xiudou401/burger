import { MenuModel } from './menu.model';
import { model, Schema } from 'mongoose';

export const MENU_ITEM_CATEGORIES = [
  'burger',
  'side',
  'drink',
  'dessert',
  'combo',
] as const;

export type MenuItemCategory = (typeof MENU_ITEM_CATEGORIES)[number];

export interface MenuItem {
  name: string;
  description?: string;
  priceCents: number;
  image?: string;
  category: MenuItemCategory;
  isAvailable: boolean;
  isFeatured: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const menuItemSchema = new Schema<MenuItem>(
  {
    name: { type: String, required: true },
    description: String,
    priceCents: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator: Number.isSafeInteger,
        message: 'Menu item priceCents must be an integer',
      },
    },
    image: String,
    category: {
      type: String,
      enum: MENU_ITEM_CATEGORIES,
      required: true,
      default: 'burger',
    },
    isAvailable: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
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
menuItemSchema.post(
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

export const MenuItemModel = model<MenuItem>(
  'MenuItem',
  menuItemSchema,
  'meals',
);
