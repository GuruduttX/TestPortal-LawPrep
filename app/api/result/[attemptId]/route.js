import { NextResponse } from 'next/server';

import { isAdminAuthenticated } from '@/lib/admin-auth';
import { getAttemptDetail } from '@/lib/dashboard-data';
import { hasResultAccess } from '@/lib/security-tokens';

export async function GET(req, { params }) {
  try {
    const { attemptId } = await params;
    const detail = await getAttemptDetail(attemptId);

    if (!detail) {
      return NextResponse.json({ error: 'Attempt not found' }, { status: 404 });
    }

    const adminViewer = await isAdminAuthenticated();
    const candidateViewer = await hasResultAccess(attemptId);
    if (!adminViewer && !candidateViewer) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const canViewFullResults =
      Boolean(detail.exam?.resultPublished) || adminViewer;

    if (!canViewFullResults) {
      return NextResponse.json({
        attempt: {
          id: detail.attempt.id,
          examTitle: detail.attempt.examTitle,
          studentName: detail.attempt.studentName,
          studentPhone: detail.attempt.studentPhone,
          submittedAt: detail.attempt.submittedAt,
          timeTaken: detail.attempt.timeTaken,
        },
        exam: detail.exam,
        resultPublished: false,
      });
    }

    return NextResponse.json({
      ...detail,
      resultPublished: true,
    });
  } catch (error) {
    console.error('Result API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
