import { redirect } from 'next/navigation';

export default async function AdminExamDetailPage({ params }) {
  const { examId } = await params;
  redirect(`/admin/builder/${examId}`);
}
