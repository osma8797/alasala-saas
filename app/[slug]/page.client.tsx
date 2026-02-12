"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

const getSlugFromParams = (params: ReturnType<typeof useParams>) => {
  const value = params?.slug;
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value[0] ?? "";
  return "";
};

export default function HomePage() {
  const routeParams = useParams();
  const slug = getSlugFromParams(routeParams);
  const [isNavOpen, setIsNavOpen] = useState(false);

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

  const handleAnchorClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    const href = event.currentTarget.getAttribute("href");
    if (!href || !href.startsWith("#")) return;

    event.preventDefault();
    const target = document.querySelector(href);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    setIsNavOpen(false);
  };

  return (
    <div dir="ltr" lang="en">
      <nav aria-label="Main navigation">
        <div className="nav-container">
          <div className="logo">Al Asala</div>

          <button
            className="nav-toggle"
            id="navToggle"
            aria-label="Toggle menu"
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
            <a href="#about" aria-label="About" onClick={handleAnchorClick}>
              About
            </a>
            <a href="#story" aria-label="Our Story" onClick={handleAnchorClick}>
              Our Story
            </a>
            <Link
              href={`/${slug}/menu`}
              aria-label="View Menu"
              onClick={() => setIsNavOpen(false)}
            >
              Menu
            </Link>
            <a
              href="#locations"
              aria-label="Locations"
              onClick={handleAnchorClick}
            >
              Locations
            </a>
          </div>
        </div>
      </nav>

      <div className="page-offset" aria-hidden="true" />

      <section className="hero" role="banner">
        <div className="hero-content">
          <span className="hero-badge">Premium Middle Eastern Cuisine</span>
          <h1>Welcome to Al Asala</h1>
          <p>Experience authentic Middle Eastern flavors in a warm, welcoming atmosphere</p>
          <div className="hero-actions">
            <Link className="btn-primary" href={`/${slug}/menu`}>
              View Menu
            </Link>
            <a className="btn-secondary" href="#about" onClick={handleAnchorClick}>
              Learn More
            </a>
          </div>
        </div>
      </section>

      <section className="section" id="about">
        <div className="section-header">
          <span className="section-badge">Who We Are</span>
          <h2>About Us</h2>
        </div>
        <div className="card">
          <p>
            Al Asala Restaurant is your destination for an authentic Middle Eastern dining experience. 
            Founded with a vision to deliver traditional flavors with a modern touch, we focus on 
            quality ingredients and exceptional hospitality. Visit our dedicated page to learn more 
            about our story and what makes us unique.
          </p>
          <Link href={`/${slug}/about`} className="btn-link">
            Learn More
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </Link>
        </div>
      </section>

      <section className="section" id="story">
        <div className="section-header">
          <span className="section-badge">Our Journey</span>
          <h2>Our Story</h2>
        </div>
        <div className="card">
          <p>
            At Al Asala Restaurant, we offer a unique dining experience that blends traditional 
            Middle Eastern flavors with modern creativity. Our menu features a wide selection of 
            dishes inspired by Arabian heritage, prepared with the finest ingredients to ensure 
            unmatched quality. From delicious appetizers to rich main courses and traditional 
            desserts, we are here to offer you an experience that captivates the senses.
          </p>
        </div>
      </section>

      <section className="hero-second" aria-label="Secondary hero">
        <div className="hero-content">
          <span className="hero-badge">Exceptional Dining</span>
          <h1>A Premium Experience Awaits</h1>
          <p>Enjoy an elegant atmosphere and captivating flavors at Al Asala Restaurant</p>
          <a className="btn-primary" href="#locations" onClick={handleAnchorClick}>
            Our Locations
          </a>
        </div>
      </section>

      <section className="section" id="locations">
        <div className="section-header">
          <span className="section-badge">Find Us</span>
          <h2>Our Locations</h2>
        </div>
        <div className="card">
          <p>
            Visit us at our main branch in Al Khobar, where we welcome you to experience 
            authentic Arabian hospitality.
          </p>

          <div className="map-wrap">
            <iframe
              title="Al Asala Restaurant location in Al Khobar"
              src="https://www.google.com/maps?q=26.2172,50.1971&hl=en&z=14&output=embed"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>

          <div className="contact-info">
            <div className="contact-item">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <span>Prince Turki Street, Al Khobar, Saudi Arabia</span>
            </div>
            <div className="contact-item">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
              <a href="tel:+966530638477">+966 53 063 8477</a>
            </div>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <h3>Ready to Experience Authentic Flavors?</h3>
        <p>Explore our menu and discover the taste of tradition</p>
        <Link href={`/${slug}/menu`} className="btn-primary">
          View Full Menu
        </Link>
      </section>

      <footer>
        <div className="footer-content">
          <div className="footer-brand">
            <h3>Al Asala</h3>
            <p>Premium Middle Eastern Cuisine</p>
          </div>
          <div className="footer-links">
            <div className="footer-column">
              <h4>Contact</h4>
              <p>Al Khobar, Saudi Arabia</p>
              <a href="tel:+966530638477">+966 53 063 8477</a>
            </div>
            <div className="footer-column">
              <h4>Hours</h4>
              <p>Mon - Sun: 11:00 - 23:00</p>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2024 Al Asala Restaurant. All rights reserved.</p>
        </div>
      </footer>

      <style jsx global>{`
        /* Corporate Trust Color Palette */
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
        nav {
          background: var(--bg-card);
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 1000;
          border-bottom: 1px solid var(--border);
          height: 64px;
          display: flex;
          align-items: center;
        }

        .nav-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
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

        .page-offset {
          height: 64px;
        }

        /* Hero Sections */
        .hero,
        .hero-second {
          min-height: 80vh;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          position: relative;
          padding: 60px 24px;
        }

        .hero {
          background: linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.5) 40%, rgba(0,0,0,0.3) 100%), url("/image/hero-1.jpg") center / cover no-repeat;
        }

        .hero-second {
          background: linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.5) 40%, rgba(0,0,0,0.3) 100%), url("/image/hero-2.jpg") center / cover no-repeat;
        }

        .hero-content {
          max-width: 700px;
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
        }

        .hero-content p {
          font-size: 1.25rem;
          color: rgba(255, 255, 255, 0.9);
          margin-bottom: 36px;
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
          padding: 14px 28px;
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

        /* Sections */
        .section {
          max-width: 800px;
          margin: 80px auto;
          padding: 0 24px;
        }

        .section-header {
          margin-bottom: 24px;
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

        .section h2 {
          font-size: 2rem;
          font-weight: 700;
          color: var(--text);
          letter-spacing: -0.02em;
        }

        .card {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          padding: 32px;
          box-shadow: var(--shadow);
        }

        .card p {
          font-size: 1rem;
          color: var(--text-secondary);
          line-height: 1.8;
        }

        .btn-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: var(--primary);
          font-size: 0.9375rem;
          font-weight: 500;
          text-decoration: none;
          margin-top: 20px;
          transition: gap 0.2s ease;
        }

        .btn-link:hover {
          gap: 10px;
        }

        /* Map */
        .map-wrap {
          margin-top: 24px;
          border-radius: var(--radius-md);
          overflow: hidden;
          border: 1px solid var(--border);
        }

        .map-wrap iframe {
          display: block;
          width: 100%;
          height: 350px;
          border: 0;
        }

        /* Contact Info */
        .contact-info {
          margin-top: 24px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .contact-item {
          display: flex;
          align-items: center;
          gap: 12px;
          color: var(--text-secondary);
          font-size: 0.9375rem;
        }

        .contact-item svg {
          color: var(--primary);
          flex-shrink: 0;
        }

        .contact-item a {
          color: var(--primary);
          text-decoration: none;
        }

        .contact-item a:hover {
          text-decoration: underline;
        }

        /* CTA Section */
        .cta-section {
          background: var(--primary-light);
          padding: 64px 24px;
          text-align: center;
        }

        .cta-section h3 {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--text);
          margin-bottom: 8px;
        }

        .cta-section p {
          color: var(--text-secondary);
          margin-bottom: 24px;
        }

        .cta-section .btn-primary {
          background: var(--primary);
          color: white;
        }

        .cta-section .btn-primary:hover {
          background: var(--primary-hover);
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

          .hero,
          .hero-second {
            min-height: 60vh;
          }

          .hero-content h1 {
            font-size: 2rem;
          }

          .hero-content p {
            font-size: 1rem;
          }

          .section {
            margin: 48px auto;
          }

          .card {
            padding: 24px;
          }

          .footer-content {
            grid-template-columns: 1fr;
            gap: 32px;
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
