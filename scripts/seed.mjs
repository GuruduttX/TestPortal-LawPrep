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
  passage: { type: String, default: '' },
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

  const susanPassage = `I live in a world of Susans. I got name tags for everyone who works at this nail salon, and on every one is printed the name "Susan." So many girls come and go. I don't want to bother getting new name tags each time. Besides, you know, it's never difficult to pronounce a name like Susan.

None of our clients notice. They come in and we are ready and set to work. That's all that matters to them. We all have black shoulder-length hair and wear black T-shirts and black pants. We are, more or less, the same height, too.

And, anyway, the clients will never be wrong when they ask for Susan. Dear Susan is always available and at your service! Susan never takes a day off and Susan is never fully booked if it's you who called for her. Susan, our dear, sweet Susan, always makes time for you.

The Susans and I are friendly, the way you are with someone you work with, with someone you have to see every day. I like to keep my distance, not get too close to any of them. They aren't family. Even with family, I like to keep my distance. I did my time.

The brightly lit box we work in is called "Susan's." There are others like us scattered around the city, and some are just a few doors down from us. But we're the best. It's no lie and I'm not kidding anybody when I say that. We're the best. I get people in and out, in and out, and so do the Susans.

I'm in charge, and I do what I want. I can do it all. I am the first to arrive and the last one to leave, and I never take a day off. I have got four girls—Mai, Nok, Annie, and a new girl coming, Noi. I know our names sound the same, but because I know what their names mean in our language they aren't the same to me. Any one of us can answer the phone and take appointments. Only the ones with more experience can do the manicures and pedicures, facials or waxings. And someone's always on standby, just a call away.`;

  const legalPassage = `Constitutional tort is a legal concept where a violation of one's constitutional rights by a government agent can lead to civil liability. The principle acts as a mechanism to hold the State accountable for the actions of its employees. However, not all actions by government servants amount to a constitutional tort. The State's liability is often protected under the doctrine of sovereign immunity for acts done in the exercise of sovereign functions. Courts consider the distinction between sovereign and non-sovereign functions when awarding compensation. A sovereign act is one that can only be performed by the State (e.g., defense, administration of justice).`;

  const logicPassage = `Five friends—A, B, C, D, and E—are sitting in a row facing North. C is sitting exactly in the middle of the row. B is sitting to the immediate right of C. D is sitting at one of the extreme ends. A is not sitting adjacent to C. Who is sitting to the immediate left of C?`;

  const generators = {
    'English Language': (idx) => {
      if (idx === 0) return { passage: susanPassage, text: "What is the tone of the passage?", opts: ['Warm and friendly', 'Detached and ironic', 'Humorous and light', 'Hopeful and upbeat'], ans: 'B' };
      if (idx === 1) return { passage: susanPassage, text: "Why are all the workers named 'Susan'?", opts: ['It is a family business', 'The owner finds it convenient and clients don\'t notice', 'It is a state requirement', 'The clients specifically requested it'], ans: 'B' };
      if (idx === 2) return { passage: susanPassage, text: "Which phrase best describes the narrator's attitude toward the 'Susans'?", opts: ['Deeply attached and maternal', 'Professional but distinctly distanced', 'Jealous and competitive', 'Fearful and suspicious'], ans: 'B' };
      return { passage: susanPassage, text: `According to the passage, what is true about the nail salon's operations? (Question ${idx + 1})`, opts: ['Only experienced girls do manicures', 'Everyone does facials', 'They wear pink uniforms', 'The owner takes weekends off'], ans: 'A' };
    },
    'General Knowledge': (idx) => {
      const qs = [
        { text: "Who was the chief architect of the Indian Constitution?", opts: ['Jawaharlal Nehru', 'B. R. Ambedkar', 'Mahatma Gandhi', 'Sardar Patel'], ans: 'B' },
        { text: "Which is the largest ocean on Earth?", opts: ['Atlantic', 'Indian', 'Arctic', 'Pacific'], ans: 'D' },
        { text: "What is the capital of Australia?", opts: ['Sydney', 'Melbourne', 'Canberra', 'Perth'], ans: 'C' },
        { text: "Which planet is known as the Red Planet?", opts: ['Venus', 'Jupiter', 'Mars', 'Saturn'], ans: 'C' }
      ];
      return qs[idx % qs.length];
    },
    'Legal Reasoning': (idx) => {
      if (idx < 5) {
        return { passage: legalPassage, text: `Based on the passage, which of the following is an example of a sovereign function? (Question ${idx + 1})`, opts: ['Running a state transport bus', 'Administration of justice', 'Operating a public hospital', 'Fixing a pothole'], ans: 'B' };
      }
      return { text: "Principle: A person is liable for negligence if they breach a duty of care, causing foreseeable harm. Facts: X leaves a banana peel on the road. Y slips on it and breaks a leg. Is X liable?", opts: ['Yes, X breached a duty of care', 'No, Y should have been careful', 'No, X did not intend to hurt Y', 'Yes, banana peels are inherently dangerous'], ans: 'A' };
    },
    'Logical Reasoning': (idx) => {
      if (idx < 3) return { passage: logicPassage, text: "Who is sitting at the extreme left end of the row?", opts: ['A', 'D', 'E', 'Cannot be determined'], ans: 'D' }; // (Assume A E C B D arrangement)
      if (idx >= 3 && idx < 6) return { passage: logicPassage, text: "Who is sitting to the immediate left of C?", opts: ['A', 'B', 'D', 'E'], ans: 'D' };
      return { text: "If all bats are cats, and no cats are rats, then which of the following is true?", opts: ['Some bats are rats', 'No bats are rats', 'All rats are bats', 'Some cats are bats'], ans: 'B' };
    },
    'Quantitative Techniques': (idx) => {
      const qs = [
        { text: "If a train travels at 60 km/hr, how long will it take to cover 150 km?", opts: ['2 hours', '2.5 hours', '3 hours', '3.5 hours'], ans: 'B' },
        { text: "What is 15% of 200?", opts: ['20', '30', '40', '50'], ans: 'B' },
        { text: "If the radius of a circle is 7cm, what is its approximate circumference? (Take π = 22/7)", opts: ['44 cm', '22 cm', '88 cm', '77 cm'], ans: 'A' }
      ];
      return qs[idx % qs.length];
    }
  };

  for (const section of sectionsConfig) {
    for (let i = 0; i < section.questionCount; i++) {
        const generation = generators[section.name](i) || { text: `Autogenerated question for ${section.name}`, opts: ['A', 'B', 'C', 'D'], ans: 'A' };
        
        questionsToInsert.push({
            examId: exam._id,
            questionNumber: questionNumber,
            section: section.name,
            questionText: generation.text || `Sample question Q${questionNumber}`,
            passage: generation.passage || '',
            options: {
              A: generation.opts ? generation.opts[0] : `Option A for Q${questionNumber}`,
              B: generation.opts ? generation.opts[1] : `Option B for Q${questionNumber}`,
              C: generation.opts ? generation.opts[2] : `Option C for Q${questionNumber}`,
              D: generation.opts ? generation.opts[3] : `Option D for Q${questionNumber}`
            },
            correctAnswer: generation.ans || 'A'
        });
        questionNumber++;
    }
  }

  await Question.insertMany(questionsToInsert);
  console.log(`Inserted ${questionsToInsert.length} realistic questions mapped to sections.`);

  mongoose.connection.close();
}

seed().catch(err => {
  console.error(err);
  mongoose.connection.close();
  process.exit(1);
});
