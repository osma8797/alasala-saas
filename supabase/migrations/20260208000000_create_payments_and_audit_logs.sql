-- ============================================
-- Migration: Create Payments & Audit Logs Tables
-- Phase 1 Blocker Fix: Enterprise Schema Upgrade
-- Date: 2026-02-08
-- ============================================

-- ============================================
-- 1. CREATE ENUM FOR PAYMENT STATUS
-- ============================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
        CREATE TYPE payment_status AS ENUM ('pending', 'succeeded', 'failed', 'refunded');
    END IF;
END $$;

-- ============================================
-- 2. CREATE PAYMENTS TABLE (Transactional)
-- ============================================
-- This is DISTINCT from payment_logs.
-- payment_logs = debugging/observability (append-only log)
-- payments     = transactional source of truth (status lifecycle)
-- ============================================
CREATE TABLE IF NOT EXISTS public.payments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id        UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    tenant_id       UUID REFERENCES public.tenants(id) ON DELETE SET NULL,
    stripe_payment_id TEXT UNIQUE,
    amount          DECIMAL(12, 2) NOT NULL CHECK (amount >= 0),
    currency        TEXT NOT NULL DEFAULT 'sar',
    status          payment_status NOT NULL DEFAULT 'pending',
    refunded_at     TIMESTAMP WITH TIME ZONE,
    metadata        JSONB DEFAULT '{}',
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON public.payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_tenant_id ON public.payments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_stripe_id ON public.payments(stripe_payment_id);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON public.payments(created_at DESC);

-- Comments
COMMENT ON TABLE public.payments IS 'Transactional payment records — source of truth for payment lifecycle';
COMMENT ON COLUMN public.payments.stripe_payment_id IS 'Stripe Payment Intent ID or Checkout Session ID (used for idempotency)';
COMMENT ON COLUMN public.payments.status IS 'Payment lifecycle: pending → succeeded/failed, succeeded → refunded';

-- Auto-update updated_at
DROP TRIGGER IF EXISTS update_payments_updated_at ON public.payments;
CREATE TRIGGER update_payments_updated_at
    BEFORE UPDATE ON public.payments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 3. CREATE AUDIT_LOGS TABLE
