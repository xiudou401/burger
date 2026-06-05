import { ServiceError } from '../errors/ServiceError';
import { assertOrderTransition, parseOrderStatus } from './order-status';

test('parses known order statuses', () => {
  expect(parseOrderStatus('pending_payment')).toBe('pending_payment');
  expect(parseOrderStatus('completed')).toBe('completed');
});

test('rejects unknown order statuses', () => {
  expect(() => parseOrderStatus('refunded')).toThrow(ServiceError);
});

test('allows expected order status transitions', () => {
  expect(() => assertOrderTransition('pending_payment', 'paid')).not.toThrow();
  expect(() => assertOrderTransition('paid', 'preparing')).not.toThrow();
  expect(() => assertOrderTransition('preparing', 'ready')).not.toThrow();
  expect(() => assertOrderTransition('ready', 'completed')).not.toThrow();
});

test('blocks invalid order status transitions', () => {
  expect(() => assertOrderTransition('pending_payment', 'completed')).toThrow(
    ServiceError,
  );
  expect(() => assertOrderTransition('completed', 'paid')).toThrow(
    ServiceError,
  );
});
