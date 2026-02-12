# Al-Asala: Full-Stack Multi-Tenant SaaS Platform

Al-Asala is a modern **multi-tenant restaurant SaaS** built with a full‑stack Next.js architecture.  
It provides a beautiful public menu experience, plus an internal admin dashboard for managing orders,
revenue and tenants.

---

## 👤 Demo Access (for Recruiters)

### 🍽️ Public Menu (Customer View)

- **Menu**: https://alasala-saas.vercel.app/alasala/menu

> Place a test order using **Stripe Test Card** (`4242 4242 4242 4242`) to see the real-time update in the Dashboard.

### 🔐 Admin Dashboard

- **Login**: https://alasala-saas.vercel.app/login  
  - **Email**: `admin@demo.com`  
  - **Password**: `123456`

> This demo account is read-only for evaluation purposes.

---

## 🧰 Tech Stack

| Layer      | Technology                                              |
|-----------|----------------------------------------------------------|
| Framework | **Next.js 14/15** (App Router, React Server Components) |
| Language  | **TypeScript**                                          |
| Styling   | **Tailwind CSS**                                        |
| Backend   | **Supabase** (PostgreSQL + RLS + Auth)                  |
| Payments  | **Stripe** (Checkout Sessions + Webhooks)               |
| Charts    | **Recharts**                                            |

---

## ✨ Key Features

- **Multi-Tenant Architecture** – Each restaurant lives under its own slug  
  (for example: `/alasala/menu`).
- **Secure Payments** – Stripe Checkout with webhook handling and idempotency.
- **Role-Based Access Control (RBAC)** – OWNER / ADMIN / STAFF with middleware-enforced protection.
- **Admin Dashboard** – KPIs, revenue charts, order status breakdown, and recent orders table.
- **Server-Side Pricing** – Menu prices are always validated on the server; client values are ignored.

---

## 🧱 High-Level Structure

```bash
app/
  [slug]/              # Public restaurant pages (home, menu, cart, checkout)
  admin/dashboard/     # Protected admin dashboard
  api/checkout/        # Stripe checkout session creation
  api/webhook/stripe/  # Stripe webhook handler

components/
  ui/                  # Reusable UI components (Button, Card, Input, Modal, Badge)
  layout/              # Layout components (Navbar, Footer)

lib/
  rbac.ts              # Role-based access utilities
  stripe.ts            # Stripe client singleton
  payment-logger.ts    # Payment event logging
  supabase-*.ts        # Supabase clients (admin/server/browser)

supabase/
  migrations/          # SQL migrations for tenants, orders, payments, etc.
```

---

## 🚀 Roadmap

- Migrating manual menu configuration to **Supabase Database** for dynamic management.

---

## 🛠 Getting Started (Local)

```bash
# 1. Clone
git clone https://github.com/osma8797/alasala-saas.git
cd alasala-saas

# 2. Install dependencies
npm install

# 3. Environment variables
cp .env.example .env.local
# Fill in Supabase + Stripe keys

# 4. Run dev server
npm run dev
```

---

## 📜 Useful Scripts

| Command                  | Description                 |
|--------------------------|-----------------------------|
| `npm run dev`            | Start development server    |
| `npm run build`          | Build for production        |
| `npm run start`          | Run production build        |
| `npm run lint`           | Run ESLint                  |
| `npm run test`           | Run tests with Vitest       |

---

## 🔐 Notes on Security

- Middleware-based **RBAC** on `/admin` routes.
- Supabase **Row-Level Security (RLS)** on core tables.
- Stripe webhooks verified with a signing secret, with idempotent order creation.

---

## 📄 License

This repository is currently **private** and intended for portfolio and evaluation purposes only.
