import Link from 'next/link';
import { getExamSummaries } from '@/lib/dashboard-data';

export const dynamic = 'force-dynamic';

export default async function AdminOverviewPage() {
  const exams = await getExamSummaries();

  const totalQuestions = exams.reduce((s, e) => s + e.questionCount, 0);
  const totalAttempts = exams.reduce((s, e) => s + e.attemptCount, 0);
  const liveExams = exams.filter((e) => e.status === 'published').length;

  const stats = [
    { label: 'Total Exams', value: exams.length, color: '#0f3460', borderColor: '#0f3460' },
    { label: 'Live Exams', value: liveExams, color: '#27ae60', borderColor: '#27ae60' },
    { label: 'Question Bank', value: totalQuestions, color: '#f39c12', borderColor: '#f39c12' },
    { label: 'Submissions', value: totalAttempts, color: '#e94560', borderColor: '#e94560' },
  ];

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight" style={{ color: '#1a1a2e' }}>Dashboard Overview</h1>
          <p className="text-[12px] font-medium mt-0.5" style={{ color: '#636e72' }}>
            Examination platform summary and quick actions
          </p>
        </div>
        <Link href="/admin/exams"
          className="inline-flex items-center gap-2 px-4 py-2.5 text-[12px] font-bold text-white tracking-wide uppercase rounded-sm transition-all hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, #0f3460, #1a5276)', boxShadow: '0 2px 8px rgba(15,52,96,0.3)' }}>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          New Exam
        </Link>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-white p-5"
            style={{ border: '1px solid #dfe6e9', borderTop: `3px solid ${s.borderColor}`, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <p className="text-[10px] font-extrabold uppercase tracking-widest" style={{ color: '#636e72' }}>{s.label}</p>
            <p className="text-4xl font-black leading-tight mt-1" style={{ color: '#1a1a2e' }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-3">
        <Link href="/admin/exams"
          className="flex items-center gap-3 bg-white p-4 transition-all hover:translate-y-[-1px]"
          style={{ border: '1px solid #dfe6e9', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <div className="h-10 w-10 rounded-sm flex items-center justify-center" style={{ background: '#e8f4fd' }}>
            <svg className="w-5 h-5" style={{ color: '#0f3460' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </div>
          <div>
            <p className="text-[13px] font-bold" style={{ color: '#1a1a2e' }}>Create Exam</p>
            <p className="text-[11px]" style={{ color: '#b2bec3' }}>Add new examination</p>
          </div>
        </Link>
        <Link href="/admin/results"
          className="flex items-center gap-3 bg-white p-4 transition-all hover:translate-y-[-1px]"
          style={{ border: '1px solid #dfe6e9', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <div className="h-10 w-10 rounded-sm flex items-center justify-center" style={{ background: '#eafaf1' }}>
            <svg className="w-5 h-5" style={{ color: '#27ae60' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div>
            <p className="text-[13px] font-bold" style={{ color: '#1a1a2e' }}>View Results</p>
            <p className="text-[11px]" style={{ color: '#b2bec3' }}>Check submissions</p>
          </div>
        </Link>
        <Link href="/" target="_blank"
          className="flex items-center gap-3 bg-white p-4 transition-all hover:translate-y-[-1px]"
          style={{ border: '1px solid #dfe6e9', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <div className="h-10 w-10 rounded-sm flex items-center justify-center" style={{ background: '#fef5e7' }}>
            <svg className="w-5 h-5" style={{ color: '#f39c12' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
            </svg>
          </div>
          <div>
            <p className="text-[13px] font-bold" style={{ color: '#1a1a2e' }}>Student Portal</p>
            <p className="text-[11px]" style={{ color: '#b2bec3' }}>View public page</p>
          </div>
        </Link>
      </div>

      {/* Exam Table */}
      <div className="bg-white overflow-hidden" style={{ border: '1px solid #dfe6e9', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <div className="px-5 py-3 flex items-center justify-between"
          style={{ background: 'linear-gradient(90deg, #1a1a2e, #16213e)' }}>
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4" style={{ color: '#e94560' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h2 className="text-[13px] font-bold text-white tracking-wide">EXAMINATION REGISTER</h2>
          </div>
          <Link href="/admin/exams" className="text-[11px] font-bold tracking-wide" style={{ color: '#e94560' }}>
            MANAGE ALL →
          </Link>
        </div>

        {/* Column Headers */}
        <div className="px-5 py-2.5" style={{ background: '#f0f3f8', borderBottom: '2px solid #0f3460' }}>
          <div className="grid grid-cols-12 gap-2 text-[10px] font-bold uppercase tracking-widest" style={{ color: '#636e72' }}>
            <div className="col-span-3">Exam Name</div>
            <div className="col-span-2 text-center">Status</div>
            <div className="col-span-1 text-center">Questions</div>
            <div className="col-span-2 text-center">Duration</div>
            <div className="col-span-1 text-center">Attempts</div>
            <div className="col-span-1 text-center">Avg %</div>
            <div className="col-span-2 text-right">Action</div>
          </div>
        </div>

        {exams.length === 0 ? (
          <div className="px-5 py-16 text-center text-[13px]" style={{ color: '#636e72' }}>
            No examinations created yet.
          </div>
        ) : (
          <div>
            {exams.map((exam, idx) => {
              const avg = exam.questionCount
                ? Math.round((exam.averageScore / exam.questionCount) * 100) : 0;

              return (
                <div key={exam.id} className="px-5 py-3 transition-colors hover:bg-blue-50/40"
                  style={{ background: idx % 2 === 0 ? '#ffffff' : '#f9fafb' }}>
                  <div className="grid grid-cols-12 gap-2 items-center text-[13px]">
                    <div className="col-span-3">
                      <p className="font-bold" style={{ color: '#1a1a2e' }}>{exam.title}</p>
                      <p className="text-[10px] font-mono" style={{ color: '#b2bec3' }}>/{exam.slug}</p>
                    </div>
                    <div className="col-span-2 text-center">
                      {exam.status === 'published' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-sm text-[10px] font-extrabold uppercase"
                          style={{ background: '#d4edda', color: '#155724', border: '1px solid #a3d9b1' }}>
                          <span className="h-1.5 w-1.5 rounded-full bg-green-600" />
                          Live
                        </span>
                      ) : exam.status === 'archived' ? (
                        <span className="inline-block px-2.5 py-1 rounded-sm text-[10px] font-extrabold uppercase"
                          style={{ background: '#e2e3e5', color: '#383d41', border: '1px solid #d6d8db' }}>
                          Archived
                        </span>
                      ) : (
                        <span className="inline-block px-2.5 py-1 rounded-sm text-[10px] font-extrabold uppercase"
                          style={{ background: '#fff3cd', color: '#856404', border: '1px solid #ffc107' }}>
                          Draft
                        </span>
                      )}
                    </div>
                    <div className="col-span-1 text-center font-bold" style={{ color: '#1a1a2e' }}>{exam.questionCount}</div>
                    <div className="col-span-2 text-center" style={{ color: '#636e72' }}>{exam.durationMinutes} min</div>
                    <div className="col-span-1 text-center font-bold" style={{ color: '#1a1a2e' }}>{exam.attemptCount}</div>
                    <div className="col-span-1 text-center">
                      {exam.attemptCount > 0 ? (
                        <span className="font-extrabold" style={{ color: avg >= 60 ? '#27ae60' : avg >= 30 ? '#f39c12' : '#e94560' }}>
                          {avg}%
                        </span>
                      ) : (
                        <span style={{ color: '#dfe6e9' }}>—</span>
                      )}
                    </div>
                    <div className="col-span-2 text-right">
                      <Link href={`/admin/exams/${exam.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-sm text-[10px] font-extrabold uppercase tracking-wider transition-all hover:bg-[#0f3460] hover:text-white"
                        style={{ background: 'white', color: '#0f3460', border: '2px solid #0f3460' }}>
                        Manage →
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
