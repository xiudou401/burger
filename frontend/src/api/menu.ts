// fetchMenuVersion 改造（加超时）
export const fetchMenuVersion = async (): Promise<string> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒超时

  try {
    const res = await fetch('/api/menuVersion', {
      signal: controller.signal,
    });
    if (!res.ok) throw new Error('Failed to fetch menu version');
    const data = await res.json();
    return data.menuVersion as string;
  } catch (err) {
    if ((err as Error).name === 'AbortError') {
      console.warn('Menu version request timed out');
    } else {
      console.error(err);
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
};
