import mongoose from 'mongoose';

import dbConnect from '@/lib/mongodb';
import Attempt from '@/lib/models/Attempt';
import Exam from '@/lib/models/Exam';
import Question from '@/lib/models/Question';

import {
  ensureExamSystemBootstrapped,
  serializeAttempt,
  serializeExam,
  serializeQuestion,
  computeMaxPossibleMarks,
} from '@/lib/exam-management';

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id) && String(new mongoose.Types.ObjectId(id)) === String(id);
}

function buildCountMap(records, countKey) {
  return new Map(
    records.map((record) => [String(record._id), Number(record[countKey] || 0)])
  );
}

export async function getExamSummaries() {
  await ensureExamSystemBootstrapped();
  await dbConnect();

  const [exams, questionCounts, attemptStats] = await Promise.all([
    Exam.find({}).sort({ updatedAt: -1 }).lean(),
    Question.aggregate([
      { $group: { _id: '$examId', questionCount: { $sum: 1 } } },
    ]),
    Attempt.aggregate([
      {
        $group: {
          _id: '$examId',
          attemptCount: { $sum: 1 },
          averageScore: { $avg: '$score' },
          highestRawScore: { $max: '$score' },
        },
      },
    ]),
  ]);

  const questionCountMap = buildCountMap(questionCounts, 'questionCount');
  const attemptStatsMap = new Map(
    attemptStats.map((record) => [String(record._id), record])
  );

  return exams.map((exam) => {
    const serialized = serializeExam(exam);
    const examId = serialized.id;
    const questionCount = questionCountMap.get(examId) || 0;
    const stats = attemptStatsMap.get(examId);
    // The correct denominator for any percentage shown on this exam
    const maxPossibleMarks = computeMaxPossibleMarks(serialized, questionCount);

    return {
      ...serialized,
      questionCount,
      maxPossibleMarks,
      attemptCount: Number(stats?.attemptCount || 0),
      averageScore: stats?.averageScore ?? 0,
      highestRawScore: Number(stats?.highestRawScore ?? 0),
    };
  });
}

export async function getExamDetail(examId) {
  if (!isValidObjectId(examId)) return null;
  await ensureExamSystemBootstrapped();
  await dbConnect();

  const [exam, questions, attempts] = await Promise.all([
    Exam.findById(examId).lean(),
    Question.find({ examId }).sort({ questionNumber: 1 }).lean(),
    Attempt.find({ examId }).sort({ submittedAt: -1 }).limit(1000).lean(),
  ]);

  if (!exam) {
    return null;
  }

  const totalQuestions = questions.length;
  const totalAttempts = attempts.length;
  const averageScore = totalAttempts
    ? attempts.reduce((sum, attempt) => sum + attempt.score, 0) / totalAttempts
    : 0;
  const highestScore = totalAttempts
    ? Math.max(...attempts.map((attempt) => attempt.score))
    : 0;

  return {
    exam: serializeExam(exam),
    questions: questions.map(serializeQuestion),
    attempts: attempts.map(serializeAttempt),
    metrics: {
      totalQuestions,
      totalAttempts,
      averageScore,
      highestScore,
    },
  };
}

export async function getAttemptDetail(attemptId) {
  if (!isValidObjectId(attemptId)) return null;
  await ensureExamSystemBootstrapped();
  await dbConnect();

  const attempt = await Attempt.findById(attemptId).lean();

  if (!attempt) {
    return null;
  }

  const exam = await Exam.findById(attempt.examId).lean();
  const fallbackQuestions = attempt.questionSnapshot?.length
    ? []
    : await Question.find({ examId: attempt.examId })
        .sort({ questionNumber: 1 })
        .lean();

  return {
    attempt: serializeAttempt(attempt),
    exam: serializeExam(exam),
    questions: attempt.questionSnapshot?.length
      ? attempt.questionSnapshot.map((question) => ({
          questionNumber: question.questionNumber,
          questionText: question.questionText,
          options: {
            A: question.options.A,
            B: question.options.B,
            C: question.options.C,
            D: question.options.D,
          },
          correctAnswer: question.correctAnswer,
        }))
      : fallbackQuestions.map(serializeQuestion),
  };
}
