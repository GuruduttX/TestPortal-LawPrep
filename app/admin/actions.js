'use server';

import mongoose from 'mongoose';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import {
  clearAdminSession,
  createAdminSession,
  requireAdminSession,
  validateAdminCredentials,
} from '@/lib/admin-auth';
import {
  ensureExamSystemBootstrapped,
  getUniqueExamSlug,
} from '@/lib/exam-management';
import dbConnect from '@/lib/mongodb';
import Attempt from '@/lib/models/Attempt';
import Exam from '@/lib/models/Exam';
import Question from '@/lib/models/Question';

function readString(formData, key) {
  return String(formData.get(key) || '').trim();
}

function readRequiredString(formData, key, label) {
  const value = readString(formData, key);

  if (!value) {
    throw new Error(`${label} is required.`);
  }

  return value;
}

function readPositiveNumber(formData, key, label) {
  const value = Number(readString(formData, key));

  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${label} must be a positive number.`);
  }

  return value;
}

function readStatus(formData) {
  const status = readRequiredString(formData, 'status', 'Status');
  const allowed = new Set(['draft', 'published', 'archived']);

  if (!allowed.has(status)) {
    throw new Error('Invalid exam status.');
  }

  return status;
}

function assertObjectId(id, label) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error(`Invalid ${label}.`);
  }
}

function parseSections(formData) {
  const raw = readString(formData, 'sections');
  if (!raw) return [];
  return raw.split('\n').map((line) => line.trim()).filter(Boolean).map((name) => {
    // Check if format is "Name | marks | negative"
    const parts = name.split('|').map((p) => p.trim());
    return {
      name: parts[0],
      marksPerQuestion: parts[1] ? Number(parts[1]) || 1 : undefined,
      negativeMarks: parts[2] ? Number(parts[2]) || 0 : undefined,
    };
  });
}

async function revalidateAdminAndPublicExamPaths(exam) {
  revalidatePath('/admin');
  revalidatePath('/admin/exams');
  revalidatePath('/admin/results');
  revalidatePath(`/admin/exams/${exam._id}`);
  revalidatePath(`/admin/builder/${exam._id}`);
  revalidatePath('/exams');
  revalidatePath('/test');
  revalidatePath(`/exam/${exam.slug}`);
}

export async function loginAction(formData) {
  const username = readRequiredString(formData, 'username', 'Username');
  const password = readRequiredString(formData, 'password', 'Password');

  if (!validateAdminCredentials(username, password)) {
    redirect('/admin/login?error=invalid');
  }

  await createAdminSession();
  redirect('/admin');
}

export async function logoutAction() {
  await clearAdminSession();
  redirect('/admin/login');
}

export async function createExamAction(formData) {
  await requireAdminSession();
  await ensureExamSystemBootstrapped();
  await dbConnect();

  const title = readRequiredString(formData, 'title', 'Exam title');
  const slugInput = readString(formData, 'slug');
  const exam = await Exam.create({
    title,
    slug: await getUniqueExamSlug(slugInput || title),
    description: readString(formData, 'description'),
    instructions: readString(formData, 'instructions'),
    durationMinutes: readPositiveNumber(formData, 'durationMinutes', 'Duration'),
    marksPerQuestion: Number(readString(formData, 'marksPerQuestion')) || 1,
    negativeMarks: Number(readString(formData, 'negativeMarks')) || 0,
    sections: parseSections(formData),
    status: readStatus(formData),
    resultPublished: formData.get('resultPublished') === 'on',
  });

  await revalidateAdminAndPublicExamPaths(exam);
  redirect(`/admin/exams/${exam._id}`);
}

export async function updateExamAction(formData) {
  await requireAdminSession();
  await ensureExamSystemBootstrapped();
  await dbConnect();

  const examId = readRequiredString(formData, 'examId', 'Exam');
  assertObjectId(examId, 'exam');

  const existingExam = await Exam.findById(examId);
  if (!existingExam) {
    throw new Error('Exam not found.');
  }

  existingExam.title = readRequiredString(formData, 'title', 'Exam title');
  existingExam.slug = await getUniqueExamSlug(
    readString(formData, 'slug') || existingExam.title,
    existingExam._id
  );
  existingExam.description = readString(formData, 'description');
  existingExam.instructions = readString(formData, 'instructions');
  existingExam.durationMinutes = readPositiveNumber(formData, 'durationMinutes', 'Duration');
  existingExam.marksPerQuestion = Number(readString(formData, 'marksPerQuestion')) || 1;
  existingExam.negativeMarks = Number(readString(formData, 'negativeMarks')) || 0;
  existingExam.sections = parseSections(formData);
  existingExam.status = readStatus(formData);
  existingExam.resultPublished = formData.get('resultPublished') === 'on';

  await existingExam.save();
  await revalidateAdminAndPublicExamPaths(existingExam);
  redirect(`/admin/builder/${existingExam._id}`);
}

export async function quickCreateExamAction() {
  await requireAdminSession();
  await ensureExamSystemBootstrapped();
  await dbConnect();

  const title = `Untitled Exam ${new Date().toISOString().slice(0, 10)}`;
  const defaultInstructionsHTML = `
<ol style="padding-left: 24px; line-height: 1.8;">
  <li>The clock will be set at the server. The countdown timer at the top right corner of the screen will display the remaining time available for you to complete the examination. When the timer reaches zero, the examination will end by itself. You need not terminate the examination or submit your paper.</li>
  <li>The Question Palette displayed on the right side of the screen will show the status of each question using one of the following symbols:</li>
</ol>
<div style="padding: 12px 24px 12px 48px; line-height: 2.2;">
  <div style="display: flex; align-items: center; gap: 8px;">
    <span style="display: inline-block; width: 18px; height: 18px; background: #ccc; border: 1px solid #999;"></span>
    <span>You have not visited the question yet.</span>
  </div>
  <div style="display: flex; align-items: center; gap: 8px;">
    <span style="display: inline-block; width: 18px; height: 18px; background: #d9534f; border: 1px solid #d43f3a;"></span>
    <span>You have not answered the question.</span>
  </div>
  <div style="display: flex; align-items: center; gap: 8px;">
    <span style="display: inline-block; width: 18px; height: 18px; background: #5cb85c; border: 1px solid #4cae4c;"></span>
    <span>You have answered the question.</span>
  </div>
  <div style="display: flex; align-items: center; gap: 8px;">
    <span style="display: inline-block; width: 18px; height: 18px; background: #5bc0de; border: 1px solid #46b8da; border-radius: 50%;"></span>
    <span>You have NOT answered the question, but have marked the question for review.</span>
  </div>
  <div style="display: flex; align-items: center; gap: 8px;">
    <span style="display: inline-block; width: 18px; height: 18px; background: #5bc0de; border: 1px solid #46b8da; border-radius: 50%; position: relative;">
      <span style="position: absolute; bottom: -2px; right: -2px; width: 8px; height: 8px; border-radius: 50%; background: #5cb85c; border: 1px solid #fff;"></span>
    </span>
    <span>You have answered the question, but marked it for review.</span>
  </div>
</div>
<p style="padding-left: 24px; margin-bottom: 16px;">The <strong>Mark For Review</strong> status for a question simply indicates that you would like to look at that question again. If a question is answered but marked for review, then the answer will be considered for evaluation unless the status is modified by the candidate.</p>
<h3 style="font-weight: bold; margin-bottom: 12px;">Navigating To A Question:</h3>
<ol style="padding-left: 24px; line-height: 1.8;">
  <li>To answer a question, do the following:
    <ol style="padding-left: 24px; list-style-type: decimal; margin-top: 4px;">
      <li>Click on the question number in the Question Palette at the right of your screen to go to that numbered question directly. Note that using this option does NOT save your answer to the current question.</li>
      <li>Click on <strong>Save &amp; Next</strong> to save your answer for the current question and then go to the next question.</li>
      <li>Click on <strong>Mark for Review &amp; Next</strong> to save your answer for the current question and also mark it for review, and then go to the next question.</li>
    </ol>
  </li>
</ol>
<p style="padding-left: 24px; margin-bottom: 8px;">Note that your answer for the current question will not be saved if you navigate to another question directly by clicking on a question number without saving the answer to the previous question.</p>
<p style="padding-left: 24px; margin-bottom: 24px;">You can view all the questions by clicking on the Question Paper button. This feature is provided so that if you want, you can just see the entire question paper at a glance.</p>
`;

  const exam = await Exam.create({
    title,
    slug: await getUniqueExamSlug(title),
    description: '',
    instructions: defaultInstructionsHTML,
    durationMinutes: 60,
    marksPerQuestion: 1,
    negativeMarks: 0.25,
    status: 'draft',
    resultPublished: false,
    sections: [
      { name: 'English Language', marksPerQuestion: 1, negativeMarks: 0.25 },
      { name: 'General Knowledge', marksPerQuestion: 1, negativeMarks: 0.25 },
      { name: 'Legal Reasoning', marksPerQuestion: 1, negativeMarks: 0.25 },
      { name: 'Logical Reasoning', marksPerQuestion: 1, negativeMarks: 0.25 },
      { name: 'Quantitative Techniques', marksPerQuestion: 1, negativeMarks: 0.25 }
    ]
  });

  await revalidateAdminAndPublicExamPaths(exam);
  redirect(`/admin/builder/${exam._id}`);
}

export async function setExamStatusAction(formData) {
  await requireAdminSession();
  await ensureExamSystemBootstrapped();
  await dbConnect();

  const examId = readRequiredString(formData, 'examId', 'Exam');
  assertObjectId(examId, 'exam');

  const exam = await Exam.findByIdAndUpdate(
    examId,
    { status: readStatus(formData) },
    { new: true }
  );

  if (!exam) {
    throw new Error('Exam not found.');
  }

  await revalidateAdminAndPublicExamPaths(exam);
}

export async function setResultPublishAction(formData) {
  await requireAdminSession();
  await ensureExamSystemBootstrapped();
  await dbConnect();

  const examId = readRequiredString(formData, 'examId', 'Exam');
  assertObjectId(examId, 'exam');

  const exam = await Exam.findByIdAndUpdate(
    examId,
    { resultPublished: formData.get('resultPublished') === 'true' },
    { new: true }
  );

  if (!exam) {
    throw new Error('Exam not found.');
  }

  await revalidateAdminAndPublicExamPaths(exam);
}

export async function deleteExamAction(formData) {
  await requireAdminSession();
  await ensureExamSystemBootstrapped();
  await dbConnect();

  const examId = readRequiredString(formData, 'examId', 'Exam');
  assertObjectId(examId, 'exam');

  const exam = await Exam.findById(examId);
  if (!exam) {
    throw new Error('Exam not found.');
  }

  // Delete all questions and attempts for this exam
  await Question.deleteMany({ examId });
  await Attempt.deleteMany({ examId });
  await Exam.findByIdAndDelete(examId);

  revalidatePath('/admin');
  revalidatePath('/admin/exams');
  revalidatePath('/admin/results');
  revalidatePath('/exams');
  redirect('/admin/exams');
}

export async function duplicateExamAction(formData) {
  await requireAdminSession();
  await ensureExamSystemBootstrapped();
  await dbConnect();

  const examId = readRequiredString(formData, 'examId', 'Exam');
  assertObjectId(examId, 'exam');

  const source = await Exam.findById(examId).lean();
  if (!source) {
    throw new Error('Exam not found.');
  }

  const sourceQuestions = await Question.find({ examId })
    .sort({ questionNumber: 1 })
    .lean();

  const newTitle = `${source.title} (Copy)`;
  const uniqueSlug = await getUniqueExamSlug(`${source.slug}-copy`);

  const created = await Exam.create({
    title: newTitle,
    slug: uniqueSlug,
    description: source.description ?? '',
    instructions: source.instructions ?? '',
    durationMinutes: source.durationMinutes,
    totalQuestionsOverride: source.totalQuestionsOverride ?? null,
    totalMarksOverride: source.totalMarksOverride ?? null,
    totalSectionsOverride: source.totalSectionsOverride ?? null,
    marksPerQuestion: source.marksPerQuestion ?? 1,
    negativeMarks: source.negativeMarks ?? 0,
    sections: Array.isArray(source.sections)
      ? source.sections.map((s) => ({
          name: s.name,
          totalQuestions: s.totalQuestions ?? null,
          marksPerQuestion: s.marksPerQuestion ?? 1,
          negativeMarks: s.negativeMarks ?? 0,
        }))
      : [],
    status: 'draft',
    resultPublished: false,
  });

  try {
    if (sourceQuestions.length > 0) {
      await Question.insertMany(
        sourceQuestions.map((q) => ({
          examId: created._id,
          questionNumber: q.questionNumber,
          section: q.section ?? '',
          questionText: q.questionText,
          passage: q.passage ?? '',
          options: {
            A: q.options.A,
            B: q.options.B,
            C: q.options.C,
            D: q.options.D,
          },
          correctAnswer: q.correctAnswer,
        }))
      );
    }
  } catch (err) {
    await Question.deleteMany({ examId: created._id });
    await Exam.findByIdAndDelete(created._id);
    throw err;
  }

  await revalidateAdminAndPublicExamPaths(created);
  redirect(`/admin/exams/${created._id}`);
}

export async function createQuestionAction(formData) {
  await requireAdminSession();
  await ensureExamSystemBootstrapped();
  await dbConnect();

  const examId = readRequiredString(formData, 'examId', 'Exam');
  assertObjectId(examId, 'exam');

  const exam = await Exam.findById(examId);

  if (!exam) {
    throw new Error('Exam not found.');
  }

  const questionNumber = readPositiveNumber(
    formData,
    'questionNumber',
    'Question number'
  );
  const duplicate = await Question.findOne({ examId, questionNumber }).lean();

  if (duplicate) {
    throw new Error('That question number already exists for this exam.');
  }

  const correctAnswer = readRequiredString(formData, 'correctAnswer', 'Correct answer');
  if (!['A', 'B', 'C', 'D'].includes(correctAnswer)) {
    throw new Error('Correct answer must be A, B, C, or D.');
  }

  const created = await Question.create({
    examId,
    questionNumber,
    section: readString(formData, 'section'),
    questionText: readRequiredString(formData, 'questionText', 'Question text'),
    passage: readString(formData, 'passage'),
    options: {
      A: readRequiredString(formData, 'optionA', 'Option A'),
      B: readRequiredString(formData, 'optionB', 'Option B'),
      C: readRequiredString(formData, 'optionC', 'Option C'),
      D: readRequiredString(formData, 'optionD', 'Option D'),
    },
    correctAnswer,
  });

  await revalidateAdminAndPublicExamPaths(exam);
  redirect(`/admin/builder/${exam._id}?q=${created._id.toString()}`);
}

export async function updateQuestionAction(formData) {
  await requireAdminSession();
  await ensureExamSystemBootstrapped();
  await dbConnect();

  const examId = readRequiredString(formData, 'examId', 'Exam');
  const questionId = readRequiredString(formData, 'questionId', 'Question');
  assertObjectId(examId, 'exam');
  assertObjectId(questionId, 'question');

  const [exam, question] = await Promise.all([
    Exam.findById(examId),
    Question.findById(questionId),
  ]);

  if (!exam || !question) {
    throw new Error('Question or exam not found.');
  }

  const questionNumber = readPositiveNumber(
    formData,
    'questionNumber',
    'Question number'
  );
  const duplicate = await Question.findOne({
    examId,
    questionNumber,
    _id: { $ne: questionId },
  }).lean();

  if (duplicate) {
    throw new Error('That question number already exists for this exam.');
  }

  question.questionNumber = questionNumber;
  question.section = readString(formData, 'section');
  question.questionText = readRequiredString(formData, 'questionText', 'Question text');
  question.passage = readString(formData, 'passage');
  question.options = {
    A: readRequiredString(formData, 'optionA', 'Option A'),
    B: readRequiredString(formData, 'optionB', 'Option B'),
    C: readRequiredString(formData, 'optionC', 'Option C'),
    D: readRequiredString(formData, 'optionD', 'Option D'),
  };
  const correctAnswer = readRequiredString(formData, 'correctAnswer', 'Correct answer');
  if (!['A', 'B', 'C', 'D'].includes(correctAnswer)) {
    throw new Error('Correct answer must be A, B, C, or D.');
  }
  question.correctAnswer = correctAnswer;

  await question.save();
  await revalidateAdminAndPublicExamPaths(exam);
  redirect(`/admin/builder/${exam._id}?q=${questionId}`);
}

export async function deleteQuestionAction(formData) {
  await requireAdminSession();
  await ensureExamSystemBootstrapped();
  await dbConnect();

  const examId = readRequiredString(formData, 'examId', 'Exam');
  const questionId = readRequiredString(formData, 'questionId', 'Question');
  assertObjectId(examId, 'exam');
  assertObjectId(questionId, 'question');

  const exam = await Exam.findById(examId);

  if (!exam) {
    throw new Error('Exam not found.');
  }

  await Question.findOneAndDelete({ _id: questionId, examId });
  await revalidateAdminAndPublicExamPaths(exam);

  const nextQ = await Question.findOne({ examId }).sort({ questionNumber: 1 }).lean();
  const qParam = nextQ ? String(nextQ._id) : 'new';
  redirect(`/admin/builder/${exam._id}?q=${qParam}`);
}
