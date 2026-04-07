import mongoose from 'mongoose';

const SectionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    totalQuestions: { type: Number, default: null, min: 0 },
    marksPerQuestion: { type: Number, default: 1, min: 0 },
    negativeMarks: { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

const ExamSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
      index: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    instructions: {
      type: String,
      default: '',
    },
    durationMinutes: {
      type: Number,
      required: true,
      min: 1,
      default: 120,
    },
    totalQuestionsOverride: {
      type: Number,
      default: null,
      min: 0,
    },
    totalMarksOverride: {
      type: Number,
      default: null,
      min: 0,
    },
    totalSectionsOverride: {
      type: Number,
      default: null,
      min: 0,
    },
    marksPerQuestion: {
      type: Number,
      default: 1,
      min: 0,
    },
    negativeMarks: {
      type: Number,
      default: 0,
      min: 0,
    },
    sections: {
      type: [SectionSchema],
      default: [],
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'draft',
      index: true,
    },
    resultPublished: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Exam || mongoose.model('Exam', ExamSchema);
