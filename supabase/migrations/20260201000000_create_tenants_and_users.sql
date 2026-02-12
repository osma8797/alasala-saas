-- ============================================
-- Migration: Create Tenants and Users Tables
-- Phase 1: Database Schema Completion
-- ============================================

-- ============================================
-- 1. CREATE ENUM FOR USER ROLES
-- ============================================
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('OWNER', 'ADMIN', 'STAFF');
    END IF;
END $$;

-- ============================================
-- 2. CREATE TENANTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    logo_url TEXT,
    settings JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add comment for documentation
COMMENT ON TABLE public.tenants IS 'Stores restaurant/business tenant information for multi-tenancy';
COMMENT ON COLUMN public.tenants.slug IS 'Unique URL-friendly identifier for the tenant (e.g., alasala)';
COMMENT ON COLUMN public.tenants.settings IS 'JSON object for tenant-specific settings (theme, features, etc.)';

-- ============================================
-- 3. CREATE USERS TABLE (Linked to Supabase Auth)
-- ============================================
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    role user_role NOT NULL DEFAULT 'STAFF',
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add comment for documentation
COMMENT ON TABLE public.users IS 'Extended user profile linked to Supabase Auth';
COMMENT ON COLUMN public.users.id IS 'References auth.users.id - automatically synced with Supabase Auth';
COMMENT ON COLUMN public.users.role IS 'User role: OWNER (full access), ADMIN (manage orders/menu), STAFF (view only)';

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON public.users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);

-- ============================================
-- 4. UPDATE ORDERS TABLE - Link to Tenant
-- ============================================
-- Add tenant_id column to orders if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'tenant_id'
    ) THEN
        ALTER TABLE public.orders ADD COLUMN tenant_id UUID REFERENCES public.tenants(id);
    END IF;
END $$;

-- Create index for tenant filtering
CREATE INDEX IF NOT EXISTS idx_orders_tenant_id ON public.orders(tenant_id);

-- ============================================
-- 5. ENABLE ROW LEVEL SECURITY
-- ============================================
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 6. RLS POLICIES FOR TENANTS
-- ============================================
-- Allow anyone to read active tenants (for public menu pages)
DROP POLICY IF EXISTS "tenants_public_read" ON public.tenants;
CREATE POLICY "tenants_public_read"
ON public.tenants
FOR SELECT
TO anon, authenticated
USING (is_active = true);

-- Allow authenticated users to manage their own tenant
DROP POLICY IF EXISTS "tenants_owner_all" ON public.tenants;
CREATE POLICY "tenants_owner_all"
ON public.tenants
FOR ALL
TO authenticated
USING (
    id IN (
        SELECT tenant_id FROM public.users 
        WHERE users.id = auth.uid() AND users.role = 'OWNER'
    )
);

-- Service role bypass for admin operations
DROP POLICY IF EXISTS "tenants_service_role" ON public.tenants;
CREATE POLICY "tenants_service_role"
ON public.tenants
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================
-- 7. RLS POLICIES FOR USERS
-- ============================================
-- Users can read their own profile
DROP POLICY IF EXISTS "users_read_own" ON public.users;
CREATE POLICY "users_read_own"
ON public.users
FOR SELECT
TO authenticated
USING (id = auth.uid());

-- Users can update their own profile (except role)
DROP POLICY IF EXISTS "users_update_own" ON public.users;
CREATE POLICY "users_update_own"
ON public.users
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Owners/Admins can read all users in their tenant
DROP POLICY IF EXISTS "users_tenant_read" ON public.users;
CREATE POLICY "users_tenant_read"
ON public.users
FOR SELECT
TO authenticated
USING (
    tenant_id IN (
        SELECT tenant_id FROM public.users 
        WHERE users.id = auth.uid() AND users.role IN ('OWNER', 'ADMIN')
    )
);

-- Owners can manage users in their tenant
DROP POLICY IF EXISTS "users_owner_manage" ON public.users;
CREATE POLICY "users_owner_manage"
ON public.users
FOR ALL
TO authenticated
USING (
    tenant_id IN (
        SELECT tenant_id FROM public.users 
        WHERE users.id = auth.uid() AND users.role = 'OWNER'
    )
);

-- Service role bypass for admin operations
DROP POLICY IF EXISTS "users_service_role" ON public.users;
CREATE POLICY "users_service_role"
ON public.users
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================
-- 8. GRANTS
-- ============================================
-- Grant access to authenticated users
GRANT SELECT ON public.tenants TO anon;
GRANT SELECT ON public.tenants TO authenticated;
GRANT ALL ON public.tenants TO service_role;

GRANT SELECT, UPDATE ON public.users TO authenticated;
GRANT ALL ON public.users TO service_role;

-- ============================================
-- 9. TRIGGER: Auto-update updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_tenants_updated_at ON public.tenants;
CREATE TRIGGER update_tenants_updated_at
    BEFORE UPDATE ON public.tenants
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 10. TRIGGER: Auto-create user profile on signup
-- ============================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        'STAFF'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users (only if not exists)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- ============================================
-- 11. INSERT DEFAULT TENANT: Alasala
-- ============================================
INSERT INTO public.tenants (name, slug, settings)
VALUES (
    'Al Asala Restaurant',
    'alasala',
    '{
        "currency": "SAR",
        "timezone": "Asia/Riyadh",
        "theme": "corporate-trust",
        "features": {
            "reservations": true,
            "online_ordering": true,
            "delivery": false
        }
    }'::jsonb
)
ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    updated_at = NOW();

-- ============================================
-- 12. UPDATE EXISTING ORDERS (Link to Alasala tenant)
-- ============================================
UPDATE public.orders
SET tenant_id = (SELECT id FROM public.tenants WHERE slug = 'alasala')
WHERE tenant_id IS NULL AND (restaurant_slug = 'alasala' OR restaurant_slug IS NULL);

-- ============================================
-- DONE!
-- ============================================
