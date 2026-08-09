'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Play, Info, ChevronLeft, ChevronRight, Sparkles, ShieldCheck, Flame, Star, Award } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import CourseCard from '@/components/CourseCard';

export default function HomePage() {
  const router = useRouter();
  const { courses, currentUser } = useAppStore();

  const isAdmin = currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN';
  const isInstructor = currentUser.role === 'INSTRUCTOR';

  // Automatically redirect Instructors & Admins to their portals when visiting /
  useEffect(() => {
    if (isInstructor) {
      router.push('/instructor');
    } else if (isAdmin) {
      router.push('/admin');
    }
  }, [isInstructor, isAdmin, router]);

  const featuredCourse = courses[0] || {
    id: 'course-1',
    title: 'Full-Stack Next.js 14 & React Masterclass 2026',
    slug: 'full-stack-nextjs-react-masterclass',
    subtitle: 'Build production-ready web apps with App Router, TypeScript, Prisma, MongoDB & Tailwind CSS from absolute zero to deployment.',
    thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&w=1600&q=80',
    discountPrice: 699,
    price: 3499
  };

  const enrolledCourses = courses.filter(c =>
    currentUser.enrolledCourseIds.includes(c.id) || currentUser.enrolledCourseIds.includes(c.slug)
  );

  const trendingCourses = courses.slice().sort((a, b) => b.studentCount - a.studentCount);
  const topRatedCourses = courses.slice().sort((a, b) => b.rating - a.rating);
  const webDevCourses = courses.filter(c => c.categoryName.toLowerCase().includes('web') || c.categoryName.toLowerCase().includes('react'));

  // Horizontal Scroll Controls
  const scrollRow = (rowId: string, direction: 'left' | 'right') => {
    const el = document.getElementById(rowId);
    if (el) {
      const scrollAmount = direction === 'left' ? -600 : 600;
      el.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className="bg-black text-white min-h-screen pb-24 space-y-12">
      {/* Hero Banner Section */}
      <section className="relative w-full h-[80vh] min-h-[550px] flex items-end overflow-hidden">
        {/* Background Image / Backdrop */}
        <div className="absolute inset-0 z-0">
          <img
            src={featuredCourse.thumbnail}
            alt={featuredCourse.title}
            className="w-full h-full object-cover object-center scale-105 filter brightness-75"
          />
          {/* Top-to-bottom and Bottom-to-top Gradient Overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/60 to-transparent" />
          <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/80 to-transparent" />
        </div>

        {/* Featured Content Hero Details */}
        <div className="relative z-10 max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12 pb-16 space-y-4 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E50914]/20 border border-[#E50914]/40 text-red-400 text-xs font-bold uppercase tracking-wider">
            <Flame className="w-3.5 h-3.5 fill-current" />
            <span>FEATURED SELECTION</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight drop-shadow-2xl">
            {featuredCourse.title}
          </h1>

          <p className="text-slate-300 text-sm sm:text-base line-clamp-3 max-w-2xl leading-relaxed drop-shadow">
            {featuredCourse.subtitle}
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-3">
            <Link
              href={`/course/${featuredCourse.slug}`}
              className="bg-white hover:bg-slate-200 text-black font-extrabold px-7 py-3 rounded-md transition shadow-2xl flex items-center gap-2 text-sm"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>Start Learning</span>
            </Link>

            <Link
              href={`/course/${featuredCourse.slug}`}
              className="bg-white/20 hover:bg-white/30 backdrop-blur-md text-white font-bold px-6 py-3 rounded-md transition border border-white/20 flex items-center gap-2 text-sm"
            >
              <Info className="w-5 h-5" />
              <span>More Info</span>
            </Link>

            {isAdmin && (
              <Link
                href="/admin"
                className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold px-5 py-3 rounded-md transition border border-amber-500/40 flex items-center gap-2 text-sm"
              >
                <ShieldCheck className="w-5 h-5 text-amber-400" />
                <span>Admin Console</span>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Main Content Rows Area */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12 space-y-10">

        {/* Row 1: Continue Learning (If enrolled) */}
        {enrolledCourses.length > 0 && (
          <section className="space-y-3 relative group/row">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-wide">Continue Learning</h2>

            <div className="relative">
              <button
                onClick={() => scrollRow('row-continue', 'left')}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-40 w-10 h-24 bg-black/70 text-white hidden group-hover/row:flex items-center justify-center hover:bg-black/90 transition border-r border-white/10"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>

              <div id="row-continue" className="flex items-center gap-4 overflow-x-auto no-scrollbar py-4 scroll-snap-x">
                {enrolledCourses.map((course, idx) => (
                  <div key={course.id || (course as any)._id || `cont-${idx}`} className="w-64 sm:w-72 flex-shrink-0 scroll-snap-align-start">
                    <CourseCard course={course} />
                  </div>
                ))}
              </div>

              <button
                onClick={() => scrollRow('row-continue', 'right')}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-40 w-10 h-24 bg-black/70 text-white hidden group-hover/row:flex items-center justify-center hover:bg-black/90 transition border-l border-white/10"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
          </section>
        )}

        {/* Row 2: Trending Modules */}
        <section className="space-y-3 relative group/row">
          <div className="flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-wide">Trending Courses</h2>
            <Link href="/courses" className="text-xs font-semibold text-red-500 hover:underline">Explore All &rarr;</Link>
          </div>

          <div className="relative">
            <button
              onClick={() => scrollRow('row-trending', 'left')}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-40 w-10 h-24 bg-black/70 text-white hidden group-hover/row:flex items-center justify-center hover:bg-black/90 transition border-r border-white/10"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <div id="row-trending" className="flex items-center gap-4 overflow-x-auto no-scrollbar py-4 scroll-snap-x">
              {trendingCourses.map((course, idx) => (
                <div key={course.id || (course as any)._id || `trend-${idx}`} className="w-64 sm:w-72 flex-shrink-0 scroll-snap-align-start">
                  <CourseCard course={course} />
                </div>
              ))}
            </div>

            <button
              onClick={() => scrollRow('row-trending', 'right')}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-40 w-10 h-24 bg-black/70 text-white hidden group-hover/row:flex items-center justify-center hover:bg-black/90 transition border-l border-white/10"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </section>

        {/* Row 3: Top Rated Modules */}
        <section className="space-y-3 relative group/row">
          <div className="flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-wide">Top Rated Courses</h2>
            <Link href="/courses?sort=RATING" className="text-xs font-semibold text-red-500 hover:underline">Explore All &rarr;</Link>
          </div>

          <div className="relative">
            <button
              onClick={() => scrollRow('row-toprated', 'left')}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-40 w-10 h-24 bg-black/70 text-white hidden group-hover/row:flex items-center justify-center hover:bg-black/90 transition border-r border-white/10"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <div id="row-toprated" className="flex items-center gap-4 overflow-x-auto no-scrollbar py-4 scroll-snap-x">
              {topRatedCourses.map((course, idx) => (
                <div key={course.id || (course as any)._id || `top-${idx}`} className="w-64 sm:w-72 flex-shrink-0 scroll-snap-align-start">
                  <CourseCard course={course} />
                </div>
              ))}
            </div>

            <button
              onClick={() => scrollRow('row-toprated', 'right')}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-40 w-10 h-24 bg-black/70 text-white hidden group-hover/row:flex items-center justify-center hover:bg-black/90 transition border-l border-white/10"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </section>

        {/* Row 4: Web Development & AI Channel */}
        <section className="space-y-3 relative group/row">
          <div className="flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-wide">Web Development & AI Channel</h2>
            <Link href="/courses?category=web-development" className="text-xs font-semibold text-red-500 hover:underline">Explore All &rarr;</Link>
          </div>

          <div className="relative">
            <button
              onClick={() => scrollRow('row-webdev', 'left')}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-40 w-10 h-24 bg-black/70 text-white hidden group-hover/row:flex items-center justify-center hover:bg-black/90 transition border-r border-white/10"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <div id="row-webdev" className="flex items-center gap-4 overflow-x-auto no-scrollbar py-4 scroll-snap-x">
              {webDevCourses.map((course, idx) => (
                <div key={course.id || (course as any)._id || `webdev-${idx}`} className="w-64 sm:w-72 flex-shrink-0 scroll-snap-align-start">
                  <CourseCard course={course} />
                </div>
              ))}
            </div>

            <button
              onClick={() => scrollRow('row-webdev', 'right')}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-40 w-10 h-24 bg-black/70 text-white hidden group-hover/row:flex items-center justify-center hover:bg-black/90 transition border-l border-white/10"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </section>

      </div>
    </div>
  );
}
