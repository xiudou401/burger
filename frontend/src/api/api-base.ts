const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '');

const configuredApiUrl = process.env.REACT_APP_API_URL?.trim();

export const API_ORIGIN = configuredApiUrl
  ? trimTrailingSlash(configuredApiUrl)
  : '';

export const API_BASE = `${API_ORIGIN}/api`;
