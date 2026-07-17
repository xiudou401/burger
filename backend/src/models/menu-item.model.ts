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
  },
  { timestamps: true },
);

export const MenuItemModel = model<MenuItem>(
  'MenuItem',
  menuItemSchema,
  'meals',
);
