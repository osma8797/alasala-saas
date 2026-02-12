-- Add restaurant_slug column to orders table for multi-tenant support
-- Each order will be linked to a specific restaurant

alter table public.orders 
add column if not exists restaurant_slug text;

-- Create index for faster queries by restaurant
create index if not exists idx_orders_restaurant_slug 
on public.orders (restaurant_slug);

-- Add comment for documentation
comment on column public.orders.restaurant_slug is 'Restaurant identifier for multi-tenant support';
