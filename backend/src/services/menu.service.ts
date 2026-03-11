// import Meal from '../model/meal.model';

// export const getMenuVersion = async (): Promise<string> => {
//   const latest = await Meal.findOne()
//     .sort({ updatedAt: -1 })
//     .select('updatedAt')
//     .lean();

//   if (!latest?.updatedAt) return '0';
//   return String(new Date(latest.updatedAt).getTime());
// };
import { MenuModel } from '../models/menu.model';

export const getMenuVersion = async (): Promise<number> => {
  const menuDoc = await MenuModel.findById('main').select('version').lean();

  return menuDoc?.version ?? 0;
};
