import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { validateCart } from '../../../api/cart';
import { ApiError } from '../../../api/request';
import { useQuoteValidationRequest } from './useQuoteValidationRequest';

jest.mock('../../../api/cart', () => ({
  validateCart: jest.fn(),
}));

interface HarnessProps {
  menuVersion: number | null;
  refreshMenuVersion?: (signal?: AbortSignal) => Promise<number>;
  onMenuVersionConflict?: () => void;
}

const Harness = ({
  menuVersion,
  refreshMenuVersion = async () => 2,
  onMenuVersionConflict = () => {},
}: HarnessProps) => {
  const { ensureQuote } = useQuoteValidationRequest({
    items: [{ id: 'meal-1', quantity: 1 }],
    itemsSig: 'meal-1:1',
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
    .mockRejectedValue(new ApiError(409, { message: 'Menu updated' }));

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
