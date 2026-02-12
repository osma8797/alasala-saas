-- Table Reservation with Pre-order schema
-- Creates `orders` and `order_items` with RLS enabled.

-- Needed for gen_random_uuid()
create extension if not exists "pgcrypto";

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_name text,
  phone_number text,
  reservation_date timestamp,
  guest_count integer,
  total_price numeric,
  status text not null default 'pending',
  created_at timestamp not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders (id) on delete cascade,
  item_name text,
  quantity integer,
  price numeric
);

alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- Ensure guest (anon) reservations can be created.
grant insert on table public.orders to anon;
grant insert on table public.order_items to anon;

drop policy if exists "anon_insert_orders" on public.orders;
create policy "anon_insert_orders"
on public.orders
for insert
to anon
with check (true);

drop policy if exists "anon_insert_order_items" on public.order_items;
create policy "anon_insert_order_items"
on public.order_items
for insert
to anon
with check (true);

-- Allow guests (anon) to read orders/items (needed for returning order id).
grant select on table public.orders to anon;
grant select on table public.order_items to anon;

drop policy if exists "anon_read_orders" on public.orders;
create policy "anon_read_orders"
on public.orders
for select
to anon
using (true);

drop policy if exists "anon_read_items" on public.order_items;
create policy "anon_read_items"
on public.order_items
for select
to anon
using (true);

