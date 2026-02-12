"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState, useEffect, useMemo } from "react";

interface CartItem {
  name: string;
  price: number;
  quantity?: number;
}

// Saudi phone number validation regex
const SAUDI_PHONE_REGEX = /^(\+966|00966|966)?[- ]?0?5[0-9]{8}$/;

interface CheckoutForm {
  name: string;
  phone: string;
  email: string;
  orderType: "dine-in" | "takeaway";
  notes: string;
}

export default function CheckoutPage() {
  const params = useParams();
  const slug = typeof params?.slug === "string" ? params.slug : Array.isArray(params?.slug) ? params.slug[0] : "";

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [form, setForm] = useState<CheckoutForm>({
    name: "",
    phone: "",
    email: "",
    orderType: "dine-in",
    notes: "",
  });
  const [errors, setErrors] = useState<Partial<CheckoutForm>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("orders");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Normalize items with quantity
        const normalized = normalizeCartItems(parsed);
        setCartItems(normalized);
      } catch {
        setCartItems([]);
      }
    }
  }, []);

  const normalizeCartItems = (items: CartItem[]): CartItem[] => {
    const grouped = new Map<string, CartItem>();
    
    items.forEach((item) => {
      const key = `${item.name}-${item.price}`;
      const existing = grouped.get(key);
      if (existing) {
        existing.quantity = (existing.quantity || 1) + 1;
      } else {
        grouped.set(key, { ...item, quantity: 1 });
      }
    });

    return Array.from(grouped.values());
  };

  const subtotal = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.price * (item.quantity || 1), 0);
  }, [cartItems]);

  const tax = useMemo(() => subtotal * 0.15, [subtotal]); // 15% VAT
  const total = useMemo(() => subtotal + tax, [subtotal, tax]);

  const validateForm = (): boolean => {
    const newErrors: Partial<CheckoutForm> = {};

    // Name validation
    const nameRegex = /^[\u0600-\u06FFa-zA-Z\s]{2,50}$/;
    if (!form.name.trim()) {
      newErrors.name = "Name is required";
    } else if (!nameRegex.test(form.name.trim())) {
      newErrors.name = "Please enter a valid name";
    }

    // Phone validation (Saudi format)
    const cleanPhone = form.phone.replace(/[\s-]/g, "");
    if (!cleanPhone) {
      newErrors.phone = "Phone number is required";
    } else if (!SAUDI_PHONE_REGEX.test(cleanPhone)) {
      newErrors.phone = "Please enter a valid Saudi phone number (+966 5X XXX XXXX)";
    }

    // Email validation (optional but must be valid if provided)
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const formatPhoneNumber = (value: string): string => {
    let cleaned = value.replace(/[^\d+]/g, "");
    if (cleaned.startsWith("05")) {
      cleaned = "+966" + cleaned.substring(1);
    } else if (cleaned.startsWith("5") && cleaned.length <= 9) {
      cleaned = "+966" + cleaned;
    }
    return cleaned;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (cartItems.length === 0) {
      setErrors({ name: "Your cart is empty" });
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Build checkout items
      const checkoutItems = cartItems.map((item) => ({
        name: item.name,
        price: item.price,
        quantity: item.quantity || 1,
      }));

      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: checkoutItems,
          restaurantSlug: slug,
          customerName: form.name,
          customerPhone: form.phone,
          customerEmail: form.email || undefined,
          orderType: form.orderType,
          notes: form.notes || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("Checkout failed");
      }

      const data = await response.json();
      
      if (data.url) {
        // Clear cart and redirect to Stripe
        localStorage.removeItem("orders");
        window.location.href = data.url;
      } else {
        throw new Error("Missing checkout URL");
      }
    } catch (error) {
      console.error("Checkout error:", error);
      setErrors({ name: "Payment failed. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const removeItem = (index: number) => {
    const newItems = [...cartItems];
    newItems.splice(index, 1);
    setCartItems(newItems);
    
    // Update localStorage
    const flatItems: CartItem[] = [];
    newItems.forEach((item) => {
      for (let i = 0; i < (item.quantity || 1); i++) {
        flatItems.push({ name: item.name, price: item.price });
      }
    });
    localStorage.setItem("orders", JSON.stringify(flatItems));
  };

  if (cartItems.length === 0) {
    return (
      <div dir="ltr" lang="en" className="checkout-page">
        <nav>
          <div className="nav-container">
            <Link href={`/${slug}`} className="logo">Al Asala Restaurant</Link>
            <div className="nav-links">
              <Link href={`/${slug}/menu`}>Menu</Link>
            </div>
          </div>
        </nav>
        
        <main className="empty-cart">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="9" cy="21" r="1" />
            <circle cx="20" cy="21" r="1" />
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
          </svg>
          <h1>Your Cart is Empty</h1>
          <p>Add some delicious items from our menu</p>
          <Link href={`/${slug}/menu`} className="btn-primary">
            Browse Menu
          </Link>
        </main>

        <style jsx global>{`
          :root {
            --primary: #0066FF;
            --bg: #F8FAFC;
            --bg-card: #FFFFFF;
            --text: #1E293B;
            --text-secondary: #475569;
            --border: #E2E8F0;
          }
          * { margin: 0; padding: 0; box-sizing: border-box; font-family: Arial, sans-serif; }
          body { background-color: var(--bg); color: var(--text); }
          nav { background: var(--bg-card); padding: 0.8rem; position: fixed; width: 100%; top: 0; z-index: 1000; border-bottom: 1px solid var(--border); }
          .nav-container { max-width: 1200px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; padding: 0 1rem; }
          .logo { font-size: 1.3rem; font-weight: bold; color: var(--text); text-decoration: none; }
          .nav-links a { color: var(--text-secondary); text-decoration: none; margin: 0 0.8rem; }
          .empty-cart { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 2rem; }
          .empty-cart svg { color: var(--text-secondary); margin-bottom: 1rem; }
          .empty-cart h1 { font-size: 1.5rem; margin-bottom: 0.5rem; }
          .empty-cart p { color: var(--text-secondary); margin-bottom: 1.5rem; }
          .btn-primary { background: var(--primary); color: white; padding: 0.75rem 1.5rem; border-radius: 8px; text-decoration: none; font-weight: 600; }
        `}</style>
      </div>
    );
  }

  return (
    <div dir="ltr" lang="en" className="checkout-page">
      <nav>
        <div className="nav-container">
          <Link href={`/${slug}`} className="logo">Al Asala Restaurant</Link>
          <div className="nav-links">
            <Link href={`/${slug}/menu`}>Menu</Link>
            <Link href={`/${slug}/cart`}>Cart</Link>
          </div>
        </div>
      </nav>

      <main className="checkout-content">
        <div className="checkout-grid">
          {/* Order Summary */}
          <div className="order-summary">
            <h2>Order Summary</h2>
            <ul className="cart-items">
              {cartItems.map((item, index) => (
                <li key={`${item.name}-${index}`} className="cart-item">
                  <div className="item-info">
                    <span className="item-name">{item.name}</span>
                    <span className="item-qty">x{item.quantity || 1}</span>
                  </div>
                  <div className="item-actions">
                    <span className="item-price">${(item.price * (item.quantity || 1)).toFixed(2)}</span>
                    <button 
                      className="remove-btn" 
                      onClick={() => removeItem(index)}
                      aria-label="Remove item"
                    >
                      ×
                    </button>
                  </div>
                </li>
              ))}
            </ul>
            <div className="summary-totals">
              <div className="summary-row">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="summary-row">
                <span>VAT (15%)</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <div className="summary-row total">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Checkout Form */}
          <div className="checkout-form-container">
            <h2>Your Details</h2>
            <form onSubmit={handleSubmit} className="checkout-form">
              <div className="form-group">
                <label htmlFor="name">Full Name *</label>
                <input
                  type="text"
                  id="name"
                  placeholder="Enter your full name"
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  className={errors.name ? "error" : ""}
                />
                {errors.name && <span className="error-message">{errors.name}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="phone">Phone Number * (Saudi)</label>
                <input
                  type="tel"
                  id="phone"
                  placeholder="+966 5X XXX XXXX"
                  value={form.phone}
                  onChange={(e) => setForm((prev) => ({ ...prev, phone: formatPhoneNumber(e.target.value) }))}
                  className={errors.phone ? "error" : ""}
                />
                {errors.phone && <span className="error-message">{errors.phone}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="email">Email (Optional)</label>
                <input
                  type="email"
                  id="email"
                  placeholder="your@email.com"
                  value={form.email}
                  onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                  className={errors.email ? "error" : ""}
                />
                {errors.email && <span className="error-message">{errors.email}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="orderType">Order Type</label>
                <select
                  id="orderType"
                  value={form.orderType}
                  onChange={(e) => setForm((prev) => ({ ...prev, orderType: e.target.value as "dine-in" | "takeaway" }))}
                >
                  <option value="dine-in">Dine-in</option>
                  <option value="takeaway">Takeaway</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="notes">Special Instructions (Optional)</label>
                <textarea
                  id="notes"
                  placeholder="Any special requests?"
                  value={form.notes}
                  onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                />
              </div>

              <button type="submit" className="submit-btn" disabled={isSubmitting}>
                {isSubmitting ? "Processing..." : `Pay $${total.toFixed(2)}`}
              </button>

              <p className="secure-notice">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                Secure payment powered by Stripe
              </p>
            </form>
          </div>
        </div>
      </main>

      <style jsx global>{`
        :root {
          --primary: #0066FF;
          --primary-hover: #0052CC;
          --primary-light: #E6F0FF;
          --success: #10B981;
          --error: #EF4444;
          --bg: #F8FAFC;
          --bg-card: #FFFFFF;
          --text: #1E293B;
          --text-secondary: #475569;
          --border: #E2E8F0;
        }
        * { margin: 0; padding: 0; box-sizing: border-box; font-family: Arial, sans-serif; }
        body { background-color: var(--bg); color: var(--text); }
        nav { background: var(--bg-card); padding: 0.8rem; position: fixed; width: 100%; top: 0; z-index: 1000; border-bottom: 1px solid var(--border); }
        .nav-container { max-width: 1200px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; padding: 0 1rem; }
        .logo { font-size: 1.3rem; font-weight: bold; color: var(--text); text-decoration: none; }
        .nav-links a { color: var(--text-secondary); text-decoration: none; margin: 0 0.8rem; transition: color 0.2s; }
        .nav-links a:hover { color: var(--primary); }
        
        .checkout-content { padding: 100px 1rem 2rem; max-width: 1000px; margin: 0 auto; }
        .checkout-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; }
        
        .order-summary, .checkout-form-container { background: var(--bg-card); border-radius: 12px; padding: 1.5rem; box-shadow: 0 2px 10px rgba(0,0,0,0.05); }
        .order-summary h2, .checkout-form-container h2 { font-size: 1.25rem; margin-bottom: 1rem; padding-bottom: 0.75rem; border-bottom: 1px solid var(--border); }
        
        .cart-items { list-style: none; margin-bottom: 1rem; }
        .cart-item { display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 0; border-bottom: 1px solid var(--border); }
        .cart-item:last-child { border-bottom: none; }
        .item-info { display: flex; align-items: center; gap: 0.5rem; }
        .item-name { font-weight: 500; }
        .item-qty { color: var(--text-secondary); font-size: 0.9rem; }
        .item-actions { display: flex; align-items: center; gap: 0.75rem; }
        .item-price { font-weight: 600; }
        .remove-btn { background: none; border: none; color: var(--error); font-size: 1.25rem; cursor: pointer; padding: 0.25rem; }
        
        .summary-totals { padding-top: 1rem; border-top: 1px solid var(--border); }
        .summary-row { display: flex; justify-content: space-between; padding: 0.5rem 0; font-size: 0.95rem; }
        .summary-row.total { font-size: 1.1rem; font-weight: 700; padding-top: 0.75rem; border-top: 1px solid var(--border); margin-top: 0.5rem; }
        
        .checkout-form { display: flex; flex-direction: column; gap: 1rem; }
        .form-group { display: flex; flex-direction: column; gap: 0.4rem; }
        .form-group label { font-size: 0.9rem; font-weight: 600; }
        .form-group input, .form-group select, .form-group textarea { padding: 0.75rem; border: 1px solid var(--border); border-radius: 8px; font-size: 1rem; }
        .form-group input:focus, .form-group select:focus, .form-group textarea:focus { outline: none; border-color: var(--primary); box-shadow: 0 0 0 3px var(--primary-light); }
        .form-group input.error { border-color: var(--error); }
        .error-message { color: var(--error); font-size: 0.8rem; }
        
        .submit-btn { background: var(--primary); color: white; border: none; padding: 1rem; font-size: 1rem; font-weight: 600; border-radius: 8px; cursor: pointer; transition: background 0.2s; margin-top: 0.5rem; }
        .submit-btn:hover:not(:disabled) { background: var(--primary-hover); }
        .submit-btn:disabled { opacity: 0.7; cursor: not-allowed; }
        
        .secure-notice { display: flex; align-items: center; justify-content: center; gap: 0.5rem; color: var(--text-secondary); font-size: 0.85rem; margin-top: 0.75rem; }
        .secure-notice svg { color: var(--success); }
        
        @media (max-width: 768px) {
          .checkout-grid { grid-template-columns: 1fr; }
          .order-summary { order: 2; }
          .checkout-form-container { order: 1; }
        }
      `}</style>
    </div>
  );
}
