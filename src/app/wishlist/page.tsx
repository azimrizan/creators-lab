'use client';

import React from 'react';
import Link from 'next/link';
import { Heart, ArrowLeft } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import CourseCard from '@/components/CourseCard';

export default function WishlistPage() {
  const { courses, wishlistCourseIds } = useAppStore();

  const wishlistedCourses = courses.filter(c => {
    const cId = c.id || (c as any)._id || c.slug;
    return wishlistCourseIds.includes(cId);
  });

  return (
    <div className="bg-[#0B0B0B] text-white min-h-screen pt-24 pb-20">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12 space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-bold uppercase">
            <Heart className="w-3.5 h-3.5 fill-current" />
            <span>Saved Courses</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">My Wishlist</h1>
          <p className="text-xs text-[#B3B3B3]">Courses you have bookmarked for future learning</p>
        </div>

        {/* Content */}
        {wishlistedCourses.length === 0 ? (
          <div className="bg-[#141414] border border-white/10 rounded-xl p-12 text-center space-y-4 max-w-md mx-auto">
            <Heart className="w-12 h-12 text-slate-600 mx-auto" />
            <div className="space-y-1">
              <h3 className="text-white font-bold text-base">Your wishlist is empty</h3>
              <p className="text-xs text-[#B3B3B3]">Bookmark courses while browsing to save them for later.</p>
            </div>
            <Link
              href="/courses"
              className="inline-flex items-center gap-2 bg-[#E50914] hover:bg-[#b80710] text-white font-bold text-xs px-6 py-3 rounded-md transition shadow-lg"
            >
              <span>Explore Courses</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {wishlistedCourses.map((course, idx) => (
              <CourseCard key={course.id || (course as any)._id || `wish-${idx}`} course={course} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
