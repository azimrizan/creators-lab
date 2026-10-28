import mongoose, { Schema, Document, models } from 'mongoose';

/** One learner's spaced-repetition state for one flashcard (SM-2). */
export interface ICardReviewDocument extends Document {
  userId: string;
  courseSlug: string;
  lessonId: string;
  cardId: string;
  ease: number;
  intervalDays: number;
  reps: number;
  lapses: number;
  dueAt: Date;
  lastReviewedAt?: Date;
}

const CardReviewSchema = new Schema<ICardReviewDocument>(
  {
    userId: { type: String, required: true, index: true },
    courseSlug: { type: String, required: true },
    lessonId: { type: String, required: true },
    cardId: { type: String, required: true },
    ease: { type: Number, default: 2.5 },
    intervalDays: { type: Number, default: 0 },
    reps: { type: Number, default: 0 },
    lapses: { type: Number, default: 0 },
    dueAt: { type: Date, default: Date.now, index: true },
    lastReviewedAt: { type: Date }
  },
  { timestamps: true }
);

CardReviewSchema.index({ userId: 1, cardId: 1 }, { unique: true });

export default models.CardReview || mongoose.model<ICardReviewDocument>('CardReview', CardReviewSchema);
