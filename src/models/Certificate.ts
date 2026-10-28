import mongoose, { Schema, Document, models } from 'mongoose';

export interface ICertificateDocument extends Document {
  certificateNumber: string;
  userId: string;
  userName: string;
  courseSlug: string;
  courseId: string;
  courseTitle: string;
  instructorName: string;
  issueDate: string;
  examPercent: number;
}

const CertificateSchema = new Schema<ICertificateDocument>(
  {
    certificateNumber: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    userName: { type: String, required: true },
    courseSlug: { type: String, required: true },
    courseId: { type: String, required: true },
    courseTitle: { type: String, required: true },
    instructorName: { type: String, default: '' },
    issueDate: { type: String, required: true },
    examPercent: { type: Number, default: 0 }
  },
  { timestamps: true }
);

CertificateSchema.index({ userId: 1, courseSlug: 1 }, { unique: true });

export default models.Certificate || mongoose.model<ICertificateDocument>('Certificate', CertificateSchema);
