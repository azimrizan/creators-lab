'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Star, Heart, ShoppingBag, Check, Play } from 'lucide-react';
import { Course, getSafeThumbnail } from '@/lib/types';
import { useAppStore } from '@/lib/store';
import AuthModal from './AuthModal';

interface CourseCardProps {
  course: Course;
  imageClassName?: string;
}

const formatLevel = (level?: string) =>
  level ? level.replace(/_/g, ' ').toLowerCase().replace(/^\w/, ch => ch.toUpperCase()) : '';

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
  const salePrice = course.discountPrice || course.price;
  const hasDiscount = Boolean(course.discountPrice && course.discountPrice < course.price);

  return (
    <>
      <article
        onClick={handleCardClick}
        className="glass-strong group relative h-full rounded-[22px] overflow-hidden flex flex-col p-2 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_28px_60px_-24px_rgba(79,70,229,0.55)]"
      >
        {/* Thumbnail */}
        <div className={`relative overflow-hidden rounded-[16px] bg-lavender ${imageClassName || 'h-48 w-full'}`}>
          <img
            src={displayThumbnail}
            alt={course.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />

          {course.categoryName && (
            <span className="absolute top-3 left-3 max-w-[75%] truncate glass-strong text-[11px] font-semibold tracking-wide px-3 py-1.5 rounded-full text-ink">
              {course.categoryName}
            </span>
          )}

          <button
            onClick={handleWishlistClick}
            className={`absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-sm transition ${
              isWishlisted ? 'bg-white text-rose-500' : 'bg-white/90 text-ink-body hover:bg-white hover:text-ink'
            }`}
            aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-rose-500' : ''}`} />
          </button>
        </div>

        {/* Content */}
        <div className="px-3 pt-4 pb-3 flex-1 flex flex-col gap-3">
          <h3 className="font-display font-semibold text-ink text-base leading-snug line-clamp-2">
            {course.title}
          </h3>
          <p className="text-[13px] text-ink-muted line-clamp-1">
            By {course.instructorName}{course.level ? ` · ${formatLevel(course.level)}` : ''}
          </p>

          {/* Price + Rating */}
          <div className="mt-auto pt-3 border-t border-[#E9E7FA] flex items-center justify-between gap-2">
            <div className="flex items-baseline gap-2">
              <span className="font-display font-semibold text-lg text-ink">₹{salePrice}</span>
              {hasDiscount && (
                <span className="text-[13px] text-[#6B6785] line-through">₹{course.price}</span>
              )}
            </div>
            <div className="flex items-center gap-1 text-[13px] font-semibold text-ink">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span>{course.rating}</span>
              {course.reviewCount > 0 && (
                <span className="font-normal text-[#6B6785]">({course.reviewCount.toLocaleString('en-IN')})</span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {isEnrolled ? (
              <span className="btn-soft flex-1 h-11 rounded-full text-sm font-semibold flex items-center justify-center gap-2">
                <Play className="w-4 h-4 fill-current" />
                Continue Learning
              </span>
            ) : (
              <>
                <span className="flex-1 h-11 rounded-full bg-lavender text-brand text-sm font-semibold flex items-center justify-center group-hover:bg-[#E2E5FF] transition">
                  View Details
                </span>
                <button
                  onClick={handleCartClick}
                  disabled={isInCart}
                  className={`w-11 h-11 rounded-full flex items-center justify-center transition shrink-0 ${
                    isInCart
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'btn-soft'
                  }`}
                  aria-label={isInCart ? 'In cart' : 'Add to cart'}
                  title={isInCart ? 'In cart' : 'Add to cart'}
                >
                  {isInCart ? <Check className="w-4 h-4" /> : <ShoppingBag className="w-4 h-4" />}
                </button>
              </>
            )}
          </div>
        </div>
      </article>

      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </>
  );
}
