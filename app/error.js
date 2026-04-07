'use client';

import { useEffect } from 'react';

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error('[ExamPortal Error]', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4"
      style={{ background: '#f4f6f9' }}>
      <div className="max-w-lg w-full bg-white p-8 text-center"
        style={{ border: '1px solid #dfe6e9', borderTop: '4px solid #e94560', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
        <div className="flex items-center justify-center w-14 h-14 rounded-full mx-auto mb-5"
          style={{ background: '#fdecea' }}>
          <svg className="w-7 h-7" style={{ color: '#e94560' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
        </div>
        <h2 className="text-xl font-extrabold mb-2" style={{ color: '#1a1a2e' }}>Something went wrong</h2>
        <p className="text-[13px] font-medium mb-6 leading-relaxed" style={{ color: '#636e72' }}>
          An unexpected error occurred in the examination platform.<br />
          Please notify the invigilator or administrator if this persists.
        </p>
        {error?.digest && (
          <p className="text-[10px] font-mono mb-4 px-3 py-1.5 rounded-sm inline-block"
            style={{ background: '#f4f6f9', color: '#b2bec3' }}>
            Error ref: {error.digest}
          </p>
        )}
        <button
          onClick={() => reset()}
          className="inline-flex items-center gap-2 px-6 py-2.5 text-[12px] font-bold text-white rounded-sm uppercase tracking-wider transition-all hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, #0f3460, #1a5276)', boxShadow: '0 2px 8px rgba(15,52,96,0.3)' }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Try again
        </button>
      </div>
    </div>
  );
}
