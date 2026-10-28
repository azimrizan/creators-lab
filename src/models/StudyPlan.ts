import mongoose, { Schema, Document, models } from 'mongoose';

export interface IStudySession {
  day: string;
  courseSlug: string;
  courseTitle: string;
  lessonIds: string[];
  lessonTitles: string[];
  minutes: number;
  focus: string;
}

export interface IStudyPlanDocument extends Document {
  userId: string;
  weekStart: string;
  summary: string;
  nudge: string;
  sessions: IStudySession[];
}

const StudyPlanSchema = new Schema<IStudyPlanDocument>(
  {
    userId: { type: String, required: true, index: true },
    weekStart: { type: String, required: true },
    summary: { type: String, default: '' },
    nudge: { type: String, default: '' },
    sessions: [
      {
        day: String,
        courseSlug: String,
        courseTitle: String,
        lessonIds: [String],
        lessonTitles: [String],
        minutes: Number,
        focus: String,
        _id: false
      }
    ]
  },
  { timestamps: true }
);

StudyPlanSchema.index({ userId: 1, weekStart: 1 }, { unique: true });

export default models.StudyPlan || mongoose.model<IStudyPlanDocument>('StudyPlan', StudyPlanSchema);
