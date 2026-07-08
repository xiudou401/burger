import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  createMenuItem,
  deleteMenuItem,
  fetchMenuItems,
  updateMenuItem,
} from '../../api/menu-items';
import type { MenuItem } from '../../types/menu-item';
import {
  buildMenuItemPayload,
  emptyMenuForm,
  menuItemToForm,
  type AdminMenuForm,
} from './admin-menu-form';

export const useAdminMenuPage = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [form, setForm] = useState<AdminMenuForm>(emptyMenuForm);
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

  const updateForm = (field: keyof AdminMenuForm, value: string | boolean) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const resetForm = () => {
    setForm(emptyMenuForm);
    setEditingMenuItemId(null);
  };

  const editMenuItem = (menuItem: MenuItem) => {
    setEditingMenuItemId(menuItem.id);
    setForm(menuItemToForm(menuItem));
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);

    let payload;

    try {
      payload = buildMenuItemPayload(form);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid menu item');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = editingMenuItemId
        ? await updateMenuItem(editingMenuItemId, payload)
        : await createMenuItem(payload);

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
