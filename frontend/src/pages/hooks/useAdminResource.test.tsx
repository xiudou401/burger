import { act, render, screen } from '@testing-library/react';
import { useAdminResource } from './useAdminResource';

interface HarnessProps {
  load: (signal: AbortSignal) => Promise<string>;
}

const Harness = ({ load }: HarnessProps) => {
  const { data, error, isLoading, refresh } = useAdminResource({
    initialData: 'initial',
    load,
    errorMessage: 'Could not load resource',
  });

  return (
    <div>
      <p>data: {data}</p>
      <p>loading: {String(isLoading)}</p>
      {error && <p>error: {error}</p>}
      <button type="button" onClick={() => void refresh()}>
        Refresh
      </button>
    </div>
  );
};

describe('useAdminResource', () => {
  test('loads data on mount and refreshes on demand', async () => {
    const load = jest
      .fn<Promise<string>, [AbortSignal]>()
      .mockResolvedValueOnce('first')
      .mockResolvedValueOnce('second');

    render(<Harness load={load} />);

    expect(await screen.findByText('data: first')).toBeInTheDocument();

    await act(async () => {
      screen.getByRole('button', { name: 'Refresh' }).click();
    });

    expect(await screen.findByText('data: second')).toBeInTheDocument();
    expect(load).toHaveBeenCalledTimes(2);
  });

  test('ignores stale load results after a newer refresh starts', async () => {
    let resolveFirst!: (value: string) => void;
    let resolveSecond!: (value: string) => void;
    const firstLoad = new Promise<string>((resolve) => {
      resolveFirst = resolve;
    });
    const secondLoad = new Promise<string>((resolve) => {
      resolveSecond = resolve;
    });
    const load = jest
      .fn<Promise<string>, [AbortSignal]>()
      .mockReturnValueOnce(firstLoad)
      .mockReturnValueOnce(secondLoad);

    render(<Harness load={load} />);

    await act(async () => {
      screen.getByRole('button', { name: 'Refresh' }).click();
    });

    await act(async () => {
      resolveSecond('newer');
      await secondLoad;
    });

    expect(screen.getByText('data: newer')).toBeInTheDocument();

    await act(async () => {
      resolveFirst('older');
      await firstLoad;
    });

    expect(screen.getByText('data: newer')).toBeInTheDocument();
    expect(screen.queryByText('data: older')).not.toBeInTheDocument();
  });
});
