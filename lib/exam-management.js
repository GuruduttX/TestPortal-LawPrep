import dbConnect from '@/lib/mongodb';
import Attempt from '@/lib/models/Attempt';
import Exam from '@/lib/models/Exam';
import Question from '@/lib/models/Question';

const DEFAULT_LEGACY_EXAM = {
  title: 'LPT Scholarship Test',
  slug: 'lpt-scholarship-test',
  description: 'Legacy migrated exam',
  instructions:
    'Read each question carefully before selecting an answer. The exam interface tracks unanswered, answered, and review-marked questions.',
  durationMinutes: 120,
  status: 'published',
  resultPublished: false,
};

function normalizeWhitespace(value) {
  return value.trim().replace(/\s+/g, ' ');
}

export function slugifyExamTitle(value) {
  return normalizeWhitespace(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export async function getUniqueExamSlug(rawValue, excludeId = null) {
  const baseSlug = slugifyExamTitle(rawValue) || DEFAULT_LEGACY_EXAM.slug;
  let candidate = baseSlug;
  let suffix = 1;

  while (true) {
    const existing = await Exam.findOne({
      slug: candidate,
      ...(excludeId ? { _id: { $ne: excludeId } } : {}),
    }).lean();

    if (!existing) {
      return candidate;
    }

    candidate = `${baseSlug}-${suffix}`;
    suffix += 1;
  }
}

export function buildQuestionSnapshot(questions) {
  return questions.map((question) => ({
    questionNumber: question.questionNumber,
    questionText: question.questionText,
    options: {
      A: question.options.A,
      B: question.options.B,
      C: question.options.C,
      D: question.options.D,
    },
    correctAnswer: question.correctAnswer,
  }));
}

/**
 * Computes the maximum marks a student can earn on an exam.
 * This is the correct denominator for ALL percentage calculations.
 *
 * Logic (in priority order):
 *   1. If admin set totalMarksOverride → use that directly.
 *   2. If exam has sections with per-section marksPerQuestion configured:
 *        sum of (sectionQuestionCount × sectionMarksPerQuestion)
 *   3. Flat exam: questionCount × marksPerQuestion
 *
 * @param {object} exam   - serialized exam object (from serializeExam)
 * @param {number} questionCount - actual question count from DB
 * @returns {number} max possible positive marks (always > 0)
 */
export function computeMaxPossibleMarks(exam, questionCount) {
  // 1. Admin override wins
  if (exam.totalMarksOverride != null && exam.totalMarksOverride > 0) {
    return exam.totalMarksOverride;
  }

  const sections = exam.sections || [];

  // 2. Section-level marks
  if (sections.length > 0) {
    let total = 0;
    sections.forEach((s) => {
      // How many questions does this section have?
      const qCount = s.totalQuestions != null ? s.totalQuestions : questionCount / sections.length;
      const mpq = s.marksPerQuestion ?? exam.marksPerQuestion ?? 1;
      total += qCount * mpq;
    });
    if (total > 0) return total;
  }

  // 3. Flat exam
  const mpq = exam.marksPerQuestion ?? 1;
  return (questionCount || 1) * mpq;
}

export function serializeExam(examDoc) {
  if (!examDoc) {
    return null;
  }

  const exam = examDoc._id ? examDoc : { ...examDoc, _id: examDoc.id };

  return {
    id: exam._id.toString(),
    title: exam.title,
    slug: exam.slug,
    description: exam.description || '',
    instructions: exam.instructions || '',
    durationMinutes: exam.durationMinutes,
    totalQuestionsOverride: exam.totalQuestionsOverride ?? null,
    totalMarksOverride: exam.totalMarksOverride ?? null,
    totalSectionsOverride: exam.totalSectionsOverride ?? null,
    marksPerQuestion: exam.marksPerQuestion ?? 1,
    negativeMarks: exam.negativeMarks ?? 0,
    sections: (exam.sections || []).map((s) => ({
      name: s.name,
      totalQuestions: s.totalQuestions ?? null,
      marksPerQuestion: s.marksPerQuestion ?? exam.marksPerQuestion ?? 1,
      negativeMarks: s.negativeMarks ?? exam.negativeMarks ?? 0,
    })),
    status: exam.status,
    resultPublished: Boolean(exam.resultPublished),
    createdAt: exam.createdAt ? new Date(exam.createdAt).toISOString() : null,
    updatedAt: exam.updatedAt ? new Date(exam.updatedAt).toISOString() : null,
  };
}

export function serializeQuestion(questionDoc) {
  if (!questionDoc) {
    return null;
  }

  return {
    id: questionDoc._id.toString(),
    examId: questionDoc.examId.toString(),
    questionNumber: questionDoc.questionNumber,
    section: questionDoc.section || '',
    questionText: questionDoc.questionText,
    passage: questionDoc.passage || '',
    options: {
      A: questionDoc.options.A,
      B: questionDoc.options.B,
      C: questionDoc.options.C,
      D: questionDoc.options.D,
    },
    correctAnswer: questionDoc.correctAnswer,
  };
}

export function serializeAttempt(attemptDoc) {
  if (!attemptDoc) {
    return null;
  }

  return {
    id: attemptDoc._id.toString(),
    examId: attemptDoc.examId.toString(),
    examTitle: attemptDoc.examTitle,
    studentName: attemptDoc.studentName,
    studentPhone: attemptDoc.studentPhone,
    score: attemptDoc.score,
    submittedAt: new Date(attemptDoc.submittedAt).toISOString(),
    timeTaken: attemptDoc.timeTaken,
    answers: attemptDoc.answers.map((answer) => ({
      questionNumber: answer.questionNumber,
      selectedOption: answer.selectedOption,
    })),
    questionSnapshot: (attemptDoc.questionSnapshot || []).map((question) => ({
      questionNumber: question.questionNumber,
      questionText: question.questionText,
      options: {
        A: question.options.A,
        B: question.options.B,
        C: question.options.C,
        D: question.options.D,
      },
      correctAnswer: question.correctAnswer,
    })),
  };
}

async function bootstrapExamSystem() {
  await dbConnect();

  await Exam.syncIndexes();
  await Question.syncIndexes();
  await Attempt.syncIndexes();

  const legacyQuestionsExist = await Question.exists({
    $or: [{ examId: { $exists: false } }, { examId: null }],
  });
  const legacyAttemptsExist = await Attempt.exists({
    $or: [{ examId: { $exists: false } }, { examId: null }],
  });

  if (!legacyQuestionsExist && !legacyAttemptsExist) {
    return null;
  }

  let exam = await Exam.findOne({ slug: DEFAULT_LEGACY_EXAM.slug });

  if (!exam) {
    exam = await Exam.create(DEFAULT_LEGACY_EXAM);
  }

  await Question.updateMany(
    { $or: [{ examId: { $exists: false } }, { examId: null }] },
    { $set: { examId: exam._id } }
  );

  await Attempt.updateMany(
    { $or: [{ examId: { $exists: false } }, { examId: null }] },
    { $set: { examId: exam._id, examTitle: exam.title } }
  );

  return exam;
}

export async function ensureExamSystemBootstrapped() {
  if (!global.__lptExamBootstrapPromise) {
    global.__lptExamBootstrapPromise = bootstrapExamSystem().catch((error) => {
      global.__lptExamBootstrapPromise = null;
      throw error;
    });
  }

  return global.__lptExamBootstrapPromise;
}
