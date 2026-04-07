import mongoose from 'mongoose';

const AttemptSchema = new mongoose.Schema({
  examId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exam',
    required: true,
    index: true,
  },
  examTitle: {
    type: String,
    required: true,
  },
  studentName: {
    type: String,
    required: true,
  },
  studentPhone: {
    type: String,
    required: true,
    index: true,
  },
  answers: [
    {
      questionNumber: { type: Number, required: true },
      selectedOption: { type: String, enum: ['A', 'B', 'C', 'D'], required: true },
    },
  ],
  questionSnapshot: [
    {
      questionNumber: { type: Number, required: true },
      questionText: { type: String, required: true },
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
  ],
  score: {
    type: Number,
    required: true,
    default: 0,
  },
  submittedAt: {
    type: Date,
    default: Date.now,
  },
  timeTaken: {
    type: Number, // in seconds
    required: true,
  },
});

AttemptSchema.index({ examId: 1, studentPhone: 1 }, { unique: true });

export default mongoose.models.Attempt || mongoose.model('Attempt', AttemptSchema);
