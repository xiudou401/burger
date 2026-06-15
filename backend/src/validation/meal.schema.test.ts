import { MealPayloadSchema } from './meal.schema';

test('normalizes and coerces meal payloads at the request boundary', () => {
  expect(
    MealPayloadSchema.parse({
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
  });
});
