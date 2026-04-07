import ResultClient from './ResultClient';

import { isAdminAuthenticated } from '@/lib/admin-auth';
import { getAttemptDetail } from '@/lib/dashboard-data';
import { hasResultAccess } from '@/lib/security-tokens';

export const dynamic = 'force-dynamic';

export default async function ResultPage({ params }) {
  const { attemptId } = await params;
  const adminViewer = await isAdminAuthenticated();
  const candidateViewer = await hasResultAccess(attemptId);

  if (!adminViewer && !candidateViewer) {
    return (
      <main className="min-h-screen bg-gray-100 flex items-start justify-center p-8">
        <div className="bg-white p-6 border border-red-300 max-w-md w-full shadow-sm">
          <h1 className="text-xl font-bold text-red-700 mb-2">Unauthorized</h1>
          <p className="text-gray-600 text-sm">You do not have permission to access this result.</p>
        </div>
      </main>
    );
  }

  const detail = await getAttemptDetail(attemptId);

  if (!detail) {
    return (
      <main className="min-h-screen bg-gray-100 flex items-start justify-center p-8">
        <div className="bg-white p-6 border border-red-300 max-w-md w-full shadow-sm">
          <h1 className="text-xl font-bold text-red-700 mb-2">Assessment Not Found</h1>
          <p className="text-gray-600 text-sm">We could not locate this test attempt in our records.</p>
        </div>
      </main>
    );
  }

  const { attempt, exam, questions } = detail;

  if (!exam?.resultPublished) {
    return (
      <main className="min-h-screen bg-[linear-gradient(180deg,_#f5f7fb,_#e7eef7)] px-4 py-12 text-slate-900">
        <div className="mx-auto max-w-3xl rounded-[32px] border border-slate-200 bg-white p-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan-700">
            Submission Received
          </p>
          <h1 className="mt-4 text-3xl font-semibold text-slate-950">
            Your exam has been submitted successfully.
          </h1>
          <p className="mt-4 text-sm leading-7 text-slate-600">
            {exam?.title || attempt.examTitle} is currently under review. The
            result link will start showing your score only after the admin team
            publishes results.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl bg-slate-50 p-5">
              <div className="text-xs uppercase tracking-[0.2em] text-slate-500">
                Candidate
              </div>
              <div className="mt-2 text-lg font-semibold text-slate-950">
                {attempt.studentName}
              </div>
              <div className="mt-1 text-sm text-slate-600">
                {attempt.studentPhone}
              </div>
            </div>
            <div className="rounded-3xl bg-slate-50 p-5">
              <div className="text-xs uppercase tracking-[0.2em] text-slate-500">
                Submission Time
              </div>
              <div className="mt-2 text-lg font-semibold text-slate-950">
                {new Date(attempt.submittedAt).toLocaleString()}
              </div>
              <div className="mt-1 text-sm text-slate-600">
                Time taken: {Math.floor(attempt.timeTaken / 60)} min {attempt.timeTaken % 60} sec
              </div>
            </div>
          </div>

          <div className="mt-8 rounded-[28px] border border-amber-200 bg-amber-50 p-5 text-sm leading-7 text-amber-900">
            Keep this page or bookmark the link. Once results are published, the
            same URL will show your detailed report.
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 text-gray-900 font-sans pb-24 p-4 sm:p-8">
      <ResultClient attempt={attempt} exam={exam} questions={questions} />
    </main>
  );
}
