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

export const DEFAULT_COURSE_THUMBNAIL = 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80';
export const STALE_REACT_IMAGE_ID = '1633356122544-f134324a6cee';

export const CATEGORY_THUMBNAILS: { [key: string]: string } = {
  dance: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=800&q=80',
  music: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80',
  ai: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=800&q=80',
  python: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=800&q=80',
  storytelling: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=800&q=80',
  film: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=800&q=80',
  cinema: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=800&q=80',
  design: 'https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?auto=format&fit=crop&w=800&q=80',
  figma: 'https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?auto=format&fit=crop&w=800&q=80',
  ui: 'https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?auto=format&fit=crop&w=800&q=80',
  ux: 'https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?auto=format&fit=crop&w=800&q=80',
  cloud: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80',
  devops: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80',
  kubernetes: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80',
  aws: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80',
  security: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80',
  cyber: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80',
  hacking: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80',
  mobile: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=800&q=80',
  flutter: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=800&q=80',
  web: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80',
  fullstack: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80',
  react: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80',
  next: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80',
  photo: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80'
};

export const CURATED_THUMBNAIL_GALLERY = [
  'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80'
];

export function getSafeThumbnail(thumbnail?: string, title?: string, categoryName?: string): string {
  const textToSearch = `${title || ''} ${categoryName || ''}`.toLowerCase();

  // If keyword matches a specific theme, prioritize that image
  for (const [key, url] of Object.entries(CATEGORY_THUMBNAILS)) {
    if (textToSearch.includes(key)) {
      // If the current thumbnail is already custom and valid (and not stale react or default), keep it
      if (thumbnail && !thumbnail.includes(STALE_REACT_IMAGE_ID) && thumbnail !== DEFAULT_COURSE_THUMBNAIL) {
        return thumbnail;
      }
      return url;
    }
  }

  // If already a valid, custom non-stale URL, return it
  if (thumbnail && !thumbnail.includes(STALE_REACT_IMAGE_ID)) {
    return thumbnail;
  }

  // Fallback: pick deterministically from gallery based on title
  if (title) {
    let hash = 0;
    for (let i = 0; i < title.length; i++) {
      hash = (hash << 5) - hash + title.charCodeAt(i);
      hash |= 0;
    }
    const index = Math.abs(hash) % CURATED_THUMBNAIL_GALLERY.length;
    return CURATED_THUMBNAIL_GALLERY[index];
  }

  return DEFAULT_COURSE_THUMBNAIL;
}
