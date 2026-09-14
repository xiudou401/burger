import { getPriceUpdatedNotice } from './quote-notice';

describe('getPriceUpdatedNotice', () => {
  it('returns null without price changes', () => {
    expect(getPriceUpdatedNotice([])).toBeNull();
  });

  it('describes a single item price change', () => {
    expect(
      getPriceUpdatedNotice([{ name: 'Classic Burger', priceCents: 1250 }]),
    ).toBe(
      'Classic Burger price updated to $12.50. Please review before paying.',
    );
  });

  it('summarizes multiple item price changes', () => {
    expect(
      getPriceUpdatedNotice([
        { name: 'Classic Burger', priceCents: 1250 },
        { name: 'Fries', priceCents: 650 },
        { name: 'Shake', priceCents: 900 },
      ]),
    ).toBe(
      'Classic Burger, Fries, and more prices changed. Please review before paying.',
    );
  });
});
