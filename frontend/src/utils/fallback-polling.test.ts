import { createFallbackPolling } from './fallback-polling';

describe('createFallbackPolling', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('delays the first poll and ignores repeated starts', async () => {
    const task = vi.fn();
    const polling = createFallbackPolling(task);
    polling.start();
    polling.start();
    expect(task).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(30_000);
    expect(task).toHaveBeenCalledTimes(1);
    polling.dispose();
  });

  it('can poll immediately and waits for completion before scheduling again', async () => {
    let finish!: () => void;
    const task = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
    );
    const polling = createFallbackPolling(task, { immediate: true });
    polling.start();
    expect(task).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(60_000);
    expect(task).toHaveBeenCalledTimes(1);
    finish();
    await vi.advanceTimersByTimeAsync(30_000);
    expect(task).toHaveBeenCalledTimes(2);
    polling.dispose();
  });

  it('retries after failure and stops scheduling on dispose', async () => {
    const task = vi.fn().mockRejectedValue(new Error('Offline'));
    const polling = createFallbackPolling(task, { immediate: true });
    polling.start();
    await vi.advanceTimersByTimeAsync(30_000);
    expect(task).toHaveBeenCalledTimes(2);
    polling.dispose();
    polling.start();
    await vi.advanceTimersByTimeAsync(60_000);
    expect(task).toHaveBeenCalledTimes(2);
  });

  it('aborts a stopped poll and prevents its completion from scheduling an old loop', async () => {
    let finish!: () => void;
    const signals: AbortSignal[] = [];
    const task = vi.fn((signal: AbortSignal) => {
      signals.push(signal);
      return signals.length === 1
        ? new Promise<void>((resolve) => {
            finish = resolve;
          })
        : Promise.resolve();
    });
    const polling = createFallbackPolling(task, { immediate: true });
    polling.start();
    polling.stop();
    expect(signals[0].aborted).toBe(true);
    polling.start();
    finish();
    await vi.advanceTimersByTimeAsync(30_000);
    expect(task).toHaveBeenCalledTimes(3);
    polling.dispose();
  });

  it('keeps separate instances independent', async () => {
    const menu = vi.fn();
    const orders = vi.fn();
    const menuPolling = createFallbackPolling(menu);
    const ordersPolling = createFallbackPolling(orders);
    menuPolling.start();
    ordersPolling.start();
    menuPolling.stop();
    await vi.advanceTimersByTimeAsync(30_000);
    expect(menu).not.toHaveBeenCalled();
    expect(orders).toHaveBeenCalledTimes(1);
    ordersPolling.dispose();
  });
});