-- ============================================
-- Immutable append-only log of all critical actions.
-- No UPDATE or DELETE policies — audit logs are permanent.
-- ============================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id    UUID REFERENCES public.users(id) ON DELETE SET NULL,
    action      TEXT NOT NULL,
    entity      TEXT NOT NULL,
    entity_id   TEXT,
    old_values  JSONB,
    new_values  JSONB,
    ip_address  INET,
    user_agent  TEXT,
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_id ON public.audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON public.audit_logs(entity, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- Comments
COMMENT ON TABLE public.audit_logs IS 'Immutable audit trail — tracks all critical actions for compliance';
COMMENT ON COLUMN public.audit_logs.action IS 'Action performed, e.g. CREATE_ORDER, UPDATE_STATUS, DELETE_ORDER, LOGIN, CHANGE_ROLE';
COMMENT ON COLUMN public.audit_logs.entity IS 'Table/resource affected, e.g. orders, users, tenants, payments';
COMMENT ON COLUMN public.audit_logs.entity_id IS 'Primary key of the affected row (cast to text for uniformity)';
COMMENT ON COLUMN public.audit_logs.old_values IS 'Snapshot of changed fields BEFORE the action (null for CREATE)';
COMMENT ON COLUMN public.audit_logs.new_values IS 'Snapshot of changed fields AFTER the action (null for DELETE)';

-- ============================================
-- 4. ENABLE ROW LEVEL SECURITY
-- ============================================
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 5. RLS POLICIES FOR PAYMENTS
-- ============================================

-- Owners & Admins can read payments for their tenant
DROP POLICY IF EXISTS "payments_tenant_read" ON public.payments;
CREATE POLICY "payments_tenant_read"
ON public.payments
FOR SELECT
TO authenticated
USING (
    tenant_id IN (
        SELECT u.tenant_id FROM public.users u
        WHERE u.id = auth.uid()
          AND u.role IN ('OWNER', 'ADMIN')
    )
);

-- Only service_role can INSERT/UPDATE payments (webhooks & server actions)
DROP POLICY IF EXISTS "payments_service_role" ON public.payments;
CREATE POLICY "payments_service_role"
ON public.payments
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================
-- 6. RLS POLICIES FOR AUDIT_LOGS
-- ============================================

-- Owners & Admins can READ audit logs for their tenant's entities
-- (audit_logs don't have tenant_id directly, but we check via actor's tenant)
DROP POLICY IF EXISTS "audit_logs_admin_read" ON public.audit_logs;
CREATE POLICY "audit_logs_admin_read"
ON public.audit_logs
FOR SELECT
TO authenticated
USING (
    -- Actor belongs to the same tenant as the requesting user
    actor_id IN (
        SELECT u2.id FROM public.users u2
        WHERE u2.tenant_id IN (
            SELECT u1.tenant_id FROM public.users u1
            WHERE u1.id = auth.uid()
              AND u1.role IN ('OWNER', 'ADMIN')
        )
    )
    -- Also allow users to see their own actions
    OR actor_id = auth.uid()
);

-- No INSERT/UPDATE/DELETE for authenticated users — audit logs are immutable
-- Only service_role can write audit logs
DROP POLICY IF EXISTS "audit_logs_service_role" ON public.audit_logs;
CREATE POLICY "audit_logs_service_role"
ON public.audit_logs
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================
-- 7. GRANTS
-- ============================================

-- Payments: authenticated can read (filtered by RLS), service_role has full access
GRANT SELECT ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;

-- Audit Logs: authenticated can read (filtered by RLS), service_role has full access
GRANT SELECT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;

-- ============================================
-- 8. HELPER: Audit Log Function
-- ============================================
-- Reusable function to insert audit log entries from triggers or server code.
-- Called via: SELECT log_audit_event(actor, action, entity, entity_id, old, new)
-- ============================================
CREATE OR REPLACE FUNCTION log_audit_event(
    p_actor_id    UUID,
    p_action      TEXT,
    p_entity      TEXT,
    p_entity_id   TEXT DEFAULT NULL,
    p_old_values  JSONB DEFAULT NULL,
    p_new_values  JSONB DEFAULT NULL,
    p_ip_address  INET DEFAULT NULL,
    p_user_agent  TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_log_id UUID;
BEGIN
    INSERT INTO public.audit_logs (
        actor_id, action, entity, entity_id,
        old_values, new_values, ip_address, user_agent
    ) VALUES (
        p_actor_id, p_action, p_entity, p_entity_id,
        p_old_values, p_new_values, p_ip_address, p_user_agent
    )
    RETURNING id INTO v_log_id;

    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 9. TRIGGER: Auto-audit payment status changes
-- ============================================
CREATE OR REPLACE FUNCTION audit_payment_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        PERFORM log_audit_event(
            NULL,                                           -- actor (null = system/webhook)
            'UPDATE_PAYMENT_STATUS',                        -- action
            'payments',                                     -- entity
            NEW.id::TEXT,                                   -- entity_id
            jsonb_build_object('status', OLD.status),       -- old_values
            jsonb_build_object('status', NEW.status)        -- new_values
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_audit_payment_status ON public.payments;
CREATE TRIGGER trg_audit_payment_status
    AFTER UPDATE ON public.payments
    FOR EACH ROW
    EXECUTE FUNCTION audit_payment_status_change();

-- ============================================
-- 10. TRIGGER: Auto-audit order status changes
-- ============================================
CREATE OR REPLACE FUNCTION audit_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        PERFORM log_audit_event(
            NULL,                                           -- actor (null = system/webhook)
            'UPDATE_ORDER_STATUS',                          -- action
            'orders',                                       -- entity
            NEW.id::TEXT,                                   -- entity_id
            jsonb_build_object('status', OLD.status),       -- old_values
            jsonb_build_object('status', NEW.status)        -- new_values
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_audit_order_status ON public.orders;
CREATE TRIGGER trg_audit_order_status
    AFTER UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION audit_order_status_change();

-- ============================================
-- 11. BACKFILL: Create payment records for existing paid orders
-- ============================================
INSERT INTO public.payments (order_id, tenant_id, amount, currency, status, created_at)
SELECT
    o.id,
    o.tenant_id,
    COALESCE(o.total_price, 0),
    'sar',
    'succeeded'::payment_status,
    o.created_at
FROM public.orders o
WHERE o.status = 'paid'
  AND NOT EXISTS (
      SELECT 1 FROM public.payments p WHERE p.order_id = o.id
  );

-- ============================================
-- DONE! Migration complete.
-- Tables created: payments, audit_logs
-- Functions: log_audit_event()
-- Triggers: payment status audit, order status audit
-- ============================================
