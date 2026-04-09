import { redirect } from 'next/navigation';

export default async function ExamBuilderRedirect({ params }) {
  const { examId } = await params;
  redirect(`/admin/builder/${examId}`);
}

