import { ServiceError } from '../errors/ServiceError';
import { assertOrderTransition } from './order-status';

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
