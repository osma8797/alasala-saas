'use client';

import { useState, useCallback } from 'react';
import { CartItem } from '@/types';

type CheckoutState = {
  isLoading: boolean;
  error: string | null;
};

/**
 * Build checkout items from cart items
 */
const buildCheckoutItems = (items: CartItem[]) => {
  return items
    .filter((item) => item.name && item.price > 0)
    .map((item) => ({
      name: item.name.trim(),
      price: item.price,
      quantity: item.quantity || 1,
    }));
};

/**
 * Custom hook for handling Stripe checkout
 */
export function useCheckout(restaurantSlug: string) {
  const [state, setState] = useState<CheckoutState>({
    isLoading: false,
    error: null,
  });

  const checkout = useCallback(
    async (items: CartItem[]) => {
      if (!restaurantSlug) {
        setState({ isLoading: false, error: 'Restaurant not specified.' });
        return;
      }

      if (items.length === 0) {
        setState({ isLoading: false, error: 'Cart is empty.' });
        return;
      }

      setState({ isLoading: true, error: null });

      try {
        const cleanedItems = buildCheckoutItems(items);

        if (cleanedItems.length === 0) {
          throw new Error('No valid items in cart.');
        }

        const response = await fetch('/api/checkout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            items: cleanedItems,
            restaurantSlug,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Checkout request failed');
        }

        if (data.url) {
          window.location.href = data.url;
        } else {
          throw new Error('Missing checkout URL');
        }
      } catch (error) {
        console.error('Checkout Error:', error);
        setState({
          isLoading: false,
          error: error instanceof Error ? error.message : 'Payment failed. Please try again.',
        });
      }
    },
    [restaurantSlug]
  );

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  return {
    isLoading: state.isLoading,
    error: state.error,
    checkout,
    clearError,
  };
}

export default useCheckout;
