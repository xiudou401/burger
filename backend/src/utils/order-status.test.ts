import assert from 'node:assert/strict';
import test from 'node:test';
import { ServiceError } from '../errors/ServiceError';
import {
  assertOrderTransition,
  parseOrderStatus,
} from './order-status';

test('parses known order statuses', () => {
  assert.equal(parseOrderStatus('pending_payment'), 'pending_payment');
  assert.equal(parseOrderStatus('completed'), 'completed');
});

test('rejects unknown order statuses', () => {
  assert.throws(() => parseOrderStatus('refunded'), ServiceError);
});

test('allows expected order status transitions', () => {
  assert.doesNotThrow(() => assertOrderTransition('pending_payment', 'paid'));
  assert.doesNotThrow(() => assertOrderTransition('paid', 'preparing'));
  assert.doesNotThrow(() => assertOrderTransition('preparing', 'ready'));
  assert.doesNotThrow(() => assertOrderTransition('ready', 'completed'));
});

test('blocks invalid order status transitions', () => {
  assert.throws(
    () => assertOrderTransition('pending_payment', 'completed'),
    ServiceError,
  );
  assert.throws(() => assertOrderTransition('completed', 'paid'), ServiceError);
});
