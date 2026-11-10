import { ListAdminOrdersQuerySchema } from './order.schema';

test('validates date bounds and refuses to hide active kitchen tickets with dates', () => {
  const input = {
    view: 'past',
    from: '2026-11-09T13:00:00Z',
    to: '2026-11-10T13:00:00Z',
  };
  expect(ListAdminOrdersQuerySchema.safeParse(input).success).toBe(true);
  expect(
    ListAdminOrdersQuerySchema.safeParse({ ...input, from: 'not-a-date' })
      .success,
  ).toBe(false);
  expect(
    ListAdminOrdersQuerySchema.safeParse({
      ...input,
      from: input.to,
      to: input.from,
    }).success,
  ).toBe(false);
  expect(
    ListAdminOrdersQuerySchema.safeParse({ ...input, view: 'kitchen' }).success,
  ).toBe(false);
});
