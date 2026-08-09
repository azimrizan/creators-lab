import mongoose, { Schema, Document, models } from 'mongoose';
import { UserRole } from '@/lib/types';

export interface IUserDocument extends Document {
  name: string;
  email: string;
  passwordHash?: string;
  role: UserRole;
  avatar: string;
  bio?: string;
  isBlocked: boolean;
  enrolledCourseIds: string[];
  wishlistCourseIds: string[];
  createdAt: Date;
}

const UserSchema = new Schema<IUserDocument>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String },
    role: {
      type: String,
      enum: ['SUPER_ADMIN', 'ADMIN', 'CONTENT_MANAGER', 'SUPPORT_STAFF', 'INSTRUCTOR', 'STUDENT'],
      default: 'STUDENT'
    },
    avatar: { type: String, default: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=250&q=80' },
    bio: { type: String },
    isBlocked: { type: Boolean, default: false },
    enrolledCourseIds: [{ type: String }],
    wishlistCourseIds: [{ type: String }]
  },
  { timestamps: true }
);

export default models.User || mongoose.model<IUserDocument>('User', UserSchema);
