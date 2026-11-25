export const createFallbackPolling = (
  task: (signal: AbortSignal) => unknown | Promise<unknown>,
  { intervalMs = 30_000, immediate = false } = {},
) => {
  let timer: number | undefined;
  let controller: AbortController | null = null;
  let active = false;
  let disposed = false;
  let generation = 0;

  const tick = async (run: number) => {
    if (!active || disposed || run !== generation) return;
    const currentController = new AbortController();
    controller = currentController;
    try {
      await task(currentController.signal);
    } catch {
      // Failed polls are retried on the next tick; callers own error display.
    } finally {
      if (controller === currentController) controller = null;
      if (active && !disposed && run === generation) {
        timer = window.setTimeout(() => void tick(run), intervalMs);
      }
    }
  };

  const stop = () => {
    active = false;
    generation += 1;
    window.clearTimeout(timer);
    timer = undefined;
    controller?.abort();
    controller = null;
  };

  return {
    start() {
      if (active || disposed) return;
      active = true;
      const run = ++generation;
      if (immediate) void tick(run);
      else timer = window.setTimeout(() => void tick(run), intervalMs);
    },
    stop,
    dispose() {
      disposed = true;
      stop();
    },
  };
};
