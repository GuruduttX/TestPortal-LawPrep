import AdminDashboardShell from '@/app/admin/_components/AdminDashboardShell';
import { requireAdminSession } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardLayout({ children }) {
  await requireAdminSession();

  return <AdminDashboardShell>{children}</AdminDashboardShell>;
}
