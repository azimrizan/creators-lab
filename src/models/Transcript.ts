import mongoose, { Schema, Document, models } from 'mongoose';

/** Raw Whisper output cached per media file, so a video shared by several lessons is transcribed once. */
export interface ITranscriptDocument extends Document {
  mediaKey: string;
  language: string;
  durationSec: number;
  segments: Array<{ start: number; end: number; text: string }>;
  aiModel: string;
}

const TranscriptSchema = new Schema<ITranscriptDocument>(
  {
    mediaKey: { type: String, required: true, unique: true, index: true },
    language: { type: String, default: 'en' },
    durationSec: { type: Number, default: 0 },
    segments: [{ start: Number, end: Number, text: String, _id: false }],
    aiModel: { type: String }
  },
  { timestamps: true }
);

export default models.Transcript || mongoose.model<ITranscriptDocument>('Transcript', TranscriptSchema);
