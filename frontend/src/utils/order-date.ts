import { TZDate } from '@date-fns/tz';

export const ORDER_TIME_ZONE = 'Australia/Sydney';

const timeFormatter = new Intl.DateTimeFormat(undefined, {
  timeZone: ORDER_TIME_ZONE,
  timeStyle: 'short',
});
const dayFormatter = new Intl.DateTimeFormat(undefined, {
  timeZone: ORDER_TIME_ZONE,
  dateStyle: 'medium',
});

const dateTimeFormatter = new Intl.DateTimeFormat(undefined, {
  timeZone: ORDER_TIME_ZONE,
  dateStyle: 'medium',
  timeStyle: 'short',
});

export const formatOrderDateTime = (
  value: string | number | Date,
  fallback = '-',
) => {
  const date = new Date(value instanceof Date ? value.getTime() : value);
  return Number.isNaN(date.getTime())
    ? fallback
    : dateTimeFormatter.format(date);
};

export const orderDayKey = (value: string | number | Date): string | null => {
  const date = new TZDate(
    value instanceof Date ? value.getTime() : new Date(value).getTime(),
    ORDER_TIME_ZONE,
  );
  if (Number.isNaN(date.getTime())) return null;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

export const formatKitchenPlacedAt = (value: string, now: number): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Order time unavailable';
  return orderDayKey(date) === orderDayKey(now)
    ? timeFormatter.format(date)
    : formatOrderDateTime(date);
};

export const formatOrderDay = (value: string, now: number): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Date unavailable';
  const yesterday = new TZDate(now, ORDER_TIME_ZONE);
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
  const midnight = (value: string) => {
    if (!value) return null;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value))
      throw new Error('Choose valid order dates.');
    const [year, month, day] = value.split('-').map(Number);
    return new TZDate(year, month - 1, day, ORDER_TIME_ZONE);
  };
  const start = midnight(from);
  const end = midnight(through);
  if (
    (start && orderDayKey(start) !== from) ||
    (end && orderDayKey(end) !== through)
  )
    throw new Error('Choose valid order dates.');
  if (start && end && start > end)
    throw new Error('The end date must be on or after the start date.');
  if (end) end.setDate(end.getDate() + 1);
  return {
    from: start ? new Date(start.getTime()).toISOString() : undefined,
    to: end ? new Date(end.getTime()).toISOString() : undefined,
  };
};
