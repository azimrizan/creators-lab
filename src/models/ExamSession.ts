import mongoose, { Schema, Document, models } from 'mongoose';

export interface IExamResult {
  questionId: string;
  type: 'MCQ' | 'SHORT';
  question: string;
  answer: string;
  points: number;
  maxPoints: number;
  feedback: string;
  correctAnswer: string;
}

export interface IExamSessionDocument extends Document {
  userId: string;
  courseSlug: string;
  attemptNo: number;
  questionIds: string[];
  startedAt: Date;
  expiresAt: Date;
  status: 'IN_PROGRESS' | 'SUBMITTED';
  submittedLate: boolean;
  results: IExamResult[];
  score: number;
  maxScore: number;
  percent: number;
  passed: boolean;
  certificateNumber?: string;
  updatedAt: Date;
}

const ExamSessionSchema = new Schema<IExamSessionDocument>(
  {
    userId: { type: String, required: true, index: true },
    courseSlug: { type: String, required: true, index: true },
    attemptNo: { type: Number, required: true },
    questionIds: [{ type: String }],
    startedAt: { type: Date, required: true },
    expiresAt: { type: Date, required: true },
    status: { type: String, enum: ['IN_PROGRESS', 'SUBMITTED'], default: 'IN_PROGRESS' },
    submittedLate: { type: Boolean, default: false },
    results: [
      {
        questionId: String,
        type: { type: String },
        question: String,
        answer: String,
        points: Number,
        maxPoints: Number,
        feedback: String,
        correctAnswer: String,
        _id: false
      }
    ],
    score: { type: Number, default: 0 },
    maxScore: { type: Number, default: 0 },
    percent: { type: Number, default: 0 },
    passed: { type: Boolean, default: false },
    certificateNumber: { type: String }
  },
  { timestamps: true }
);

export default models.ExamSession || mongoose.model<IExamSessionDocument>('ExamSession', ExamSessionSchema);
