import Link from 'next/link';

import {
  setExamStatusAction,
  setResultPublishAction,
  quickCreateExamAction
} from '@/app/admin/actions';
import ExamRowActions from '@/app/admin/_components/ExamRowActions';
import { getExamSummaries } from '@/lib/dashboard-data';

export const dynamic = 'force-dynamic';

export default async function AdminExamsPage() {
  const exams = await getExamSummaries();
  const liveCount = exams.filter((e) => e.status === 'published').length;
  const totalQ = exams.reduce((s, e) => s + e.questionCount, 0);
  const totalSubs = exams.reduce((s, e) => s + e.attemptCount, 0);

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight" style={{ color: '#1a1a2e' }}>Exam Management</h1>
          <p className="text-[12px] font-medium mt-0.5" style={{ color: '#636e72' }}>Manage all examinations</p>
        </div>
        <form action={quickCreateExamAction}>
          <button type="submit"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 text-[11px] font-bold text-white tracking-wide uppercase rounded-sm transition-all hover:opacity-90 cursor-pointer"
            style={{ background: 'linear-gradient(135deg, #0f3460, #1a5276)', boxShadow: '0 2px 8px rgba(15,52,96,0.3)' }}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Create New Exam
          </button>
        </form>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Exams', value: exams.length, border: '#0f3460' },
          { label: 'Live', value: liveCount, border: '#27ae60' },
          { label: 'Questions', value: totalQ, border: '#f39c12' },
          { label: 'Submissions', value: totalSubs, border: '#e94560' },
        ].map((s) => (
          <div key={s.label} className="bg-white px-4 py-3"
            style={{ border: '1px solid #dfe6e9', borderTop: `3px solid ${s.border}` }}>
            <p className="text-[9px] font-extrabold uppercase tracking-widest" style={{ color: '#636e72' }}>{s.label}</p>
            <p className="text-2xl font-black mt-0.5" style={{ color: '#1a1a2e' }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Exams Table — horizontal scroll prevents action buttons from overlapping */}
      <div
        className="bg-white overflow-hidden rounded-sm"
        style={{ border: '1px solid #dfe6e9', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
      >
        <div className="px-4 py-2.5 flex items-center justify-between"
          style={{ background: 'linear-gradient(90deg, #1a1a2e, #16213e)' }}>
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4" style={{ color: '#e94560' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h2 className="text-[12px] font-bold text-white tracking-wide">ALL EXAMINATIONS</h2>
          </div>
          <span className="text-[10px] font-bold" style={{ color: '#e94560' }}>{exams.length} Registered</span>
        </div>

        <div className="overflow-x-auto">
          {/* Column headers */}
          <div className="px-5 py-2 min-w-[1024px]" style={{ background: '#f0f3f8', borderBottom: '2px solid #0f3460' }}>
            <div
              className="grid items-center gap-x-3 text-[9px] font-extrabold uppercase tracking-widest"
              style={{
                color: '#636e72',
                gridTemplateColumns: 'minmax(140px,1fr) 76px 64px 64px 96px 96px minmax(380px,max-content)',
              }}
            >
              <div>Exam Name</div>
              <div className="text-center">Questions</div>
              <div className="text-center">Time</div>
              <div className="text-center">Subs</div>
              <div className="text-center">Status</div>
              <div className="text-center">Results</div>
              <div className="text-right pr-1">Actions</div>
            </div>
          </div>

        {exams.length === 0 ? (
          <div className="px-5 py-16 text-center min-w-[1024px]">
            <svg className="w-12 h-12 mx-auto mb-3" style={{ color: '#dfe6e9' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          <p className="text-[14px] font-bold" style={{ color: '#636e72' }}>No examinations created yet</p>
            <p className="text-[12px] mt-1" style={{ color: '#b2bec3' }}>Get started by creating your first exam</p>
            <form action={quickCreateExamAction} className="mt-4 inline-block">
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-5 py-2.5 text-[11px] font-bold text-white uppercase tracking-wider rounded-sm cursor-pointer"
                style={{ background: 'linear-gradient(135deg, #0f3460, #1a5276)' }}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Create First Exam
              </button>
            </form>
          </div>
        ) : (
          <>
            {exams.map((exam, idx) => (
              <div
                key={exam.id}
                className="px-5 py-3.5 transition-colors hover:bg-blue-50/40 min-w-[1024px]"
                style={{ background: idx % 2 === 0 ? '#ffffff' : '#f9fafb', borderBottom: '1px solid #eceff1' }}
              >
                <div
                  className="grid items-center gap-x-3 gap-y-2 text-[13px]"
                  style={{
                    gridTemplateColumns: 'minmax(140px,1fr) 76px 64px 64px 96px 96px minmax(380px,max-content)',
                  }}
                >
                  {/* Exam name */}
                  <div className="min-w-0 pr-2">
                    <p className="font-bold text-[#1a1a2e] leading-snug line-clamp-2">{exam.title}</p>
                    <p className="text-[10px] font-mono text-[#b2bec3] truncate mt-0.5" title={exam.slug}>
                      /{exam.slug}
                    </p>
                  </div>

                  {/* Questions */}
                  <div className="text-center font-bold tabular-nums" style={{ color: '#1a1a2e' }}>
                    {exam.questionCount}
                  </div>

                  {/* Duration */}
                  <div className="text-center text-[12px] tabular-nums" style={{ color: '#636e72' }}>
                    {exam.durationMinutes}m
                  </div>

                  {/* Submissions */}
                  <div className="text-center font-bold tabular-nums" style={{ color: '#1a1a2e' }}>
                    {exam.attemptCount}
                  </div>

                  {/* Status toggle */}
                  <div className="text-center flex justify-center">
                    <form action={setExamStatusAction} className="inline-flex items-center gap-1.5 hover:opacity-80 transition-opacity">
                      <input type="hidden" name="examId" value={exam.id} />
                      <input type="hidden" name="status" value={exam.status === 'published' ? 'draft' : 'published'} />
                      <button
                        type="submit"
                        title={exam.status === 'published' ? 'Change to Draft' : 'Publish as Live'}
                        className={`relative inline-flex h-[18px] w-8 items-center rounded-full transition-colors focus:outline-none shadow-inner ${
                          exam.status === 'published' ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-3 w-3 transform rounded-full bg-white shadow-sm transition-transform duration-200`}
                          style={{ transform: `translateX(${exam.status === 'published' ? '17px' : '3px'})` }}
                        />
                      </button>
                      <button type="submit" className={`text-[11px] font-bold w-7 text-left ${exam.status === 'published' ? 'text-green-700' : 'text-gray-500'}`}>
                        {exam.status === 'published' ? 'Live' : 'Draft'}
                      </button>
                    </form>
                  </div>

                  {/* Results toggle */}
                  <div className="text-center flex justify-center">
                    <form action={setResultPublishAction} className="inline-flex items-center gap-1.5 hover:opacity-80 transition-opacity">
                      <input type="hidden" name="examId" value={exam.id} />
                      <input type="hidden" name="resultPublished" value={exam.resultPublished ? 'false' : 'true'} />
                      <button
                        type="submit"
                        title={exam.resultPublished ? 'Hide results from students' : 'Make results public'}
                        className={`relative inline-flex h-[18px] w-8 items-center rounded-full transition-colors focus:outline-none shadow-inner ${
                          exam.resultPublished ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-3 w-3 transform rounded-full bg-white shadow-sm transition-transform duration-200`}
                          style={{ transform: `translateX(${exam.resultPublished ? '17px' : '3px'})` }}
                        />
                      </button>
                      <button type="submit" className={`text-[11px] font-bold w-10 text-left ${exam.resultPublished ? 'text-green-700' : 'text-gray-500'}`}>
                        {exam.resultPublished ? 'Public' : 'Hidden'}
                      </button>
                    </form>
                  </div>

                  {/* Actions toolbar */}
                  <div className="flex justify-end min-w-0">
                    <ExamRowActions examId={exam.id} examSlug={exam.slug} />
                  </div>
                </div>
              </div>
            ))}
          </>
        )}
        </div>

        {/* Footer */}
        {exams.length > 0 && (
          <div className="px-4 py-2 flex items-center justify-between text-[10px] font-bold"
            style={{ background: '#f0f3f8', borderTop: '1px solid #dfe6e9', color: '#636e72' }}>
            <span>{exams.length} exams · {liveCount} live</span>
            <span>{totalQ} questions · {totalSubs} submissions</span>
          </div>
        )}
      </div>
    </div>
  );
}
