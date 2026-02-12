"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type CartItem = { name: string; price: number; quantity: number };

const normalizeOrderItems = (rawItems: unknown[]): CartItem[] => {
  if (!Array.isArray(rawItems)) return [];

  return rawItems
    .map((raw) => {
      if (!raw || typeof raw !== "object") return null;
      const obj = raw as Record<string, unknown>;
      const name = String(obj.name ?? obj.title ?? obj.itemName ?? obj.label ?? "Item").trim();
      const price = Number(obj.price ?? 0);
      const quantity = Number(obj.quantity ?? obj.qty ?? 1);
      const safeQuantity = Number.isFinite(quantity) && quantity > 0 ? Math.floor(quantity) : 1;

      return {
        name: name.length ? name : "Item",
        price: Number.isFinite(price) && price >= 0 ? price : 0,
        quantity: safeQuantity,
      };
    })
    .filter((item): item is CartItem => Boolean(item?.name?.length));
};

const getSlugFromParams = (params: ReturnType<typeof useParams>) => {
  const value = params?.slug;
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value[0] ?? "";
  return "";
};

const calculateTotal = (items: CartItem[]) =>
  items.reduce((sum, item) => sum + item.price * item.quantity, 0);

export default function CartPage() {
  const routeParams = useParams();
  const slug = getSlugFromParams(routeParams);

  const [orders, setOrders] = useState<CartItem[]>([]);
  const [customerPhone, setCustomerPhone] = useState("");
  const [orderType, setOrderType] = useState<"dine-in" | "takeaway">("dine-in");
  const [guestsCount, setGuestsCount] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("orders") || "[]");
      setOrders(normalizeOrderItems(stored));
    } catch {
      setOrders([]);
    }
  }, []);

  const total = useMemo(() => calculateTotal(orders), [orders]);

  const persistOrders = (nextOrders: CartItem[]) => {
    setOrders(nextOrders);
    localStorage.setItem("orders", JSON.stringify(nextOrders));
  };

  const removeItem = (index: number) => {
    setSubmitSuccess(null);
    const nextOrders = orders.filter((_, idx) => idx !== index);
    persistOrders(nextOrders);
  };

  const clearCart = () => {
    localStorage.removeItem("orders");
    setOrders([]);
  };

  const handleCheckout = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(null);

    const cleanedItems = normalizeOrderItems(orders);
    const cleanPhone = customerPhone.trim();
    const safeGuestsCount =
      Number.isFinite(guestsCount) && guestsCount > 0 ? Math.floor(guestsCount) : 1;

    if (!slug) {
      setSubmitError("Restaurant not specified.");
      return;
    }

    if (cleanedItems.length === 0) {
      setSubmitError("Your cart is empty.");
      return;
    }

    if (!cleanPhone) {
      setSubmitError("Please enter your phone number.");
      return;
    }
    if (!orderType.trim()) {
      setSubmitError("Please select order type.");
      return;
    }
    if (!Number.isFinite(safeGuestsCount) || safeGuestsCount <= 0) {
      setSubmitError("Please specify number of guests.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: cleanedItems,
          restaurantSlug: slug,
        }),
      });

      if (!response.ok) {
        throw new Error("Checkout request failed");
      }

      const data = (await response.json()) as { url?: string };
      if (data?.url) {
        window.location.href = data.url;
        return;
      }

      throw new Error("Missing checkout URL");
    } catch (error) {
      console.error("Checkout Error:", error);
      setSubmitError("Payment failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div dir="ltr" lang="en">
      <div className="page-container">
        {/* Header */}
        <header className="page-header">
          <Link className="back-link" href={`/${slug}/menu#menu`}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Back to Menu
          </Link>
        </header>

        <main className="cart-wrapper">
          {/* Cart Header */}
          <div className="cart-header">
            <div>
              <h1>Shopping Cart</h1>
              <p className="cart-subtitle">{orders.length} {orders.length === 1 ? 'item' : 'items'} in your cart</p>
            </div>
            {orders.length > 0 && (
              <button className="btn-clear" onClick={() => { setSubmitSuccess(null); clearCart(); }}>
                Clear Cart
              </button>
            )}
          </div>

          <div className="cart-layout">
            {/* Cart Items */}
            <div className="cart-items-section">
              {orders.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <circle cx="9" cy="21" r="1" />
                      <circle cx="20" cy="21" r="1" />
                      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                    </svg>
                  </div>
                  <h3>Your cart is empty</h3>
                  <p>Add some delicious items from our menu to get started</p>
                  <Link href={`/${slug}/menu`} className="btn-primary">
                    Browse Menu
                  </Link>
                </div>
              ) : (
                <ul className="cart-items-list">
                  {orders.map((order, idx) => (
                    <li key={`${order.name || "Item"}-${idx}`} className="cart-item">
                      <div className="cart-item-info">
                        <h4 className="item-name">{order.name || "Item"}</h4>
                        <p className="item-meta">Qty: {order.quantity || 1}</p>
                      </div>
                      <div className="cart-item-actions">
                        <span className="item-price">${(order.price || 0) * (order.quantity || 1)}</span>
                        <button
                          className="btn-remove"
                          aria-label={`Remove ${order.name || "Item"}`}
                          onClick={() => removeItem(idx)}
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Checkout Form */}
            {orders.length > 0 && (
              <div className="checkout-section">
                <div className="checkout-card">
                  <h2>Order Details</h2>

                  <form onSubmit={handleCheckout}>
                    <div className="form-group">
                      <label htmlFor="order-type">Order Type</label>
                      <select
                        id="order-type"
                        value={orderType}
                        onChange={(e) => {
                          setOrderType(e.target.value as "dine-in" | "takeaway");
                          setSubmitError(null);
                        }}
                      >
                        <option value="dine-in">Dine-in</option>
                        <option value="takeaway">Takeaway</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label htmlFor="guests-count">Number of Guests</label>
                      <input
                        id="guests-count"
                        type="number"
                        min={1}
                        step={1}
                        value={guestsCount}
                        onChange={(e) => {
                          const value = Number(e.target.value);
                          setGuestsCount(Number.isFinite(value) && value > 0 ? Math.floor(value) : 1);
                          setSubmitError(null);
                        }}
                        placeholder="1"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="customer-phone">Phone Number</label>
                      <input
                        id="customer-phone"
                        type="tel"
                        value={customerPhone}
                        onChange={(e) => {
                          setCustomerPhone(e.target.value);
                          setSubmitError(null);
                        }}
                        placeholder="+1 234 567 8900"
                      />
                    </div>

                    {submitError && (
                      <div className="form-error">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10" />
                          <line x1="12" y1="8" x2="12" y2="12" />
                          <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                        {submitError}
                      </div>
                    )}

                    {submitSuccess && (
                      <div className="form-success">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        {submitSuccess}
                      </div>
                    )}

                    <div className="order-summary">
                      <div className="summary-row">
                        <span>Subtotal</span>
                        <span>${total}</span>
                      </div>
                      <div className="summary-row">
                        <span>Tax</span>
                        <span>$0</span>
                      </div>
                      <div className="summary-row total">
                        <span>Total</span>
                        <span>${total}</span>
                      </div>
                    </div>

                    <button
                      className="btn-checkout"
                      type="submit"
                      disabled={orders.length === 0 || isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <span className="spinner"></span>
                          Processing...
                        </>
                      ) : (
                        <>
                          Proceed to Payment
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="9 18 15 12 9 6" />
                          </svg>
                        </>
                      )}
                    </button>
                  </form>

                  <p className="secure-note">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    Secure checkout powered by Stripe
                  </p>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      <style jsx global>{`
        /* Corporate Trust Palette */
        :root {
          --primary: #0066FF;
          --primary-hover: #0052CC;
          --primary-light: #E6F0FF;
          --secondary: #64748B;
          --bg: #F8FAFC;
          --bg-card: #FFFFFF;
          --text: #1E293B;
          --text-secondary: #475569;
          --text-muted: #64748B;
          --border: #E2E8F0;
          --border-light: #F1F5F9;
          --success: #10B981;
          --success-light: #D1FAE5;
          --error: #EF4444;
          --error-light: #FEE2E2;
          --radius: 8px;
          --radius-md: 12px;
          --radius-lg: 16px;
          --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
          --shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
          --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
        }

        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: var(--bg);
          color: var(--text);
          line-height: 1.6;
          -webkit-font-smoothing: antialiased;
          min-height: 100vh;
        }

        .page-container {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }

        .page-header {
          background: var(--bg-card);
          border-bottom: 1px solid var(--border);
          padding: 16px 24px;
        }

        .back-link {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: var(--text-secondary);
          text-decoration: none;
          font-size: 0.875rem;
          font-weight: 500;
          transition: color 0.15s ease;
        }

        .back-link:hover {
          color: var(--primary);
        }

        .cart-wrapper {
          flex: 1;
          max-width: 1200px;
          width: 100%;
          margin: 0 auto;
          padding: 32px 24px;
        }

        .cart-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 32px;
        }

        .cart-header h1 {
          font-size: 1.75rem;
          font-weight: 700;
          color: var(--text);
          letter-spacing: -0.02em;
          margin-bottom: 4px;
        }

        .cart-subtitle {
          color: var(--text-muted);
          font-size: 0.875rem;
        }

        .btn-clear {
          background: transparent;
          color: var(--error);
          border: 1px solid var(--error);
          padding: 8px 16px;
          border-radius: var(--radius);
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .btn-clear:hover {
          background: var(--error-light);
        }

        .cart-layout {
          display: grid;
          grid-template-columns: 1fr 400px;
          gap: 32px;
          align-items: start;
        }

        /* Empty State */
        .empty-state {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          padding: 64px 32px;
          text-align: center;
        }

        .empty-icon {
          width: 80px;
          height: 80px;
          background: var(--border-light);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 24px;
          color: var(--text-muted);
        }

        .empty-state h3 {
          font-size: 1.25rem;
          font-weight: 600;
          color: var(--text);
          margin-bottom: 8px;
        }

        .empty-state p {
          color: var(--text-muted);
          margin-bottom: 24px;
        }

        .btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: var(--primary);
          color: white;
          font-size: 0.9375rem;
          font-weight: 500;
          padding: 12px 24px;
          border-radius: var(--radius);
          text-decoration: none;
          transition: all 0.15s ease;
        }

        .btn-primary:hover {
          background: var(--primary-hover);
        }

        /* Cart Items */
        .cart-items-list {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .cart-item {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          padding: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          transition: all 0.15s ease;
        }

        .cart-item:hover {
          border-color: var(--secondary);
          box-shadow: var(--shadow);
        }

        .cart-item-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .item-name {
          font-size: 1rem;
          font-weight: 600;
          color: var(--text);
        }

        .item-meta {
          font-size: 0.875rem;
          color: var(--text-muted);
        }

        .cart-item-actions {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .item-price {
          font-size: 1.125rem;
          font-weight: 700;
          color: var(--text);
        }

        .btn-remove {
          background: transparent;
          border: 1px solid var(--border);
          color: var(--text-muted);
          width: 40px;
          height: 40px;
          border-radius: var(--radius);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .btn-remove:hover {
          background: var(--error-light);
          border-color: var(--error);
          color: var(--error);
        }

        /* Checkout Section */
        .checkout-section {
          position: sticky;
          top: 24px;
        }

        .checkout-card {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          padding: 24px;
          box-shadow: var(--shadow);
        }

        .checkout-card h2 {
          font-size: 1.125rem;
          font-weight: 600;
          color: var(--text);
          margin-bottom: 20px;
        }

        .form-group {
          margin-bottom: 16px;
        }

        .form-group label {
          display: block;
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--text);
          margin-bottom: 6px;
        }

        .form-group input,
        .form-group select {
          width: 100%;
          padding: 12px 14px;
          font-size: 0.9375rem;
          border: 1px solid var(--border);
          border-radius: var(--radius);
          background: var(--bg-card);
          color: var(--text);
          transition: all 0.15s ease;
        }

        .form-group input:focus,
        .form-group select:focus {
          outline: none;
          border-color: var(--primary);
          box-shadow: 0 0 0 3px var(--primary-light);
        }

        .form-group input::placeholder {
          color: var(--text-muted);
        }

        .form-error {
          display: flex;
          align-items: center;
          gap: 8px;
          background: var(--error-light);
          color: var(--error);
          padding: 12px 16px;
          border-radius: var(--radius);
          font-size: 0.875rem;
          margin-bottom: 16px;
        }

        .form-success {
          display: flex;
          align-items: center;
          gap: 8px;
          background: var(--success-light);
          color: var(--success);
          padding: 12px 16px;
          border-radius: var(--radius);
          font-size: 0.875rem;
          margin-bottom: 16px;
        }

        .order-summary {
          border-top: 1px solid var(--border);
          padding-top: 16px;
          margin-bottom: 16px;
        }

        .summary-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          font-size: 0.875rem;
          color: var(--text-secondary);
        }

        .summary-row.total {
          border-top: 1px solid var(--border);
          margin-top: 8px;
          padding-top: 16px;
          font-size: 1rem;
          font-weight: 700;
          color: var(--text);
        }

        .btn-checkout {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: var(--primary);
          color: white;
          font-size: 0.9375rem;
          font-weight: 600;
          padding: 14px 24px;
          border: none;
          border-radius: var(--radius);
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .btn-checkout:hover:not(:disabled) {
          background: var(--primary-hover);
        }

        .btn-checkout:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .spinner {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .secure-note {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          margin-top: 16px;
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        /* Responsive */
        @media (max-width: 900px) {
          .cart-layout {
            grid-template-columns: 1fr;
          }

          .checkout-section {
            position: static;
          }
        }

        @media (max-width: 640px) {
          .cart-header {
            flex-direction: column;
            gap: 16px;
          }

          .cart-wrapper {
            padding: 24px 16px;
          }

          .cart-item {
            flex-direction: column;
            align-items: flex-start;
            gap: 16px;
          }

          .cart-item-actions {
            width: 100%;
            justify-content: space-between;
          }

          .btn-remove {
            width: 100%;
            height: 44px;
          }
        }
      `}</style>
    </div>
  );
}
