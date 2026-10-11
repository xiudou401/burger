const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '');

const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();

export const API_ORIGIN = configuredApiUrl
  ? trimTrailingSlash(configuredApiUrl)
  : '';

export const API_BASE = `${API_ORIGIN}/api`;
