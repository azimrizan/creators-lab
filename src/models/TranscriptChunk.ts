import mongoose, { Schema, Document, models } from 'mongoose';

/** A searchable ~1 minute passage of a lesson transcript, used by the tutor and content generation. */
export interface ITranscriptChunkDocument extends Document {
  courseSlug: string;
  lessonId: string;
  order: number;
  startSec: number;
  endSec: number;
  topic: string;
  text: string;
}

const TranscriptChunkSchema = new Schema<ITranscriptChunkDocument>(
  {
    courseSlug: { type: String, required: true, index: true },
    lessonId: { type: String, required: true, index: true },
    order: { type: Number, required: true },
    startSec: { type: Number, required: true },
    endSec: { type: Number, required: true },
    topic: { type: String, default: '' },
    text: { type: String, required: true }
  },
  { timestamps: true }
);

TranscriptChunkSchema.index({ courseSlug: 1, lessonId: 1, order: 1 });

export default models.TranscriptChunk || mongoose.model<ITranscriptChunkDocument>('TranscriptChunk', TranscriptChunkSchema);
