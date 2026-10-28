import mongoose, { Schema, Document, models } from 'mongoose';

/** A fresh question generated for one learner after they miss a checkpoint question. */
export interface IFollowUpQuestionDocument extends Document {
  userId: string;
  courseSlug: string;
  lessonId: string;
  checkpointId: string;
  topic: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  answeredCorrectly?: boolean;
}

const FollowUpQuestionSchema = new Schema<IFollowUpQuestionDocument>(
  {
    userId: { type: String, required: true, index: true },
    courseSlug: { type: String, required: true },
    lessonId: { type: String, required: true },
    checkpointId: { type: String, required: true },
    topic: { type: String, default: '' },
    question: { type: String, required: true },
    options: [{ type: String }],
    correctIndex: { type: Number, required: true },
    explanation: { type: String, default: '' },
    answeredCorrectly: { type: Boolean }
  },
  { timestamps: true }
);

export default models.FollowUpQuestion || mongoose.model<IFollowUpQuestionDocument>('FollowUpQuestion', FollowUpQuestionSchema);
