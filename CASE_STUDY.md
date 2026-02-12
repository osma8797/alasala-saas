# Case Study: Al Asala SaaS — Enterprise Restaurant Management Platform

## Executive Summary

Al Asala is a multi-tenant, enterprise-grade Restaurant Management System built from scratch as a solo engineer. The platform handles the full lifecycle of restaurant operations — from customer-facing digital menus and Stripe-powered payments to an admin dashboard with real-time analytics, role-based access control, and a complete audit trail.

**Built with:** Next.js 16, TypeScript (Strict), Supabase (PostgreSQL), Stripe, Tailwind CSS, Recharts, Vitest

**Key Numbers:**
- 7 database tables with Row-Level Security
- 3-tier RBAC system (Owner > Admin > Staff)
- 76 passing unit tests

---

## 1. Database Schema

7 tables with Row-Level Security:

- tenants — Restaurant/business entities (id, slug, name, settings, is_active)
- users — Extended profiles linked to Supabase Auth (id, email, role, tenant_id, is_active)
- orders — Customer orders (id, tenant_id, customer_name, phone, total_price, status)
- order_items — Individual items per order (id, order_id, item_name, quantity, price)
- payments — Transactional payment records (id, order_id, stripe_payment_id, amount, status)
- payment_logs — Append-only observability log (id, stripe_session_id, event_type, status)
- audit_logs — Immutable audit trail (id, actor_id, action, entity, old_values, new_values)

5 migration files, RLS on every table, 3 automatic triggers.

---

## 2. Security Model

| Layer | What It Does |
|-------|-------------|
| Middleware (Edge) | Auth check -> Profile fetch -> Active check -> Role hierarchy check |
| RLS Policies | Tenant isolation, role-based read/write at database level |
| Server-Side Pricing | Menu catalog is the single source of truth for prices |
| Webhook Signature | Stripe signature verification before processing any event |
| Idempotency | UNIQUE constraint + application check prevents duplicate processing |
| Audit Trail | Immutable log with automatic triggers — no delete/update policies |
| Service Role Isolation | Only webhooks and server actions use service role |

---

## 3. Testing Strategy

**Framework:** Vitest with jsdom environment
**Total:** 76 tests, 100% pass rate

| Test File | Tests | Coverage |
|-----------|-------|----------|
| auth-utils.test.ts | 20 | Email, password, name validation, signup form, sanitization |
| payment-logic.test.ts | 14 | Payment logging, session data building, log validation |
| utils.test.ts | 19 | Price formatting, date/time, slug parsing, classnames |
| checkout-api.test.ts | 12 | Checkout validation, server-side pricing, error handling |
| webhook-api.test.ts | 11 | Webhook signature, idempotency, event handling |

**Testing philosophy:** Focus unit tests on pure business logic (validation, formatting, data transformation). These functions are the most likely to have edge-case bugs and the easiest to test in isolation.

---

## 4. What I Would Do Differently

1. **Start with a proper design system** — I used inline styles initially and migrated to a more structured approach later. Starting with Tailwind utility classes from day one would have saved refactoring time.

2. **Add integration tests earlier** — Unit tests cover pure functions well, but I would add API route tests (mocking Stripe and Supabase) to catch integration issues sooner.

3. **Use Supabase generated types** — Instead of manually defining TypeScript types in types/index.ts, I would use supabase gen types to auto-generate them from the database schema. This eliminates type drift.

4. **Implement rate limiting** — The checkout API has no rate limiting. In production, I would add rate limiting via middleware or a service like Upstash.

---

## 5. Results and Impact

This project demonstrates the ability to:

- **Design and implement a multi-tenant architecture** from database schema to application routing
- **Build enterprise security features** (RBAC, audit logs, RLS) that go beyond basic authentication
- **Integrate third-party payment systems** with proper security (server-side validation, idempotency, webhook handling)
- **Make architectural trade-offs** and document the reasoning behind each decision
- **Write maintainable, tested code** with TypeScript strict mode, 76 unit tests, and clear separation of concerns

The codebase is production-ready for deployment and designed to scale to multiple restaurant tenants without code changes.

---

## 6. Tech Stack Summary

| Category | Technology | Why |
|----------|-----------|-----|
| Framework | Next.js 16 (App Router) | Server Components, Edge middleware, file-based routing |
| Language | TypeScript (Strict) | Type safety, better DX, fewer runtime errors |
| Database | Supabase (PostgreSQL) | RLS, Auth, real-time, managed infrastructure |
| Payments | Stripe | Industry standard, excellent webhook system, test mode |
| Styling | Tailwind CSS v4 | Utility-first, fast iteration, consistent design |
| Charts | Recharts | React-native charting, responsive, composable |
| Testing | Vitest | Fast, ESM-native, excellent TypeScript support |
| Linting | ESLint + Prettier | Code quality + consistent formatting |

---

*Built by Osama — Full-Stack Engineer, 2026*
