import { model, Schema, Types } from 'mongoose';

export const MENU_ITEM_CATEGORIES = [
  'burger',
  'side',
  'drink',
  'dessert',
  'combo',
] as const;

export type MenuItemCategory = (typeof MENU_ITEM_CATEGORIES)[number];
export type MenuItemServingSize = 'light' | 'regular' | 'filling' | 'share';

export interface MenuItem {
  name: string;
  description?: string;
  priceCents: number;
  image?: string;
  category: MenuItemCategory;
  isAvailable: boolean;
  tags: string[];
  dietary: string[];
  allergens: string[];
  spiceLevel: number;
  servingSize: MenuItemServingSize;
  pairingIds: Types.ObjectId[];
  comboItemIds: Types.ObjectId[];
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
    tags: {
      type: [String],
      default: [],
    },
    dietary: {
      type: [String],
      default: [],
    },
    allergens: {
      type: [String],
      default: [],
    },
    spiceLevel: {
      type: Number,
      min: 0,
      max: 3,
      default: 0,
    },
    servingSize: {
      type: String,
      enum: ['light', 'regular', 'filling', 'share'],
      default: 'regular',
    },
    pairingIds: {
      type: [Schema.Types.ObjectId],
      ref: 'MenuItem',
      default: [],
    },
    comboItemIds: {
      type: [Schema.Types.ObjectId],
      ref: 'MenuItem',
      default: [],
    },
  },
  { timestamps: true },
);

export const MenuItemModel = model<MenuItem>(
  'MenuItem',
  menuItemSchema,
  'meals',
);
