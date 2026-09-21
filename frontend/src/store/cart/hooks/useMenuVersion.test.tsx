import { act, fireEvent, render, screen } from '@testing-library/react';
import { fetchMenuVersion } from '../../../api/menu-version';
import { connectMenuRealtime } from '../../../api/realtime';
import { useMenuVersion } from './useMenuVersion';

jest.mock('../../../api/menu-version', () => ({
  fetchMenuVersion: jest.fn(),
}));

jest.mock('../../../api/realtime', () => ({
  connectMenuRealtime: jest.fn(),
}));

const disconnect = jest.fn();
const mockSocket = () =>
  ({ disconnect }) as unknown as ReturnType<typeof connectMenuRealtime>;

beforeEach(() => {
  disconnect.mockClear();
  jest.mocked(connectMenuRealtime).mockReturnValue(mockSocket());
});

const deferred = <T,>() => {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
};

const Harness = () => {
  const { menuVersion, refreshMenuVersion } = useMenuVersion();

  return (
    <>
      <span>{menuVersion ?? 'none'}</span>
      <button
        type="button"
        onClick={() => void refreshMenuVersion().catch(() => {})}
      >
        Refresh
      </button>
    </>
  );
};

test('does not let an older response overwrite a newer menu version', async () => {
  const olderRequest = deferred<number>();
  const newerRequest = deferred<number>();

  jest
    .mocked(fetchMenuVersion)
    .mockReturnValueOnce(olderRequest.promise)
    .mockReturnValueOnce(newerRequest.promise);

  render(<Harness />);
  fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));

  await act(async () => {
    newerRequest.resolve(12);
    await newerRequest.promise;
  });

  expect(screen.getByText('12')).toBeInTheDocument();

  await act(async () => {
    olderRequest.resolve(11);
    await olderRequest.promise;
  });

  expect(screen.getByText('12')).toBeInTheDocument();
});

test('keeps an earlier successful result when a later request fails', async () => {
  const earlierRequest = deferred<number>();
  const laterRequest = deferred<number>();

  jest
    .mocked(fetchMenuVersion)
    .mockReturnValueOnce(earlierRequest.promise)
    .mockReturnValueOnce(laterRequest.promise);

  render(<Harness />);
  fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));

  await act(async () => {
    laterRequest.reject(new Error('Network error'));

    try {
      await laterRequest.promise;
    } catch {
      // The manual refresh handles this failure.
    }
  });

  await act(async () => {
    earlierRequest.resolve(10);
    await earlierRequest.promise;
  });

  expect(screen.getByText('10')).toBeInTheDocument();
});

test('updates menu version from realtime menu events', async () => {
  const initialRequest = deferred<number>();
  let onMenuUpdated: Parameters<typeof connectMenuRealtime>[0] | null = null;

  jest.mocked(fetchMenuVersion).mockReturnValueOnce(initialRequest.promise);
  jest.mocked(connectMenuRealtime).mockImplementation((handler) => {
    onMenuUpdated = handler;
    return mockSocket();
  });

  render(<Harness />);

  act(() => {
    onMenuUpdated?.({ menuVersion: 15 });
  });

  expect(screen.getByText('15')).toBeInTheDocument();

  act(() => {
    onMenuUpdated?.({ menuVersion: 14 });
  });

  expect(screen.getByText('15')).toBeInTheDocument();
});
