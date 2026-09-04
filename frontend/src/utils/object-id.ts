const OBJECT_ID_PATTERN = /^[0-9a-fA-F]{24}$/;

export const isObjectId = (value: string | null | undefined): value is string =>
  typeof value === 'string' && OBJECT_ID_PATTERN.test(value);

export const getObjectIdOrNull = (
  value: string | null | undefined,
): string | null => (isObjectId(value) ? value : null);
