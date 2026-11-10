import type { ReactNode } from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { useAdminOrdersPage } from './hooks/useAdminOrdersPage';
import type { Order, OrderStatus } from '../types/order';
import AdminOrders from './AdminOrders';

vi.mock('./hooks/useAdminOrdersPage', () => ({ useAdminOrdersPage: vi.fn() }));
vi.mock('../components/Admin/AdminLayout', () => ({
  default: ({ children }: { children: ReactNode }) => <main>{children}</main>,
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

const renderOrders = (orders: Order[]) => {
  vi.mocked(useAdminOrdersPage).mockReturnValue({
    orders,
    isLoading: false,
    isLoadingMore: false,
    error: null,
    updatingOrderId: null,
    hasMoreOrders: false,
    nextStatuses: {
      pending_payment: [],
      confirmed: [],
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
    <MemoryRouter>
      <AdminOrders />
    </MemoryRouter>,
  );
};

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
  expect(screen.getByRole('tab', { name: 'Awaiting payment' })).toHaveFocus();
  expect(screen.getByText('No orders in this view.')).toBeInTheDocument();
});
