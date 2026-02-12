'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { CartItem, Order } from '@/types';

const CART_STORAGE_KEY = 'orders';

/**
 * Normalize raw items from localStorage to CartItem format
 */
const normalizeOrderItems = (rawItems: unknown[]): CartItem[] => {
  if (!Array.isArray(rawItems)) return [];

  return rawItems
    .map((raw) => {
      if (!raw || typeof raw !== 'object') return null;
      const obj = raw as Record<string, unknown>;
      const name = String(obj.name ?? obj.title ?? obj.itemName ?? obj.label ?? 'Item').trim();
      const price = Number(obj.price ?? 0);
      const quantity = Number(obj.quantity ?? obj.qty ?? 1);
      const safeQuantity = Number.isFinite(quantity) && quantity > 0 ? Math.floor(quantity) : 1;

      return {
        name: name.length ? name : 'Item',
        price: Number.isFinite(price) && price >= 0 ? price : 0,
        quantity: safeQuantity,
      };
    })
    .filter((item): item is CartItem => Boolean(item?.name?.length));
};

/**
 * Custom hook for managing shopping cart state
 */
export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        setItems(normalizeOrderItems(JSON.parse(stored)));
      }
    } catch {
      setItems([]);
    }
    setIsLoaded(true);
  }, []);

  // Persist cart to localStorage
  const persistItems = useCallback((nextItems: CartItem[]) => {
    setItems(nextItems);
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(nextItems));
  }, []);

  // Add item to cart
  const addItem = useCallback((item: Order) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.name === item.name);
      let nextItems: CartItem[];
      
      if (existing) {
        nextItems = prev.map((i) =>
          i.name === item.name ? { ...i, quantity: i.quantity + 1 } : i
        );
      } else {
        nextItems = [...prev, { ...item, quantity: 1 }];
      }
      
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(nextItems));
      return nextItems;
    });
  }, []);

  // Remove item from cart
  const removeItem = useCallback((index: number) => {
    setItems((prev) => {
      const nextItems = prev.filter((_, idx) => idx !== index);
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(nextItems));
      return nextItems;
    });
  }, []);

  // Update item quantity
  const updateQuantity = useCallback((index: number, quantity: number) => {
    if (quantity < 1) return;
    
    setItems((prev) => {
      const nextItems = prev.map((item, idx) =>
        idx === index ? { ...item, quantity } : item
      );
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(nextItems));
      return nextItems;
    });
  }, []);

  // Clear cart
  const clearCart = useCallback(() => {
    localStorage.removeItem(CART_STORAGE_KEY);
    setItems([]);
  }, []);

  // Calculate total
  const total = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items]
  );

  // Item count
  const itemCount = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  );

  return {
    items,
    total,
    itemCount,
    isLoaded,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    persistItems,
  };
}

export default useCart;
