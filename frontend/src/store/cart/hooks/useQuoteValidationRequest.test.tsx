import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { HTTP_STATUS } from '../../../api/http-status';
import { validateCart } from '../../../api/cart';
import { ApiError } from '../../../api/request';
import { useQuoteValidationRequest } from './useQuoteValidationRequest';

jest.mock('../../../api/cart', () => ({
  validateCart: jest.fn(),
}));

interface HarnessProps {
  menuVersion: number | null;
  itemsSig?: string;
  refreshMenuVersion?: (signal?: AbortSignal) => Promise<number>;
}

const Harness = ({
  menuVersion,
  itemsSig = 'meal-1:1',
  refreshMenuVersion = async () => 2,
}: HarnessProps) => {
  const { validateQuote } = useQuoteValidationRequest({
    items: [{ id: 'meal-1', quantity: 1 }],
    itemsSig,
    menuVersion,
    needsQuoteValidation: true,
    refreshMenuVersion,
    onQuoteValidated: () => {},
  });

  const validate = async () => {
    try {
      await validateQuote();
      document.body.dataset.quoteResult = 'resolved';
    } catch (error) {
      document.body.dataset.quoteResult =
        error instanceof Error ? error.message : 'rejected';
    }
  };

  return (
    <button type="button" onClick={() => void validate()}>
      Validate
    </button>
  );
};

afterEach(() => {
  delete document.body.dataset.quoteResult;
  jest.clearAllMocks();
});

test('rejects when the menu version is not available', async () => {
  render(<Harness menuVersion={null} />);

  fireEvent.click(screen.getByRole('button', { name: 'Validate' }));

  await waitFor(() => {
    expect(document.body.dataset.quoteResult).toBe(
      'The menu is still loading. Please try again.',
    );
  });
  expect(validateCart).not.toHaveBeenCalled();
});

test('refreshes and retries after a menu version conflict', async () => {
  const refreshMenuVersion = jest.fn().mockResolvedValue(2);

  jest
    .mocked(validateCart)
    .mockRejectedValueOnce(
      new ApiError(HTTP_STATUS.CONFLICT, { message: 'Menu updated' }),
    )
    .mockResolvedValueOnce({
      menuVersion: 2,
      items: [],
      totalCents: 0,
    });

  render(<Harness menuVersion={1} refreshMenuVersion={refreshMenuVersion} />);

  fireEvent.click(screen.getByRole('button', { name: 'Validate' }));

  await waitFor(() => {
    expect(document.body.dataset.quoteResult).toBe('resolved');
  });
  expect(refreshMenuVersion).toHaveBeenCalled();
  expect(validateCart).toHaveBeenNthCalledWith(
    1,
    [{ id: 'meal-1', quantity: 1 }],
    1,
    expect.any(AbortSignal),
  );
  expect(validateCart).toHaveBeenNthCalledWith(
    2,
    [{ id: 'meal-1', quantity: 1 }],
    2,
    expect.any(AbortSignal),
  );
});

test('does not treat a local cart change as a menu version conflict', async () => {
  let resolveValidation!: (value: {
    menuVersion: number;
    items: [];
    totalCents: number;
  }) => void;
  const validation = new Promise<{
    menuVersion: number;
    items: [];
    totalCents: number;
  }>((resolve) => {
    resolveValidation = resolve;
  });
  const refreshMenuVersion = jest.fn().mockResolvedValue(2);

  jest.mocked(validateCart).mockReturnValue(validation);

  const { rerender } = render(
    <Harness menuVersion={1} refreshMenuVersion={refreshMenuVersion} />,
  );

  fireEvent.click(screen.getByRole('button', { name: 'Validate' }));
  rerender(
    <Harness
      menuVersion={1}
      itemsSig="meal-1:2"
      refreshMenuVersion={refreshMenuVersion}
    />,
  );

  await act(async () => {
    resolveValidation({ menuVersion: 1, items: [], totalCents: 0 });
    await validation;
  });

  await waitFor(() => {
    expect(document.body.dataset.quoteResult).toBe(
      'Your cart changed. Please validate it again.',
    );
  });
  expect(refreshMenuVersion).not.toHaveBeenCalled();
});
