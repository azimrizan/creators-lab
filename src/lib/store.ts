'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, Course, Order, Certificate, UserRole, getSafeThumbnail } from './types';
import { MOCK_COURSES, MOCK_ORDERS, MOCK_CERTIFICATES } from './mockData';
import { stripQuizAnswers } from './courseUtils';

interface ProgressMap {
  [courseId: string]: {
    completedLessonIds: string[];
    lastPositionSec: { [lessonId: string]: number };
  };
}

const GUEST_USER: User = {
  id: 'guest',
  name: 'Guest Learner',
  email: 'guest@learnhub.com',
  role: 'STUDENT',
  avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=250&q=80',
  isBlocked: false,
  enrolledCourseIds: [],
  wishlistCourseIds: [],
  createdAt: new Date().toISOString()
};

interface AppStore {
  // User & Auth State
  currentUser: User;
  setCurrentUser: (user: User) => void;

  // Data Fetching
  fetchCoursesFromApi: () => Promise<void>;
  fetchOrdersFromApi: () => Promise<void>;
  fetchCertificatesFromApi: () => Promise<void>;
  hydrateCourseProgress: (courseId: string) => Promise<void>;

  // Courses & Data State
  courses: Course[];
  userProgress: ProgressMap;
  markLessonComplete: (courseId: string, lessonId: string) => void;
  updateWatchPosition: (courseId: string, lessonId: string, seconds: number) => void;

  // Cart & Wishlist State
  cartCourseIds: string[];
  addToCart: (courseId: string) => void;
  removeFromCart: (courseId: string) => void;
  clearCart: () => void;
  appliedCoupon: string | null;
  applyCoupon: (code: string) => { success: boolean; discountPercent: number; message: string };

  wishlistCourseIds: string[];
  toggleWishlist: (courseId: string) => void;

  // Orders & Enrollment State
  orders: Order[];
  certificates: Certificate[];
  enrollUserInCourse: (courseId: string, paymentId: string, gateway: 'RAZORPAY' | 'STRIPE') => Promise<void>;

  // Admin Actions
  addCourse: (course: Course) => Promise<void>;
  updateCourseStatus: (courseId: string, status: Course['status']) => void;
  blockUser: (userId: string, isBlocked: boolean) => Promise<void>;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      currentUser: GUEST_USER,
      setCurrentUser: (user: User) => set({ currentUser: user }),

      courses: MOCK_COURSES.map(stripQuizAnswers),
      orders: MOCK_ORDERS,
      certificates: MOCK_CERTIFICATES,

      fetchCoursesFromApi: async () => {
        try {
          const res = await fetch('/api/courses');
          const data = await res.json();
          if (data.success && data.data && data.data.length > 0) {
            const sanitized = data.data.map((c: Course) => ({
              ...c,
              thumbnail: getSafeThumbnail(c.thumbnail, c.title, c.categoryName)
            }));
            set({ courses: sanitized });
          }
        } catch (e) {
          // fallback to initial state
        }
      },

      fetchOrdersFromApi: async () => {
        try {
          const res = await fetch('/api/orders');
          const data = await res.json();
          if (data.success && data.orders) {
            set({ orders: data.orders });
          }
        } catch (e) {}
      },

      fetchCertificatesFromApi: async () => {
        try {
          const res = await fetch('/api/certificates');
          const data = await res.json();
          if (data.success && Array.isArray(data.certificates)) {
            set({ certificates: data.certificates });
          }
        } catch (e) {}
      },

      // Merge the learner's saved server progress into local state (server wins for completion).
      hydrateCourseProgress: async (courseId: string) => {
        if (get().currentUser.id === 'guest') return;
        try {
          const res = await fetch(`/api/progress?courseId=${encodeURIComponent(courseId)}`);
          const data = await res.json();
          if (!data.success || !Array.isArray(data.progress)) return;
          set(state => {
            const current = state.userProgress[courseId] || { completedLessonIds: [], lastPositionSec: {} };
            const completed = new Set(current.completedLessonIds);
            const positions = { ...current.lastPositionSec };
            data.progress.forEach((p: { lessonId: string; positionSec: number; completed: boolean }) => {
              if (p.completed) completed.add(p.lessonId);
              if (p.positionSec > 0) positions[p.lessonId] = p.positionSec;
            });
            return {
              userProgress: {
                ...state.userProgress,
                [courseId]: { completedLessonIds: Array.from(completed), lastPositionSec: positions }
              }
            };
          });
        } catch (e) {}
      },

      userProgress: {},

      markLessonComplete: (courseId: string, lessonId: string) => {
        set(state => {
          const current = state.userProgress[courseId] || { completedLessonIds: [], lastPositionSec: {} };
          if (current.completedLessonIds.includes(lessonId)) return state;

          const updatedCompleted = [...current.completedLessonIds, lessonId];
          const newProgress = {
            ...state.userProgress,
            [courseId]: {
              ...current,
              completedLessonIds: updatedCompleted
            }
          };

          // Save progress to API if authenticated
          if (state.currentUser.id !== 'guest') {
            fetch('/api/progress', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ courseId, lessonId, isCompleted: true })
            }).catch(() => {});
          }

