import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Attempt from '@/lib/models/Attempt';
import Exam from '@/lib/models/Exam';
import Question from '@/lib/models/Question';
import { adminApiUnauthorizedResponse } from '@/lib/admin-auth';
import { computeMaxPossibleMarks, serializeExam } from '@/lib/exam-management';

function escapeCsv(value) {
  const str = String(value || '');
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET(req) {
  const unauthorized = await adminApiUnauthorizedResponse();
  if (unauthorized) return unauthorized;

  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);

    const selectedExamId = searchParams.get('exam') || '';
    const searchName = searchParams.get('search') || '';
    const searchDate = searchParams.get('date') || '';

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

    const attempts = await Attempt.find(query).sort({ submittedAt: -1 }).lean();
    const exams = await Exam.find({}).lean();
    
    // Fetch question counts for all exams to compute max marks correctly
    const questionCounts = await Question.aggregate([
      { $group: { _id: '$examId', count: { $sum: 1 } } }
    ]);
    const qCountMap = new Map(questionCounts.map(q => [String(q._id), q.count]));

    const examMap = {};
    exams.forEach(e => { 
      const serialized = serializeExam(e);
      const qCount = qCountMap.get(serialized.id) || 0;
      examMap[serialized.id] = {
        ...serialized,
        maxPossibleMarks: computeMaxPossibleMarks(serialized, qCount)
      };
    });

    // CSV Headers
    const rows = [
      ['Candidate Name', 'Phone Number', 'Exam Title', 'Score', 'Max Marks', 'Percentage', 'Time Taken (Mins)', 'Submitted At']
    ];

    attempts.forEach((att) => {
      const ex = examMap[String(att.examId)];
      const maxMarks = ex?.maxPossibleMarks || ex?.questionCount || 100;
      const pct = Math.max(0, Math.round((att.score / maxMarks) * 100));
      const submittedAt = new Date(att.submittedAt).toLocaleString('en-IN');
      const timeMins = (att.timeTaken / 60).toFixed(1);

      rows.push([
        att.studentName,
        att.studentPhone,
        att.examTitle || ex?.title || 'Unknown',
        att.score,
        maxMarks,
        `${pct}%`,
        timeMins,
        submittedAt
      ]);
    });

    const csvContent = rows.map(row => row.map(escapeCsv).join(',')).join('\n');

    return new Response(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="exam_results_${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
  }
}
