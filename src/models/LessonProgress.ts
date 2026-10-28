import mongoose, { Schema, Document, models } from 'mongoose';

export interface ILessonProgressDocument extends Document {
  userId: string;
  courseSlug: string;
  lessonId: string;
  positionSec: number;
  durationSec: number;
  watchedSec: number;
  maxPositionSec: number;
  completed: boolean;
  completedAt?: Date;
  rewatches: Array<{ fromSec: number; toSec: number; at: Date }>;
  skips: Array<{ fromSec: number; toSec: number; at: Date }>;
  clearedCheckpointIds: string[];
  updatedAt: Date;
}

const LessonProgressSchema = new Schema<ILessonProgressDocument>(
  {
    userId: { type: String, required: true, index: true },
    courseSlug: { type: String, required: true, index: true },
    lessonId: { type: String, required: true },
    positionSec: { type: Number, default: 0 },
    durationSec: { type: Number, default: 0 },
    watchedSec: { type: Number, default: 0 },
    maxPositionSec: { type: Number, default: 0 },
    completed: { type: Boolean, default: false },
    completedAt: { type: Date },
    rewatches: [{ fromSec: Number, toSec: Number, at: Date, _id: false }],
    skips: [{ fromSec: Number, toSec: Number, at: Date, _id: false }],
    clearedCheckpointIds: [{ type: String }]
  },
  { timestamps: true }
);

LessonProgressSchema.index({ userId: 1, courseSlug: 1, lessonId: 1 }, { unique: true });

export default models.LessonProgress || mongoose.model<ILessonProgressDocument>('LessonProgress', LessonProgressSchema);
