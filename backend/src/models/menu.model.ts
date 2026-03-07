import { model, Schema } from 'mongoose';

export interface Menu {
  _id: string;
  version: string;
  updatedAt: Date;
}

const menuSchema = new Schema<Menu>(
  {
    _id: { type: String, required: true },
    version: { type: String, required: true },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: false },
);

export const MenuModel = model<Menu>('Menu', menuSchema);
