import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  createMeal,
  deleteMeal,
  fetchMeals,
  MealPayload,
  updateMeal,
} from '../../api/meals';
import type { Meal } from '../../types/meal';

const emptyForm: MealPayload = {
  name: '',
  description: '',
  priceCents: 0,
  image: '',
};

export const useAdminMenuPage = () => {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [form, setForm] = useState<MealPayload>(emptyForm);
  const [editingMealId, setEditingMealId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const isEditing = useMemo(() => !!editingMealId, [editingMealId]);

  const loadMeals = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetchMeals({ page: 1, limit: 100 });
      setMeals(res.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load menu');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMeals();
  }, []);

  const updateForm = (field: keyof MealPayload, value: string) => {
    setForm((current) => ({
      ...current,
      [field]: field === 'priceCents' ? Math.round(Number(value) * 100) : value,
    }));
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingMealId(null);
  };

  const editMeal = (meal: Meal) => {
    setEditingMealId(meal.id);
    setForm({
      name: meal.name,
      description: meal.description ?? '',
      priceCents: meal.priceCents,
      image: meal.image ?? '',
    });
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setMessage(null);

    try {
      const res = editingMealId
        ? await updateMeal(editingMealId, form)
        : await createMeal(form);

      setMeals((current) => {
        if (editingMealId) {
          return current.map((meal) =>
            meal.id === editingMealId ? res.meal : meal,
          );
        }

        return [res.meal, ...current];
      });

      setMessage(editingMealId ? 'Meal updated' : 'Meal added');
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save meal');
    } finally {
      setIsSubmitting(false);
    }
  };

  const removeMeal = async (mealId: string) => {
    setError(null);
    setMessage(null);

    try {
      await deleteMeal(mealId);
      setMeals((current) => current.filter((meal) => meal.id !== mealId));
      setMessage('Meal deleted');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete meal');
    }
  };

  return {
    meals,
    form,
    isEditing,
    isLoading,
    isSubmitting,
    error,
    message,
    updateForm,
    submit,
    editMeal,
    removeMeal,
    resetForm,
    refresh: loadMeals,
  };
};
