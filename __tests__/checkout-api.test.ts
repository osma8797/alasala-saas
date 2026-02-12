import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/checkout/route';

// ============================================
// Mock Stripe
// ============================================
const mockCreate = vi.fn();

vi.mock('@/lib/stripe', () => ({
  getStripeClient: () => ({
    checkout: {
      sessions: {
        create: mockCreate,
      },
    },
  }),
}));

// ============================================
// Helpers
// ============================================

function buildRequest(body: Record<string, unknown>): Request {
  return new Request('http://localhost:3000/api/checkout', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      origin: 'http://localhost:3000',
    },
    body: JSON.stringify(body),
  });
}

async function getResponseData(req: Request) {
  const response = await POST(req);
  const data = await response.json();
  return { status: response.status, data };
}

// ============================================
// Tests
// ============================================

describe('POST /api/checkout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreate.mockResolvedValue({
      url: 'https://checkout.stripe.com/test-session',
    });
  });

  // ==========================================
  // INPUT VALIDATION
  // ==========================================

  describe('Input Validation', () => {
    it('should reject request with missing restaurantSlug', async () => {
      const req = buildRequest({ items: [{ name: 'Hummus', price: 12, quantity: 1 }] });
      const { status, data } = await getResponseData(req);

      expect(status).toBe(400);
      expect(data.error).toContain('restaurantSlug');
    });

    it('should reject request with empty cart', async () => {
      const req = buildRequest({ items: [], restaurantSlug: 'alasala' });
      const { status, data } = await getResponseData(req);

      expect(status).toBe(400);
      expect(data.error).toContain('empty');
    });

    it('should reject request with missing items field', async () => {
      const req = buildRequest({ restaurantSlug: 'alasala' });
      const { status, data } = await getResponseData(req);

      expect(status).toBe(400);
      expect(data.error).toContain('empty');
    });
  });

  // ==========================================
  // SERVER-SIDE PRICE VALIDATION (CRITICAL)
  // ==========================================

  describe('Server-Side Price Validation', () => {
    it('should use server price and IGNORE client price', async () => {
      const req = buildRequest({
        items: [{ name: 'Hummus', price: 0.01, quantity: 1 }],
        restaurantSlug: 'alasala',
      });

      await POST(req);

      expect(mockCreate).toHaveBeenCalledTimes(1);
      const callArgs = mockCreate.mock.calls[0][0];
      expect(callArgs.line_items[0].price_data.unit_amount).toBe(1200);
      expect(callArgs.line_items[0].price_data.unit_amount).not.toBe(1);
    });

    it('should use canonical item name from server catalog', async () => {
      const req = buildRequest({
        items: [{ name: 'hummus', price: 999, quantity: 2 }],
        restaurantSlug: 'alasala',
      });

      await POST(req);

      const callArgs = mockCreate.mock.calls[0][0];
      expect(callArgs.line_items[0].price_data.product_data.name).toBe('Hummus');
      expect(callArgs.line_items[0].quantity).toBe(2);
    });

    it('should reject items not on the menu', async () => {
      const req = buildRequest({
        items: [{ name: 'FREE PIZZA', price: 0, quantity: 1 }],
        restaurantSlug: 'alasala',
      });

      const { status, data } = await getResponseData(req);

      expect(status).toBe(400);
      expect(data.error).toContain('not on our menu');
      expect(data.error).toContain('FREE PIZZA');
      expect(mockCreate).not.toHaveBeenCalled();
    });

    it('should reject mixed valid and invalid items', async () => {
      const req = buildRequest({
        items: [
          { name: 'Hummus', price: 12, quantity: 1 },
          { name: 'FAKE ITEM', price: 0, quantity: 1 },
        ],
        restaurantSlug: 'alasala',
      });

      const { status, data } = await getResponseData(req);

      expect(status).toBe(400);
      expect(data.error).toContain('FAKE ITEM');
    });

    it('should handle multiple valid items with correct server prices', async () => {
      const req = buildRequest({
        items: [
          { name: 'Lamb Kebab', price: 1, quantity: 1 },
          { name: 'Hummus', price: 1, quantity: 2 },
          { name: 'Pomegranate Juice', price: 1, quantity: 3 },
        ],
        restaurantSlug: 'alasala',
      });

      await POST(req);

      const callArgs = mockCreate.mock.calls[0][0];
      const lineItems = callArgs.line_items;

      expect(lineItems).toHaveLength(3);
      expect(lineItems[0].price_data.unit_amount).toBe(5000);
      expect(lineItems[1].price_data.unit_amount).toBe(1200);
      expect(lineItems[2].price_data.unit_amount).toBe(1000);
    });
  });

  // ==========================================
  // STRIPE SESSION
  // ==========================================

  describe('Stripe Session Creation', () => {
    it('should return checkout URL on success', async () => {
      const req = buildRequest({
        items: [{ name: 'Hummus', price: 12, quantity: 1 }],
        restaurantSlug: 'alasala',
      });

      const { status, data } = await getResponseData(req);

      expect(status).toBe(200);
      expect(data.url).toBe('https://checkout.stripe.com/test-session');
    });

    it('should pass restaurant_slug in Stripe metadata', async () => {
      const req = buildRequest({
        items: [{ name: 'Hummus', price: 12, quantity: 1 }],
        restaurantSlug: 'alasala',
      });

      await POST(req);

      const callArgs = mockCreate.mock.calls[0][0];
      expect(callArgs.metadata.restaurant_slug).toBe('alasala');
    });

    it('should use SAR currency', async () => {
      const req = buildRequest({
        items: [{ name: 'Hummus', price: 12, quantity: 1 }],
        restaurantSlug: 'alasala',
      });

      await POST(req);

      const callArgs = mockCreate.mock.calls[0][0];
      expect(callArgs.line_items[0].price_data.currency).toBe('sar');
    });

    it('should store server-validated prices in metadata (not client prices)', async () => {
      const req = buildRequest({
        items: [{ name: 'Lamb Kebab', price: 0.01, quantity: 1 }],
        restaurantSlug: 'alasala',
      });

      await POST(req);

      const callArgs = mockCreate.mock.calls[0][0];
      const metadataItems = JSON.parse(callArgs.metadata.items);

      expect(metadataItems[0].price).toBe(50);
      expect(metadataItems[0].name).toBe('Lamb Kebab');
    });
  });
});
