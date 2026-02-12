import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getStripeClient, getWebhookSecret } from '@/lib/stripe';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { logPaymentEvent, buildPaymentLogFromSession } from '@/lib/payment-logger';

// ============================================
// POST /api/webhook/stripe
// ============================================

export async function POST(req: Request) {
  const webhookSecret = getWebhookSecret();

  if (!webhookSecret) {
    console.error('Stripe Webhook Error: STRIPE_WEBHOOK_SECRET is missing.');
    return NextResponse.json(
      { error: 'Webhook secret not configured' },
      { status: 500 }
    );
  }

  const stripe = getStripeClient();
  if (!stripe) {
    console.error('Stripe Webhook Error: Stripe client not configured.');
    return NextResponse.json(
      { error: 'Stripe not configured' },
      { status: 500 }
    );
  }

  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    console.error('Stripe Webhook Error: Missing stripe-signature header.');
    return NextResponse.json(
      { error: 'Missing signature' },
      { status: 400 }
    );
  }

  // ---- Verify webhook signature ----
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Stripe Webhook Signature Error:', message);

    await logPaymentEvent({
      stripe_session_id: null,
      restaurant_slug: null,
      event_type: 'webhook.signature_failed',
      status: 'failed',
      amount: null,
      error_message: message,
    });

    return NextResponse.json(
      { error: `Webhook signature verification failed: ${message}` },
      { status: 400 }
    );
  }

  // ============================================
  // EVENT: checkout.session.completed
  // ============================================
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;

    // ---- IDEMPOTENCY CHECK ----
    // If we already processed this Stripe session, return 200 immediately.
    // This prevents duplicate orders when Stripe retries the webhook.
    const { data: existingPayment } = await supabaseAdmin
      .from('payments')
      .select('id')
      .eq('stripe_payment_id', session.id)
      .maybeSingle();

    if (existingPayment) {
      console.log(`Idempotency: session ${session.id} already processed, skipping.`);
      return NextResponse.json({ received: true, duplicate: true });
    }

    try {
      const metadata = session.metadata || {};
      const itemsJson: { name: string; price: number; quantity: number }[] =
        metadata.items ? JSON.parse(metadata.items) : [];
      const restaurantSlug = metadata.restaurant_slug || null;
      const customerName = session.customer_details?.name || null;
      const customerEmail = session.customer_details?.email || null;
      const customerPhone = session.customer_details?.phone || null;
      const totalPrice = session.amount_total ? session.amount_total / 100 : 0;
      const currency = session.currency || 'sar';

      // ---- 1. Resolve tenant_id from slug ----
      let tenantId: string | null = null;
      if (restaurantSlug) {
        const { data: tenant } = await supabaseAdmin
          .from('tenants')
          .select('id')
          .eq('slug', restaurantSlug)
          .maybeSingle();
        tenantId = tenant?.id || null;
      }

      // ---- 2. Insert order ----
      const { data: orderData, error: insertError } = await supabaseAdmin
        .from('orders')
        .insert({
          restaurant_slug: restaurantSlug,
          tenant_id: tenantId,
          customer_name: customerName,
          phone_number: customerPhone,
          total_price: totalPrice,
          status: 'paid',
        })
        .select('id')
        .single();

      if (insertError || !orderData?.id) {
        console.error('Supabase Insert Error:', insertError?.message);

        await logPaymentEvent({
          stripe_session_id: session.id,
          restaurant_slug: restaurantSlug,
          event_type: 'checkout.session.completed',
          status: 'failed',
          amount: totalPrice,
          customer_email: customerEmail,
          customer_phone: customerPhone,
          error_message: `Failed to save order: ${insertError?.message}`,
          metadata: { items: itemsJson },
        });

        return NextResponse.json(
          { error: 'Failed to save order' },
          { status: 500 }
        );
      }

      // ---- 3. Insert order items ----
      if (itemsJson.length > 0) {
        const orderItems = itemsJson.map((item) => ({
          order_id: orderData.id,
          item_name: item.name,
          quantity: item.quantity,
          price: item.price,
        }));

        const { error: itemsError } = await supabaseAdmin
          .from('order_items')
          .insert(orderItems);

        if (itemsError) {
          console.error('Supabase Items Insert Error:', itemsError.message);
        }
      }

      // ---- 4. Insert into PAYMENTS table (transactional record) ----
      const { error: paymentError } = await supabaseAdmin
        .from('payments')
        .insert({
          order_id: orderData.id,
          tenant_id: tenantId,
          stripe_payment_id: session.id,
          amount: totalPrice,
          currency: currency,
          status: 'succeeded',
        });

      if (paymentError) {
        // Log but don't fail the webhook — order was already created
        console.error('Payments Insert Error:', paymentError.message);
      }

      // ---- 5. Log to payment_logs (observability) ----
      await logPaymentEvent({
        stripe_session_id: session.id,
        restaurant_slug: restaurantSlug,
        event_type: 'checkout.session.completed',
        status: 'success',
        amount: totalPrice,
        currency: currency,
        customer_email: customerEmail,
        customer_phone: customerPhone,
        metadata: {
          order_id: orderData.id,
          payment_recorded: !paymentError,
          items_count: itemsJson.length,
        },
      });

      console.log('Order saved successfully:', orderData.id);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error('Webhook Processing Error:', message);

      await logPaymentEvent(
        buildPaymentLogFromSession(session, 'checkout.session.completed', 'failed', message)
      );

      return NextResponse.json(
        { error: 'Failed to process webhook' },
        { status: 500 }
      );
    }
  }

  // ============================================
  // EVENT: checkout.session.expired
  // ============================================
  if (event.type === 'checkout.session.expired') {
    const session = event.data.object as Stripe.Checkout.Session;

    await logPaymentEvent(
      buildPaymentLogFromSession(session, 'checkout.session.expired', 'expired')
    );
  }

  // ============================================
  // EVENT: payment_intent.payment_failed
  // ============================================
  if (event.type === 'payment_intent.payment_failed') {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;

    await logPaymentEvent({
      stripe_session_id: paymentIntent.id,
      restaurant_slug: paymentIntent.metadata?.restaurant_slug || null,
      event_type: 'payment_intent.payment_failed',
      status: 'failed',
      amount: paymentIntent.amount ? paymentIntent.amount / 100 : null,
      currency: paymentIntent.currency,
      error_message:
        paymentIntent.last_payment_error?.message || 'Payment failed',
      metadata: {
        failure_code: paymentIntent.last_payment_error?.code,
        failure_type: paymentIntent.last_payment_error?.type,
      },
    });
  }

  // ============================================
  // EVENT: charge.refunded
  // ============================================
  if (event.type === 'charge.refunded') {
    const charge = event.data.object as Stripe.Charge;

    // Update the payments table if we have a matching record
    if (charge.payment_intent) {
      const paymentIntentId =
        typeof charge.payment_intent === 'string'
          ? charge.payment_intent
          : charge.payment_intent.id;

      const { error: refundError } = await supabaseAdmin
        .from('payments')
        .update({
          status: 'refunded',
          refunded_at: new Date().toISOString(),
        })
        .eq('stripe_payment_id', paymentIntentId);

      if (refundError) {
        console.error('Refund update error:', refundError.message);
      }

      await logPaymentEvent({
        stripe_session_id: paymentIntentId,
        restaurant_slug: charge.metadata?.restaurant_slug || null,
        event_type: 'charge.refunded',
        status: 'success',
        amount: charge.amount_refunded ? charge.amount_refunded / 100 : null,
        currency: charge.currency,
        metadata: { refund_reason: charge.metadata?.refund_reason },
      });
    }
  }

  return NextResponse.json({ received: true });
}
