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

export default function AboutPage() {
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

  return (
    <div dir="ltr" lang="en">
      <nav>
        <div className="nav-container">
          <div className="logo">Al Asala</div>
          <button
            className="nav-toggle"
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
          <div className={`nav-links${isNavOpen ? " open" : ""}`}>
            <Link href={`/${slug}`} onClick={() => setIsNavOpen(false)}>
              Home
            </Link>
            <Link href={`/${slug}/about`} className="active" onClick={() => setIsNavOpen(false)}>
              About
            </Link>
            <Link href={`/${slug}/menu`} onClick={() => setIsNavOpen(false)}>
              Menu
            </Link>
          </div>
        </div>
      </nav>

      <div className="page-offset" />

      <main className="about-page">
        <div className="about-header">
          <span className="badge">Our Story</span>
          <h1>About Al Asala</h1>
          <p>A journey of authentic flavors and warm hospitality</p>
        </div>

        <section className="about-section">
          <div className="about-content">
            <div className="about-text">
              <h2>Our Heritage</h2>
              <p>
                Al Asala Restaurant is a unique destination that blends Middle Eastern heritage with 
                modern creativity. Established in 2010, our mission is to deliver an unforgettable 
                dining experience, focusing on using the finest quality ingredients to prepare dishes 
                inspired by authentic Middle Eastern traditions.
              </p>
              <p>
                Our team is dedicated to providing exceptional service in a warm and welcoming 
                atmosphere, where every dish tells a story of heritage and tradition.
              </p>
            </div>
            <div className="about-image">
              <img
                src="/image/osama992.JPG"
                alt="Al Asala Restaurant interior"
                loading="lazy"
              />
            </div>
          </div>
        </section>

        <section className="vision-section">
          <div className="vision-card">
            <h2>Our Vision</h2>
            <p>
              Our vision is to preserve Middle Eastern heritage by presenting authentic flavors in 
              innovative ways. Whether you are looking for a family dining experience or celebrating 
              a special occasion, we are here to make every moment memorable and unforgettable.
            </p>
          </div>
        </section>

        <section className="features-section">
          <h2 className="section-title">What Sets Us Apart</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                  <path d="M2 17l10 5 10-5" />
                  <path d="M2 12l10 5 10-5" />
                </svg>
              </div>
              <h3>Premium Quality</h3>
              <p>We use the finest local and imported ingredients</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <h3>Expert Team</h3>
              <p>Our chefs have years of experience in traditional cooking</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              </div>
              <h3>Unique Experience</h3>
              <p>Warm atmosphere and exceptional service</p>
            </div>
          </div>
        </section>

        <div className="cta-section">
          <h2>Ready to Experience Our Cuisine?</h2>
          <p>Explore our menu and discover the taste of tradition</p>
          <Link href={`/${slug}/menu`} className="btn-primary">
            View Menu
          </Link>
        </div>
      </main>

      <footer>
        <p>&copy; 2024 Al Asala Restaurant. All rights reserved.</p>
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

        .nav-links a:hover,
        .nav-links a.active {
          color: var(--primary);
          background: var(--primary-light);
        }

        .page-offset {
          height: 64px;
        }

        /* About Page */
        .about-page {
          max-width: 1200px;
          margin: 0 auto;
          padding: 48px 24px;
        }

        .about-header {
          text-align: center;
          margin-bottom: 64px;
        }

        .badge {
          display: inline-block;
          background: var(--primary-light);
          color: var(--primary);
          font-size: 0.75rem;
          font-weight: 600;
          padding: 6px 12px;
          border-radius: 9999px;
          margin-bottom: 16px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .about-header h1 {
          font-size: 2.5rem;
          font-weight: 700;
          color: var(--text);
          margin-bottom: 12px;
          letter-spacing: -0.02em;
        }

        .about-header p {
          font-size: 1.125rem;
          color: var(--text-muted);
        }

        /* About Sections */
        .about-section {
          margin-bottom: 64px;
        }

        .about-content {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 48px;
          align-items: center;
        }

        .about-section.reverse .about-content {
          direction: rtl;
        }

        .about-section.reverse .about-text {
          direction: ltr;
        }

        .about-text h2 {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--text);
          margin-bottom: 16px;
        }

        .about-text p {
          color: var(--text-secondary);
          margin-bottom: 16px;
          line-height: 1.8;
        }

        .about-image img {
          width: 100%;
          height: 350px;
          object-fit: cover;
          border-radius: var(--radius-md);
          box-shadow: var(--shadow-md);
        }

        /* Vision Section */
        .vision-section {
          margin-bottom: 64px;
        }

        .vision-card {
          background: var(--primary-light);
          border-radius: var(--radius-md);
          padding: 48px;
          text-align: center;
        }

        .vision-card h2 {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--text);
          margin-bottom: 16px;
        }

        .vision-card p {
          color: var(--text-secondary);
          max-width: 700px;
          margin: 0 auto;
          line-height: 1.8;
        }

        /* Features Section - New Layout */
        .features-section {
          margin-bottom: 64px;
          text-align: center;
        }

        .section-title {
          font-size: 1.75rem;
          font-weight: 700;
          color: var(--text);
          margin-bottom: 40px;
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 32px;
        }

        .feature-card {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          padding: 32px 24px;
          text-align: center;
          transition: all 0.2s ease;
        }

        .feature-card:hover {
          transform: translateY(-4px);
          box-shadow: var(--shadow-md);
          border-color: var(--primary);
        }

        .feature-card .feature-icon {
          width: 64px;
          height: 64px;
          background: var(--primary-light);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--primary);
          margin: 0 auto 20px;
        }

        .feature-card h3 {
          font-size: 1.125rem;
          font-weight: 600;
          color: var(--text);
          margin-bottom: 8px;
        }

        .feature-card p {
          font-size: 0.9375rem;
          color: var(--text-muted);
          margin: 0;
          line-height: 1.6;
        }

        /* Features */
        .features {
          display: flex;
          flex-direction: column;
          gap: 24px;
          margin-top: 24px;
        }

        .feature {
          display: flex;
          gap: 16px;
          align-items: flex-start;
        }

        .feature-icon {
          width: 48px;
          height: 48px;
          background: var(--primary-light);
          border-radius: var(--radius);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--primary);
          flex-shrink: 0;
        }

        .feature h3 {
          font-size: 1rem;
          font-weight: 600;
          color: var(--text);
          margin-bottom: 4px;
        }

        .feature p {
          font-size: 0.875rem;
          color: var(--text-muted);
          margin: 0;
        }

        /* CTA Section */
        .cta-section {
          text-align: center;
          padding: 64px 24px;
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
        }

        .cta-section h2 {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--text);
          margin-bottom: 8px;
        }

        .cta-section p {
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
          transform: translateY(-1px);
          box-shadow: var(--shadow-md);
        }

        /* Footer */
        footer {
          background: var(--text);
          color: rgba(255,255,255,0.6);
          padding: 24px;
          text-align: center;
          margin-top: 64px;
        }

        footer p {
          font-size: 0.875rem;
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

          .about-content {
            grid-template-columns: 1fr;
            gap: 32px;
          }

          .about-section.reverse .about-content {
            direction: ltr;
          }

          .about-header h1 {
            font-size: 2rem;
          }

          .vision-card {
            padding: 32px 24px;
          }

          .features-grid {
            grid-template-columns: 1fr;
            gap: 24px;
          }

          .section-title {
            font-size: 1.5rem;
            margin-bottom: 32px;
          }

          .about-image img {
            height: 280px;
          }
        }
      `}</style>
    </div>
  );
}
