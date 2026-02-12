import { redirect } from 'next/navigation';

/**
 * /admin -> redirect to /admin/dashboard
 * This ensures there's no dead page at the /admin root.
 */
export default function AdminPage() {
  redirect('/admin/dashboard');
}
