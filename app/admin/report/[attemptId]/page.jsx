import Link from 'next/link';
import ResultClient from '@/app/result/[attemptId]/ResultClient';
import { getAttemptDetail } from '@/lib/dashboard-data';
import { requireAdminSession } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export default async function AdminFullReportPage({ params }) {
  await requireAdminSession();
  const { attemptId } = await params;
  const detail = await getAttemptDetail(attemptId);

  if (!detail) {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ background: '#f4f6f9' }}>
        <div className="text-center">
          <h1 className="text-xl font-extrabold" style={{ color: '#1a1a2e' }}>Attempt Not Found</h1>
          <Link href="/admin/results"
            className="mt-4 inline-block px-5 py-2.5 text-[12px] font-bold text-white uppercase tracking-wider rounded-sm"
            style={{ background: 'linear-gradient(135deg, #0f3460, #1a5276)' }}>
            ← Back to Results
          </Link>
        </div>
      </main>
    );
  }

  const { attempt, exam, questions } = detail;
  const totalQ = questions?.length || 0;
  const pct = totalQ ? Math.round((attempt.score / totalQ) * 100) : 0;

  // Compute correct / incorrect / skipped
  const studentAnswers = {};
  attempt.answers.forEach((a) => { studentAnswers[a.questionNumber] = a.selectedOption; });

  let correct = 0, incorrect = 0, skipped = 0;
  questions.forEach((q) => {
    const selected = studentAnswers[q.questionNumber];
    if (!selected) skipped++;
    else if (selected === q.correctAnswer) correct++;
    else incorrect++;
  });

  let pctColor, pctBg;
  if (pct >= 70) { pctColor = '#155724'; pctBg = '#d4edda'; }
  else if (pct >= 40) { pctColor = '#856404'; pctBg = '#fff3cd'; }
  else { pctColor = '#721c24'; pctBg = '#f8d7da'; }

  return (
    <main className="min-h-screen" style={{ background: '#f4f6f9' }}>
      {/* Full-width Header */}
      <header className="sticky top-0 z-50"
        style={{ background: 'linear-gradient(90deg, #1a1a2e, #16213e, #0f3460)', boxShadow: '0 2px 12px rgba(0,0,0,0.3)' }}>
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin/results"
              className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider transition-colors rounded-sm px-3 py-1.5"
              style={{ color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
              Back
            </Link>
            <div style={{ borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '16px' }}>
              <p className="text-[14px] font-bold text-white tracking-wide">
                CANDIDATE REPORT — {attempt.studentName?.toUpperCase()}
              </p>
              <p className="text-[10px] font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>
                {exam?.title || attempt.examTitle}
              </p>
            </div>
          </div>

          {/* Quick stats in header */}
          <div className="flex items-center gap-4">
            <div className="text-center px-3">
              <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.3)' }}>Score</p>
              <p className="text-[16px] font-black text-white">{attempt.score}/{totalQ}</p>
            </div>
            <div className="px-3 py-1.5 rounded-sm text-[14px] font-black"
              style={{ background: pctBg, color: pctColor }}>
              {pct}%
            </div>
            <div className="text-center px-3">
              <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.3)' }}>Time</p>
              <p className="text-[14px] font-bold text-white">
                {Math.floor(attempt.timeTaken / 60)}m {attempt.timeTaken % 60}s
              </p>
            </div>
          </div>
        </div>

        <div className="h-1" style={{ background: 'linear-gradient(90deg, #e94560, #c0392b)' }} />
      </header>

      {/* Candidate Info + Score Breakdown */}
      <div className="bg-white" style={{ borderBottom: '2px solid #dfe6e9' }}>
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="grid grid-cols-9 gap-4">
            {/* Candidate info */}
            <div className="col-span-2">
              <p className="text-[9px] font-extrabold uppercase tracking-widest" style={{ color: '#636e72' }}>Candidate</p>
              <p className="text-[14px] font-bold mt-0.5" style={{ color: '#1a1a2e' }}>{attempt.studentName}</p>
              <p className="text-[11px] font-mono" style={{ color: '#636e72' }}>{attempt.studentPhone}</p>
            </div>
            <div className="col-span-2">
              <p className="text-[9px] font-extrabold uppercase tracking-widest" style={{ color: '#636e72' }}>Examination</p>
              <p className="text-[13px] font-bold mt-0.5" style={{ color: '#1a1a2e' }}>{exam?.title || attempt.examTitle}</p>
              <p className="text-[11px]" style={{ color: '#636e72' }}>
                {new Date(attempt.submittedAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>

            {/* Answer breakdown */}
            <div className="col-span-5">
              <p className="text-[9px] font-extrabold uppercase tracking-widest mb-2" style={{ color: '#636e72' }}>Answer Breakdown</p>
              <div className="grid grid-cols-4 gap-3">
                <div className="px-3 py-2 rounded-sm" style={{ background: '#f0f3f8', border: '1px solid #dfe6e9' }}>
                  <p className="text-[9px] font-bold uppercase" style={{ color: '#636e72' }}>Total</p>
                  <p className="text-[20px] font-black" style={{ color: '#0f3460' }}>{totalQ}</p>
                </div>
                <div className="px-3 py-2 rounded-sm" style={{ background: '#d4edda', border: '1px solid #a3d9b1' }}>
                  <p className="text-[9px] font-bold uppercase" style={{ color: '#155724' }}>Correct</p>
                  <p className="text-[20px] font-black" style={{ color: '#155724' }}>{correct}</p>
                </div>
                <div className="px-3 py-2 rounded-sm" style={{ background: '#f8d7da', border: '1px solid #f5c6cb' }}>
                  <p className="text-[9px] font-bold uppercase" style={{ color: '#721c24' }}>Incorrect</p>
                  <p className="text-[20px] font-black" style={{ color: '#721c24' }}>{incorrect}</p>
                </div>
                <div className="px-3 py-2 rounded-sm" style={{ background: '#e2e3e5', border: '1px solid #d6d8db' }}>
                  <p className="text-[9px] font-bold uppercase" style={{ color: '#383d41' }}>Skipped</p>
                  <p className="text-[20px] font-black" style={{ color: '#383d41' }}>{skipped}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Full-page result content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <ResultClient
          attempt={attempt}
          exam={exam}
          questions={questions}
          isAdminView
        />
      </div>
    </main>
  );
}
