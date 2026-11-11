import { ListAdminOrdersQuerySchema } from './order.schema';

test.each(['#2A094D', ' 2a094d ', '6a223b0b1b8ae983e72a094d'])(
  'normalizes order search %s',
  (search) => {
    expect(ListAdminOrdersQuerySchema.parse({ search }).search).toBe(
      search.trim().replace('#', '').toLowerCase(),
    );
  },
);

test.each(['', 'abc', '1234567', '.*', '#abcdef$', 'zzzzzz'])(
  'rejects invalid search %s',
  (search) => {
    expect(ListAdminOrdersQuerySchema.safeParse({ search }).success).toBe(
      false,
    );
  },
);
