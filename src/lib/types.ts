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

export const DEFAULT_COURSE_THUMBNAIL = 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=800&q=80';
export const STALE_REACT_IMAGE_ID = '1633356122544-f134324a6cee';

export const CATEGORY_THUMBNAILS: { [key: string]: string } = {
  filmmaking: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=800&q=80',
  cinematography: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=800&q=80',
  camera: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=800&q=80',
  directing: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=800&q=80',
  storytelling: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=800&q=80',
  film: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=800&q=80',
  cinema: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=800&q=80',
  
  photography: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80',
  photo: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80',
  portrait: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
  lighting: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80',
  
  editing: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=800&q=80',
  davinci: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=800&q=80',
  grading: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=800&q=80',
  color: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=800&q=80',
  premiere: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=800&q=80',
  
  '3d': 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
  blender: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
  motion: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80',
  animation: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80',
  vfx: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80',
  unreal: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
  
  music: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=800&q=80',
  audio: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=800&q=80',
  sound: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=800&q=80',
  scoring: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=800&q=80',
  mixing: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=800&q=80',
  ableton: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=800&q=80',
  
  design: 'https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?auto=format&fit=crop&w=800&q=80',
  figma: 'https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?auto=format&fit=crop&w=800&q=80',
  ui: 'https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?auto=format&fit=crop&w=800&q=80',
  ux: 'https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?auto=format&fit=crop&w=800&q=80',
  branding: 'https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?auto=format&fit=crop&w=800&q=80',
  typography: 'https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?auto=format&fit=crop&w=800&q=80',
  
  dance: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=800&q=80',
  acting: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=800&q=80'
};

export const CURATED_THUMBNAIL_GALLERY = [
  'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=800&q=80', // Cinema camera
  'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=800&q=80', // Color grading
  'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80', // Camera lens
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80', // 3D Fluid
  'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=800&q=80', // Studio sound mixer
  'https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?auto=format&fit=crop&w=800&q=80', // Design UI
  'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80', // Motion graphics
  'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=800&q=80'  // Performing arts / cinematic lighting
];

export function getSafeThumbnail(thumbnail?: string, title?: string, categoryName?: string): string {
  const textToSearch = `${title || ''} ${categoryName || ''}`.toLowerCase();

  // If keyword matches a specific theme, prioritize that image
  for (const [key, url] of Object.entries(CATEGORY_THUMBNAILS)) {
    if (textToSearch.includes(key)) {
      if (thumbnail && !thumbnail.includes(STALE_REACT_IMAGE_ID) && !thumbnail.includes('photo-1555066931') && thumbnail !== DEFAULT_COURSE_THUMBNAIL) {
        return thumbnail;
      }
      return url;
    }
  }

  // If already a valid, non-code, non-stale URL, return it
  if (thumbnail && !thumbnail.includes(STALE_REACT_IMAGE_ID) && !thumbnail.includes('photo-1555066931')) {
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
