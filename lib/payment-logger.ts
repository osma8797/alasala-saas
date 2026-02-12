import { supabaseAdmin } from './supabase-admin';

export type PaymentLogData = {
  stripe_session_id: string | null;
  restaurant_slug: string | null;
  event_type: string;
  status: 'success' | 'failed' | 'expired' | 'pending';
  amount: number | null;
  currency?: string;
  customer_email?: string | null;
  customer_phone?: string | null;
  error_message?: string | null;
  metadata?: Record<string, unknown>;
};

/**
 * Log payment event to the database
 * @param data - Payment event data
 * @returns Promise<boolean> - true if logged successfully, false otherwise
 */
export async function logPaymentEvent(data: PaymentLogData): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin.from('payment_logs').insert({
      stripe_session_id: data.stripe_session_id,
      restaurant_slug: data.restaurant_slug,
      event_type: data.event_type,
      status: data.status,
      amount: data.amount,
      currency: data.currency || 'sar',
      customer_email: data.customer_email || null,
      customer_phone: data.customer_phone || null,
      error_message: data.error_message || null,
      metadata: data.metadata || null,
    });

    if (error) {
      console.error('Failed to log payment event:', error);
      return false;
    }

    console.log(`Payment log recorded: ${data.event_type} - ${data.status}`);
    return true;
  } catch (err) {
    console.error('Failed to log payment event:', err);
    return false;
  }
}

/**
 * Build payment log data from Stripe checkout session
 */
export function buildPaymentLogFromSession(
  session: {
    id: string;
    amount_total?: number | null;
    metadata?: Record<string, string> | null;
    customer_details?: {
      email?: string | null;
      phone?: string | null;
    } | null;
  },
  eventType: string,
  status: PaymentLogData['status'],
  errorMessage?: string
): PaymentLogData {
  return {
    stripe_session_id: session.id,
    restaurant_slug: session.metadata?.restaurant_slug || null,
    event_type: eventType,
    status,
    amount: session.amount_total ? session.amount_total / 100 : null,
    customer_email: session.customer_details?.email || null,
    customer_phone: session.customer_details?.phone || null,
    error_message: errorMessage || null,
  };
}

/**
 * Validate payment log data
 */
export function validatePaymentLogData(data: Partial<PaymentLogData>): string[] {
  const errors: string[] = [];

  if (!data.event_type) {
    errors.push('event_type is required');
  }

  if (!data.status) {
    errors.push('status is required');
  }

  const validStatuses = ['success', 'failed', 'expired', 'pending'];
  if (data.status && !validStatuses.includes(data.status)) {
    errors.push(`status must be one of: ${validStatuses.join(', ')}`);
  }

  if (data.amount !== null && data.amount !== undefined && data.amount < 0) {
    errors.push('amount cannot be negative');
  }

  if (data.customer_email && !isValidEmail(data.customer_email)) {
    errors.push('customer_email is not a valid email');
  }

  return errors;
}

/**
 * Simple email validation
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
