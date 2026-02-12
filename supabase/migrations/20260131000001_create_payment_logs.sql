-- Payment Logs table for tracking all payment transactions
-- Records both successful and failed payments for debugging

create table if not exists public.payment_logs (
  id uuid primary key default gen_random_uuid(),
  stripe_session_id text,
  restaurant_slug text,
  event_type text not null,
  status text not null,
  amount numeric,
  currency text default 'sar',
  customer_email text,
  customer_phone text,
  error_message text,
  metadata jsonb,
  created_at timestamp not null default now()
);

-- Index for faster queries
create index if not exists idx_payment_logs_restaurant on public.payment_logs (restaurant_slug);
create index if not exists idx_payment_logs_status on public.payment_logs (status);
create index if not exists idx_payment_logs_created_at on public.payment_logs (created_at);

-- Enable RLS
alter table public.payment_logs enable row level security;

-- Allow service role to insert logs (webhook uses service role)
grant insert on table public.payment_logs to service_role;
grant select on table public.payment_logs to service_role;

-- Comment for documentation
comment on table public.payment_logs is 'Logs all payment transactions for debugging and audit purposes';
