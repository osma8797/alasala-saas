import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// ============================================
// Role Definitions (mirrored from lib/rbac.ts)
// ============================================
// We inline these here because middleware runs in the Edge Runtime
// and cannot import from lib/ files that use Node.js APIs.

type UserRole = 'OWNER' | 'ADMIN' | 'STAFF';

const ROLE_LEVEL: Record<UserRole, number> = {
  STAFF: 1,
  ADMIN: 2,
  OWNER: 3,
};

/**
 * Routes and the minimum role required to access them.
 * If a route is not listed here, it is considered public.
 */
const PROTECTED_ROUTES: { pattern: string; minRole: UserRole }[] = [
  { pattern: '/admin', minRole: 'ADMIN' },
];

function hasMinRole(userRole: UserRole, requiredRole: UserRole): boolean {
  return (ROLE_LEVEL[userRole] ?? 0) >= (ROLE_LEVEL[requiredRole] ?? 0);
}

function getRequiredRole(pathname: string): UserRole | null {
  for (const route of PROTECTED_ROUTES) {
    if (pathname.startsWith(route.pattern)) {
      return route.minRole;
    }
  }
  return null;
}

// ============================================
// Middleware
// ============================================

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const pathname = request.nextUrl.pathname;
  const requiredRole = getRequiredRole(pathname);
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // If Supabase is not configured: public routes allowed, protected routes → login
  if (!supabaseUrl || !supabaseAnonKey) {
    if (requiredRole) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: Do not write any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make your app slow or
  // unresponsive due to session refresh issues.

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // ---- Public route: no auth needed ----
  if (!requiredRole) {
    // Redirect logged-in users away from login page
    if (pathname === '/login' && user) {
      const url = request.nextUrl.clone();
      url.pathname = '/admin/dashboard';
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  // ---- Protected route: require authentication ----
  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  // ---- Protected route: require correct role ----
  // Query the user's role from the users table.
  // We use the anon-key client here — RLS policy "users_read_own"
  // allows authenticated users to read their own row.
  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('role, is_active')
    .eq('id', user.id)
    .single();

  // If profile lookup fails (user not in public.users yet, or DB error),
  // deny access to protected routes as a safe default.
  if (profileError || !profile) {
    console.error('RBAC: Failed to fetch user profile:', profileError?.message);
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('error', 'profile_not_found');
    return NextResponse.redirect(url);
  }

  // Block inactive users
  if (!profile.is_active) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('error', 'account_disabled');
    return NextResponse.redirect(url);
  }

  // Check role hierarchy
  const userRole = profile.role as UserRole;
  if (!hasMinRole(userRole, requiredRole)) {
    // User is authenticated but lacks permission.
    // Redirect to a safe page instead of showing admin content.
    const url = request.nextUrl.clone();
    url.pathname = '/';
    url.searchParams.set('error', 'insufficient_permissions');
    return NextResponse.redirect(url);
  }

  // ---- All checks passed: allow access ----
  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes (for webhooks, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|api).*)',
  ],
};
