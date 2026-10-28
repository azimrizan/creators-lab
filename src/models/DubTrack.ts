import mongoose, { Schema, Document, models } from 'mongoose';

/** One AI-dubbed audio language for a lesson video, plus its subtitles. Shared by every lesson that uses the same video. */
export interface IDubTrackDocument extends Document {
  mediaKey: string;
  language: string;
  voice: 'male' | 'female';
  status: 'queued' | 'transcribing' | 'translating' | 'voicing' | 'mixing' | 'ready' | 'failed';
  progress: number;
  error?: string;
  /** Public URL of the AAC track (Vercel Blob, or the local file route in development). */
  audioUrl?: string;
  /** WebVTT subtitles in this language. */
  subtitles?: string;
  updatedAt: Date;
}

const DubTrackSchema = new Schema<IDubTrackDocument>(
  {
    mediaKey: { type: String, required: true, index: true },
    language: { type: String, required: true },
    voice: { type: String, enum: ['male', 'female'], default: 'male' },
    status: { type: String, required: true },
    progress: { type: Number, default: 0 },
    error: { type: String },
    audioUrl: { type: String },
    subtitles: { type: String }
  },
  { timestamps: true }
);

DubTrackSchema.index({ mediaKey: 1, language: 1 }, { unique: true });

export default models.DubTrack || mongoose.model<IDubTrackDocument>('DubTrack', DubTrackSchema);
