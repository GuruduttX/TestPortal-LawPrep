"use client";

import { useState } from 'react';
import { logoutAction } from '@/app/admin/actions';
import AdminSidebar from '@/app/admin/_components/AdminSidebar';

export default function AdminDashboardShell({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      <AdminSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <div className="flex flex-1 flex-col md:pl-[240px] transition-all duration-300">
        <header
          className="flex h-14 shrink-0 items-center justify-between px-4 md:px-6"
          style={{ background: 'linear-gradient(90deg, #1a1a2e, #16213e, #0f3460)', boxShadow: '0 2px 8px rgba(0,0,0,0.25)' }}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden text-white p-1 hover:bg-white/10 rounded-sm"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
              </svg>
            </button>

            <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-black tracking-wider text-white bg-green-600 rounded-sm uppercase">
              Exam System
            </span>
            <span className="text-[12px] font-bold tracking-wide uppercase truncate max-w-[150px] sm:max-w-none" style={{ color: 'rgba(255,255,255,0.9)' }}>
              Admin Panel
            </span>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <span className="hidden lg:inline-block text-[11px] font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>
              {new Date().toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
            </span>
            <form action={logoutAction}>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 text-[10px] sm:text-[11px] font-bold rounded-sm uppercase tracking-wider transition-all"
                style={{ color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="hidden xs:inline">Logout</span>
              </button>
            </form>
          </div>
        </header>

        <div className="h-0.5 shrink-0" style={{ background: 'linear-gradient(90deg, #e94560, #c0392b)' }} />

        <main className="flex-1 overflow-y-auto" style={{ background: '#f4f6f9' }}>
          <div className="px-3 py-4 sm:px-6 sm:py-6 w-full max-w-[1280px] mx-auto overflow-x-hidden">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
