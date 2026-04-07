import TestClient from '@/app/test/TestClient';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import {
  ensureExamSystemBootstrapped,
  serializeExam,
  serializeQuestion,
} from '@/lib/exam-management';
import dbConnect from '@/lib/mongodb';
import { createAttemptToken } from '@/lib/security-tokens';
import Exam from '@/lib/models/Exam';
import Question from '@/lib/models/Question';

export const dynamic = 'force-dynamic';

export default async function ExamPage({ params, searchParams }) {
  const { slug } = await params;
  const sp = await searchParams;
  const previewRequested = sp?.preview === '1' || sp?.preview === 'true';
  const adminPreview = previewRequested && (await isAdminAuthenticated());

  await ensureExamSystemBootstrapped();
  await dbConnect();

  const examDoc = await Exam.findOne({ slug, status: 'published' }).lean();

  if (!examDoc) {
    return (
      <main className="min-h-screen bg-slate-100 px-4 py-12">
        <div className="mx-auto max-w-2xl rounded-[32px] border border-slate-200 bg-white p-8 shadow-[0_16px_40px_rgba(15,23,42,0.07)]">
          <h1 className="text-2xl font-semibold text-slate-950">
            Exam not available
          </h1>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            This exam is either unpublished, archived, or no longer available.
          </p>
        </div>
      </main>
    );
  }

  const questionsDoc = await Question.find({ examId: examDoc._id })
    .sort({ questionNumber: 1 })
    .lean();

  const exam = serializeExam(examDoc);
  const questions = questionsDoc.map((question) => {
    const serialized = serializeQuestion(question);
    return {
      id: serialized.id,
      questionNumber: serialized.questionNumber,
      section: serialized.section,
      questionText: serialized.questionText,
      passage: serialized.passage || '',
      options: serialized.options,
    };
  });

  const attemptToken = createAttemptToken({
    examId: exam.id,
    durationMinutes: exam.durationMinutes,
  });

  return (
    <TestClient
      exam={exam}
      questions={questions}
      adminPreview={adminPreview}
      attemptToken={attemptToken}
    />
  );
}
