import type { MenuItemPayload } from '../../api/menu-items';

export type AdminMenuForm = Omit<MenuItemPayload, 'priceCents'> & {
  price: string;
};

export type AdminMenuFormErrors = Partial<
  Record<'name' | 'price' | 'image', string>
>;

export const emptyMenuForm: AdminMenuForm = {
  name: '',
  description: '',
  price: '',
  image: '',
  category: 'burger',
  isAvailable: true,
};

export const menuItemToForm = (menuItem: {
  name: string;
  description?: string;
  priceCents: number;
  image?: string;
  category: MenuItemPayload['category'];
  isAvailable: boolean;
}): AdminMenuForm => ({
  name: menuItem.name,
  description: menuItem.description ?? '',
  price: (menuItem.priceCents / 100).toFixed(2),
  image: menuItem.image ?? '',
  category: menuItem.category,
  isAvailable: menuItem.isAvailable,
});

export const validateMenuItemForm = (
  form: AdminMenuForm,
): AdminMenuFormErrors => {
  const errors: AdminMenuFormErrors = {};
  const name = form.name.trim();

  if (!name) {
    errors.name = 'Name is required';
  }

  const price = Number(form.price);

  if (!Number.isFinite(price) || price <= 0) {
    errors.price = 'Price must be greater than 0';
  }

  const image = form.image.trim();

  if (image && !image.startsWith('/') && !/^https?:\/\/[^\s]+$/i.test(image)) {
    errors.image = 'Image must be a URL or app path';
  }

  return errors;
};

export const buildMenuItemPayload = (form: AdminMenuForm): MenuItemPayload => {
  const errors = validateMenuItemForm(form);
  const firstError = Object.values(errors)[0];

  if (firstError) {
    throw new Error(firstError);
  }

  const price = Number(form.price);

  return {
    name: form.name.trim(),
    description: form.description.trim(),
    priceCents: Math.round(price * 100),
    image: form.image.trim(),
    category: form.category,
    isAvailable: form.isAvailable,
  };
};
