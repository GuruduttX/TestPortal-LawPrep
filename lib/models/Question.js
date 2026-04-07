import mongoose from 'mongoose';

const QuestionSchema = new mongoose.Schema(
  {
    examId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Exam',
      required: true,
      index: true,
    },
    questionNumber: {
      type: Number,
      required: true,
      min: 1,
    },
    section: {
      type: String,
      default: '',
      trim: true,
    },
    questionText: {
      type: String,
      required: true,
      default: 'Placeholder question text',
    },
    /** Long reading material shown in the left column of the test UI (optional). */
    passage: {
      type: String,
      default: '',
    },
    options: {
      A: { type: String, required: true },
      B: { type: String, required: true },
      C: { type: String, required: true },
      D: { type: String, required: true },
    },
    correctAnswer: {
      type: String,
      enum: ['A', 'B', 'C', 'D'],
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

QuestionSchema.index({ examId: 1, questionNumber: 1 }, { unique: true });

export default mongoose.models.Question || mongoose.model('Question', QuestionSchema);
