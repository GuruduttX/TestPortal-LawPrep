import { redirect } from 'next/navigation';

import { ensureExamSystemBootstrapped } from '@/lib/exam-management';
import dbConnect from '@/lib/mongodb';
import Exam from '@/lib/models/Exam';

export const dynamic = 'force-dynamic';

export default async function TestPage() {
  await ensureExamSystemBootstrapped();
  await dbConnect();

  const exam = await Exam.findOne({ status: 'published' })
    .sort({ updatedAt: -1 })
    .lean();

  if (exam) {
    redirect(`/exam/${exam.slug}`);
  }

  redirect('/exams');
}
