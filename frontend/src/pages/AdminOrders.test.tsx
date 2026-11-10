import type { ReactNode } from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { useAdminOrdersPage } from './hooks/useAdminOrdersPage';
import type { Order, OrderStatus } from '../types/order';
import AdminOrders from './AdminOrders';

vi.mock('./hooks/useAdminOrdersPage', () => ({ useAdminOrdersPage: vi.fn() }));
vi.mock('../components/Admin/AdminLayout', () => ({
  default: ({
    children,
    action,
  }: {
    children: ReactNode;
    action?: ReactNode;
  }) => (
    <main>
      {action}
      {children}
    </main>
  ),
}));

const makeOrder = (status: OrderStatus): Order => ({
  id: status,
  status,
  items: [
    {
      menuItemId: status,
      name: `${status} meal`,
      quantity: 1,
      priceCents: 1200,
      subtotalCents: 1200,
    },
  ],
  totalCents: 1200,
  menuVersion: 1,
  version: 0,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
});

const renderOrders = (
  orders: Order[],
  allowCancellation = false,
  initialEntry = '/admin/orders',
) => {
  vi.mocked(useAdminOrdersPage).mockReturnValue({
    orders,
    isLoading: false,
    isLoadingMore: false,
    error: null,
    hasUpdates: false,
    updatingOrderIds: [],
    connectionStatus: 'live',
    isOnline: true,
    hasMoreOrders: false,
    nextStatuses: {
      pending_payment: [],
      confirmed: allowCancellation ? ['preparing', 'cancelled'] : [],
      preparing: [],
      ready: [],
      completed: [],
      cancelled: [],
    },
    refresh: vi.fn(),
    loadMore: vi.fn(),
    changeStatus: vi.fn(),
  });
  render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <AdminOrders />
    </MemoryRouter>,
  );
};

test('restores the history view and applied dates from the URL', () => {
  renderOrders(
    [makeOrder('completed')],
    false,
    '/admin/orders?view=past&from=2026-01-01&through=2026-01-02',
  );
  expect(screen.getByRole('tab', { name: 'Past orders' })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  expect(screen.getByLabelText('From date')).toHaveValue('2026-01-01');
  expect(screen.getByLabelText('To date')).toHaveValue('2026-01-02');
  expect(useAdminOrdersPage).toHaveBeenLastCalledWith('past', {
    from: '2025-12-31T13:00:00.000Z',
    to: '2026-01-02T13:00:00.000Z',
  });
});

test('separates awaiting payment and past orders from the kitchen lanes', () => {
  renderOrders(
    [
      'pending_payment',
      'confirmed',
      'preparing',
      'ready',
      'completed',
      'cancelled',
    ].map((status) => makeOrder(status as OrderStatus)),
  );
  expect(screen.getByRole('tab', { name: 'Kitchen' })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  expect(screen.queryByText('pending_payment meal')).not.toBeInTheDocument();
  expect(screen.queryByText('completed meal')).not.toBeInTheDocument();
  for (const [title, status] of [
    ['New', 'confirmed'],
    ['Preparing', 'preparing'],
    ['Ready', 'ready'],
  ]) {
    const lane = screen
      .getByRole('heading', { name: title })
      .closest('section')!;
    expect(within(lane).getByText(`${status} meal`)).toBeInTheDocument();
  }
  fireEvent.click(screen.getByRole('tab', { name: 'Awaiting payment' }));
  const awaiting = screen
    .getByRole('heading', { name: 'Awaiting payment' })
    .closest('section')!;
  expect(
    within(awaiting).getByText('pending_payment meal'),
  ).toBeInTheDocument();
  expect(
    within(awaiting).queryByText('completed meal'),
  ).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('tab', { name: 'Past orders' }));
  const past = screen
    .getByRole('heading', { name: 'Past orders' })
    .closest('section')!;
  expect(within(past).getByText('completed meal')).toBeInTheDocument();
  expect(within(past).getByText('cancelled meal')).toBeInTheDocument();
  expect(
    within(past).queryByText('pending_payment meal'),
  ).not.toBeInTheDocument();
  expect(screen.queryByText('confirmed meal')).not.toBeInTheDocument();
  expect(
    screen.queryByRole('heading', { name: 'Recent orders' }),
  ).not.toBeInTheDocument();
});

test('supports keyboard switching and shows empty views', () => {
  renderOrders([makeOrder('confirmed')]);
  expect(
    screen.queryByRole('heading', { name: 'Awaiting payment' }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole('heading', { name: 'Past orders' }),
  ).not.toBeInTheDocument();
  fireEvent.keyDown(screen.getByRole('tab', { name: 'Kitchen' }), {
    key: 'ArrowRight',
  });
  expect(screen.getByRole('tab', { name: 'Past orders' })).toHaveFocus();
  expect(screen.getByText('No orders in this view.')).toBeInTheDocument();
});

test('groups historical orders by placement date and applies or clears a date range', () => {
  renderOrders([makeOrder('completed'), makeOrder('cancelled')]);
  fireEvent.click(screen.getByRole('tab', { name: 'Past orders' }));
  expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(1);
  expect(screen.getAllByText(/2026/).length).toBeGreaterThan(0);
  fireEvent.change(screen.getByLabelText('From date'), {
    target: { value: '2026-01-01' },
  });
  fireEvent.change(screen.getByLabelText('To date'), {
    target: { value: '2026-01-02' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Apply dates' }));
  expect(useAdminOrdersPage).toHaveBeenLastCalledWith('past', {
    from: '2025-12-31T13:00:00.000Z',
    to: '2026-01-02T13:00:00.000Z',
  });
  fireEvent.click(screen.getByRole('button', { name: 'All dates' }));
  expect(useAdminOrdersPage).toHaveBeenLastCalledWith('past', {});
});

test('confirms paid order cancellation and submits the selected reason', () => {
  const portal = document.createElement('div');
  portal.id = 'backdrop-root';
  document.body.appendChild(portal);
  renderOrders(
    [
      {
        ...makeOrder('confirmed'),
        payment: { status: 'paid', currency: 'aud' },
      },
    ],
    true,
  );
  const state = vi.mocked(useAdminOrdersPage).mock.results.at(-1)!.value;
  expect(
    screen.queryByRole('button', { name: 'Cancel order' }),
  ).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /Options for order/ }));
  fireEvent.click(screen.getByRole('button', { name: 'Cancel order' }));
  expect(state.changeStatus).not.toHaveBeenCalled();
  expect(
    screen.getByText(
      'This order is paid. Arrange any refund separately in Stripe.',
    ),
  ).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('Cancellation reason'), {
    target: { value: 'item_unavailable' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Confirm cancellation' }));
  expect(state.changeStatus).toHaveBeenCalledWith(
    'confirmed',
    'cancelled',
    0,
    'item_unavailable',
  );
  portal.remove();
});
