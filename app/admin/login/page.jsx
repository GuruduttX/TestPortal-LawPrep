import { redirect } from 'next/navigation';
import { loginAction } from '@/app/admin/actions';
import { isAdminAuthenticated } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export default async function AdminLoginPage({ searchParams }) {
  if (await isAdminAuthenticated()) redirect('/admin');

  const params = await searchParams;
  return (
    <main className="min-h-screen flex items-center justify-center p-4 sm:p-8 relative"
      style={{ backgroundColor: '#f4f6f9' }}>
      
      {/* Decorative Top Bar to match Dashboard */}
      <div className="absolute top-0 left-0 w-full">
        <div className="h-14 w-full flex items-center px-6" style={{ background: 'linear-gradient(90deg, #1a1a2e, #16213e, #0f3460)', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 flex items-center justify-center bg-white rounded p-0.5">
              <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <span className="text-white text-xs font-bold tracking-widest uppercase">Exam System</span>
          </div>
        </div>
        <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, #e94560, #c0392b)' }} />
      </div>

      <div className="w-full max-w-[420px] relative z-10 mx-auto transform translate-y-4">
        {/* Auth Card */}
        <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-gray-100/80 overflow-hidden">
          
          <div className="px-8 py-10">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold tracking-tight mb-2" style={{ color: '#1a1a2e' }}>Admin Authentication</h1>
              <p className="text-sm font-medium text-gray-500">Enter your credentials to access the portal</p>
            </div>

            {params?.error === 'invalid' && (
              <div className="mb-6 p-4 rounded-xl flex items-start gap-3" style={{ background: 'rgba(233,69,96,0.08)', border: '1px solid rgba(233,69,96,0.2)' }}>
                <svg className="w-5 h-5 mt-0.5 shrink-0" style={{ color: '#e94560' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div className="text-sm font-medium" style={{ color: '#c0392b' }}>
                  Authentication failed. Please check your credentials.
                </div>
              </div>
            )}

            <form action={loginAction} className="space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#16213e' }}>Username</label>
                <input 
                  type="text" 
                  name="username" 
                  required
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-sm outline-none transition-all focus:bg-white placeholder:text-gray-400 focus:border-[#0f3460] focus:ring-[3px] focus:ring-[#0f3460]/10"
                  placeholder="Enter your username" 
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#16213e' }}>Password</label>
                <input 
                  type="password" 
                  name="password" 
                  required
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-sm outline-none transition-all focus:bg-white placeholder:text-gray-400 focus:border-[#0f3460] focus:ring-[3px] focus:ring-[#0f3460]/10"
                  placeholder="••••••••" 
                />
              </div>

              <button 
                type="submit"
                className="w-full mt-4 py-3.5 px-4 rounded-xl text-white text-sm font-bold tracking-wide uppercase transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
                style={{ background: 'linear-gradient(135deg, #1a1a2e, #0f3460)' }}
              >
                Sign In
              </button>
            </form>

          </div>
          
          {/* Card Bottom Accent */}
          <div className="h-1.5 w-full" style={{ background: 'linear-gradient(90deg, #e94560, #c0392b)' }} />
        </div>

        {/* Footer */}
        <div className="mt-8 text-center px-4">
          <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: '#16213e', opacity: 0.5 }}>
            &copy; {new Date().getFullYear()} Exam System
          </p>
        </div>
      </div>
    </main>
  );
}
