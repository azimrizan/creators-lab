import mongoose, { Schema, Document, models } from 'mongoose';
import { CourseStatus, CourseLevel, LessonContentType } from '@/lib/types';

export interface ICourseDocument extends Document {
  title: string;
  slug: string;
  subtitle: string;
  description: string;
  thumbnail: string;
  previewVideoUrl: string;
  price: number;
  discountPrice?: number;
  status: CourseStatus;
  level: CourseLevel;
  language: string;
  categoryId: string;
  categoryName: string;
  subcategory: string;
  tags: string[];
  instructorId: string;
  instructorName: string;
  instructorAvatar: string;
  instructorTitle: string;
  sections: Array<{
    id: string;
    title: string;
    order: number;
    lessons: Array<{
      id: string;
      title: string;
      order: number;
      contentType: LessonContentType;
      durationSeconds: number;
      videoUrl: string;
      isFreePreview: boolean;
      pdfUrl?: string;
      textContent?: string;
      quiz?: any;
    }>;
  }>;
  rating: number;
  reviewCount: number;
  studentCount: number;
  whatYouWillLearn: string[];
  prerequisites: string[];
}

const CourseSchema = new Schema<ICourseDocument>(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },
    subtitle: { type: String },
    description: { type: String },
    thumbnail: { type: String },
    previewVideoUrl: { type: String },
    price: { type: Number, required: true },
    discountPrice: { type: Number },
    status: {
      type: String,
      enum: ['DRAFT', 'PENDING_APPROVAL', 'PUBLISHED', 'UNPUBLISHED', 'REJECTED', 'ARCHIVED'],
      default: 'DRAFT',
      index: true
    },
    level: {
      type: String,
      enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'ALL_LEVELS'],
      default: 'BEGINNER'
    },
    language: { type: String, default: 'English' },
    categoryId: { type: String, required: true, index: true },
    categoryName: { type: String, required: true },
    subcategory: { type: String },
    tags: [{ type: String }],
    instructorId: { type: String, required: true },
    instructorName: { type: String, required: true },
    instructorAvatar: { type: String },
    instructorTitle: { type: String },
    sections: [Schema.Types.Mixed],
    rating: { type: Number, default: 5.0 },
    reviewCount: { type: Number, default: 0 },
    studentCount: { type: Number, default: 0 },
    whatYouWillLearn: [{ type: String }],
    prerequisites: [{ type: String }]
  },
  { timestamps: true }
);

CourseSchema.index({ title: 'text', subtitle: 'text', description: 'text', tags: 'text', categoryName: 'text' });

export default models.Course || mongoose.model<ICourseDocument>('Course', CourseSchema);
