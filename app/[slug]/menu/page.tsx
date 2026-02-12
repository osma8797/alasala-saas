"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { MENU_ITEMS, getCategories, getCategoryLabel } from "@/constants/menu";

type Order = { name: string; price: number };

export default function MenuPage() {
  const { slug } = useParams();
  const slugValue =
    typeof slug === "string" ? slug : Array.isArray(slug) ? (slug[0] ?? "") : "";
  const basePath = slugValue ? `/${slugValue}` : "";
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState(getCategories()[0]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isReservationOpen, setIsReservationOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [reservationError, setReservationError] = useState("");
  const [showReservationConfirmation, setShowReservationConfirmation] = useState(false);
  const [showOrderConfirmation, setShowOrderConfirmation] = useState(false);
  const [orderedItem, setOrderedItem] = useState("");
  const [userName, setUserName] = useState("");
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [guests, setGuests] = useState("");
  const [phone, setPhone] = useState("");
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const storedOrders = localStorage.getItem("orders");
    if (storedOrders) {
      try {
        setOrders(JSON.parse(storedOrders));
      } catch {
        setOrders([]);
      }
    }

    if (window.location.hash === "#reservationModal") {
      setIsReservationOpen(true);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem("orders", JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    document.body.style.overflow = isNavOpen ? "hidden" : "";

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsNavOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isNavOpen]);

  const menuItems = useMemo(() => MENU_ITEMS, []);

  const addToOrder = (itemName: string, price: number) => {
    setOrders((prev) => [...prev, { name: itemName, price }]);
    setOrderedItem(itemName);
    setShowOrderConfirmation(true);
    window.setTimeout(() => setShowOrderConfirmation(false), 3000);
  };

  const removeFromCart = (index: number) => {
    setOrders((prev) => prev.filter((_, i) => i !== index));
  };

  const openReservation = () => {
    setReservationError("");
    setShowReservationConfirmation(false);
    setIsReservationOpen(true);
  };

  const closeReservation = () => {
    setShowReservationConfirmation(false);
    setIsReservationOpen(false);
  };

  const openCart = () => {
    setIsCartOpen(true);
  };

  const closeCart = () => {
    setIsCartOpen(false);
  };

  const buildCheckoutItems = (rawItems: Order[]) => {
    const grouped = new Map<string, { name: string; price: number; quantity: number }>();

    rawItems.forEach((item) => {
      const nameTrimmed = String(item.name ?? "").trim();
      const price = Number(item.price ?? 0);
      const safeName = nameTrimmed.length ? nameTrimmed : "Item";
      const safePrice = Number.isFinite(price) && price >= 0 ? price : 0;
      const key = `${safeName}@@${safePrice}`;

      const existing = grouped.get(key);
      if (existing) {
        existing.quantity += 1;
      } else {
        grouped.set(key, { name: safeName, price: safePrice, quantity: 1 });
      }
    });

    return Array.from(grouped.values());
  };

  const submitOrder = async () => {
    setReservationError("");
    setIsSubmittingOrder(true);

    try {
      if (!slugValue) {
        setReservationError("Restaurant not specified.");
        return;
      }

      const cleanedItems = buildCheckoutItems(orders);
      if (cleanedItems.length === 0) {
        setReservationError("Your cart is empty.");
        return;
      }

      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: cleanedItems,
          restaurantSlug: slugValue,
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
      setReservationError("Payment failed. Please try again.");
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  const handleReservationSubmit = async () => {
    const nameRegex = /^[\u0600-\u06FFa-zA-Z\s]+$/;
    const phoneRegex = /^(?:\+|00)?[0-9]{7,15}$/;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const pickedDate = date ? new Date(date) : null;

    if (
      !nameRegex.test(name) ||
      !pickedDate ||
      pickedDate < today ||
      !phoneRegex.test(phone.replace(/\s/g, "")) ||
      !guests
    ) {
      setReservationError("Please fill in all fields correctly.");
      return;
    }

    setReservationError("");
    const guestsCount = guests === "5+" ? 5 : Number(guests);

    try {
      const existing = JSON.parse(localStorage.getItem("reservations") || "[]");
      const next = Array.isArray(existing) ? existing : [];
      next.push({
        restaurant_slug: slugValue,
        name: name.trim(),
        date,
        guests_count: guestsCount,
        phone: phone.trim(),
        created_at: new Date().toISOString(),
      });
      localStorage.setItem("reservations", JSON.stringify(next));
    } catch {
      // Ignore errors
    }

    alert("Your reservation has been confirmed!");
    closeReservation();
    setName("");
    setDate("");
    setGuests("");
    setPhone("");
    setShowReservationConfirmation(false);
    setUserName("");
  };

  const categoryLabel = (category: string) => getCategoryLabel(category);

  const cartTotal = orders.reduce((sum, item) => sum + item.price, 0);

  return (
    <div dir="ltr" lang="en">
      {/* Navigation */}
      <nav role="navigation" aria-label="Main Navigation">
        <div className="nav-container">
          <div className="logo">Al Asala</div>

          <button
            className="nav-toggle"
            aria-label="Toggle Menu"
            aria-expanded={isNavOpen}
            onClick={() => setIsNavOpen((prev) => !prev)}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>

          <div className={`nav-links${isNavOpen ? " open" : ""}`} id="navLinks">
            <Link href={`${basePath}#about`} onClick={() => setIsNavOpen(false)}>
              About
            </Link>
            <a href="#menu" onClick={() => setIsNavOpen(false)}>
              Menu
            </a>
            <a
              href="#reservationModal"
              onClick={(event) => {
                event.preventDefault();
                setIsNavOpen(false);
                openReservation();
              }}
            >
              Reservations
            </a>
            <button className="nav-cart-btn" onClick={() => { setIsNavOpen(false); openCart(); }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
              {orders.length > 0 && <span className="cart-badge">{orders.length}</span>}
            </button>
          </div>
        </div>
      </nav>

      <div className="page-offset" aria-hidden="true" />

      {/* Hero Section */}
      <section className="hero" role="banner">
        <div className="hero-content">
          <span className="hero-badge">Premium Middle Eastern Cuisine</span>
          <h1>Authentic Flavors,<br />Modern Experience</h1>
          <p>Discover our carefully curated menu of traditional dishes, prepared with the finest ingredients and served with passion.</p>
          <div className="hero-actions">
            <a href="#menu" className="btn-primary">
              View Menu
            </a>
            <a
              href="#reservationModal"
              className="btn-secondary"
              onClick={(event) => {
                event.preventDefault();
                openReservation();
              }}
            >
              Book a Table
            </a>
          </div>
        </div>
      </section>

      {/* Menu Section */}
      <section className="menu-section" id="menu">
        <div className="section-header">
          <span className="section-badge">Our Selection</span>
          <h2>Menu</h2>
          <p>A curated selection of authentic dishes prepared fresh daily</p>
        </div>

        {/* Category Filters */}
        <div className="menu-filters">
          {getCategories().map((category) => (
            <button
              key={category}
              className={`filter-btn${activeCategory === category ? " active" : ""}`}
              onClick={() => setActiveCategory(category)}
            >
              {categoryLabel(category)}
            </button>
          ))}
        </div>

        {/* Menu Grid */}
        <div className="menu-grid">
          {menuItems.map((item) => (
            <div
              key={item.title}
              className="menu-card"
              data-category={item.category}
              style={{
                display: activeCategory === item.category ? "flex" : "none",
              }}
            >
              <div className="menu-card-image">
                <img src={item.img} alt={item.title} loading="lazy" />
              </div>
              <div className="menu-card-content">
                <h3>{item.title}</h3>
                <p className="menu-card-desc">{item.description}</p>
                <div className="menu-card-footer">
                  <span className="menu-card-price">${item.price}</span>
                  <div className="menu-card-actions">
                    <Link href={`${basePath}/menu/${item.slug}`} className="btn-text">
                      Details
                    </Link>
                    <button
                      className="btn-add"
                      onClick={() => addToOrder(item.title, item.price)}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                      Add
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Reservation Modal */}
      <div
        className={`modal-overlay${isReservationOpen ? " active" : ""}`}
        onClick={(e) => { if (e.target === e.currentTarget) closeReservation(); }}
        style={{ display: isReservationOpen ? "flex" : "none" }}
      >
        <div className="modal-content">
          <button className="modal-close" onClick={closeReservation}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
          <h2>Book a Table</h2>
          <p className="modal-subtitle">Reserve your spot for an unforgettable dining experience</p>

          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input
              type="text"
              id="name"
              placeholder="John Smith"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="date">Date & Time</label>
            <input
              type="datetime-local"
              id="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="guests">Guests</label>
              <select
                id="guests"
                value={guests}
                onChange={(e) => setGuests(e.target.value)}
              >
                <option value="" disabled>Select</option>
                <option value="1">1 Guest</option>
                <option value="2">2 Guests</option>
                <option value="3">3 Guests</option>
                <option value="4">4 Guests</option>
                <option value="5+">5+ Guests</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="phone">Phone</label>
              <input
                type="tel"
                id="phone"
                placeholder="+1 234 567 8900"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          {reservationError && (
            <div className="form-error">{reservationError}</div>
          )}

          <button className="btn-submit" onClick={handleReservationSubmit}>
            Confirm Reservation
          </button>
        </div>
      </div>

      {/* Cart Modal */}
      <div
        className={`modal-overlay${isCartOpen ? " active" : ""}`}
        onClick={(e) => { if (e.target === e.currentTarget) closeCart(); }}
        style={{ display: isCartOpen ? "flex" : "none" }}
      >
        <div className="modal-content cart-modal">
          <button className="modal-close" onClick={closeCart}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
          <h2>Your Cart</h2>

          {orders.length === 0 ? (
            <div className="cart-empty">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
              <p>Your cart is empty</p>
              <button className="btn-text" onClick={closeCart}>Continue Shopping</button>
            </div>
          ) : (
            <>
              <ul className="cart-items">
                {orders.map((order, index) => (
                  <li key={`${order.name}-${index}`}>
                    <div className="cart-item-info">
                      <span className="cart-item-name">{order.name}</span>
                      <span className="cart-item-price">${order.price}</span>
                    </div>
                    <button
                      className="cart-item-remove"
                      onClick={() => removeFromCart(index)}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </li>
                ))}
              </ul>

              <div className="cart-summary">
                <div className="cart-total">
                  <span>Total</span>
                  <span className="cart-total-price">${cartTotal}</span>
                </div>
                <button
                  className="btn-submit"
                  onClick={submitOrder}
                  disabled={isSubmittingOrder}
                >
                  {isSubmittingOrder ? "Processing..." : "Checkout"}
                </button>
              </div>
            </>
          )}

          {reservationError && (
            <div className="form-error">{reservationError}</div>
          )}
        </div>
      </div>

      {/* Order Confirmation Toast */}
      {showOrderConfirmation && (
        <div className="toast">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span>Added <strong>{orderedItem}</strong> to cart</span>
        </div>
      )}

      {/* Footer */}
      <footer>
        <div className="footer-content">
          <div className="footer-brand">
            <h3>Al Asala</h3>
            <p>Premium Middle Eastern Cuisine</p>
          </div>
          <div className="footer-links">
            <div className="footer-column">
              <h4>Contact</h4>
              <p>Prince Turki Street, Al Khobar</p>
              <a href="tel:+966530638477">+966 53 063 8477</a>
            </div>
            <div className="footer-column">
              <h4>Hours</h4>
              <p>Mon - Sun: 11:00 - 23:00</p>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2024 Al Asala. All rights reserved.</p>
        </div>
      </footer>

      <style jsx global>{`
        /* Corporate Trust Palette */
        :root {
          --primary: #0066FF;
          --primary-hover: #0052CC;
          --primary-light: #E6F0FF;
          --secondary: #64748B;
          --secondary-light: #94A3B8;
          --bg: #F8FAFC;
          --bg-card: #FFFFFF;
          --text: #1E293B;
          --text-secondary: #475569;
          --text-muted: #64748B;
          --border: #E2E8F0;
          --border-light: #F1F5F9;
          --success: #10B981;
          --error: #EF4444;
          --radius: 8px;
          --radius-md: 12px;
          --radius-lg: 16px;
          --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
          --shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
          --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
          --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
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
        }

        /* Navigation */
        nav[role="navigation"] {
          background: var(--bg-card);
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 1000;
          border-bottom: 1px solid var(--border);
        }

        .nav-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 24px;
          height: 64px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .logo {
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--text);
          letter-spacing: -0.02em;
        }

        .nav-toggle {
          display: none;
          background: transparent;
          border: none;
          color: var(--text);
          cursor: pointer;
          padding: 8px;
          border-radius: var(--radius);
        }

        .nav-toggle:hover {
          background: var(--border-light);
        }

        .nav-links {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .nav-links a {
          color: var(--text-secondary);
          text-decoration: none;
          font-size: 0.875rem;
          font-weight: 500;
          padding: 8px 16px;
          border-radius: var(--radius);
          transition: all 0.15s ease;
        }

        .nav-links a:hover {
          color: var(--text);
          background: var(--border-light);
        }

        .nav-cart-btn {
          display: flex;
          align-items: center;
          gap: 4px;
          background: var(--primary);
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: var(--radius);
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s ease;
          position: relative;
        }

        .nav-cart-btn:hover {
          background: var(--primary-hover);
        }

        .cart-badge {
          position: absolute;
          top: -4px;
          right: -4px;
          background: var(--error);
          color: white;
          font-size: 0.7rem;
          font-weight: 600;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .page-offset {
          height: 64px;
        }

        /* Hero Section */
        .hero {
          background: linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.5) 40%, rgba(0,0,0,0.35) 100%), url("/image/menu-hero.jpg") center / cover no-repeat;
          padding: 120px 24px;
          text-align: center;
          min-height: 70vh;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .hero-content {
          max-width: 700px;
          margin: 0 auto;
        }

        .hero-badge {
          display: inline-block;
          background: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(10px);
          color: white;
          font-size: 0.75rem;
          font-weight: 600;
          padding: 8px 16px;
          border-radius: 9999px;
          margin-bottom: 20px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .hero-content h1 {
          font-size: clamp(2.5rem, 6vw, 3.5rem);
          font-weight: 700;
          color: white;
          line-height: 1.1;
          margin-bottom: 20px;
          letter-spacing: -0.02em;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .hero-content p {
          font-size: 1.25rem;
          color: rgba(255, 255, 255, 0.9);
          margin-bottom: 36px;
          max-width: 520px;
          margin-left: auto;
          margin-right: auto;
          line-height: 1.7;
        }

        .hero-actions {
          display: flex;
          gap: 12px;
          justify-content: center;
          flex-wrap: wrap;
        }

        .btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: white;
          color: var(--primary);
          font-size: 0.9375rem;
          font-weight: 600;
          padding: 14px 28px;
          border-radius: var(--radius);
          text-decoration: none;
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.15);
        }

        .btn-primary:hover {
          background: var(--primary);
          color: white;
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(0, 102, 255, 0.4);
        }

        .btn-secondary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          color: white;
          font-size: 0.9375rem;
          font-weight: 500;
          padding: 12px 24px;
          border-radius: var(--radius);
          text-decoration: none;
          border: 1px solid rgba(255, 255, 255, 0.3);
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .btn-secondary:hover {
          background: rgba(255, 255, 255, 0.2);
          border-color: rgba(255, 255, 255, 0.5);
        }

        /* Menu Section */
        .menu-section {
          max-width: 1200px;
          margin: 0 auto;
          padding: 64px 24px;
        }

        .section-header {
          text-align: center;
          margin-bottom: 48px;
        }

        .section-badge {
          display: inline-block;
          background: var(--primary-light);
          color: var(--primary);
          font-size: 0.75rem;
          font-weight: 600;
          padding: 6px 12px;
          border-radius: 9999px;
          margin-bottom: 12px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .section-header h2 {
          font-size: 2rem;
          font-weight: 700;
          color: var(--text);
          margin-bottom: 8px;
          letter-spacing: -0.02em;
        }

        .section-header p {
          color: var(--text-muted);
          font-size: 1rem;
        }

        /* Menu Filters */
        .menu-filters {
          display: flex;
          gap: 8px;
          justify-content: center;
          margin-bottom: 32px;
          flex-wrap: wrap;
        }

        .filter-btn {
          background: var(--bg-card);
          color: var(--text-secondary);
          border: 1px solid var(--border);
          padding: 10px 20px;
          border-radius: 9999px;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .filter-btn:hover {
          border-color: var(--secondary-light);
          color: var(--text);
        }

        .filter-btn.active {
          background: var(--primary);
          color: white;
          border-color: var(--primary);
        }

        /* Menu Grid */
        .menu-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 24px;
        }

        .menu-card {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          overflow: hidden;
          display: flex;
          flex-direction: column;
          transition: all 0.2s ease;
        }

        .menu-card:hover {
          border-color: var(--secondary-light);
          box-shadow: var(--shadow-md);
          transform: translateY(-2px);
        }

        .menu-card-image {
          aspect-ratio: 4/3;
          overflow: hidden;
        }

        .menu-card-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.3s ease;
        }

        .menu-card:hover .menu-card-image img {
          transform: scale(1.05);
        }

        .menu-card-content {
          padding: 20px;
          display: flex;
          flex-direction: column;
          flex: 1;
        }

        .menu-card-content h3 {
          font-size: 1.125rem;
          font-weight: 600;
          color: var(--text);
          margin-bottom: 4px;
        }

        .menu-card-desc {
          font-size: 0.875rem;
          color: var(--text-muted);
          margin-bottom: 16px;
          flex: 1;
        }

        .menu-card-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .menu-card-price {
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--text);
        }

        .menu-card-actions {
          display: flex;
          gap: 8px;
        }

        .btn-text {
          background: transparent;
          color: var(--primary);
          font-size: 0.875rem;
          font-weight: 500;
          padding: 8px 12px;
          border: none;
          border-radius: var(--radius);
          cursor: pointer;
          text-decoration: none;
          transition: all 0.15s ease;
        }

        .btn-text:hover {
          background: var(--primary-light);
        }

        .btn-add {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: var(--primary);
          color: white;
          font-size: 0.875rem;
          font-weight: 500;
          padding: 8px 12px;
          border: none;
          border-radius: var(--radius);
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .btn-add:hover {
          background: var(--primary-hover);
        }

        /* Modal */
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1100;
          padding: 24px;
          backdrop-filter: blur(4px);
        }

        .modal-content {
          background: var(--bg-card);
          border-radius: var(--radius-lg);
          padding: 32px;
          max-width: 420px;
          width: 100%;
          position: relative;
          box-shadow: var(--shadow-lg);
          max-height: 90vh;
          overflow-y: auto;
        }

        .modal-content.cart-modal {
          max-width: 480px;
        }

        .modal-close {
          position: absolute;
          top: 16px;
          right: 16px;
          background: transparent;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          padding: 4px;
          border-radius: var(--radius);
          transition: all 0.15s ease;
        }

        .modal-close:hover {
          background: var(--border-light);
          color: var(--text);
        }

        .modal-content h2 {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--text);
          margin-bottom: 8px;
        }

        .modal-subtitle {
          color: var(--text-muted);
          font-size: 0.875rem;
          margin-bottom: 24px;
        }

        /* Form Elements */
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

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .form-error {
          background: #FEE2E2;
          color: var(--error);
          padding: 12px 16px;
          border-radius: var(--radius);
          font-size: 0.875rem;
          margin-bottom: 16px;
        }

        .btn-submit {
          width: 100%;
          background: var(--primary);
          color: white;
          font-size: 0.9375rem;
          font-weight: 500;
          padding: 14px 24px;
          border: none;
          border-radius: var(--radius);
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .btn-submit:hover:not(:disabled) {
          background: var(--primary-hover);
        }

        .btn-submit:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* Cart */
        .cart-empty {
          text-align: center;
          padding: 32px 0;
          color: var(--text-muted);
        }

        .cart-empty svg {
          margin-bottom: 16px;
          opacity: 0.5;
        }

        .cart-empty p {
          margin-bottom: 16px;
        }

        .cart-items {
          list-style: none;
          margin-bottom: 24px;
          max-height: 300px;
          overflow-y: auto;
        }

        .cart-items li {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 0;
          border-bottom: 1px solid var(--border-light);
        }

        .cart-items li:last-child {
          border-bottom: none;
        }

        .cart-item-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .cart-item-name {
          font-weight: 500;
          color: var(--text);
        }

        .cart-item-price {
          font-size: 0.875rem;
          color: var(--text-muted);
        }

        .cart-item-remove {
          background: transparent;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          padding: 8px;
          border-radius: var(--radius);
          transition: all 0.15s ease;
        }

        .cart-item-remove:hover {
          background: #FEE2E2;
          color: var(--error);
        }

        .cart-summary {
          border-top: 1px solid var(--border);
          padding-top: 16px;
        }

        .cart-total {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          font-size: 1rem;
          font-weight: 500;
        }

        .cart-total-price {
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--text);
        }

        /* Toast */
        .toast {
          position: fixed;
          bottom: 24px;
          left: 50%;
          transform: translateX(-50%);
          background: var(--text);
          color: white;
          padding: 12px 20px;
          border-radius: var(--radius);
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.875rem;
          box-shadow: var(--shadow-lg);
          z-index: 1200;
          animation: slideUp 0.3s ease;
        }

        .toast svg {
          color: var(--success);
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translate(-50%, 20px);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0);
          }
        }

        /* Footer */
        footer {
          background: var(--text);
          color: white;
          padding: 48px 24px 24px;
        }

        .footer-content {
          max-width: 1200px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1fr 2fr;
          gap: 48px;
          padding-bottom: 32px;
          border-bottom: 1px solid rgba(255,255,255,0.1);
        }

        .footer-brand h3 {
          font-size: 1.25rem;
          font-weight: 700;
          margin-bottom: 8px;
        }

        .footer-brand p {
          color: rgba(255,255,255,0.6);
          font-size: 0.875rem;
        }

        .footer-links {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 32px;
        }

        .footer-column h4 {
          font-size: 0.875rem;
          font-weight: 600;
          margin-bottom: 12px;
          color: rgba(255,255,255,0.6);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .footer-column p,
        .footer-column a {
          font-size: 0.875rem;
          color: rgba(255,255,255,0.8);
          margin-bottom: 8px;
          text-decoration: none;
          display: block;
        }

        .footer-column a:hover {
          color: white;
        }

        .footer-bottom {
          max-width: 1200px;
          margin: 0 auto;
          padding-top: 24px;
          text-align: center;
        }

        .footer-bottom p {
          font-size: 0.875rem;
          color: rgba(255,255,255,0.4);
        }

        /* Responsive */
        @media (max-width: 768px) {
          .nav-toggle {
            display: block;
          }

          .nav-links {
            position: fixed;
            top: 64px;
            left: 0;
            right: 0;
            background: var(--bg-card);
            border-bottom: 1px solid var(--border);
            padding: 16px;
            display: none;
            flex-direction: column;
            gap: 8px;
          }

          .nav-links.open {
            display: flex;
          }

          .nav-links a {
            width: 100%;
            text-align: center;
          }

          .nav-cart-btn {
            width: 100%;
            justify-content: center;
          }

          .hero {
            padding: 60px 24px;
            min-height: 50vh;
          }

          .hero-content h1 {
            font-size: 2rem;
          }

          .hero-content p {
            font-size: 1rem;
          }

          .form-row {
            grid-template-columns: 1fr;
          }

          .footer-content {
            grid-template-columns: 1fr;
            gap: 32px;
          }

          .menu-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 480px) {
          .hero-actions {
            flex-direction: column;
          }

          .btn-primary,
          .btn-secondary {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
}
