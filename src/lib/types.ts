export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'CONTENT_MANAGER' | 'SUPPORT_STAFF' | 'INSTRUCTOR' | 'STUDENT';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  bio?: string;
  isBlocked: boolean;
  enrolledCourseIds: string[];
  wishlistCourseIds: string[];
  createdAt: string;
}

export type CourseStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'PUBLISHED' | 'UNPUBLISHED' | 'REJECTED' | 'ARCHIVED';
export type CourseLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'ALL_LEVELS';
export type LessonContentType = 'VIDEO' | 'PDF' | 'TEXT' | 'QUIZ' | 'ASSIGNMENT';

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
}

export interface Quiz {
  id: string;
  title: string;
  passingScorePercent: number;
  timeLimitMinutes: number;
  questions: QuizQuestion[];
}

export interface Lesson {
  id: string;
  title: string;
  order: number;
  contentType: LessonContentType;
  durationSeconds: number;
  videoUrl: string;
  isFreePreview: boolean;
  pdfUrl?: string;
  textContent?: string;
  quiz?: Quiz;
}

export interface Section {
  id: string;
  title: string;
  order: number;
  lessons: Lesson[];
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  subcategories: string[];
}

export interface Course {
  id: string;
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
  sections: Section[];
  rating: number;
  reviewCount: number;
  studentCount: number;
  whatYouWillLearn: string[];
  prerequisites: string[];
  updatedAt: string;
}

export interface Review {
  id: string;
  courseId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface LessonQA {
  id: string;
  lessonId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  isInstructor: boolean;
  question: string;
  createdAt: string;
  replies: {
    id: string;
    userId: string;
    userName: string;
    userAvatar: string;
    isInstructor: boolean;
    answer: string;
    createdAt: string;
  }[];
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  userName: string;
  userEmail: string;
  items: {
    courseId: string;
    courseTitle: string;
    price: number;
  }[];
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  paymentGateway: 'RAZORPAY' | 'STRIPE';
  paymentId: string;
  status: 'SUCCESSFUL' | 'FAILED' | 'REFUNDED' | 'PENDING';
  createdAt: string;
}

export interface Certificate {
  id: string;
  certificateNumber: string;
  userId: string;
  userName: string;
  courseId: string;
  courseTitle: string;
  issueDate: string;
  instructorName: string;
}

export interface SystemSettings {
  siteName: string;
  contactEmail: string;
  currencySymbol: string;
  enableRazorpay: boolean;
  taxRatePercent: number;
  maxLoginAttempts: number;
  require2FAForAdmin: boolean;
}
