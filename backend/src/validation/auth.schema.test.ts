import { LoginSchema, SignupSchema } from './auth.schema';

describe('auth schemas', () => {
  test('normalizes signup names and emails at the request boundary', () => {
    expect(
      SignupSchema.parse({
        name: ' Pat ',
        email: ' PAT@example.com ',
        password: 'Burger#2026',
      }),
    ).toEqual({
      name: 'Pat',
      email: 'pat@example.com',
      password: 'Burger#2026',
    });
  });

  test('normalizes login emails at the request boundary', () => {
    expect(
      LoginSchema.parse({
        email: ' PAT@example.com ',
        password: 'Burger#2026',
      }),
    ).toEqual({
      email: 'pat@example.com',
      password: 'Burger#2026',
    });
  });
});
