import mongoose, { Schema, Document, models } from 'mongoose';

/** Per-lesson revision material: a summary, key points and flashcards. */
export interface IStudyKitDocument extends Document {
  courseSlug: string;
  lessonId: string;
  summary: string;
  keyPoints: string[];
  cards: Array<{ cardId: string; front: string; back: string; timestampSec: number }>;
  status: 'DRAFT' | 'APPROVED';
}

const StudyKitSchema = new Schema<IStudyKitDocument>(
  {
    courseSlug: { type: String, required: true, index: true },
    lessonId: { type: String, required: true },
    summary: { type: String, default: '' },
    keyPoints: [{ type: String }],
    cards: [{ cardId: String, front: String, back: String, timestampSec: Number, _id: false }],
    status: { type: String, enum: ['DRAFT', 'APPROVED'], default: 'DRAFT' }
  },
  { timestamps: true }
);

StudyKitSchema.index({ courseSlug: 1, lessonId: 1 }, { unique: true });

export default models.StudyKit || mongoose.model<IStudyKitDocument>('StudyKit', StudyKitSchema);
