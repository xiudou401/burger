import assert from 'node:assert/strict';
import test from 'node:test';
import { validatePasswordPolicy } from './password-policy';

test('accepts passwords that satisfy the production policy', () => {
  assert.equal(validatePasswordPolicy('Burger#2026'), true);
});

test('rejects passwords without required complexity', () => {
  assert.equal(validatePasswordPolicy('Short1!'), false);
  assert.equal(validatePasswordPolicy('burger#2026'), false);
  assert.equal(validatePasswordPolicy('BURGER#2026'), false);
  assert.equal(validatePasswordPolicy('BurgerOnly!'), false);
  assert.equal(validatePasswordPolicy('Burger2026'), false);
});

test('rejects passwords containing whitespace', () => {
  assert.equal(validatePasswordPolicy('Burger #2026'), false);
});
