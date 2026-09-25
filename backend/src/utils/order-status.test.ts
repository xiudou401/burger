import { ServiceError } from '../errors/ServiceError';
import {
  allowedOrderTransitions,
  assertCanTransitionOrderStatus,
  canTransitionOrderStatus,
} from './order-status-machine';

test('allows expected order status transitions', () => {
  expect(() =>
    assertCanTransitionOrderStatus('pending_payment', 'confirmed'),
  ).not.toThrow();
  expect(() =>
    assertCanTransitionOrderStatus('pending_payment', 'cancelled'),
  ).not.toThrow();
  expect(() =>
    assertCanTransitionOrderStatus('confirmed', 'preparing'),
  ).not.toThrow();
  expect(() =>
    assertCanTransitionOrderStatus('confirmed', 'cancelled'),
  ).not.toThrow();
  expect(() =>
    assertCanTransitionOrderStatus('preparing', 'ready'),
  ).not.toThrow();
  expect(() =>
    assertCanTransitionOrderStatus('preparing', 'cancelled'),
  ).not.toThrow();
  expect(() =>
    assertCanTransitionOrderStatus('ready', 'completed'),
  ).not.toThrow();
});

test('blocks invalid order status transitions', () => {
  expect(() =>
    assertCanTransitionOrderStatus('pending_payment', 'completed'),
  ).toThrow(ServiceError);
  expect(() =>
    assertCanTransitionOrderStatus('completed', 'confirmed'),
  ).toThrow(ServiceError);
  expect(() =>
    assertCanTransitionOrderStatus('cancelled', 'confirmed'),
  ).toThrow(ServiceError);
  expect(() =>
    assertCanTransitionOrderStatus('ready', 'pending_payment'),
  ).toThrow(ServiceError);
});

test('exposes transition checks for UI and service rules', () => {
  expect(canTransitionOrderStatus('confirmed', 'preparing')).toBe(true);
  expect(canTransitionOrderStatus('completed', 'preparing')).toBe(false);
  expect(allowedOrderTransitions.completed).toEqual([]);
  expect(allowedOrderTransitions.cancelled).toEqual([]);
});
