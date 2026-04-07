import Link from 'next/link';
import { getExamDetail } from '@/lib/dashboard-data';
import { requireAdminSession } from '@/lib/admin-auth';
import AdminTestEditorClient from '../AdminTestEditorClient';

export const dynamic = 'force-dynamic';

export default async function FullScreenBuilderPage({ params }) {
  await requireAdminSession();
  const { examId } = await params;

  const detail = await getExamDetail(examId);
  if (!detail) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-xl font-extrabold text-gray-800">Exam Not Found</h1>
          <Link href="/admin/exams" className="mt-4 inline-block px-5 py-2.5 text-sm font-bold text-white uppercase rounded bg-gray-900">
            ← Back
          </Link>
        </div>
      </main>
    );
  }

  const { exam, questions } = detail;

  return <AdminTestEditorClient initialExam={exam} initialQuestions={questions} />;
}
