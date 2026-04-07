import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

import { adminApiUnauthorizedResponse } from '@/lib/admin-auth';
import dbConnect from '@/lib/mongodb';
import Exam from '@/lib/models/Exam';
import Question from '@/lib/models/Question';
import { ensureExamSystemBootstrapped, getUniqueExamSlug } from '@/lib/exam-management';

function revalidateExamCaches(exam) {
  const id = exam._id.toString();
  revalidatePath('/admin');
  revalidatePath('/admin/exams');
  revalidatePath('/admin/results');
  revalidatePath(`/admin/exams/${id}`);
  revalidatePath(`/admin/exams/${id}/builder`);
  revalidatePath('/exams');
  revalidatePath('/test');
  revalidatePath(`/exam/${exam.slug}`);
}

const OPTION_KEYS = ['A', 'B', 'C', 'D'];

function normalizeOptions(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const out = {};
  for (const key of OPTION_KEYS) {
    const v = String(raw[key] ?? '').trim();
    if (!v) return null;
    out[key] = v;
  }
  return out;
}

export async function PUT(req, { params }) {
  const unauthorized = await adminApiUnauthorizedResponse();
  if (unauthorized) return unauthorized;

  try {
    await ensureExamSystemBootstrapped();
    await dbConnect();

    const { examId } = await params;
    const body = await req.json();

    const exam = await Exam.findById(examId);
    if (!exam) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
    }

    if (body.title !== undefined) {
      const t = String(body.title).trim();
      if (!t) {
        return NextResponse.json({ error: 'Exam title cannot be empty' }, { status: 400 });
      }
      exam.title = t;
      exam.slug = await getUniqueExamSlug(body.slug || t, exam._id);
    }

    if (body.description !== undefined) exam.description = body.description;
    if (body.instructions !== undefined) exam.instructions = body.instructions;
    if (body.durationMinutes !== undefined) {
      const d = Number(body.durationMinutes);
      exam.durationMinutes = Number.isFinite(d) && d >= 1 ? Math.floor(d) : 120;
    }
    if (body.totalQuestionsOverride !== undefined) {
      exam.totalQuestionsOverride =
        body.totalQuestionsOverride === null ? null : Math.max(0, Number(body.totalQuestionsOverride) || 0);
    }
    if (body.totalMarksOverride !== undefined) {
      exam.totalMarksOverride =
        body.totalMarksOverride === null ? null : Math.max(0, Number(body.totalMarksOverride) || 0);
    }
    if (body.totalSectionsOverride !== undefined) {
      exam.totalSectionsOverride =
        body.totalSectionsOverride === null ? null : Math.max(0, Number(body.totalSectionsOverride) || 0);
    }
    if (body.marksPerQuestion !== undefined) {
      const m = Number(body.marksPerQuestion);
      exam.marksPerQuestion = Number.isFinite(m) && m >= 0 ? m : 1;
    }
    if (body.negativeMarks !== undefined) {
      const n = Number(body.negativeMarks);
      exam.negativeMarks = Number.isFinite(n) && n >= 0 ? n : 0;
    }
    if (body.status) exam.status = body.status;
    if (body.resultPublished !== undefined) exam.resultPublished = Boolean(body.resultPublished);

    if (body.sections !== undefined) {
      exam.sections = (body.sections || [])
        .map((s) => ({
          name: String(s?.name ?? '').trim(),
          totalQuestions:
            s?.totalQuestions === '' || s?.totalQuestions === null || s?.totalQuestions === undefined
              ? null
              : Math.max(0, Number(s.totalQuestions) || 0),
          marksPerQuestion:
            s?.marksPerQuestion !== undefined && s?.marksPerQuestion !== ''
              ? Math.max(0, Number(s.marksPerQuestion) || 0)
              : exam.marksPerQuestion,
          negativeMarks:
            s?.negativeMarks !== undefined && s?.negativeMarks !== ''
              ? Math.max(0, Number(s.negativeMarks) || 0)
              : exam.negativeMarks,
        }))
        .filter((s) => s.name.length > 0);
    }

    await exam.save();
    revalidateExamCaches(exam);

    return NextResponse.json({
      id: exam._id.toString(),
      title: exam.title,
      slug: exam.slug,
      description: exam.description,
      instructions: exam.instructions,
      durationMinutes: exam.durationMinutes,
      totalQuestionsOverride: exam.totalQuestionsOverride,
      totalMarksOverride: exam.totalMarksOverride,
      totalSectionsOverride: exam.totalSectionsOverride,
      marksPerQuestion: exam.marksPerQuestion,
      negativeMarks: exam.negativeMarks,
      sections: exam.sections,
      status: exam.status,
      resultPublished: exam.resultPublished,
    });
  } catch (error) {
    console.error('Exam update API error:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}

export async function POST(req, { params }) {
  const unauthorized = await adminApiUnauthorizedResponse();
  if (unauthorized) return unauthorized;

  try {
    await ensureExamSystemBootstrapped();
    await dbConnect();

    const { examId } = await params;
    const body = await req.json();

    const exam = await Exam.findById(examId);
    if (!exam) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
    }

    const {
      questionId,
      questionNumber: rawNum,
      section,
      questionText,
      passage: rawPassage,
      options,
      correctAnswer,
    } = body;

    const qNum = Number(rawNum);
    if (!Number.isInteger(qNum) || qNum < 1) {
      return NextResponse.json({ error: 'Invalid question number' }, { status: 400 });
    }

    const text = String(questionText ?? '').trim();
    if (!text) {
      return NextResponse.json({ error: 'Question text is required' }, { status: 400 });
    }

    const passage = String(rawPassage ?? '').trim();

    const opts = normalizeOptions(options);
    if (!opts) {
      return NextResponse.json({ error: 'All four options (A–D) must be non-empty' }, { status: 400 });
    }

    const ca = String(correctAnswer ?? '')
      .trim()
      .toUpperCase();
    if (!OPTION_KEYS.includes(ca)) {
      return NextResponse.json({ error: 'Correct answer must be A, B, C, or D' }, { status: 400 });
    }

    const sectionStr = String(section ?? '').trim();

    const duplicateQuery = { examId, questionNumber: qNum };
    if (questionId) {
      duplicateQuery._id = { $ne: questionId };
    }
    const duplicate = await Question.findOne(duplicateQuery).lean();
    if (duplicate) {
      return NextResponse.json(
        { error: 'That question number already exists for this exam' },
        { status: 409 }
      );
    }

    let question;
    if (questionId) {
      question = await Question.findById(questionId);
      if (!question || question.examId.toString() !== examId) {
        return NextResponse.json({ error: 'Question not found' }, { status: 404 });
      }
      question.questionNumber = qNum;
      question.section = sectionStr;
      question.questionText = text;
      question.passage = passage;
      question.options = opts;
      question.correctAnswer = ca;
      await question.save();
    } else {
      question = await Question.create({
        examId,
        questionNumber: qNum,
        section: sectionStr,
        questionText: text,
        passage,
        options: opts,
        correctAnswer: ca,
      });
    }

    revalidateExamCaches(exam);

    return NextResponse.json({
      id: question._id.toString(),
      questionNumber: question.questionNumber,
      section: question.section,
      questionText: question.questionText,
      passage: question.passage || '',
      options: question.options,
      correctAnswer: question.correctAnswer,
    });
  } catch (error) {
    if (error?.code === 11000) {
      return NextResponse.json({ error: 'Question number already exists' }, { status: 409 });
    }
    console.error('Question save API error:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  const unauthorized = await adminApiUnauthorizedResponse();
  if (unauthorized) return unauthorized;

  try {
    await ensureExamSystemBootstrapped();
    await dbConnect();

    const { examId } = await params;
    const { searchParams } = new URL(req.url);
    const questionId = searchParams.get('questionId');

    if (!questionId) {
      return NextResponse.json({ error: 'Missing questionId' }, { status: 400 });
    }

    const question = await Question.findById(questionId);
    if (!question || question.examId.toString() !== examId) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    const exam = await Exam.findById(examId);
    await Question.deleteOne({ _id: questionId });
    if (exam) revalidateExamCaches(exam);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Question delete API error:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
