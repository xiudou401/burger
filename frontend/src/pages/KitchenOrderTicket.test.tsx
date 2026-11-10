import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { Order } from '../types/order';
import KitchenOrderTicket from './KitchenOrderTicket';

const now = new Date('2026-11-10T02:00:00Z').getTime();
const order: Order = {
  id: 'order-123456',
  status: 'ready',
  version: 1,
  items: [
    {
      menuItemId: 'meal-1',
      name: 'Classic Burger',
      quantity: 2,
      priceCents: 1200,
      subtotalCents: 2400,
    },
  ],
  totalCents: 2400,
  menuVersion: 1,
  createdAt: '2026-11-10T01:40:00Z',
  updatedAt: '2026-11-10T01:59:00Z',
};
const renderTicket = (overrides = {}) => {
  const props = {
    order,
    now,
    nextStatuses: ['completed'] as Array<'completed' | 'cancelled'>,
    isUpdating: false,
    isOnline: true,
    onAdvance: vi.fn(),
    onCancel: vi.fn(),
    ...overrides,
  };
  const view = render(
    <MemoryRouter>
      <KitchenOrderTicket {...props} />
    </MemoryRouter>,
  );
  return { props, ...view };
};

test('emphasizes age and fulfillment action without showing kitchen prices', () => {
  const { props } = renderTicket();
  expect(screen.getByText('20 min since ordered')).toBeInTheDocument();
  expect(screen.getByText('Long wait')).toBeInTheDocument();
  expect(screen.queryByText('$24.00')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Mark collected' }));
  expect(props.onAdvance).toHaveBeenCalledWith('completed');
});

test('only disables the ticket that is submitting or offline', () => {
  const { rerender, props } = renderTicket({ isUpdating: true });
  expect(screen.getByRole('button', { name: 'Updating...' })).toBeDisabled();
  rerender(
    <MemoryRouter>
      <KitchenOrderTicket {...props} isUpdating={false} isOnline={false} />
    </MemoryRouter>,
  );
  expect(screen.getByRole('button', { name: 'Mark collected' })).toBeDisabled();
});

test('keeps cancellation behind an accessible disclosure and closes on Escape', () => {
  const { props } = renderTicket({ nextStatuses: ['completed', 'cancelled'] });
  const options = screen.getByRole('button', {
    name: 'Options for order 123456',
  });
  expect(
    screen.queryByRole('button', { name: 'Cancel order' }),
  ).not.toBeInTheDocument();
  fireEvent.click(options);
  fireEvent.keyDown(options, { key: 'Escape' });
  expect(options).toHaveFocus();
  expect(
    screen.queryByRole('button', { name: 'Cancel order' }),
  ).not.toBeInTheDocument();
  fireEvent.click(options);
  fireEvent.click(screen.getByRole('button', { name: 'Cancel order' }));
  expect(props.onCancel).toHaveBeenCalledTimes(1);
});
