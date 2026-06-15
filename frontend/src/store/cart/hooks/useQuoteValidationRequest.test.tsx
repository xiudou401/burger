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
  onMenuVersionConflict?: () => void;
}

const Harness = ({
  menuVersion,
  itemsSig = 'meal-1:1',
  refreshMenuVersion = async () => 2,
  onMenuVersionConflict = () => {},
}: HarnessProps) => {
  const { ensureQuote } = useQuoteValidationRequest({
    items: [{ id: 'meal-1', quantity: 1 }],
    itemsSig,
    menuVersion,
    needsQuoteValidation: true,
    refreshMenuVersion,
    onQuoteValidated: () => {},
    onMenuVersionConflict,
  });

  const validate = async () => {
    try {
      await ensureQuote();
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

test('refreshes after a version conflict but rejects the current validation', async () => {
  const refreshMenuVersion = jest.fn().mockResolvedValue(2);
  const onMenuVersionConflict = jest.fn();

  jest
    .mocked(validateCart)
    .mockRejectedValue(
      new ApiError(HTTP_STATUS.CONFLICT, { message: 'Menu updated' }),
    );

  render(
    <Harness
      menuVersion={1}
      refreshMenuVersion={refreshMenuVersion}
      onMenuVersionConflict={onMenuVersionConflict}
    />,
  );

  fireEvent.click(screen.getByRole('button', { name: 'Validate' }));

  await waitFor(() => {
    expect(document.body.dataset.quoteResult).toBe(
      'The menu changed. Please validate your cart again.',
    );
  });
  expect(refreshMenuVersion).toHaveBeenCalled();
  expect(onMenuVersionConflict).toHaveBeenCalled();
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
  const onMenuVersionConflict = jest.fn();

  jest.mocked(validateCart).mockReturnValue(validation);

  const { rerender } = render(
    <Harness
      menuVersion={1}
      refreshMenuVersion={refreshMenuVersion}
      onMenuVersionConflict={onMenuVersionConflict}
    />,
  );

  fireEvent.click(screen.getByRole('button', { name: 'Validate' }));
  rerender(
    <Harness
      menuVersion={1}
      itemsSig="meal-1:2"
      refreshMenuVersion={refreshMenuVersion}
      onMenuVersionConflict={onMenuVersionConflict}
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
  expect(onMenuVersionConflict).not.toHaveBeenCalled();
});
