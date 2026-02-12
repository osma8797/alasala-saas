"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

// Saudi phone number validation regex (+966 5X XXX XXXX)
const SAUDI_PHONE_REGEX = /^(\+966|00966|966)?[- ]?0?5[0-9]{8}$/;

interface ReservationForm {
  name: string;
  phone: string;
  date: string;
  time: string;
  guests: string;
  notes: string;
}

export default function ReservationsPage() {
  const params = useParams();
  const router = useRouter();
  const slug = typeof params?.slug === "string" ? params.slug : Array.isArray(params?.slug) ? params.slug[0] : "";

  const [form, setForm] = useState<ReservationForm>({
    name: "",
    phone: "",
    date: "",
    time: "",
    guests: "",
    notes: "",
  });
  const [errors, setErrors] = useState<Partial<ReservationForm>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: Partial<ReservationForm> = {};

    // Name validation (Arabic and English letters, spaces only)
    const nameRegex = /^[\u0600-\u06FFa-zA-Z\s]{2,50}$/;
    if (!form.name.trim()) {
      newErrors.name = "Name is required";
    } else if (!nameRegex.test(form.name.trim())) {
      newErrors.name = "Please enter a valid name (Arabic or English letters only)";
    }

    // Phone validation (Saudi format)
    const cleanPhone = form.phone.replace(/[\s-]/g, "");
    if (!cleanPhone) {
      newErrors.phone = "Phone number is required";
    } else if (!SAUDI_PHONE_REGEX.test(cleanPhone)) {
      newErrors.phone = "Please enter a valid Saudi phone number (+966 5X XXX XXXX)";
    }

    // Date validation
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDate = form.date ? new Date(form.date) : null;
    if (!form.date) {
      newErrors.date = "Date is required";
    } else if (selectedDate && selectedDate < today) {
      newErrors.date = "Please select a future date";
    }

    // Time validation
    if (!form.time) {
      newErrors.time = "Time is required";
    }

    // Guests validation
    if (!form.guests) {
      newErrors.guests = "Number of guests is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const formatPhoneNumber = (value: string): string => {
    // Remove all non-digit characters except +
    let cleaned = value.replace(/[^\d+]/g, "");
    
    // If starts with 05, add +966
    if (cleaned.startsWith("05")) {
      cleaned = "+966" + cleaned.substring(1);
    }
    // If starts with 5, add +966
    else if (cleaned.startsWith("5") && cleaned.length <= 9) {
      cleaned = "+966" + cleaned;
    }
    
    return cleaned;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setForm((prev) => ({ ...prev, phone: formatted }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Store reservation in localStorage
      const reservations = JSON.parse(localStorage.getItem("reservations") || "[]");
      const newReservation = {
        id: Date.now(),
        restaurant_slug: slug,
        ...form,
        guests_count: parseInt(form.guests) || 1,
        created_at: new Date().toISOString(),
      };
      reservations.push(newReservation);
      localStorage.setItem("reservations", JSON.stringify(reservations));

      setSubmitSuccess(true);
      
      // Reset form
      setForm({
        name: "",
        phone: "",
        date: "",
        time: "",
        guests: "",
        notes: "",
      });

      // Redirect after 2 seconds
      setTimeout(() => {
        router.push(`/${slug}/menu`);
      }, 2000);
    } catch (error) {
      console.error("Reservation error:", error);
      setErrors({ name: "Failed to submit reservation. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get minimum date (today)
  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };

  return (
    <div dir="ltr" lang="en" className="reservations-page">
      <nav>
        <div className="nav-container">
          <Link href={`/${slug}`} className="logo">Al Asala Restaurant</Link>
          <div className="nav-links">
            <Link href={`/${slug}`}>Home</Link>
            <Link href={`/${slug}/menu`}>Menu</Link>
            <Link href={`/${slug}/cart`}>Cart</Link>
          </div>
        </div>
      </nav>

      <main className="main-content">
        <div className="reservation-container">
          <div className="reservation-header">
            <h1>Book a Table</h1>
            <p>Reserve your spot for an unforgettable dining experience</p>
          </div>

          {submitSuccess ? (
            <div className="success-message">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              <h2>Reservation Confirmed!</h2>
              <p>Thank you for your reservation. We look forward to seeing you!</p>
              <p className="redirect-text">Redirecting to menu...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="reservation-form">
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
                  onChange={handlePhoneChange}
                  className={errors.phone ? "error" : ""}
                />
                {errors.phone && <span className="error-message">{errors.phone}</span>}
                <span className="helper-text">Format: +966 5X XXX XXXX</span>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="date">Date *</label>
                  <input
                    type="date"
                    id="date"
                    value={form.date}
                    min={getMinDate()}
                    onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))}
                    className={errors.date ? "error" : ""}
                  />
                  {errors.date && <span className="error-message">{errors.date}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="time">Time *</label>
                  <select
                    id="time"
                    value={form.time}
                    onChange={(e) => setForm((prev) => ({ ...prev, time: e.target.value }))}
                    className={errors.time ? "error" : ""}
                  >
                    <option value="">Select time</option>
                    <option value="11:00">11:00 AM</option>
                    <option value="12:00">12:00 PM</option>
                    <option value="13:00">1:00 PM</option>
                    <option value="14:00">2:00 PM</option>
                    <option value="15:00">3:00 PM</option>
                    <option value="18:00">6:00 PM</option>
                    <option value="19:00">7:00 PM</option>
                    <option value="20:00">8:00 PM</option>
                    <option value="21:00">9:00 PM</option>
                    <option value="22:00">10:00 PM</option>
                  </select>
                  {errors.time && <span className="error-message">{errors.time}</span>}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="guests">Number of Guests *</label>
                <select
                  id="guests"
                  value={form.guests}
                  onChange={(e) => setForm((prev) => ({ ...prev, guests: e.target.value }))}
                  className={errors.guests ? "error" : ""}
                >
                  <option value="">Select guests</option>
                  <option value="1">1 Guest</option>
                  <option value="2">2 Guests</option>
                  <option value="3">3 Guests</option>
                  <option value="4">4 Guests</option>
                  <option value="5">5 Guests</option>
                  <option value="6">6 Guests</option>
                  <option value="7">7 Guests</option>
                  <option value="8">8+ Guests</option>
                </select>
                {errors.guests && <span className="error-message">{errors.guests}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="notes">Special Requests (Optional)</label>
                <textarea
                  id="notes"
                  placeholder="Any dietary requirements or special requests?"
                  value={form.notes}
                  onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                />
              </div>

              <button type="submit" className="submit-btn" disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Confirm Reservation"}
              </button>
            </form>
          )}
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
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
          font-family: "Arial", sans-serif;
        }
        body {
          background-color: var(--bg);
          color: var(--text);
        }
        nav {
          background-color: var(--bg-card);
          padding: 0.8rem;
          position: fixed;
          width: 100%;
          top: 0;
          z-index: 1000;
          border-bottom: 1px solid var(--border);
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        .nav-container {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0 1rem;
        }
        .logo {
          font-size: 1.3rem;
          font-weight: bold;
          color: var(--text);
          text-decoration: none;
        }
        .nav-links a {
          color: var(--text-secondary);
          text-decoration: none;
          margin: 0 0.8rem;
          font-size: 1rem;
          transition: color 0.3s;
        }
        .nav-links a:hover {
          color: var(--primary);
        }
        .main-content {
          padding-top: 80px;
          min-height: 100vh;
          display: flex;
          justify-content: center;
          align-items: flex-start;
          padding: 100px 1rem 2rem;
        }
        .reservation-container {
          background: var(--bg-card);
          border-radius: 16px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
          padding: 2rem;
          width: 100%;
          max-width: 500px;
        }
        .reservation-header {
          text-align: center;
          margin-bottom: 2rem;
        }
        .reservation-header h1 {
          font-size: 1.75rem;
          font-weight: 700;
          color: var(--text);
          margin-bottom: 0.5rem;
        }
        .reservation-header p {
          color: var(--text-secondary);
          font-size: 0.95rem;
        }
        .reservation-form {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .form-group label {
          font-size: 0.9rem;
          font-weight: 600;
          color: var(--text);
        }
        .form-group input,
        .form-group select,
        .form-group textarea {
          padding: 0.75rem 1rem;
          border: 1px solid var(--border);
          border-radius: 8px;
          font-size: 1rem;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: var(--primary);
          box-shadow: 0 0 0 3px var(--primary-light);
        }
        .form-group input.error,
        .form-group select.error {
          border-color: var(--error);
        }
        .error-message {
          color: var(--error);
          font-size: 0.8rem;
        }
        .helper-text {
          color: var(--text-secondary);
          font-size: 0.75rem;
        }
        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }
        .submit-btn {
          background-color: var(--primary);
          color: white;
          border: none;
          padding: 1rem;
          font-size: 1rem;
          font-weight: 600;
          border-radius: 8px;
          cursor: pointer;
          transition: background-color 0.2s;
          margin-top: 0.5rem;
        }
        .submit-btn:hover:not(:disabled) {
          background-color: var(--primary-hover);
        }
        .submit-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        .success-message {
          text-align: center;
          padding: 2rem 1rem;
        }
        .success-message svg {
          color: var(--success);
          margin-bottom: 1rem;
        }
        .success-message h2 {
          font-size: 1.5rem;
          color: var(--text);
          margin-bottom: 0.5rem;
        }
        .success-message p {
          color: var(--text-secondary);
        }
        .redirect-text {
          margin-top: 1rem;
          font-size: 0.9rem;
          color: var(--text-secondary);
        }
        @media (max-width: 480px) {
          .form-row {
            grid-template-columns: 1fr;
          }
          .reservation-container {
            padding: 1.5rem;
          }
        }
      `}</style>
    </div>
  );
}
