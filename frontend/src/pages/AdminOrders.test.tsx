import type { ReactNode } from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { useAdminOrdersPage } from './hooks/useAdminOrdersPage';
import type { Order, OrderStatus } from '../types/order';
import AdminOrders from './AdminOrders';
import { orderDateRange, orderDayKey } from '../utils/order-date';

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

test('searches all statuses by order number and clears back to the original view', () => {
  renderOrders([
    makeOrder('confirmed'),
    makeOrder('cancelled'),
    makeOrder('pending_payment'),
  ]);
  expect(screen.getByLabelText('Order number')).not.toBeVisible();
  fireEvent.click(screen.getByRole('button', { name: 'Open order search' }));
  fireEvent.change(screen.getByLabelText('Order number'), {
    target: { value: '#2A094D' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Search orders' }));
  expect(useAdminOrdersPage).toHaveBeenLastCalledWith('all', {
    search: '2a094d',
  });
  const results = screen.getByRole('region', { name: 'Order search results' });
  expect(within(results).getByText('confirmed meal')).toBeInTheDocument();
  expect(within(results).getByText('cancelled meal')).toBeInTheDocument();
  expect(within(results).getByText('pending_payment meal')).toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: 'Start preparing' }),
  ).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Clear order search' }));
  expect(useAdminOrdersPage).toHaveBeenLastCalledWith('kitchen', {});
});

