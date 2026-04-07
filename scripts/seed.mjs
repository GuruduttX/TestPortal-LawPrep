import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Load .env.local
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '../.env.local') });

const SectionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  marksPerQuestion: { type: Number, default: 1 },
  negativeMarks: { type: Number, default: 0 },
}, { _id: false });

const ExamSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String, default: '' },
    instructions: { type: String, default: '' },
    durationMinutes: { type: Number, default: 120 },
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'published',
    },
    sections: {
      type: [SectionSchema],
      default: [],
    },
    resultPublished: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const QuestionSchema = new mongoose.Schema({
  examId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true },
  questionNumber: { type: Number, required: true },
  section: { type: String, default: '' },
  questionText: { type: String, required: true },
  options: {
    A: { type: String, required: true },
    B: { type: String, required: true },
    C: { type: String, required: true },
    D: { type: String, required: true },
  },
  correctAnswer: { type: String, enum: ['A', 'B', 'C', 'D'], required: true },
});

QuestionSchema.index({ examId: 1, questionNumber: 1 }, { unique: true });

// Avoid OverwriteModelError
const Exam = mongoose.models.Exam || mongoose.model('Exam', ExamSchema);
const Question = mongoose.models.Question || mongoose.model('Question', QuestionSchema);
const Attempt = mongoose.models.Attempt || mongoose.model('Attempt', new mongoose.Schema({}, { strict: false }));

const defaultInstructionsHTML = `
<p style="font-weight: bold; margin-bottom: 12px;">General Instructions:</p>
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
<p style="font-weight: bold; margin-bottom: 12px; margin-top: 16px;">Navigating To A Question:</p>
<ol style="padding-left: 24px; line-height: 1.8;">
  <li>To answer a question, do the following:
    <ol style="padding-left: 24px; list-style-type: decimal; margin-top: 4px;">
      <li>Click on the question number in the Question Palette at the right of your screen to go to that numbered question directly. Note that using this option does NOT save your answer to the current question.</li>
      <li>Click on <strong>Save &amp; Next</strong> to save your answer for the current question and then go to the next question.</li>
      <li>Click on <strong>Mark for Review &amp; Next</strong> to save your answer for the current question and also mark it for review, and then go to the next question.</li>
    </ol>
  </li>
</ol>
<p style="padding-left: 24px; margin-bottom: 8px; margin-top: 12px;">Note that your answer for the current question will not be saved if you navigate to another question directly by clicking on a question number without saving the answer to the previous question.</p>
<p style="padding-left: 24px; margin-bottom: 24px;">You can view all the questions by clicking on the Question Paper button. This feature is provided so that if you want, you can just see the entire question paper at a glance.</p>
`;

const sectionsConfig = [
  { name: 'English Language', questionCount: 14, marksPerQuestion: 1, negativeMarks: 0.25 },
  { name: 'General Knowledge', questionCount: 10, marksPerQuestion: 1, negativeMarks: 0.25 },
  { name: 'Legal Reasoning', questionCount: 14, marksPerQuestion: 1, negativeMarks: 0.25 },
  { name: 'Logical Reasoning', questionCount: 16, marksPerQuestion: 1, negativeMarks: 0.25 },
  { name: 'Quantitative Techniques', questionCount: 6, marksPerQuestion: 1, negativeMarks: 0.25 }
];

async function seed() {
  if (!process.env.MONGODB_URI) {
    console.error('Please define MONGODB_URI in .env.local');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB.');

  // Clear existing
  await Exam.deleteMany({});
  await Question.deleteMany({});
  await Attempt.deleteMany({});
  console.log('Cleared existing exams, questions, and attempts.');

  const exam = await Exam.create({
    title: 'LPT Scholarship Test - 1003 (2027 - 28)',
    slug: 'lpt-scholarship-test-1003',
    description: 'Seeded exam with complete 60 questions format and sections.',
    instructions: defaultInstructionsHTML,
    durationMinutes: 60,
    status: 'published',
    resultPublished: false,
    sections: sectionsConfig.map(s => ({
      name: s.name,
      marksPerQuestion: s.marksPerQuestion,
      negativeMarks: s.negativeMarks
    }))
  });

  const questionsToInsert = [];
  let questionNumber = 1;
  const dummyAnswers = ['A', 'B', 'C', 'D'];

  for (const section of sectionsConfig) {
    for (let i = 0; i < section.questionCount; i++) {
        const correctAns = dummyAnswers[Math.floor(Math.random() * dummyAnswers.length)];
        questionsToInsert.push({
            examId: exam._id,
            questionNumber: questionNumber,
            section: section.name,
            questionText: `Sample question for ${section.name} (Q${questionNumber}). Please update this content with the real question later.`,
            options: {
            A: `Option A for Q${questionNumber}`,
            B: `Option B for Q${questionNumber}`,
            C: `Option C for Q${questionNumber}`,
            D: `Option D for Q${questionNumber}`
            },
            correctAnswer: correctAns
        });
        questionNumber++;
    }
  }

  await Question.insertMany(questionsToInsert);
  console.log(`Inserted ${questionsToInsert.length} questions mapped to sections.`);

  mongoose.connection.close();
}

seed().catch(err => {
  console.error(err);
  mongoose.connection.close();
  process.exit(1);
});
