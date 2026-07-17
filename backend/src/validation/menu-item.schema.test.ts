import { MenuItemPayloadSchema, MenuItemQuerySchema } from './menu-item.schema';

test('normalizes and coerces menu item payloads at the request boundary', () => {
  expect(
    MenuItemPayloadSchema.parse({
      name: ' Classic Burger ',
      description: ' Beef, cheese, and pickles ',
      priceCents: '1299',
      image: ' /img/classic.jpg ',
    }),
  ).toEqual({
    name: 'Classic Burger',
    description: 'Beef, cheese, and pickles',
    priceCents: 1299,
    image: '/img/classic.jpg',
    category: 'burger',
    isAvailable: true,
  });
});

test('limits menu search keyword length', () => {
  expect(
    MenuItemQuerySchema.safeParse({
      keyword: 'a'.repeat(50),
    }).success,
  ).toBe(true);

  expect(
    MenuItemQuerySchema.safeParse({
      keyword: 'a'.repeat(51),
    }).success,
  ).toBe(false);
});
