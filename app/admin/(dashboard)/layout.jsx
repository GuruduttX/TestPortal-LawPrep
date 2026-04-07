import { logoutAction } from '@/app/admin/actions';
import AdminSidebar from '@/app/admin/_components/AdminSidebar';
import { requireAdminSession } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardLayout({ children }) {
  await requireAdminSession();

  return (
    <div className="flex h-screen">
      <AdminSidebar />

      <div className="flex flex-1 flex-col pl-[240px]">
        {/* Top Header */}
        <header
          className="flex h-12 shrink-0 items-center justify-between px-6"
          style={{ background: 'linear-gradient(90deg, #1a1a2e, #16213e, #0f3460)', boxShadow: '0 2px 8px rgba(0,0,0,0.25)' }}
        >
          <div className="flex items-center gap-3">
            <span className="inline-block px-2 py-0.5 text-[10px] font-black tracking-wider text-white bg-green-600 rounded-sm uppercase">
              Exam System
            </span>
            <span className="text-[12px] font-bold tracking-wide uppercase" style={{ color: 'rgba(255,255,255,0.9)' }}>
              Administration Dashboard
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[11px] font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>
              {new Date().toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
            </span>
            <form action={logoutAction}>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold rounded-sm uppercase tracking-wider transition-all"
                style={{ color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            </form>
          </div>
        </header>

        {/* Red accent bar */}
        <div className="h-1 shrink-0" style={{ background: 'linear-gradient(90deg, #e94560, #c0392b)' }} />

        {/* Main content */}
        <main className="flex-1 overflow-y-auto" style={{ background: '#f4f6f9' }}>
          <div className="px-6 py-6 max-w-[1280px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
