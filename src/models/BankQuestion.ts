import mongoose, { Schema, Document, models } from 'mongoose';

/** Exam question bank. Each learner's exam draws a different random set of approved questions. */
export interface IBankQuestionDocument extends Document {
  courseSlug: string;
  lessonId: string;
  topic: string;
  type: 'MCQ' | 'SHORT';
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  rubric: string;
  modelAnswer: string;
  maxPoints: number;
  timestampSec: number;
  status: 'DRAFT' | 'APPROVED';
}

const BankQuestionSchema = new Schema<IBankQuestionDocument>(
  {
    courseSlug: { type: String, required: true, index: true },
    lessonId: { type: String, required: true },
    topic: { type: String, default: '' },
    type: { type: String, enum: ['MCQ', 'SHORT'], required: true },
    question: { type: String, required: true },
    options: [{ type: String }],
    correctIndex: { type: Number, default: -1 },
    explanation: { type: String, default: '' },
    rubric: { type: String, default: '' },
    modelAnswer: { type: String, default: '' },
    maxPoints: { type: Number, default: 1 },
    timestampSec: { type: Number, default: 0 },
    status: { type: String, enum: ['DRAFT', 'APPROVED'], default: 'DRAFT', index: true }
  },
  { timestamps: true }
);

export default models.BankQuestion || mongoose.model<IBankQuestionDocument>('BankQuestion', BankQuestionSchema);
