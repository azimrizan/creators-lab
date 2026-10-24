'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Star, Heart, ShoppingBag, Check, Play } from 'lucide-react';
import { Course, getSafeThumbnail } from '@/lib/types';
import { useAppStore } from '@/lib/store';
import AuthModal from './AuthModal';

interface CourseCardProps {
  course: Course;
  imageClassName?: string;
}

export default function CourseCard({ course, imageClassName }: CourseCardProps) {
  const router = useRouter();
  const { currentUser, wishlistCourseIds, toggleWishlist, cartCourseIds, addToCart } = useAppStore();
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  const courseId = course.id || (course as any)._id || course.slug;

  const isWishlisted = Boolean(courseId && wishlistCourseIds.includes(courseId));
  const isInCart = Boolean(courseId && cartCourseIds.includes(courseId));
  const isEnrolled = Boolean(
    courseId && (
      currentUser.enrolledCourseIds.includes(courseId) ||
      (course.id && currentUser.enrolledCourseIds.includes(course.id)) ||
      (course.slug && currentUser.enrolledCourseIds.includes(course.slug))
    )
  );

  const firstLesson = course.sections?.[0]?.lessons?.[0];
  const targetUrl = isEnrolled
    ? `/watch/${course.slug}/${firstLesson?.id || 'les-1'}`
    : `/course/${course.slug}`;

  const handleCardClick = () => {
    router.push(targetUrl);
  };

  const handleCartClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (currentUser.id === 'guest') {
      setIsAuthOpen(true);
      return;
    }
    if (courseId) {
      addToCart(courseId);
    }
  };

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (currentUser.id === 'guest') {
      setIsAuthOpen(true);
      return;
    }
    if (courseId) {
      toggleWishlist(courseId);
    }
  };

  const displayThumbnail = getSafeThumbnail(course.thumbnail, course.title, course.categoryName);

  return (
    <>
      <div 
        onClick={handleCardClick}
        className="group relative bg-white rounded-md overflow-hidden transition-all duration-300 transform hover:scale-105 hover:z-50 hover:shadow-xl flex flex-col border border-zinc-200 cursor-pointer"
      >
        {/* Poster Thumbnail */}
        <div className={`relative overflow-hidden bg-zinc-100 ${imageClassName || 'aspect-video'}`}>
          <img
            src={displayThumbnail}
            alt={course.title}
            className="w-full h-full object-cover group-hover:opacity-95 transition-opacity"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-white/90 via-transparent to-transparent opacity-80" />

          {/* Category Tag */}
          <span className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm text-xs font-semibold px-2 py-0.5 rounded text-zinc-800 border border-zinc-200 shadow-sm">
            {course.categoryName}
          </span>
        </div>

        {/* Card Content & Action Bar */}
        <div className="p-4 flex-1 flex flex-col justify-between space-y-3 bg-white">
          <div className="space-y-1.5">
            <h3 className="font-bold text-zinc-900 text-sm line-clamp-1 group-hover:text-[#d33028] transition-colors">
              {course.title}
            </h3>
            <p className="text-xs text-zinc-500 line-clamp-1">By {course.instructorName}</p>
          </div>

          {/* Metadata Bar */}
          <div className="flex items-center gap-3 text-[11px] text-zinc-500 font-medium">
            <div className="flex items-center gap-1 text-amber-500 font-bold">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>{course.rating}</span>
            </div>
            <span>•</span>
            <span className="text-zinc-400">{course.level}</span>
            <span>•</span>
            <span className="text-[#d33028] font-bold">₹{course.discountPrice || course.price}</span>
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between pt-2 border-t border-zinc-100">
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-full bg-[#d33028] text-white flex items-center justify-center hover:bg-[#b82720] transition shadow-md"
                title={isEnrolled ? "Stream Masterclass" : "View Curriculum & Enroll"}
              >
                <Play className="w-4 h-4 fill-current translate-x-0.5" />
              </div>

              <button
                onClick={handleWishlistClick}
                className={`w-8 h-8 rounded-full border flex items-center justify-center transition ${
                  isWishlisted
                    ? 'bg-rose-50 border-rose-400 text-rose-500'
                    : 'border-zinc-300 text-zinc-500 hover:border-zinc-400 hover:bg-zinc-100'
                }`}
                title="Wishlist"
              >
                <Heart className={`w-3.5 h-3.5 ${isWishlisted ? 'fill-rose-500 text-rose-500' : ''}`} />
              </button>
            </div>

            {/* Cart / Play Button */}
            {isEnrolled ? (
              <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2.5 py-1 rounded border border-emerald-300 hover:bg-emerald-100 transition flex items-center gap-1">
                <span>Enrolled</span>
                <span className="text-xs">▶</span>
              </span>
            ) : (
              <button
                onClick={handleCartClick}
                disabled={isInCart}
                className={`p-1.5 px-3 rounded text-xs font-semibold flex items-center gap-1.5 transition ${
                  isInCart
                    ? 'bg-[#d33028]/10 border border-[#d33028]/30 text-[#d33028]'
                    : 'bg-[#d33028] hover:bg-[#b82720] text-white shadow-md'
                }`}
              >
                {isInCart ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>In Cart</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </>
  );
}
