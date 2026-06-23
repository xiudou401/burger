let inMemoryAccessToken: string | null = null;

export const getAccessToken = () => {
  return inMemoryAccessToken;
};

export const setAccessToken = (token: string | null) => {
  inMemoryAccessToken = token;
};

export const clearAccessToken = () => {
  inMemoryAccessToken = null;
};
