import { formatMediumDateTime } from './date';

const timeFormatter = new Intl.DateTimeFormat(undefined, {
  timeStyle: 'short',
});
const dayFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
});

export const orderDayKey = (value: string | number | Date): string | null => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

export const formatKitchenPlacedAt = (value: string, now: number): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Order time unavailable';
  return orderDayKey(date) === orderDayKey(now)
    ? timeFormatter.format(date)
    : formatMediumDateTime(date);
};

export const formatOrderDay = (value: string, now: number): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Date unavailable';
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const relative =
    orderDayKey(value) === orderDayKey(now)
      ? 'Today'
      : orderDayKey(value) === orderDayKey(yesterday)
        ? 'Yesterday'
        : '';
  return `${relative ? `${relative} - ` : ''}${dayFormatter.format(date)}`;
};

export const orderDateRange = (from: string, through: string) => {
  const start = from ? new Date(`${from}T00:00:00`) : null;
  const end = through ? new Date(`${through}T00:00:00`) : null;
  if (
    (start && orderDayKey(start) !== from) ||
    (end && orderDayKey(end) !== through)
  )
    throw new Error('Choose valid order dates.');
  if (start && end && start > end)
    throw new Error('The end date must be on or after the start date.');
  if (end) end.setDate(end.getDate() + 1);
  return { from: start?.toISOString(), to: end?.toISOString() };
};