          // Certificates are issued by the server when the learner passes the final exam.
          return { userProgress: newProgress };
        });
      },

      updateWatchPosition: (courseId: string, lessonId: string, seconds: number) => {
        set(state => {
          const current = state.userProgress[courseId] || { completedLessonIds: [], lastPositionSec: {} };
          return {
            userProgress: {
              ...state.userProgress,
              [courseId]: {
                ...current,
                lastPositionSec: {
                  ...current.lastPositionSec,
                  [lessonId]: seconds
                }
              }
            }
          };
        });
      },

      cartCourseIds: [],
      addToCart: (courseId: string) => {
        set(state => {
          if (state.cartCourseIds.includes(courseId)) return state;
          return { cartCourseIds: [...state.cartCourseIds, courseId] };
        });
      },
      removeFromCart: (courseId: string) => {
        set(state => ({ cartCourseIds: state.cartCourseIds.filter(id => id !== courseId) }));
      },
      clearCart: () => set({ cartCourseIds: [], appliedCoupon: null }),

      appliedCoupon: null,
      applyCoupon: (code: string) => {
        const clean = code.trim().toUpperCase();
        if (clean === 'WELCOME20' || clean === 'PROMO20') {
          set({ appliedCoupon: clean });
          return { success: true, discountPercent: 20, message: '20% discount coupon applied!' };
        }
        return { success: false, discountPercent: 0, message: 'Invalid or expired coupon code.' };
      },

      wishlistCourseIds: [],
      toggleWishlist: (courseId: string) => {
        set(state => {
          const exists = state.wishlistCourseIds.includes(courseId);
          return {
            wishlistCourseIds: exists
              ? state.wishlistCourseIds.filter(id => id !== courseId)
              : [...state.wishlistCourseIds, courseId]
          };
        });
      },

      enrollUserInCourse: async (courseId: string, paymentId: string, gateway: 'RAZORPAY' | 'STRIPE') => {
        const state = get();
        const course = state.courses.find(c => c.id === courseId || c.slug === courseId || (c as any)._id === courseId) || state.courses[0];
        if (!course) return;

        const effectiveId = course.id || (course as any)._id || course.slug;
        const price = course.discountPrice || course.price;
        const discountAmount = state.appliedCoupon ? price * 0.2 : 0;
        const subtotal = price - discountAmount;
        const taxAmount = subtotal * 0.18;
        const totalAmount = Math.round((subtotal + taxAmount) * 100) / 100;

        const newOrder: Order = {
          id: `ord-${Date.now()}`,
          orderNumber: `ORD-2026-${Math.floor(1000 + Math.random() * 9000)}`,
          userId: state.currentUser.id,
          userName: state.currentUser.name,
          userEmail: state.currentUser.email,
          items: [{ courseId: effectiveId, courseTitle: course.title, price }],
          subtotal,
          discountAmount,
          taxAmount,
          totalAmount,
          paymentGateway: gateway,
          paymentId: paymentId || `pay_${Date.now()}`,
          status: 'SUCCESSFUL',
          createdAt: new Date().toISOString().split('T')[0]
        };

        set(curr => ({
          orders: [newOrder, ...curr.orders],
          currentUser: {
            ...curr.currentUser,
            enrolledCourseIds: Array.from(new Set([...curr.currentUser.enrolledCourseIds, effectiveId, course.id, course.slug, courseId]))
          },
          cartCourseIds: curr.cartCourseIds.filter(id => id !== effectiveId && id !== course.id && id !== course.slug && id !== courseId)
        }));

        try {
          await fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: state.currentUser.id !== 'guest' ? state.currentUser.id : undefined,
              items: [{ courseId: effectiveId, courseTitle: course.title, price }],
              subtotal,
              discountAmount,
              taxAmount,
              totalAmount,
              paymentGateway: gateway,
              paymentId
            })
          });
        } catch (e) {}
      },

      addCourse: async (newCourse: Course) => {
        try {
          const res = await fetch('/api/courses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newCourse)
          });
          const data = await res.json();
          if (data.success && data.data) {
            set(state => ({ courses: [data.data, ...state.courses] }));
            return;
          }
        } catch (e) {}

        set(state => ({ courses: [newCourse, ...state.courses] }));
      },

      updateCourseStatus: (courseId: string, status: Course['status']) => {
        set(state => ({
          courses: state.courses.map(c => (c.id === courseId ? { ...c, status } : c))
        }));
      },

      blockUser: async (userId: string, isBlocked: boolean) => {
        try {
          await fetch('/api/users', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, isBlocked })
          });
        } catch (e) {}

        set(state => {
          if (state.currentUser.id === userId) {
            return { currentUser: { ...state.currentUser, isBlocked } };
          }
          return state;
        });
      }
    }),
    {
      name: 'lms-app-store-v9',
      // Courses always come fresh from the API; persisting them could keep stale data.
      partialize: ({ courses, ...rest }) => rest
    }
  )
);
