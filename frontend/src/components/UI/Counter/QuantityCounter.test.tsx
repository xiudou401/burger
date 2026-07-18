import { fireEvent, render, screen } from '@testing-library/react';
import QuantityCounter from './QuantityCounter';
import { useCartActions } from '../../../store/cart/hooks/useCartActions';
import { useCartSelector } from '../../../store/cart/hooks/useCartSelector';
import { MAX_CART_ITEM_QUANTITY } from '../../../store/cart/cart-logic';

jest.mock('../../../store/cart/hooks/useCartActions', () => ({
  useCartActions: jest.fn(),
}));

jest.mock('../../../store/cart/hooks/useCartSelector', () => ({
  useCartSelector: jest.fn(),
}));

describe('QuantityCounter', () => {
  const addItem = jest.fn();
  const removeItem = jest.fn();

  beforeEach(() => {
    jest.mocked(useCartActions).mockReturnValue({
      addItem,
      removeItem,
      deleteItem: jest.fn(),
      clearCart: jest.fn(),
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders only the increase button when quantity is zero', () => {
    jest.mocked(useCartSelector).mockReturnValue(0);

    render(<QuantityCounter id="meal-1" />);

    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(1);

    fireEvent.click(buttons[0]);

    expect(addItem).toHaveBeenCalledWith('meal-1');
    expect(removeItem).not.toHaveBeenCalled();
  });

  test('renders current quantity and supports increase/decrease actions', () => {
    jest.mocked(useCartSelector).mockReturnValue(2);

    render(<QuantityCounter id="meal-1" />);

    expect(screen.getByText('2')).toBeInTheDocument();

    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[0]);
    fireEvent.click(buttons[1]);

    expect(removeItem).toHaveBeenCalledWith('meal-1');
    expect(addItem).toHaveBeenCalledWith('meal-1');
  });

  test('disables increase when quantity reaches the maximum', () => {
    jest.mocked(useCartSelector).mockReturnValue(MAX_CART_ITEM_QUANTITY);

    render(<QuantityCounter id="meal-1" />);

    const buttons = screen.getAllByRole('button');
    const increaseButton = buttons[1];

    expect(increaseButton).toBeDisabled();

    fireEvent.click(increaseButton);

    expect(addItem).not.toHaveBeenCalled();
  });
});
