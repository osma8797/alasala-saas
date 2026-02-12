import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getStripeClient } from '@/lib/stripe';
import { MENU_ITEMS } from '@/constants/menu';

// ============================================
// Server-Side Price Catalog
// ============================================
// Build a lookup map from the canonical menu.
// Key = lowercase title, Value = MenuItem
// This ensures the client can NEVER manipulate prices.
// ============================================
const PRICE_CATALOG = new Map(
  MENU_ITEMS.map((item) => [item.title.toLowerCase(), item])
);

const SLUG_CATALOG = new Map(
  MENU_ITEMS.map((item) => [item.slug.toLowerCase(), item])
);

/**
 * Look up a menu item by name or slug, returning the SERVER-SIDE price.
 */
function resolveMenuItem(clientItem: { name: string; slug?: string }) {
  // Try exact title match first (case-insensitive)
  const byTitle = PRICE_CATALOG.get(clientItem.name.toLowerCase().trim());
  if (byTitle) return byTitle;

  // Fallback: try slug match
  if (clientItem.slug) {
    const bySlug = SLUG_CATALOG.get(clientItem.slug.toLowerCase().trim());
    if (bySlug) return bySlug;
  }

  return null;
}

// ============================================
// POST /api/checkout
// ============================================

type ClientItem = {
  name: string;
  slug?: string;
  price: number; // ignored — we use server price
  quantity: number;
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { items, restaurantSlug } = body as {
      items: ClientItem[];
      restaurantSlug: string;
    };

    // --- Validate inputs ---
    if (!restaurantSlug || typeof restaurantSlug !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid restaurantSlug.' },
        { status: 400 }
      );
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Cart is empty.' },
        { status: 400 }
      );
    }

    // --- Get Stripe singleton ---
    const stripe = getStripeClient();
    if (!stripe) {
      return NextResponse.json(
        { error: 'Stripe is not configured.' },
        { status: 500 }
      );
    }

    // --- Resolve server prices & validate every item ---
    const resolvedItems: { name: string; serverPrice: number; quantity: number }[] = [];
    const invalidItems: string[] = [];

    for (const item of items) {
      if (!item.name || typeof item.name !== 'string') {
        invalidItems.push('unnamed item');
        continue;
      }

      const menuItem = resolveMenuItem(item);
      if (!menuItem) {
        invalidItems.push(item.name);
        continue;
      }

      const quantity = Math.max(1, Math.floor(Number(item.quantity) || 1));

      resolvedItems.push({
        name: menuItem.title,        // canonical name from server
        serverPrice: menuItem.price,  // canonical price from server
        quantity,
      });
    }

    if (invalidItems.length > 0) {
      return NextResponse.json(
        {
          error: `These items are not on our menu: ${invalidItems.join(', ')}`,
        },
        { status: 400 }
      );
    }

    if (resolvedItems.length === 0) {
      return NextResponse.json(
        { error: 'No valid items in cart.' },
        { status: 400 }
      );
    }

    // --- Build Stripe line items using SERVER prices ---
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] =
      resolvedItems.map((item) => ({
        price_data: {
          currency: 'sar',
          product_data: {
            name: item.name,
          },
          unit_amount: Math.round(item.serverPrice * 100), // SAR → halalas
        },
        quantity: item.quantity,
      }));

    // Build metadata with server-validated items
    const metadataItems = resolvedItems.map((item) => ({
      name: item.name,
      price: item.serverPrice,
      quantity: item.quantity,
    }));

    // --- Create Stripe Checkout Session ---
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${req.headers.get('origin')}/${restaurantSlug}/menu?success=true`,
      cancel_url: `${req.headers.get('origin')}/${restaurantSlug}/menu?canceled=true`,
      metadata: {
        restaurant_slug: restaurantSlug,
        items: JSON.stringify(metadataItems),
      },
      phone_number_collection: {
        enabled: true,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    if (error instanceof Stripe.errors.StripeError) {
      console.error('Stripe Error:', error.type, error.message);
      return NextResponse.json({ error: error.message }, { status: 502 });
    }

    console.error('Checkout Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
