"use client";

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function ResultFilters({ selectedExamId }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [name, setName] = useState(searchParams.get('search') || '');
  const [date, setDate] = useState(searchParams.get('date') || '');

  const handleApply = (e) => {
    if (e) e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    
    if (name.trim()) params.set('search', name.trim());
    else params.delete('search');

    if (date) params.set('date', date);
    else params.delete('date');

    router.push(`/admin/results?${params.toString()}`);
  };

  const handleReset = () => {
    setName('');
    setDate('');
    router.push('/admin/results' + (selectedExamId ? `?exam=${selectedExamId}` : ''));
  };

  const downloadUrl = `/api/admin/results/download?${searchParams.toString()}`;

  return (
    <div className="bg-white p-4 space-y-4" style={{ border: '1px solid #dfe6e9', borderRadius: '4px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
      <div className="flex flex-wrap items-end gap-4">
        {/* Name Search */}
        <div className="flex-1 min-w-[200px]">
          <label className="block text-[10px] font-extrabold uppercase tracking-widest mb-1.5" style={{ color: '#636e72' }}>
            Search Candidate
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="Enter name..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleApply()}
              style={{
                width: '100%',
                padding: '8px 12px',
                fontSize: '13px',
                border: '1px solid #dfe6e9',
                borderRadius: '4px',
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
              className="focus:border-[#0f3460]"
            />
          </div>
        </div>

        {/* Date Filter */}
        <div className="w-[180px]">
          <label className="block text-[10px] font-extrabold uppercase tracking-widest mb-1.5" style={{ color: '#636e72' }}>
            Submission Date
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            style={{
              width: '100%',
              padding: '7px 12px',
              fontSize: '13px',
              border: '1px solid #dfe6e9',
              borderRadius: '4px',
              outline: 'none',
            }}
            className="focus:border-[#0f3460]"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleApply}
            style={{
              background: '#0f3460',
              color: '#fff',
              padding: '8px 20px',
              fontSize: '12px',
              fontWeight: '700',
              borderRadius: '4px',
              cursor: 'pointer',
              border: 'none',
            }}
          >
            Filter
          </button>
          <button
            onClick={handleReset}
            style={{
              background: '#f1f2f6',
              color: '#57606f',
              padding: '8px 16px',
              fontSize: '12px',
              fontWeight: '700',
              borderRadius: '4px',
              cursor: 'pointer',
              border: '1px solid #dfe6e9',
            }}
          >
            Clear
          </button>
        </div>

        {/* Export Button */}
        <div className="ml-auto">
          <a
            href={downloadUrl}
            download
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: '#27ae60',
              color: '#fff',
              padding: '8px 24px',
              fontSize: '12px',
              fontWeight: '800',
              borderRadius: '4px',
              cursor: 'pointer',
              textDecoration: 'none',
              boxShadow: '0 2px 4px rgba(39, 174, 96, 0.2)',
            }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Download Excel (CSV)
          </a>
        </div>
      </div>
    </div>
  );
}
