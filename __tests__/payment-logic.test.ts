import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  logPaymentEvent,
  buildPaymentLogFromSession,
  validatePaymentLogData,
  isValidEmail,
  type PaymentLogData,
} from '@/lib/payment-logger';

// Mock supabaseAdmin
vi.mock('@/lib/supabase-admin', () => ({
  supabaseAdmin: {
    from: vi.fn(() => ({
      insert: vi.fn(() => Promise.resolve({ error: null })),
    })),
  },
}));

import { supabaseAdmin } from '@/lib/supabase-admin';

describe('Payment Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('logPaymentEvent', () => {
    it('should log payment event successfully', async () => {
      const mockInsert = vi.fn().mockResolvedValue({ error: null });
      vi.mocked(supabaseAdmin.from).mockReturnValue({
        insert: mockInsert,
      } as any);

      const paymentData: PaymentLogData = {
        stripe_session_id: 'cs_test_123',
        restaurant_slug: 'alasala',
        event_type: 'checkout.session.completed',
        status: 'success',
        amount: 100,
        currency: 'sar',
        customer_email: 'test@example.com',
        customer_phone: '+1234567890',
        error_message: null,
        metadata: { order_id: '123' },
      };

      const result = await logPaymentEvent(paymentData);

      expect(result).toBe(true);
      expect(supabaseAdmin.from).toHaveBeenCalledWith('payment_logs');
      expect(mockInsert).toHaveBeenCalledWith({
        stripe_session_id: 'cs_test_123',
        restaurant_slug: 'alasala',
        event_type: 'checkout.session.completed',
        status: 'success',
        amount: 100,
        currency: 'sar',
        customer_email: 'test@example.com',
        customer_phone: '+1234567890',
        error_message: null,
        metadata: { order_id: '123' },
      });
    });

    it('should return false when database insert fails', async () => {
      const mockInsert = vi.fn().mockResolvedValue({ 
        error: { message: 'Database error' } 
      });
      vi.mocked(supabaseAdmin.from).mockReturnValue({
        insert: mockInsert,
      } as any);

      const paymentData: PaymentLogData = {
        stripe_session_id: 'cs_test_123',
        restaurant_slug: 'alasala',
        event_type: 'checkout.session.completed',
        status: 'success',
        amount: 100,
      };

      const result = await logPaymentEvent(paymentData);

      expect(result).toBe(false);
    });

    it('should use default currency when not provided', async () => {
      const mockInsert = vi.fn().mockResolvedValue({ error: null });
      vi.mocked(supabaseAdmin.from).mockReturnValue({
        insert: mockInsert,
      } as any);

      const paymentData: PaymentLogData = {
        stripe_session_id: 'cs_test_123',
        restaurant_slug: 'alasala',
        event_type: 'checkout.session.completed',
        status: 'success',
        amount: 100,
      };

      await logPaymentEvent(paymentData);

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          currency: 'sar',
        })
      );
    });
  });

  describe('buildPaymentLogFromSession', () => {
    it('should build payment log data from Stripe session', () => {
      const session = {
        id: 'cs_test_session_123',
        amount_total: 5000, // in cents
        metadata: {
          restaurant_slug: 'alasala',
        },
        customer_details: {
          email: 'customer@example.com',
          phone: '+966501234567',
        },
      };

      const result = buildPaymentLogFromSession(
        session,
        'checkout.session.completed',
        'success'
      );

      expect(result).toEqual({
        stripe_session_id: 'cs_test_session_123',
        restaurant_slug: 'alasala',
        event_type: 'checkout.session.completed',
        status: 'success',
        amount: 50, // converted from cents
        customer_email: 'customer@example.com',
        customer_phone: '+966501234567',
        error_message: null,
      });
    });

    it('should handle missing metadata', () => {
      const session = {
        id: 'cs_test_session_123',
        amount_total: 5000,
        metadata: null,
        customer_details: null,
      };

      const result = buildPaymentLogFromSession(
        session,
        'checkout.session.expired',
        'expired'
      );

      expect(result.restaurant_slug).toBeNull();
      expect(result.customer_email).toBeNull();
      expect(result.customer_phone).toBeNull();
    });

    it('should include error message when provided', () => {
      const session = {
        id: 'cs_test_session_123',
        amount_total: 5000,
      };

      const result = buildPaymentLogFromSession(
        session,
        'payment_intent.payment_failed',
        'failed',
        'Card declined'
      );

      expect(result.error_message).toBe('Card declined');
      expect(result.status).toBe('failed');
    });
  });

  describe('validatePaymentLogData', () => {
    it('should return no errors for valid data', () => {
      const data: Partial<PaymentLogData> = {
        event_type: 'checkout.session.completed',
        status: 'success',
        amount: 100,
        customer_email: 'test@example.com',
      };

      const errors = validatePaymentLogData(data);

      expect(errors).toHaveLength(0);
    });

    it('should return error when event_type is missing', () => {
      const data: Partial<PaymentLogData> = {
        status: 'success',
      };

      const errors = validatePaymentLogData(data);

      expect(errors).toContain('event_type is required');
    });

    it('should return error when status is missing', () => {
      const data: Partial<PaymentLogData> = {
        event_type: 'checkout.session.completed',
      };

      const errors = validatePaymentLogData(data);

      expect(errors).toContain('status is required');
    });

    it('should return error for invalid status', () => {
      const data = {
        event_type: 'checkout.session.completed',
        status: 'invalid_status' as any,
      };

      const errors = validatePaymentLogData(data);

      expect(errors).toContain('status must be one of: success, failed, expired, pending');
    });

    it('should return error for negative amount', () => {
      const data: Partial<PaymentLogData> = {
        event_type: 'checkout.session.completed',
        status: 'success',
        amount: -50,
      };

      const errors = validatePaymentLogData(data);

      expect(errors).toContain('amount cannot be negative');
    });

    it('should return error for invalid email', () => {
      const data: Partial<PaymentLogData> = {
        event_type: 'checkout.session.completed',
        status: 'success',
        customer_email: 'invalid-email',
      };

      const errors = validatePaymentLogData(data);

      expect(errors).toContain('customer_email is not a valid email');
    });
  });

  describe('isValidEmail', () => {
    it('should return true for valid emails', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@domain.co.uk')).toBe(true);
      expect(isValidEmail('user+tag@example.org')).toBe(true);
    });

    it('should return false for invalid emails', () => {
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('invalid@')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
      expect(isValidEmail('test @example.com')).toBe(false);
    });
  });
});
