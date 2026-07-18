type DateValue = string | number | Date;

const shortDateTimeFormatter = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

const mediumDateTimeFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
});

const toValidDate = (value: DateValue): Date | null => {
  const date = value instanceof Date ? value : new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
};

export const formatShortDateTime = (
  value: DateValue,
  fallback = '-',
): string => {
  const date = toValidDate(value);

  return date ? shortDateTimeFormatter.format(date) : fallback;
};

export const formatOptionalShortDateTime = (
  value: DateValue | null | undefined,
  fallback = '-',
): string => {
  if (value === null || value === undefined) {
    return fallback;
  }

  return formatShortDateTime(value, fallback);
};

export const formatMediumDateTime = (
  value: DateValue,
  fallback = '-',
): string => {
  const date = toValidDate(value);

  return date ? mediumDateTimeFormatter.format(date) : fallback;
};
