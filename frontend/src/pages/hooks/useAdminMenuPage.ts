import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  createMenuItem,
  deleteMenuItem,
  fetchMenuItems,
  MenuItemPayload,
  updateMenuItem,
} from '../../api/menu-items';
import type { MenuItem } from '../../types/menu-item';

const emptyForm: MenuItemPayload = {
  name: '',
  description: '',
  priceCents: 0,
  image: '',
  category: 'burger',
  isAvailable: true,
  isFeatured: false,
};

export const useAdminMenuPage = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [form, setForm] = useState<MenuItemPayload>(emptyForm);
  const [editingMenuItemId, setEditingMenuItemId] = useState<string | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const isEditing = useMemo(() => !!editingMenuItemId, [editingMenuItemId]);

  const loadMenuItems = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetchMenuItems({ page: 1, limit: 100 });
      setMenuItems(res.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load menu');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMenuItems();
  }, []);

  const updateForm = (
    field: keyof MenuItemPayload,
    value: string | boolean,
  ) => {
    setForm((current) => ({
      ...current,
      [field]: field === 'priceCents' ? Math.round(Number(value) * 100) : value,
    }));
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingMenuItemId(null);
  };

  const editMenuItem = (menuItem: MenuItem) => {
    setEditingMenuItemId(menuItem.id);
    setForm({
      name: menuItem.name,
      description: menuItem.description ?? '',
      priceCents: menuItem.priceCents,
      image: menuItem.image ?? '',
      category: menuItem.category,
      isAvailable: menuItem.isAvailable,
      isFeatured: menuItem.isFeatured,
    });
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setMessage(null);

    try {
      const res = editingMenuItemId
        ? await updateMenuItem(editingMenuItemId, form)
        : await createMenuItem(form);

      setMenuItems((current) => {
        if (editingMenuItemId) {
          return current.map((menuItem) =>
            menuItem.id === editingMenuItemId ? res.menuItem : menuItem,
          );
        }

        return [res.menuItem, ...current];
      });

      setMessage(editingMenuItemId ? 'Menu item updated' : 'Menu item added');
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save menu item');
    } finally {
      setIsSubmitting(false);
    }
  };

  const removeMenuItem = async (menuItemId: string) => {
    setError(null);
    setMessage(null);

    try {
      await deleteMenuItem(menuItemId);
      setMenuItems((current) =>
        current.filter((menuItem) => menuItem.id !== menuItemId),
      );
      setMessage('Menu item deleted');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not delete menu item',
      );
    }
  };

  return {
    menuItems,
    form,
    isEditing,
    isLoading,
    isSubmitting,
    error,
    message,
    updateForm,
    submit,
    editMenuItem,
    removeMenuItem,
    resetForm,
    refresh: loadMenuItems,
  };
};
