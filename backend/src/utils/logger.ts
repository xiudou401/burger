type LogLevel = 'info' | 'warn' | 'error';

type LogFields = Record<string, unknown>;

const normalizeValue = (value: unknown): unknown => {
  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: value.stack,
    };
  }

  return value;
};

const writeLog = (level: LogLevel, event: string, fields: LogFields = {}) => {
  const payload = Object.fromEntries(
    Object.entries(fields).map(([key, value]) => [key, normalizeValue(value)]),
  );

  const line = JSON.stringify({
    level,
    event,
    ...payload,
  });

  if (level === 'error') {
    console.error(line);
    return;
  }

  if (level === 'warn') {
    console.warn(line);
    return;
  }

  console.log(line);
};

export const appLogger = {
  info: (event: string, fields?: LogFields) => writeLog('info', event, fields),
  warn: (event: string, fields?: LogFields) => writeLog('warn', event, fields),
  error: (event: string, fields?: LogFields) =>
    writeLog('error', event, fields),
};
