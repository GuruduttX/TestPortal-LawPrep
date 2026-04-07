import Link from 'next/link';
import ResultClient from '@/app/result/[attemptId]/ResultClient';
import { getAttemptDetail } from '@/lib/dashboard-data';

export const dynamic = 'force-dynamic';

export default async function AdminAttemptDetailPage({ params }) {
  const { attemptId } = await params;
  const detail = await getAttemptDetail(attemptId);

  if (!detail) {
    return (
      <div className="py-16 text-center">
        <h1 className="text-lg font-extrabold" style={{ color: '#1a1a2e' }}>Attempt Not Found</h1>
        <Link href="/admin/results" className="mt-4 inline-block px-4 py-2 rounded-sm text-[12px] font-bold uppercase"
          style={{ background: 'white', color: '#0f3460', border: '2px solid #0f3460' }}>← Back</Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="bg-white overflow-hidden" style={{ border: '1px solid #dfe6e9' }}>
        <div className="px-5 py-3 flex items-center justify-between"
          style={{ background: 'linear-gradient(90deg, #1a1a2e, #16213e)' }}>
          <div className="flex items-center gap-3">
            <Link href="/admin/results" className="text-[11px] font-bold flex items-center gap-1"
              style={{ color: 'rgba(255,255,255,0.4)' }}>
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
              RESULTS
            </Link>
            <span style={{ color: 'rgba(255,255,255,0.2)' }}>|</span>
            <h1 className="text-[13px] font-bold text-white tracking-wide">
              CANDIDATE: {detail.attempt.studentName?.toUpperCase()}
            </h1>
          </div>
          <span className="text-[11px] font-bold" style={{ color: '#e94560' }}>
            {detail.exam?.title || detail.attempt.examTitle}
          </span>
        </div>
        <div className="px-5 py-2.5 flex items-center gap-6 text-[11px] font-bold"
          style={{ background: '#f0f3f8', borderBottom: '2px solid #dfe6e9', color: '#636e72' }}>
          <span>Score: <span style={{ color: '#1a1a2e' }}>{detail.attempt.score}/{detail.questions?.length || 0}</span></span>
          <span>Phone: <span style={{ color: '#1a1a2e' }}>{detail.attempt.studentPhone}</span></span>
          <span>Time: <span style={{ color: '#1a1a2e' }}>
            {detail.attempt.timeTaken ? `${Math.floor(detail.attempt.timeTaken / 60)}m ${detail.attempt.timeTaken % 60}s` : 'N/A'}
          </span></span>
        </div>
      </div>

      <ResultClient attempt={detail.attempt} exam={detail.exam} questions={detail.questions} isAdminView />
    </div>
  );
}
