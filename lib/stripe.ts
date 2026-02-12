import Stripe from 'stripe';

let stripeInstance: Stripe | null = null;

/**
 * Get Stripe client instance (singleton)
 */
export function getStripeClient(): Stripe | null {
  if (stripeInstance) {
    return stripeInstance;
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  
  if (!secretKey) {
    console.error('Stripe Error: STRIPE_SECRET_KEY is missing.');
    return null;
  }

  stripeInstance = new Stripe(secretKey, {
    apiVersion: '2023-10-16' as any,
  });

  return stripeInstance;
}

/**
 * Get webhook secret
 */
export function getWebhookSecret(): string | undefined {
  return process.env.STRIPE_WEBHOOK_SECRET;
}

/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(
  body: string,
  signature: string,
  secret: string
): Stripe.Event {
  const stripe = getStripeClient();
  if (!stripe) {
    throw new Error('Stripe not configured');
  }
  return stripe.webhooks.constructEvent(body, signature, secret);
}

export default getStripeClient;
