import { describe, it, expect, vi, beforeEach } from 'vitest';

// Use vi.hoisted so these are available inside vi.mock factories
const { mockConstructEvent, mockFrom, mockLogPaymentEvent, mockBuildLog } = vi.hoisted(() => ({
  mockConstructEvent: vi.fn(),
  mockFrom: vi.fn(),
  mockLogPaymentEvent: vi.fn().mockResolvedValue(true),
  mockBuildLog: vi.fn().mockReturnValue({
    stripe_session_id: 'cs_test',
    restaurant_slug: null,
    event_type: 'test',
    status: 'failed',
    amount: null,
    error_message: 'test',
  }),
}));

vi.mock('@/lib/stripe', () => ({
  getStripeClient: () => ({
    webhooks: { constructEvent: mockConstructEvent },
  }),
  getWebhookSecret: () => 'whsec_test_secret',
}));

vi.mock('@/lib/supabase-admin', () => ({
  supabaseAdmin: { from: mockFrom },
}));

vi.mock('@/lib/payment-logger', () => ({
  logPaymentEvent: mockLogPaymentEvent,
  buildPaymentLogFromSession: mockBuildLog,
}));

import { POST } from '@/app/api/webhook/stripe/route';

// ============================================
// Helpers
// ============================================

function buildRequest(sig: string | null = 'test-sig'): Request {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (sig) headers['stripe-signature'] = sig;
  return new Request('http://localhost:3000/api/webhook/stripe', {
    method: 'POST',
    headers,
    body: '{}',
  });
}

function checkoutEvent(sessionId = 'cs_test_123') {
  return {
    type: 'checkout.session.completed',
    data: {
      object: {
        id: sessionId,
        amount_total: 5000,
        currency: 'sar',
        metadata: {
          restaurant_slug: 'alasala',
          items: JSON.stringify([{ name: 'Hummus', price: 12, quantity: 1 }]),
        },
        customer_details: { name: 'Ahmed', email: 'a@t.com', phone: '+966501234567' },
      },
    },
  };
}

function mockSuccessFlow() {
  mockConstructEvent.mockReturnValue(checkoutEvent('cs_new'));

  mockFrom.mockImplementation((table: string) => {
    const paymentsCallCount = mockFrom.mock.calls.filter((c: string[]) => c[0] === 'payments').length;

    if (table === 'payments' && paymentsCallCount <= 1) {
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null }),
      };
    }
    if (table === 'payments') {
      return { insert: vi.fn().mockResolvedValue({ error: null }) };
    }
    if (table === 'tenants') {
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'tenant-123' } }),
      };
    }
    if (table === 'orders') {
      return {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { id: 'order-123' }, error: null }),
      };
    }
    if (table === 'order_items') {
      return { insert: vi.fn().mockResolvedValue({ error: null }) };
    }
    return { insert: vi.fn().mockResolvedValue({ error: null }) };
  });
}

// ============================================
// Tests
// ============================================

describe('POST /api/webhook/stripe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Signature Validation', () => {
    it('should reject request without stripe-signature header', async () => {
      const res = await POST(buildRequest(null));
      expect(res.status).toBe(400);
      expect((await res.json()).error).toContain('Missing signature');
    });

    it('should reject invalid signature and return 400', async () => {
      mockConstructEvent.mockImplementation(() => { throw new Error('bad sig'); });
      const res = await POST(buildRequest('bad'));
      expect(res.status).toBe(400);
      expect((await res.json()).error).toContain('signature verification failed');
    });

    it('should log signature failure to payment_logs', async () => {
      mockConstructEvent.mockImplementation(() => { throw new Error('bad sig'); });
      await POST(buildRequest('bad'));
      expect(mockLogPaymentEvent).toHaveBeenCalledWith(
        expect.objectContaining({ event_type: 'webhook.signature_failed', status: 'failed' })
      );
    });
  });

  describe('Idempotency', () => {
    it('should return duplicate:true if payment already exists', async () => {
      mockConstructEvent.mockReturnValue(checkoutEvent('cs_dup'));
      mockFrom.mockImplementation((table: string) => {
        if (table === 'payments') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'exists' } }),
          };
        }
        return { insert: vi.fn().mockResolvedValue({ error: null }) };
      });

      const res = await POST(buildRequest());
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data.duplicate).toBe(true);
    });

    it('should NOT create order when duplicate detected', async () => {
      mockConstructEvent.mockReturnValue(checkoutEvent('cs_dup'));
      mockFrom.mockImplementation((table: string) => {
        if (table === 'payments') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'exists' } }),
          };
        }
        return { insert: vi.fn().mockResolvedValue({ error: null }) };
      });

      await POST(buildRequest());
      const orderCalls = mockFrom.mock.calls.filter((c: string[]) => c[0] === 'orders');
      expect(orderCalls).toHaveLength(0);
    });
  });

  describe('Checkout Session Completed', () => {
    it('should return 200 for new checkout', async () => {
      mockSuccessFlow();
      const res = await POST(buildRequest());
      expect(res.status).toBe(200);
      expect((await res.json()).received).toBe(true);
    });

    it('should insert into orders and payments tables', async () => {
      mockSuccessFlow();
      await POST(buildRequest());
      const tables = mockFrom.mock.calls.map((c: string[]) => c[0]);
      expect(tables).toContain('orders');
      expect(tables).toContain('payments');
    });

    it('should resolve tenant from restaurant slug', async () => {
      mockSuccessFlow();
      await POST(buildRequest());
      const tables = mockFrom.mock.calls.map((c: string[]) => c[0]);
      expect(tables).toContain('tenants');
    });

    it('should log success to payment_logs', async () => {
      mockSuccessFlow();
      await POST(buildRequest());
      expect(mockLogPaymentEvent).toHaveBeenCalledWith(
        expect.objectContaining({ event_type: 'checkout.session.completed', status: 'success', amount: 50 })
      );
    });
  });

  describe('Other Events', () => {
    it('should handle checkout.session.expired', async () => {
      mockConstructEvent.mockReturnValue({
        type: 'checkout.session.expired',
        data: { object: { id: 'cs_exp', amount_total: 5000, metadata: { restaurant_slug: 'alasala' }, customer_details: { email: 't@t.com', phone: null } } },
      });
      const res = await POST(buildRequest());
      expect(res.status).toBe(200);
    });

    it('should handle payment_intent.payment_failed', async () => {
      mockConstructEvent.mockReturnValue({
        type: 'payment_intent.payment_failed',
        data: { object: { id: 'pi_fail', amount: 5000, currency: 'sar', metadata: { restaurant_slug: 'alasala' }, last_payment_error: { message: 'Card declined', code: 'card_declined', type: 'card_error' } } },
      });
      const res = await POST(buildRequest());
      expect(res.status).toBe(200);
      expect(mockLogPaymentEvent).toHaveBeenCalledWith(
        expect.objectContaining({ event_type: 'payment_intent.payment_failed', status: 'failed', error_message: 'Card declined' })
      );
    });
  });
});
