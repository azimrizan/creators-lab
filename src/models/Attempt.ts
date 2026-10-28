import mongoose, { Schema, Document, models } from 'mongoose';

/** One answered question from any assessment, tagged by topic so reports can find weak areas. */
export interface IAttemptDocument extends Document {
  userId: string;
  courseSlug: string;
  lessonId: string;
  kind: 'CHECKPOINT' | 'FOLLOW_UP' | 'LESSON_QUIZ' | 'EXAM';
  refId: string;
  topic: string;
  question: string;
  correct: boolean;
  points: number;
  maxPoints: number;
  timestampSec: number;
}

const AttemptSchema = new Schema<IAttemptDocument>(
  {
    userId: { type: String, required: true, index: true },
    courseSlug: { type: String, required: true, index: true },
    lessonId: { type: String, default: '' },
    kind: { type: String, enum: ['CHECKPOINT', 'FOLLOW_UP', 'LESSON_QUIZ', 'EXAM'], required: true },
    refId: { type: String, default: '' },
    topic: { type: String, default: '' },
    question: { type: String, default: '' },
    correct: { type: Boolean, required: true },
    points: { type: Number, default: 0 },
    maxPoints: { type: Number, default: 1 },
    timestampSec: { type: Number, default: 0 }
  },
  { timestamps: true }
);

AttemptSchema.index({ userId: 1, courseSlug: 1, createdAt: -1 });

export default models.Attempt || mongoose.model<IAttemptDocument>('Attempt', AttemptSchema);
