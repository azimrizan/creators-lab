import mongoose, { Schema, Document, models } from 'mongoose';

export interface IReportDocument extends Document {
  userId: string;
  courseSlug: string;
  trigger: 'ON_DEMAND' | 'AFTER_EXAM' | 'AFTER_QUIZ' | 'WEEKLY';
  stats: Record<string, unknown>;
  insights: Record<string, unknown>;
  aiModel: string;
}

const ReportSchema = new Schema<IReportDocument>(
  {
    userId: { type: String, required: true, index: true },
    courseSlug: { type: String, required: true, index: true },
    trigger: { type: String, enum: ['ON_DEMAND', 'AFTER_EXAM', 'AFTER_QUIZ', 'WEEKLY'], default: 'ON_DEMAND' },
    stats: { type: Schema.Types.Mixed, default: {} },
    insights: { type: Schema.Types.Mixed, default: {} },
    aiModel: { type: String, default: '' }
  },
  { timestamps: true }
);

export default models.Report || mongoose.model<IReportDocument>('Report', ReportSchema);