test('rejects invalid order searches before sending them to the backend', () => {
  renderOrders([]);
  fireEvent.click(screen.getByRole('button', { name: 'Open order search' }));
  fireEvent.change(screen.getByLabelText('Order number'), {
    target: { value: '.*' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Search orders' }));
  expect(screen.getByRole('alert')).toHaveTextContent('Enter a 6-character');
  expect(useAdminOrdersPage).toHaveBeenLastCalledWith('kitchen', {});
});

test('restores the history view and applied dates from the URL', () => {
  renderOrders(
    [makeOrder('completed')],
    false,
    '/admin/orders?view=past&from=2026-01-01&through=2026-01-02',
  );
  expect(screen.getByRole('tab', { name: 'Order history' })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  expect(screen.getByLabelText('From date')).toHaveValue('2026-01-01');
  expect(screen.getByLabelText('To date')).toHaveValue('2026-01-02');
  expect(useAdminOrdersPage).toHaveBeenLastCalledWith('completed', {
    from: '2025-12-31T13:00:00.000Z',
    to: '2026-01-02T13:00:00.000Z',
  });
});

test('defaults history to today in Sydney with collapsed date controls', () => {
  const clock = vi
    .spyOn(Date, 'now')
    .mockReturnValue(Date.parse('2026-11-10T13:30:00Z'));
  try {
    renderOrders([], false, '/admin/orders?view=past');
    expect(useAdminOrdersPage).toHaveBeenLastCalledWith('completed', {
      from: '2026-11-10T13:00:00.000Z',
      to: '2026-11-11T13:00:00.000Z',
    });
    expect(
      screen.getByText('Today', { selector: 'summary' }).closest('details'),
    ).not.toHaveAttribute('open');
    expect(
      screen.getByRole('button', { name: 'Apply dates' }),
    ).not.toBeVisible();
  } finally {
    clock.mockRestore();
  }
});

test('keeps order-number search independent of history dates', () => {
  renderOrders(
    [],
    false,
    '/admin/orders?view=past&from=2026-01-01&through=2026-01-02&search=abcdef',
  );
  expect(useAdminOrdersPage).toHaveBeenLastCalledWith('all', {
    search: 'abcdef',
  });
  fireEvent.click(screen.getByRole('button', { name: 'Clear order search' }));
  expect(useAdminOrdersPage).toHaveBeenLastCalledWith('completed', {
    from: '2025-12-31T13:00:00.000Z',
    to: '2026-01-02T13:00:00.000Z',
  });
});

test('invalid history URL dates fall back to today rather than all dates', () => {
  renderOrders(
    [],
    false,
    '/admin/orders?view=past&from=invalid&through=invalid',
  );
  const today = orderDayKey(Date.now())!;
  expect(useAdminOrdersPage).toHaveBeenLastCalledWith(
    'completed',
    orderDateRange(today, today),
  );
});

test('opens legacy awaiting-payment links as a history filter with preserved dates', () => {
  renderOrders(
    [makeOrder('pending_payment')],
    false,
    '/admin/orders?view=awaiting_payment&from=2026-01-01&through=2026-01-02',
  );
  expect(screen.getByRole('tab', { name: 'Order history' })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  expect(screen.getByLabelText('Order status')).toHaveValue('pending_payment');
  expect(useAdminOrdersPage).toHaveBeenLastCalledWith('awaiting_payment', {
    from: '2025-12-31T13:00:00.000Z',
    to: '2026-01-02T13:00:00.000Z',
  });
  fireEvent.change(screen.getByLabelText('Order status'), {
    target: { value: 'completed' },
  });
  expect(useAdminOrdersPage).toHaveBeenLastCalledWith('completed', {
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
  expect(
    screen.queryByRole('tab', { name: 'Awaiting payment' }),
  ).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('tab', { name: 'Order history' }));
  fireEvent.change(screen.getByLabelText('Order status'), {
    target: { value: 'pending_payment' },
  });
  const awaiting = screen.getByRole('region', {
    name: 'Order history results',
  });
  expect(
    within(awaiting).getByText('pending_payment meal'),
  ).toBeInTheDocument();
  expect(
    within(awaiting).queryByText('completed meal'),
  ).not.toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('Order status'), {
    target: { value: 'completed' },
  });
  const past = screen.getByRole('region', { name: 'Order history results' });
  expect(within(past).getByText('completed meal')).toBeInTheDocument();
  expect(within(past).queryByText('cancelled meal')).not.toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('Order status'), {
    target: { value: 'cancelled' },
  });
  expect(within(past).getByText('cancelled meal')).toBeInTheDocument();
  expect(within(past).queryByText('completed meal')).not.toBeInTheDocument();
  expect(useAdminOrdersPage).toHaveBeenLastCalledWith(
    'cancelled',
    expect.objectContaining({
      from: expect.any(String),
      to: expect.any(String),
    }),
  );
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
    screen.queryByRole('heading', { name: 'Order history' }),
  ).not.toBeInTheDocument();
  fireEvent.keyDown(screen.getByRole('tab', { name: 'Kitchen' }), {
    key: 'ArrowRight',
  });
  expect(screen.getByRole('tab', { name: 'Order history' })).toHaveFocus();
  expect(
    screen.getByText('No orders match the selected dates.'),
  ).toBeInTheDocument();
});

test('groups historical orders by placement date and applies or clears a date range', () => {
  renderOrders([makeOrder('completed'), makeOrder('cancelled')]);
  fireEvent.click(screen.getByRole('tab', { name: 'Order history' }));
  fireEvent.click(screen.getByText('Today', { selector: 'summary' }));
  expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(1);
  expect(screen.getAllByText(/2026/).length).toBeGreaterThan(0);
  fireEvent.change(screen.getByLabelText('From date'), {
    target: { value: '2026-01-01' },
  });
  fireEvent.change(screen.getByLabelText('To date'), {
    target: { value: '2026-01-02' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Apply dates' }));
  expect(useAdminOrdersPage).toHaveBeenLastCalledWith('completed', {
    from: '2025-12-31T13:00:00.000Z',
    to: '2026-01-02T13:00:00.000Z',
  });
  fireEvent.click(screen.getByRole('button', { name: 'Today' }));
  expect(useAdminOrdersPage).toHaveBeenLastCalledWith(
    'completed',
    orderDateRange(orderDayKey(Date.now())!, orderDayKey(Date.now())!),
  );
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
