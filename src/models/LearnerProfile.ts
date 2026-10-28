import mongoose, { Schema, Document, models } from 'mongoose';

export interface ILearnerProfileDocument extends Document {
  userId: string;
  interests: string[];
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  goal: string;
  goalType: 'HOBBY' | 'CAREER' | 'FREELANCE' | 'UPSKILL' | 'OTHER';
  weeklyHours: number;
  learningStyle: string;
  notes: string;
  onboardedAt?: Date;
  dismissedAt?: Date;
  lastWelcomeAt?: Date;
}

const LearnerProfileSchema = new Schema<ILearnerProfileDocument>(
  {
    userId: { type: String, required: true, unique: true, index: true },
    interests: [{ type: String }],
    level: { type: String, enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'], default: 'BEGINNER' },
    goal: { type: String, default: '' },
    goalType: { type: String, enum: ['HOBBY', 'CAREER', 'FREELANCE', 'UPSKILL', 'OTHER'], default: 'OTHER' },
    weeklyHours: { type: Number, default: 3, min: 0, max: 80 },
    learningStyle: { type: String, default: '' },
    notes: { type: String, default: '' },
    onboardedAt: { type: Date },
    dismissedAt: { type: Date },
    lastWelcomeAt: { type: Date }
  },
  { timestamps: true }
);

export default models.LearnerProfile || mongoose.model<ILearnerProfileDocument>('LearnerProfile', LearnerProfileSchema);
