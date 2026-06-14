import { act, fireEvent, render, screen } from '@testing-library/react';
import { fetchMenuVersion } from '../../../api/menu-version';
import { useMenuVersion } from './useMenuVersion';

jest.mock('../../../api/menu-version', () => ({
  fetchMenuVersion: jest.fn(),
}));

const deferred = <T,>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });

  return { promise, resolve };
};

const Harness = () => {
  const { menuVersion, refreshMenuVersion } = useMenuVersion();

  return (
    <>
      <span>{menuVersion ?? 'none'}</span>
      <button type="button" onClick={() => void refreshMenuVersion()}>
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
