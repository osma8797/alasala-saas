import { SupabaseClient } from '@supabase/supabase-js';
import type { DbUser, UserRole } from '@/types';

// ============================================
// Role Hierarchy & Permissions
// ============================================

/**
 * Role hierarchy: OWNER > ADMIN > STAFF
 * Higher number = more privileges
 */
const ROLE_LEVEL: Record<UserRole, number> = {
  STAFF: 1,
  ADMIN: 2,
  OWNER: 3,
};

/**
 * Routes and the minimum role required to access them
 */
const ROUTE_PERMISSIONS: { pattern: string; minRole: UserRole }[] = [
  { pattern: '/admin', minRole: 'ADMIN' },
];

// ============================================
// Core Functions
// ============================================

/**
 * Fetch the user's profile (including role) from the `users` table.
 * Uses the authenticated Supabase client so RLS is respected.
 *
 * @param supabase - An authenticated Supabase client (NOT service_role)
 * @param userId   - The auth.uid() of the user
 * @returns The user profile, or null if not found
 */
export async function getUserProfile(
  supabase: SupabaseClient,
  userId: string
): Promise<DbUser | null> {
  const { data, error } = await supabase
    .from('users')
    .select('id, email, full_name, avatar_url, role, tenant_id, is_active, last_login_at, created_at, updated_at')
    .eq('id', userId)
    .single();

  if (error || !data) {
    return null;
  }

  return data as DbUser;
}

/**
 * Check if a role meets or exceeds the minimum required role.
 *
 * @example
 * hasMinRole('OWNER', 'ADMIN') // true  — OWNER >= ADMIN
 * hasMinRole('STAFF', 'ADMIN') // false — STAFF < ADMIN
 */
export function hasMinRole(userRole: UserRole, requiredRole: UserRole): boolean {
  return ROLE_LEVEL[userRole] >= ROLE_LEVEL[requiredRole];
}

// ============================================
// Role Check Helpers
// ============================================

export function isOwner(role: UserRole): boolean {
  return role === 'OWNER';
}

export function isAdmin(role: UserRole): boolean {
  return role === 'ADMIN' || role === 'OWNER';
}

export function isStaff(role: UserRole): boolean {
  return role === 'STAFF' || role === 'ADMIN' || role === 'OWNER';
}

// ============================================
// Route Authorization
// ============================================

/**
 * Determine the minimum role required to access a given pathname.
 * Returns null if the route is public (no restriction).
 */
export function getRequiredRoleForRoute(pathname: string): UserRole | null {
  for (const route of ROUTE_PERMISSIONS) {
    if (pathname.startsWith(route.pattern)) {
      return route.minRole;
    }
  }
  return null;
}

/**
 * Check if a user with the given role can access a pathname.
 * Returns true for public routes (no restriction).
 */
export function canAccessRoute(role: UserRole, pathname: string): boolean {
  const requiredRole = getRequiredRoleForRoute(pathname);
  if (!requiredRole) return true;
  return hasMinRole(role, requiredRole);
}

// ============================================
// Audit Log Helper (server-side only)
// ============================================

export type AuditLogInput = {
  actorId: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  oldValues?: Record<string, unknown> | null;
  newValues?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
};

/**
 * Write an entry to the audit_logs table.
 * Must use a service_role client (bypasses RLS write restriction).
 */
export async function writeAuditLog(
  supabaseAdmin: SupabaseClient,
  input: AuditLogInput
): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin.from('audit_logs').insert({
      actor_id: input.actorId,
      action: input.action,
      entity: input.entity,
      entity_id: input.entityId || null,
      old_values: input.oldValues || null,
      new_values: input.newValues || null,
      ip_address: input.ipAddress || null,
      user_agent: input.userAgent || null,
    });

    if (error) {
      console.error('Failed to write audit log:', error.message);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Audit log write error:', err);
    return false;
  }
}
