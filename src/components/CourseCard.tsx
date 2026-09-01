'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Star, Users, Heart, ShoppingBag, Check, Play, Info } from 'lucide-react';
import { Course, getSafeThumbnail } from '@/lib/types';
import { useAppStore } from '@/lib/store';
import AuthModal from './AuthModal';

interface CourseCardProps {
  course: Course;
}

export default function CourseCard({ course }: CourseCardProps) {
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

  const handleCartClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (currentUser.id === 'guest') {
      setIsAuthOpen(true);
      return;
    }
    if (courseId) {
      addToCart(courseId);
    }
  };

  const firstLesson = course.sections[0]?.lessons[0];
  const displayThumbnail = getSafeThumbnail(course.thumbnail);

  return (
    <>
      <div className="group relative bg-[#141414] rounded-md overflow-hidden transition-all duration-300 transform hover:scale-110 hover:z-50 hover:shadow-[0_10px_30px_rgba(0,0,0,0.9)] flex flex-col border border-white/5">
        {/* Poster Thumbnail */}
        <div className="relative aspect-video overflow-hidden bg-black">
          <img
            src={displayThumbnail}
            alt={course.title}
            className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-transparent to-transparent opacity-90" />

          {/* Category Tag */}
          <span className="absolute top-2 left-2 bg-black/70 backdrop-blur-sm text-xs font-semibold px-2 py-0.5 rounded text-white/90 border border-white/10">
            {course.categoryName}
          </span>
        </div>

        {/* Card Content & Action Bar */}
        <div className="p-4 flex-1 flex flex-col justify-between space-y-3 bg-[#141414]">
          <div className="space-y-1.5">
            <h3 className="font-bold text-white text-sm line-clamp-1 group-hover:text-red-500 transition-colors">
              {course.title}
            </h3>
            <p className="text-xs text-slate-400 line-clamp-1">By {course.instructorName}</p>
          </div>

          {/* Metadata Bar */}
          <div className="flex items-center gap-3 text-[11px] text-slate-300 font-medium">
            <div className="flex items-center gap-1 text-amber-400 font-bold">
              <Star className="w-3.5 h-3.5 fill-amber-400" />
              <span>{course.rating}</span>
            </div>
            <span>•</span>
            <span className="text-slate-400">{course.level}</span>
            <span>•</span>
            <span className="text-emerald-400 font-bold">₹{course.discountPrice || course.price}</span>
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between pt-2 border-t border-white/10">
            <div className="flex items-center gap-2">
              {isEnrolled ? (
                <Link
                  href={`/watch/${course.slug}/${firstLesson?.id || 'les-1'}`}
                  className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center hover:bg-slate-200 transition"
                  title="Play / Watch Now"
                >
                  <Play className="w-4 h-4 fill-current translate-x-0.5" />
                </Link>
              ) : (
                <Link
                  href={`/course/${course.slug}`}
                  className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center hover:bg-slate-200 transition"
                  title="View Details"
                >
                  <Play className="w-4 h-4 fill-current translate-x-0.5" />
                </Link>
              )}

              <button
                onClick={e => {
                  e.preventDefault();
                  if (currentUser.id === 'guest') {
                    setIsAuthOpen(true);
                    return;
                  }
                  if (courseId) {
                    toggleWishlist(courseId);
                  }
                }}
                className={`w-8 h-8 rounded-full border flex items-center justify-center transition ${
                  isWishlisted
                    ? 'bg-rose-500/20 border-rose-500 text-rose-400'
                    : 'border-white/30 text-white hover:border-white hover:bg-white/10'
                }`}
                title="Wishlist"
              >
                <Heart className={`w-3.5 h-3.5 ${isWishlisted ? 'fill-rose-500' : ''}`} />
              </button>
            </div>

            {/* Cart / Play Button */}
            {isEnrolled ? (
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-bold px-2 py-1 rounded border border-emerald-500/30">
                Enrolled
              </span>
            ) : (
              <button
                onClick={handleCartClick}
                disabled={isInCart}
                className={`p-1.5 px-3 rounded text-xs font-semibold flex items-center gap-1.5 transition ${
                  isInCart
                    ? 'bg-[#E50914]/20 border border-[#E50914]/40 text-red-300'
                    : 'bg-[#E50914] hover:bg-[#b80710] text-white'
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
