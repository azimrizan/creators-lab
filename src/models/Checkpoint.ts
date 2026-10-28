import mongoose, { Schema, Document, models } from 'mongoose';

export type ContentStatus = 'DRAFT' | 'APPROVED';

export interface ICheckpointQuestion {
  qid: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

/** An in-video pause point. The video stops at `atSec` and the learner answers its questions to continue. */
export interface ICheckpointDocument extends Document {
  courseSlug: string;
  lessonId: string;
  atSec: number;
  rewatchFromSec: number;
  topic: string;
  questions: ICheckpointQuestion[];
  status: ContentStatus;
}

const CheckpointSchema = new Schema<ICheckpointDocument>(
  {
    courseSlug: { type: String, required: true, index: true },
    lessonId: { type: String, required: true, index: true },
    atSec: { type: Number, required: true },
    rewatchFromSec: { type: Number, default: 0 },
    topic: { type: String, default: '' },
    questions: [
      {
        qid: { type: String, required: true },
        question: { type: String, required: true },
        options: [{ type: String }],
        correctIndex: { type: Number, required: true },
        explanation: { type: String, default: '' },
        _id: false
      }
    ],
    status: { type: String, enum: ['DRAFT', 'APPROVED'], default: 'DRAFT', index: true }
  },
  { timestamps: true }
);

export default models.Checkpoint || mongoose.model<ICheckpointDocument>('Checkpoint', CheckpointSchema);
