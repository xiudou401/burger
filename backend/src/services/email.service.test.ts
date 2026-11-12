import {
  sendOrderConfirmationEmail,
  sendVerificationEmail,
} from './email.service';

jest.mock('../config/env', () => ({
  env: {
    RESEND_API_KEY: 'test-key',
    EMAIL_FROM: 'orders@example.test',
    FRONTEND_URL: 'https://example.test',
  },
}));

const confirmation = {
  email: 'customer@example.test',
  orderId: '507f1f77bcf86cd799439011',
  createdAt: new Date('2026-11-12T23:00:00Z'),
  status: 'confirmed',
  items: [
    { name: 'Burger', quantity: 1, priceCents: 1200, subtotalCents: 1200 },
  ],
  totalCents: 1200,
};

describe('email provider idempotency', () => {
  const originalFetch = global.fetch;
  afterEach(() => {
    global.fetch = originalFetch;
  });

  test('retries an accepted confirmation with the same provider key and body', async () => {
    const accepted = new Set<string>();
    const bodies: string[] = [];
    let deliveries = 0;
    global.fetch = jest.fn(async (_url, options) => {
      const key = (options?.headers as Record<string, string>)[
        'Idempotency-Key'
      ];
      expect(key).toBe(`order-confirmation/${confirmation.orderId}`);
      bodies.push(String(options?.body));
      if (!accepted.has(key)) {
        accepted.add(key);
        deliveries += 1;
      }
      return { ok: true } as Response;
    });
    await sendOrderConfirmationEmail(confirmation);
    // The worker lost its local completion record after the provider accepted the first send.
    await sendOrderConfirmationEmail(confirmation);
    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(deliveries).toBe(1);
    expect(bodies[1]).toBe(bodies[0]);
  });

  test('uses different keys for different orders and propagates provider failures', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({ ok: true })
      .mockResolvedValueOnce({
        ok: false,
        text: async () => 'provider failed',
      });
    await sendOrderConfirmationEmail(confirmation);
    await expect(
      sendOrderConfirmationEmail({ ...confirmation, orderId: 'another-order' }),
    ).rejects.toThrow('Email send failed');
    const calls = jest.mocked(global.fetch).mock.calls;
    expect(
      (calls[0][1]?.headers as Record<string, string>)['Idempotency-Key'],
    ).not.toBe(
      (calls[1][1]?.headers as Record<string, string>)['Idempotency-Key'],
    );
  });

  test('does not share the order confirmation key with authentication emails', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true });
    await sendVerificationEmail({
      email: confirmation.email,
      token: 'test-token',
    });
    expect(
      jest.mocked(global.fetch).mock.calls[0][1]?.headers,
    ).not.toHaveProperty('Idempotency-Key');
  });
});
