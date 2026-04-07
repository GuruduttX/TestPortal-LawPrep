import mongoose from 'mongoose';
import { NextResponse } from 'next/server';

import {
  buildQuestionSnapshot,
  ensureExamSystemBootstrapped,
} from '@/lib/exam-management';
import dbConnect from '@/lib/mongodb';
import { consumeRateLimit } from '@/lib/rate-limit';
import {
  createResultAccessToken,
  securityConstants,
  verifyAttemptToken,
} from '@/lib/security-tokens';
import Attempt from '@/lib/models/Attempt';
import Exam from '@/lib/models/Exam';
import Question from '@/lib/models/Question';

export const dynamic = 'force-dynamic';

function normalizePhone(value) {
  const digitsOnly = String(value || '').replace(/\D/g, '');
  return digitsOnly || String(value || '').trim();
}

function sanitizeAnswers(answers) {
  const normalized = new Map();
  const allowedOptions = new Set(['A', 'B', 'C', 'D']);

  answers.forEach((answer) => {
    const questionNumber = Number(answer?.questionNumber);
    const selectedOption = String(answer?.selectedOption || '').toUpperCase();

    if (
      Number.isInteger(questionNumber) &&
      questionNumber > 0 &&
      allowedOptions.has(selectedOption)
    ) {
      normalized.set(questionNumber, selectedOption);
    }
  });

  return Array.from(normalized.entries()).map(
    ([questionNumber, selectedOption]) => ({
      questionNumber,
      selectedOption,
    })
  );
}

const MAX_NAME_LEN = 200;
const MAX_PHONE_LEN = 40;
const MAX_ANSWERS_LEN = 500;

export async function POST(req) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
    const ipLimit = consumeRateLimit(`submit-ip:${ip}`, { limit: 30, windowMs: 60_000 });
    if (!ipLimit.allowed) {
      return NextResponse.json({ error: 'Too many submission requests. Please try again shortly.' }, { status: 429 });
    }

    await ensureExamSystemBootstrapped();
    await dbConnect();
    const body = await req.json();
    const { examId, attemptToken, studentName, studentPhone, answers } = body;

    if (
      !examId ||
      !attemptToken ||
      !studentName ||
      !studentPhone ||
      !answers ||
      !Array.isArray(answers)
    ) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!mongoose.Types.ObjectId.isValid(examId)) {
      return NextResponse.json({ error: 'Invalid exam' }, { status: 400 });
    }

    const nameTrim = String(studentName).trim();
    const normalizedPhone = normalizePhone(studentPhone);
    if (!nameTrim || !normalizedPhone) {
      return NextResponse.json({ error: 'Name and phone are required' }, { status: 400 });
    }
    if (!/^\d{10}$/.test(normalizedPhone)) {
      return NextResponse.json({ error: 'Phone number must be exactly 10 digits' }, { status: 400 });
    }
    if (nameTrim.length > MAX_NAME_LEN || normalizedPhone.length > MAX_PHONE_LEN) {
      return NextResponse.json({ error: 'Name or phone is too long' }, { status: 400 });
    }
    if (answers.length > MAX_ANSWERS_LEN) {
      return NextResponse.json({ error: 'Too many answers in payload' }, { status: 400 });
    }

    const exam = await Exam.findById(examId).lean();

    if (!exam) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
    }

    if (exam.status !== 'published') {
      return NextResponse.json({ error: 'This exam is not available for submission' }, { status: 403 });
    }

    const tokenStatus = verifyAttemptToken(attemptToken, examId);
    if (!tokenStatus.ok) {
      return NextResponse.json({ error: 'Exam session is invalid or expired. Please restart the exam.' }, { status: 403 });
    }

    const formattedAnswers = sanitizeAnswers(answers);

    const questions = await Question.find({ examId })
      .sort({ questionNumber: 1 })
      .select('questionNumber section questionText options correctAnswer')
      .lean();

    if (questions.length === 0) {
      return NextResponse.json(
        { error: 'This exam has no questions configured yet' },
        { status: 400 }
      );
    }
    const validQuestionNumbers = new Set(questions.map((q) => q.questionNumber));
    const hasUnknownQuestions = formattedAnswers.some(
      (a) => !validQuestionNumbers.has(a.questionNumber)
    );
    if (hasUnknownQuestions) {
      return NextResponse.json({ error: 'Invalid answers payload' }, { status: 400 });
    }

    const questionSnapshot = buildQuestionSnapshot(questions);
    const answerKeyMap = Object.fromEntries(
      questionSnapshot.map((question) => [
        question.questionNumber,
        question.correctAnswer,
      ])
    );

    // Build section marking map from exam
    const sectionMarkingMap = {};
    (exam.sections || []).forEach((s) => {
      sectionMarkingMap[s.name] = {
        marks: s.marksPerQuestion ?? exam.marksPerQuestion ?? 1,
        negative: s.negativeMarks ?? exam.negativeMarks ?? 0,
      };
    });
    const defaultMarks = exam.marksPerQuestion ?? 1;
    const defaultNegative = exam.negativeMarks ?? 0;

    // Build question-to-section map
    const questionSectionMap = {};
    questions.forEach((q) => {
      questionSectionMap[q.questionNumber] = q.section || '';
    });

    let score = 0;
    formattedAnswers.forEach((answer) => {
      const section = questionSectionMap[answer.questionNumber] || '';
      const marking = sectionMarkingMap[section] || { marks: defaultMarks, negative: defaultNegative };

      if (answerKeyMap[answer.questionNumber] === answer.selectedOption) {
        score += marking.marks;
      } else {
        score -= marking.negative;
      }
    });

    const issuedAt = Number(tokenStatus.payload.iat || Date.now());
    const boundedTimeTaken = Math.min(
      exam.durationMinutes * 60,
      Math.max(0, Math.floor((Date.now() - issuedAt) / 1000))
    );

    let attemptDoc;
    try {
      attemptDoc = await Attempt.create({
        examId,
        examTitle: exam.title,
        studentName: nameTrim,
        studentPhone: normalizedPhone,
        answers: formattedAnswers,
        questionSnapshot,
        score,
        timeTaken: boundedTimeTaken,
      });
    } catch (createErr) {
      if (createErr?.code === 11000) {
        const existing = await Attempt.findOne({ examId, studentPhone: normalizedPhone })
          .select('_id score')
          .lean();
        if (existing) {
          const response = NextResponse.json({
            attemptId: String(existing._id),
            score: Number(existing.score || 0),
            duplicate: true,
          });
          response.cookies.set(securityConstants.RESULT_COOKIE_NAME, createResultAccessToken(existing._id), {
            httpOnly: true,
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
            path: '/',
            maxAge: securityConstants.RESULT_TOKEN_MAX_AGE_SEC,
          });
          return response;
        }
        return NextResponse.json({ error: 'You have already taken this test' }, { status: 403 });
      }
      throw createErr;
    }

    const response = NextResponse.json({ attemptId: attemptDoc._id, score });
    response.cookies.set(securityConstants.RESULT_COOKIE_NAME, createResultAccessToken(attemptDoc._id), {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: securityConstants.RESULT_TOKEN_MAX_AGE_SEC,
    });
    return response;
  } catch (error) {
    if (error?.code === 11000) {
      return NextResponse.json(
        { error: 'You have already taken this test' },
        { status: 403 }
      );
    }

    console.error('Submit API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
