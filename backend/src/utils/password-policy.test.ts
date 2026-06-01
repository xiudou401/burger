import { validatePasswordPolicy } from './password-policy';

test('accepts passwords that satisfy the production policy', () => {
  expect(validatePasswordPolicy('Burger#2026')).toBe(true);
});

test('rejects passwords without required complexity', () => {
  expect(validatePasswordPolicy('Short1!')).toBe(false);
  expect(validatePasswordPolicy('burger#2026')).toBe(false);
  expect(validatePasswordPolicy('BURGER#2026')).toBe(false);
  expect(validatePasswordPolicy('BurgerOnly!')).toBe(false);
  expect(validatePasswordPolicy('Burger2026')).toBe(false);
});

test('rejects passwords containing whitespace', () => {
  expect(validatePasswordPolicy('Burger #2026')).toBe(false);
});
