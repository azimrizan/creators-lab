import mongoose, { Schema, Document, models } from 'mongoose';

/** One row per AI call: used for per-user daily limits and cost tracking. */
export interface IAiUsageDocument extends Document {
  userKey: string;
  agent: string;
  aiModel: string;
  promptTokens: number;
  completionTokens: number;
  day: string;
  ok: boolean;
}

const AiUsageSchema = new Schema<IAiUsageDocument>(
  {
    userKey: { type: String, required: true },
    agent: { type: String, required: true },
    aiModel: { type: String, required: true },
    promptTokens: { type: Number, default: 0 },
    completionTokens: { type: Number, default: 0 },
    day: { type: String, required: true },
    ok: { type: Boolean, default: true }
  },
  { timestamps: true }
);

AiUsageSchema.index({ userKey: 1, day: 1 });

export default models.AiUsage || mongoose.model<IAiUsageDocument>('AiUsage', AiUsageSchema);
