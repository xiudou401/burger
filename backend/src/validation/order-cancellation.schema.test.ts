import {
  CancellationReasonSchema,
  UpdateOrderStatusSchema,
} from './order.schema';
import { getCancellationReasonFromQuestion } from '../services/admin-agent-tools';

describe('checkout cancellation reasons', () => {
  test.each(['checkout_superseded', 'duplicate_order'])(
    'accepts %s without breaking historical reasons',
    (reason) => {
      expect(CancellationReasonSchema.parse(reason)).toBe(reason);
      expect(
        UpdateOrderStatusSchema.parse({
          status: 'cancelled',
          version: 0,
          cancellationReason: reason,
        }).cancellationReason,
      ).toBe(reason);
    },
  );

  test('distinguishes replaced checkouts from duplicate orders in analytics questions', () => {
    expect(
      getCancellationReasonFromQuestion('orders replaced by a new checkout'),
    ).toBe('checkout_superseded');
    expect(getCancellationReasonFromQuestion('superseded checkouts')).toBe(
      'checkout_superseded',
    );
    expect(getCancellationReasonFromQuestion('duplicate orders')).toBe(
      'duplicate_order',
    );
  });
});
