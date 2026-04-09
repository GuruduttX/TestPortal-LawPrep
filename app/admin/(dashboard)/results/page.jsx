import Link from 'next/link';

import { setResultPublishAction } from '@/app/admin/actions';
import { getExamSummaries } from '@/lib/dashboard-data';
import dbConnect from '@/lib/mongodb';
import Attempt from '@/lib/models/Attempt';
import ResultFilters from './ResultFilters';

export const dynamic = 'force-dynamic';

export default async function AdminResultsPage({ searchParams }) {
  const params = await searchParams;
  const selectedExamId = params?.exam || '';
  const searchName = params?.search || '';
  const searchDate = params?.date || '';
  const exams = await getExamSummaries();

  await dbConnect();

  const query = {};
  if (selectedExamId) query.examId = selectedExamId;
  if (searchName) query.studentName = { $regex: searchName, $options: 'i' };
  if (searchDate) {
    const start = new Date(searchDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(searchDate);
    end.setHours(23, 59, 59, 999);
    query.submittedAt = { $gte: start, $lte: end };
  }

  const attempts = await Attempt.find(query).sort({ submittedAt: -1 }).limit(2000).lean();

  // Build exam lookup map
  const examMap = {};
  exams.forEach((e) => { examMap[e.id] = e; });

  // Compute stats — use exam.maxPossibleMarks as denominator (accounts for negative marking, section marks etc.)
  const totalSubmissions = attempts.length;
  const avgScore = totalSubmissions > 0
    ? (attempts.reduce((sum, a) => {
        const ex = examMap[String(a.examId)];
        const maxMarks = ex?.maxPossibleMarks > 0 ? ex.maxPossibleMarks : (ex?.questionCount || 1);
        return sum + (a.score / maxMarks) * 100;
      }, 0) / totalSubmissions).toFixed(1)
    : 0;
  const highestPct = totalSubmissions > 0
    ? Math.max(...attempts.map((a) => {
        const ex = examMap[String(a.examId)];
        const maxMarks = ex?.maxPossibleMarks > 0 ? ex.maxPossibleMarks : (ex?.questionCount || 1);
        return Math.max(0, Math.round((a.score / maxMarks) * 100));
      }))
    : 0;
  const examsWithSubs = new Set(attempts.map((a) => String(a.examId))).size;

  // Selected exam for publish toggle
  const selectedExam = selectedExamId ? exams.find((e) => e.id === selectedExamId) : null;

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight" style={{ color: '#1a1a2e' }}>Results & Analysis</h1>
          <p className="text-[12px] font-medium mt-0.5" style={{ color: '#636e72' }}>
            {selectedExam ? `Showing: ${selectedExam.title}` : 'All examination submissions'}
          </p>
        </div>
        {selectedExam && (
          <form action={setResultPublishAction}>
            <input type="hidden" name="examId" value={selectedExam.id} />
            <input type="hidden" name="resultPublished" value={selectedExam.resultPublished ? 'false' : 'true'} />
            <button type="submit"
              className="text-[11px] font-extrabold px-4 py-2 rounded-sm uppercase tracking-wider transition-all"
              style={selectedExam.resultPublished
                ? { background: '#f8d7da', color: '#721c24', border: '2px solid #f5c6cb' }
                : { background: '#d4edda', color: '#155724', border: '2px solid #a3d9b1' }
              }>
              {selectedExam.resultPublished ? '✗ Unpublish Results' : '✓ Publish Results'}
            </button>
          </form>
        )}
      </div>

      {/* Stats Strip */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total Submissions', value: totalSubmissions, border: '#0f3460' },
          { label: 'Exams w/ Submissions', value: examsWithSubs, border: '#27ae60' },
          { label: 'Average Score', value: `${avgScore}%`, border: '#f39c12' },
          { label: 'Highest Score', value: `${highestPct}%`, border: '#e94560' },
        ].map((s) => (
          <div key={s.label} className="bg-white px-4 py-3"
            style={{ borderTop: `3px solid ${s.border}`, border: '1px solid #dfe6e9', borderTopColor: s.border }}>
            <p className="text-[9px] font-extrabold uppercase tracking-widest" style={{ color: '#636e72' }}>{s.label}</p>
            <p className="text-2xl font-black mt-0.5" style={{ color: '#1a1a2e' }}>{s.value}</p>
          </div>
        ))}
      </div>

        {/* Professional Filters & Export */}
        <ResultFilters selectedExamId={selectedExamId} />

      {/* Filter + Publish Controls */}
      <div className="bg-white overflow-hidden" style={{ border: '1px solid #dfe6e9' }}>
        <div className="flex items-center justify-between px-4 py-2"
          style={{ background: '#f0f3f8', borderBottom: '1px solid #dfe6e9' }}>
          <div className="flex items-center gap-2">
            <svg className="w-3.5 h-3.5" style={{ color: '#0f3460' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            <span className="text-[10px] font-extrabold uppercase tracking-widest" style={{ color: '#636e72' }}>Quick Filter</span>
          </div>
          <span className="text-[10px] font-bold" style={{ color: '#b2bec3' }}>
            Showing {attempts.length} of {totalSubmissions} records
          </span>
        </div>
        <div className="flex items-center gap-1.5 px-4 py-2.5 flex-wrap">
          <Link href="/admin/results"
            className="px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider rounded-sm transition-all"
            style={!selectedExamId
              ? { background: '#0f3460', color: '#fff' }
              : { background: '#e2e3e5', color: '#636e72' }
            }>
            All Exams
          </Link>
          {exams.map((exam) => {
            const subCount = attempts.filter((a) => !selectedExamId && String(a.examId) === exam.id).length
              || (selectedExamId === exam.id ? attempts.length : 0);
            return (
              <Link key={exam.id} href={`/admin/results?exam=${exam.id}`}
                className="px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider rounded-sm transition-all inline-flex items-center gap-1.5"
                style={selectedExamId === exam.id
                  ? { background: '#0f3460', color: '#fff' }
                  : { background: '#e2e3e5', color: '#636e72' }
                }>
                {exam.title}
                <span className="text-[9px] font-bold px-1 rounded-sm"
                  style={selectedExamId === exam.id
                    ? { background: 'rgba(255,255,255,0.2)', color: '#fff' }
                    : { background: '#d1d5db', color: '#4b5563' }
                  }>
                  {exam.attemptCount}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Unified Data Table */}
      <div className="bg-white overflow-hidden" style={{ border: '1px solid #dfe6e9', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        {/* Table header */}
        <div className="flex items-center justify-between px-4 py-2.5"
          style={{ background: 'linear-gradient(90deg, #1a1a2e, #16213e)' }}>
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4" style={{ color: '#e94560' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h2 className="text-[13px] font-bold text-white tracking-wide">
              {selectedExam ? `${selectedExam.title.toUpperCase()} — SUBMISSIONS` : 'ALL SUBMISSIONS'}
            </h2>
          </div>
          <span className="text-[11px] font-bold" style={{ color: '#e94560' }}>
            {attempts.length} Records
          </span>
        </div>

        {/* Column headers — fixed, compact */}
        <div className="px-4 py-2" style={{ background: '#f0f3f8', borderBottom: '2px solid #0f3460' }}>
          <div className="grid gap-2 items-center text-[9px] font-extrabold uppercase tracking-widest"
            style={{ color: '#636e72', gridTemplateColumns: '40px 1fr 1fr 120px 80px 70px 80px 130px 60px' }}>
            <div className="text-center">#</div>
            <div>Candidate Name</div>
            {!selectedExam && <div>Exam</div>}
            {selectedExam && <div>Phone Number</div>}
            <div className="text-center">Phone</div>
            <div className="text-center">Score</div>
            <div className="text-center">%</div>
            <div className="text-center">Time</div>
            <div>Submitted</div>
            <div className="text-center">Action</div>
          </div>
        </div>

        {attempts.length === 0 ? (
          <div className="px-4 py-16 text-center text-[13px]" style={{ color: '#b2bec3' }}>
            No submissions found.
          </div>
        ) : (
          <div>
            {attempts.map((att, idx) => {
              const ex = examMap[String(att.examId)];
              const maxMarks = ex?.maxPossibleMarks > 0 ? ex.maxPossibleMarks : (ex?.questionCount || 1);
              // Clamp to 0 — score can be negative with heavy negative marking
              const pct = Math.max(0, Math.round((att.score / maxMarks) * 100));
              const timeMins = Math.floor(att.timeTaken / 60);
              const timeSecs = att.timeTaken % 60;

              // Score color
              let scoreBg, scoreColor;
              if (pct >= 70) { scoreBg = '#d4edda'; scoreColor = '#155724'; }
              else if (pct >= 40) { scoreBg = '#fff3cd'; scoreColor = '#856404'; }
              else { scoreBg = '#f8d7da'; scoreColor = '#721c24'; }

              return (
                <div key={att._id}
                  className="px-4 py-1.5 transition-colors hover:bg-blue-50/40"
                  style={{
                    background: idx % 2 === 0 ? '#ffffff' : '#f9fafb',
                    borderBottom: '1px solid #f0f0f0',
                  }}>
                  <div className="grid gap-2 items-center text-[12px]"
                    style={{ gridTemplateColumns: '40px 1fr 1fr 120px 80px 70px 80px 130px 60px' }}>
                    {/* S.No */}
                    <div className="text-center">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-extrabold"
                        style={{ background: '#f0f3f8', color: '#0f3460' }}>
                        {idx + 1}
                      </span>
                    </div>

                    {/* Candidate Name */}
                    <div className="font-bold truncate" style={{ color: '#1a1a2e' }}>
                      {att.studentName}
                    </div>

                    {/* Exam name OR Phone (depends on filter) */}
                    {!selectedExam ? (
                      <div className="truncate text-[11px]" style={{ color: '#636e72' }}>
                        {ex?.title || 'Unknown'}
                      </div>
                    ) : (
                      <div className="font-mono text-[11px]" style={{ color: '#636e72' }}>
                        {att.studentPhone}
                      </div>
                    )}

                    {/* Phone (always visible when showing all) */}
                    <div className="text-center font-mono text-[11px]" style={{ color: '#636e72' }}>
                      {!selectedExam ? att.studentPhone : (ex?.questionCount > 0 ? `${ex.questionCount}Q` : '—')}
                    </div>

                    {/* Score — show raw marks / max possible marks */}
                    <div className="text-center font-bold" style={{ color: att.score < 0 ? '#e94560' : '#1a1a2e' }}>
                      {att.score}/{maxMarks}
                    </div>

                    {/* Percentage badge */}
                    <div className="text-center">
                      <span className="inline-block px-2 py-0.5 text-[10px] font-extrabold rounded-sm"
                        style={{ background: scoreBg, color: scoreColor }}>
                        {pct}%
                      </span>
                    </div>

                    {/* Time */}
                    <div className="text-center text-[11px]" style={{ color: '#636e72' }}>
                      {timeMins}m {timeSecs}s
                    </div>

                    {/* Submitted */}
                    <div className="text-[10px] truncate" style={{ color: '#b2bec3' }}>
                      {new Date(att.submittedAt).toLocaleString('en-IN', {
                        day: '2-digit', month: 'short',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </div>

                    {/* Action */}
                    <div className="text-center">
                      <Link href={`/admin/report/${att._id}`}
                        className="inline-block px-2 py-1 text-[9px] font-extrabold uppercase tracking-wider transition-all rounded-sm"
                        style={{ background: '#0f3460', color: '#ffffff' }}>
                        View
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer */}
        {attempts.length > 0 && (
          <div className="px-4 py-2 flex items-center justify-between text-[10px] font-bold"
            style={{ background: '#f0f3f8', borderTop: '2px solid #dfe6e9', color: '#636e72' }}>
            <div className="flex items-center gap-4">
              <span>Total: <span style={{ color: '#1a1a2e' }}>{attempts.length}</span> candidates</span>
              <span>·</span>
              <span>Avg: <span style={{ color: '#f39c12' }}>{avgScore}%</span></span>
            </div>
            <div className="flex items-center gap-4">
              <span>Highest: <span style={{ color: '#27ae60' }}>
                {Math.max(...attempts.map((a) => a.score))}/{
                  selectedExam ? selectedExam.maxPossibleMarks ?? selectedExam.questionCount : '—'
                }
              </span></span>
              <span>Lowest: <span style={{ color: '#e94560' }}>
                {Math.min(...attempts.map((a) => a.score))}/{
                  selectedExam ? selectedExam.maxPossibleMarks ?? selectedExam.questionCount : '—'
                }
              </span></span>
            </div>
          </div>
        )}

        {/* Publish controls per exam (when showing all) */}
        {!selectedExam && exams.length > 0 && (
          <div className="px-4 py-2.5" style={{ background: '#f8f9fa', borderTop: '1px solid #dfe6e9' }}>
            <p className="text-[9px] font-extrabold uppercase tracking-widest mb-2" style={{ color: '#636e72' }}>
              Result Publication Controls
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              {exams.map((exam) => (
                <form key={exam.id} action={setResultPublishAction} className="contents">
                  <input type="hidden" name="examId" value={exam.id} />
                  <input type="hidden" name="resultPublished" value={exam.resultPublished ? 'false' : 'true'} />
                  <button type="submit"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider rounded-sm transition-all"
                    style={exam.resultPublished
                      ? { background: '#d4edda', color: '#155724', border: '1px solid #a3d9b1' }
                      : { background: '#f8d7da', color: '#721c24', border: '1px solid #f5c6cb' }
                    }>
                    <span className="h-1.5 w-1.5 rounded-full"
                      style={{ background: exam.resultPublished ? '#27ae60' : '#e94560' }} />
                    {exam.title} — {exam.resultPublished ? 'Published' : 'Hidden'}
                  </button>
                </form>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
