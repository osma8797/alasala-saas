# Al Asala SaaS - Restaurant Management Platform

A multi-tenant, enterprise-grade Restaurant Management System built with Next.js, Supabase, and Stripe. Designed for restaurant chains that need centralized order management, payment processing, and role-based access control.

## Features

- **Multi-Tenant Architecture** - Each restaurant operates under its own slug (`/alasala/menu`, `/restaurant-b/menu`)
- **Stripe Payments** - Full checkout flow with webhook handling, idempotency, and payment lifecycle tracking
- **RBAC (Role-Based Access Control)** - Three roles (Owner, Admin, Staff) with middleware-enforced route protection
- **Admin Dashboard** - Real-time order tracking with revenue charts, status breakdowns, and popular item analytics
- **Audit Logs** - Immutable trail of all critical actions with automatic triggers for status changes
- **Server-Side Price Validation** - Prices are validated against the server catalog; client-sent prices are ignored

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript (Strict Mode) |
| Styling | Tailwind CSS v4 |
| Database | Supabase (PostgreSQL + RLS) |
| Auth | Supabase Auth |
| Payments | Stripe (Checkout + Webhooks) |
| Charts | Recharts |
| Testing | Vitest + Testing Library |
| Linting | ESLint + Prettier |

## Database Schema

7 tables with Row-Level Security (RLS) enabled:

```
tenants          - Restaurant/business entities
users            - Extended profiles linked to Supabase Auth (OWNER/ADMIN/STAFF roles)
orders           - Customer orders with tenant association
order_items      - Individual items per order
payments         - Transactional payment records (source of truth)
payment_logs     - Append-only observability log for debugging
audit_logs       - Immutable audit trail for compliance
```

## Project Structure

```
app/
  [slug]/              Multi-tenant public pages (menu, cart, checkout)
  admin/dashboard/     Protected admin dashboard with charts
  api/checkout/        Stripe checkout session creation
  api/webhook/stripe/  Stripe webhook handler
components/
  ui/                  Reusable UI components (Button, Card, Input, Modal, Badge)
  layout/              Layout components (Navbar, Footer)
lib/
  rbac.ts              Role-based access control utilities
  stripe.ts            Stripe client singleton
  payment-logger.ts    Payment event logging
  supabase-admin.ts    Service-role Supabase client
  supabase-server.ts   Server-side Supabase client
  supabase-browser.ts  Client-side Supabase client
  utils.ts             Formatting and helper functions
hooks/                 Custom React hooks (useCart, useCheckout)
types/                 Centralized TypeScript type definitions
constants/             Menu catalog (server-side price source of truth)
supabase/migrations/   5 SQL migration files
__tests__/             53 unit tests (auth, payments, utilities)
middleware.ts          Auth + RBAC enforcement (3-layer protection)
```

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project
- A [Stripe](https://stripe.com) account (test mode)

### Setup

```bash
# 1. Clone the repository
git clone https://github.com/osma8797/alasala-saas.git
cd alasala-saas

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase and Stripe keys

# 4. Run database migrations
# Option A: Supabase CLI
supabase link --project-ref <your-ref>
supabase db push

# Option B: Copy SQL from supabase/migrations/ into Supabase SQL Editor

# 5. Start development server
npm run dev
```

### Testing Payments Locally

Stripe webhooks require a public URL. For local development:

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Forward webhooks to your local server
stripe listen --forward-to localhost:3000/api/webhook/stripe
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run format` | Format code with Prettier |
| `npm run format:check` | Check formatting |
| `npm run test` | Run tests in watch mode |
| `npm run test:run` | Run tests once |
| `npm run test:coverage` | Run tests with coverage report |

## Security

- **Middleware RBAC** - Auth check -> Profile fetch -> Active check -> Role hierarchy check
- **Row-Level Security** - All tables have RLS policies; service role used only for webhooks
- **Server-Side Pricing** - Checkout API validates items against server catalog
- **Webhook Idempotency** - Duplicate Stripe events are detected and skipped
- **Audit Trail** - All payment and order status changes are automatically logged

## Architecture Decisions

1. **Multi-tenant via slug routing** - Allows adding new restaurants without code changes
2. **Payments vs Payment Logs** - Separate transactional table (payments) from observability log (payment_logs)
3. **Edge-compatible middleware** - RBAC logic inlined in middleware to avoid Node.js API dependencies
4. **Singleton Stripe client** - Single instance reused across API routes to avoid connection overhead

## License

Private - All rights reserved.
