'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Play, 
  Info, 
  ChevronLeft, 
  ChevronRight, 
  ShieldCheck, 
  Search, 
  Bell, 
  ChevronDown 
} from 'lucide-react';
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

  const HERO_BANNER_IMG = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=2000&q=80";

  const featuredCourse = courses[0] || {
    id: 'course-1',
    title: 'Full-Stack Next.js 14 & React Masterclass 2026',
    slug: 'full-stack-nextjs-react-masterclass',
    subtitle: 'Picking up where he left off in "Captain America: Civil War," Tom Holland\'s web-slinger returns in a film Vox calls "a soaring, fearless teenage dream."',
    thumbnail: HERO_BANNER_IMG,
    discountPrice: 699,
    price: 3499
  };

  const enrolledCourses = courses.filter(c =>
    currentUser.enrolledCourseIds.includes(c.id) || currentUser.enrolledCourseIds.includes(c.slug)
  );

  const trendingCourses = courses.slice().sort((a, b) => b.studentCount - a.studentCount);
  const topRatedCourses = courses.slice().sort((a, b) => b.rating - a.rating);

  const webDevCourses = courses.filter(c => {
    const cat = (c.categoryName || '').toLowerCase();
    const title = (c.title || '').toLowerCase();
    return (cat.includes('web') || title.includes('next') || title.includes('react') || title.includes('full-stack') || cat.includes('full stack')) && !cat.includes('python') && !title.includes('python');
  });

  const aiCourses = courses.filter(c => {
    const cat = (c.categoryName || '').toLowerCase();
    const title = (c.title || '').toLowerCase();
    const tags = (c.tags || []).map(t => t.toLowerCase());
    return (
      cat.includes('python') ||
      cat.includes('data') ||
      title.includes(' ai') ||
      title.includes('deep learning') ||
      title.includes('llm') ||
      title.includes('machine learning') ||
      tags.includes('ai') ||
      tags.includes('machine learning') ||
      tags.includes('pytorch')
    );
  });

  const designCourses = courses.filter(c => {
    const cat = (c.categoryName || '').toLowerCase();
    const title = (c.title || '').toLowerCase();
    return (
      cat.includes('design') ||
      cat.includes('ui') ||
      cat.includes('arts') ||
      title.includes('figma') ||
      title.includes('storytelling') ||
      title.includes('cinema') ||
      title.includes('dance') ||
      title.includes('design')
    );
  });

  const devopsCourses = courses.filter(c => {
    const cat = (c.categoryName || '').toLowerCase();
    const title = (c.title || '').toLowerCase();
    return cat.includes('cloud') || cat.includes('devops') || title.includes('kubernetes') || title.includes('docker') || title.includes('aws');
  });

  // Horizontal Scroll Controls
  const scrollRow = (rowId: string, direction: 'left' | 'right') => {
    const el = document.getElementById(rowId);
    if (el) {
      const scrollAmount = direction === 'left' ? -600 : 600;
      el.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className="bg-[#141414] text-white min-h-screen pb-20 font-sans antialiased selection:bg-red-600 selection:text-white">
      
      {/* Netflix Navigation Bar */}
    

      {/* Hero Showcase Section */}
      <section className="relative w-full h-[85vh] min-h-[600px] flex items-center">
        {/* Background Image Container */}
        <div className="absolute inset-0 z-0">
          <img
            src={featuredCourse.thumbnail || HERO_BANNER_IMG}
            alt={featuredCourse.title}
            className="w-full h-full object-cover object-center"
          />
          {/* Gradient Overlays matching Netflix Vignette */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#141414] via-[#141414]/40 to-transparent w-full md:w-2/3" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-transparent to-black/30" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 px-4 sm:px-12 max-w-2xl mt-12 space-y-4">
          {/* Category Dropdown Indicator / Brand Header */}
          <div className="flex items-center gap-3">
            <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-wide">
              Movies
            </h1>
            <div className="bg-black/60 border border-white/20 text-white text-xs font-semibold px-2.5 py-1 rounded flex items-center gap-2 cursor-pointer">
              <span>Genres</span>
              <ChevronDown className="w-3 h-3" />
            </div>
          </div>

          {/* Movie Title Logo Styling */}
          <div className="pt-2">
            <h2 className="text-4xl sm:text-6xl font-black italic tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-red-500 to-red-600 drop-shadow-md">
              {featuredCourse.title}
            </h2>
          </div>

          {/* Subtitle / Description */}
          <p className="text-gray-200 text-sm sm:text-base line-clamp-3 leading-relaxed max-w-xl font-normal drop-shadow">
            {featuredCourse.subtitle}
          </p>

          {/* Hero CTA Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <Link
              href={`/course/${featuredCourse.slug}`}
              className="inline-flex items-center gap-2 bg-white hover:bg-white/80 text-black font-bold px-6 py-2.5 rounded transition shadow"
            >
              <Play className="w-5 h-5 fill-black" />
              <span className="text-base">Play</span>
            </Link>

            <Link
              href={`/course/${featuredCourse.slug}`}
              className="inline-flex items-center gap-2 bg-gray-500/70 hover:bg-gray-500/50 text-white font-semibold px-6 py-2.5 rounded transition backdrop-blur-sm"
            >
              <Info className="w-5 h-5" />
              <span className="text-base">More Info</span>
            </Link>
          </div>
        </div>

        {/* Age Rating Badge */}
        <div className="absolute right-0 bottom-36 bg-zinc-800/80 border-l-3 border-gray-200 text-gray-200 text-xs font-semibold px-3 py-1 backdrop-blur-sm">
          U/A 13+
        </div>
      </section>

      {/* Main Content Rows Section */}
      <div className="relative z-20 px-4 sm:px-12 -mt-24 space-y-10">

        {/* Top 10 Ranked Row */}
        <section className="space-y-3 relative group/row">
          <h2 className="text-lg sm:text-xl font-bold text-white tracking-wide">
            Top 10 Movies in India Today
          </h2>

          <div className="relative">
            <button
              onClick={() => scrollRow('row-top10', 'left')}
              className="absolute left-0 top-0 bottom-0 z-40 w-12 bg-black/60 text-white hidden group-hover/row:flex items-center justify-center hover:bg-black/80 transition"
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-8 h-8" />
            </button>

            <div 
              id="row-top10" 
              className="flex items-center gap-2 overflow-x-auto no-scrollbar py-4 px-1 scroll-snap-x scrollbar-none"
            >
              {trendingCourses.slice(0, 10).map((course, idx) => (
                <div 
                  key={course.id || (course as any)._id || `top10-${idx}`} 
                  className="relative flex items-center flex-shrink-0 w-44 sm:w-56 group/card cursor-pointer"
                >
                  {/* Large Stylized Number SVG */}
                  <span className="text-[120px] sm:text-[140px] font-black leading-none text-black stroke-neutral-600 select-none -mr-6 z-0 font-sans tracking-tighter"
                        style={{ WebkitTextStroke: '3px #595959' }}>
                    {idx + 1}
                  </span>

                  {/* Course Card Component Wrapped */}
                  <div className="relative z-10 w-28 sm:w-36 flex-shrink-0 transition-transform duration-300 group-hover/card:scale-105">
                    <CourseCard course={course} />
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => scrollRow('row-top10', 'right')}
              className="absolute right-0 top-0 bottom-0 z-40 w-12 bg-black/60 text-white hidden group-hover/row:flex items-center justify-center hover:bg-black/80 transition"
              aria-label="Scroll right"
            >
              <ChevronRight className="w-8 h-8" />
            </button>
          </div>
        </section>

        {/* Continue Watching Row (If enrolled) */}
        {enrolledCourses.length > 0 && (
          <section className="space-y-3 relative group/row">
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-wide">
              Continue Watching for {currentUser.name || 'User'}
            </h2>

            <div className="relative">
              <button
                onClick={() => scrollRow('row-continue', 'left')}
                className="absolute left-0 top-0 bottom-0 z-40 w-12 bg-black/60 text-white hidden group-hover/row:flex items-center justify-center hover:bg-black/80 transition"
                aria-label="Scroll left"
              >
                <ChevronLeft className="w-8 h-8" />
              </button>

              <div 
                id="row-continue" 
                className="flex items-center gap-3 overflow-x-auto no-scrollbar py-2 px-1 scroll-snap-x scrollbar-none"
              >
                {enrolledCourses.map((course, idx) => (
                  <div 
                    key={course.id || (course as any)._id || `cont-${idx}`} 
                    className="w-48 sm:w-64 flex-shrink-0 transition-transform duration-300 hover:scale-105"
                  >
                    <CourseCard course={course} />
                  </div>
                ))}
              </div>

              <button
                onClick={() => scrollRow('row-continue', 'right')}
                className="absolute right-0 top-0 bottom-0 z-40 w-12 bg-black/60 text-white hidden group-hover/row:flex items-center justify-center hover:bg-black/80 transition"
                aria-label="Scroll right"
              >
                <ChevronRight className="w-8 h-8" />
              </button>
            </div>
          </section>
        )}

        {/* Top Rated Row */}
        <section className="space-y-3 relative group/row">
          <h2 className="text-lg sm:text-xl font-bold text-white tracking-wide">
            Top Rated Masterclasses
          </h2>

          <div className="relative">
            <button
              onClick={() => scrollRow('row-toprated', 'left')}
              className="absolute left-0 top-0 bottom-0 z-40 w-12 bg-black/60 text-white hidden group-hover/row:flex items-center justify-center hover:bg-black/80 transition"
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-8 h-8" />
            </button>

            <div 
              id="row-toprated" 
              className="flex items-center gap-3 overflow-x-auto no-scrollbar py-2 px-1 scroll-snap-x scrollbar-none"
            >
              {topRatedCourses.map((course, idx) => (
                <div 
                  key={course.id || (course as any)._id || `top-${idx}`} 
                  className="w-48 sm:w-64 flex-shrink-0 transition-transform duration-300 hover:scale-105"
                >
                  <CourseCard course={course} />
                </div>
              ))}
            </div>

            <button
              onClick={() => scrollRow('row-toprated', 'right')}
              className="absolute right-0 top-0 bottom-0 z-40 w-12 bg-black/60 text-white hidden group-hover/row:flex items-center justify-center hover:bg-black/80 transition"
              aria-label="Scroll right"
            >
              <ChevronRight className="w-8 h-8" />
            </button>
          </div>
        </section>

        {/* Web Development Channel Row */}
        {webDevCourses.length > 0 && (
          <section className="space-y-3 relative group/row">
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-wide">
              Web Development & Tech
            </h2>

            <div className="relative">
              <button
                onClick={() => scrollRow('row-webdev', 'left')}
                className="absolute left-0 top-0 bottom-0 z-40 w-12 bg-black/60 text-white hidden group-hover/row:flex items-center justify-center hover:bg-black/80 transition"
                aria-label="Scroll left"
              >
                <ChevronLeft className="w-8 h-8" />
              </button>

              <div 
                id="row-webdev" 
                className="flex items-center gap-3 overflow-x-auto no-scrollbar py-2 px-1 scroll-snap-x scrollbar-none"
              >
                {webDevCourses.map((course, idx) => (
                  <div 
                    key={course.id || (course as any)._id || `webdev-${idx}`} 
                    className="w-48 sm:w-64 flex-shrink-0 transition-transform duration-300 hover:scale-105"
                  >
                    <CourseCard course={course} />
                  </div>
                ))}
              </div>

              <button
                onClick={() => scrollRow('row-webdev', 'right')}
                className="absolute right-0 top-0 bottom-0 z-40 w-12 bg-black/60 text-white hidden group-hover/row:flex items-center justify-center hover:bg-black/80 transition"
                aria-label="Scroll right"
              >
                <ChevronRight className="w-8 h-8" />
              </button>
            </div>
          </section>
        )}

        {/* AI & Machine Learning Channel Row */}
        {aiCourses.length > 0 && (
          <section className="space-y-3 relative group/row">
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-wide">
              Artificial Intelligence & Machine Learning
            </h2>

            <div className="relative">
              <button
                onClick={() => scrollRow('row-ai', 'left')}
                className="absolute left-0 top-0 bottom-0 z-40 w-12 bg-black/60 text-white hidden group-hover/row:flex items-center justify-center hover:bg-black/80 transition"
                aria-label="Scroll left"
              >
                <ChevronLeft className="w-8 h-8" />
              </button>

              <div 
                id="row-ai" 
                className="flex items-center gap-3 overflow-x-auto no-scrollbar py-2 px-1 scroll-snap-x scrollbar-none"
              >
                {aiCourses.map((course, idx) => (
                  <div 
                    key={course.id || (course as any)._id || `ai-${idx}`} 
                    className="w-48 sm:w-64 flex-shrink-0 transition-transform duration-300 hover:scale-105"
                  >
                    <CourseCard course={course} />
                  </div>
                ))}
              </div>

              <button
                onClick={() => scrollRow('row-ai', 'right')}
                className="absolute right-0 top-0 bottom-0 z-40 w-12 bg-black/60 text-white hidden group-hover/row:flex items-center justify-center hover:bg-black/80 transition"
                aria-label="Scroll right"
              >
                <ChevronRight className="w-8 h-8" />
              </button>
            </div>
          </section>
        )}

        {/* UI/UX & Design Systems Row */}
        {designCourses.length > 0 && (
          <section className="space-y-3 relative group/row">
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-wide">
              UI/UX, Filmmaking & Design Systems
            </h2>

            <div className="relative">
              <button
                onClick={() => scrollRow('row-design', 'left')}
                className="absolute left-0 top-0 bottom-0 z-40 w-12 bg-black/60 text-white hidden group-hover/row:flex items-center justify-center hover:bg-black/80 transition"
                aria-label="Scroll left"
              >
                <ChevronLeft className="w-8 h-8" />
              </button>

              <div 
                id="row-design" 
                className="flex items-center gap-3 overflow-x-auto no-scrollbar py-2 px-1 scroll-snap-x scrollbar-none"
              >
                {designCourses.map((course, idx) => (
                  <div 
                    key={course.id || (course as any)._id || `design-${idx}`} 
                    className="w-48 sm:w-64 flex-shrink-0 transition-transform duration-300 hover:scale-105"
                  >
                    <CourseCard course={course} />
                  </div>
                ))}
              </div>

              <button
                onClick={() => scrollRow('row-design', 'right')}
                className="absolute right-0 top-0 bottom-0 z-40 w-12 bg-black/60 text-white hidden group-hover/row:flex items-center justify-center hover:bg-black/80 transition"
                aria-label="Scroll right"
              >
                <ChevronRight className="w-8 h-8" />
              </button>
            </div>
          </section>
        )}

        {/* Cloud & DevOps Row */}
        {devopsCourses.length > 0 && (
          <section className="space-y-3 relative group/row">
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-wide">
              Cloud Computing & DevOps
            </h2>

            <div className="relative">
              <button
                onClick={() => scrollRow('row-devops', 'left')}
                className="absolute left-0 top-0 bottom-0 z-40 w-12 bg-black/60 text-white hidden group-hover/row:flex items-center justify-center hover:bg-black/80 transition"
                aria-label="Scroll left"
              >
                <ChevronLeft className="w-8 h-8" />
              </button>

              <div 
                id="row-devops" 
                className="flex items-center gap-3 overflow-x-auto no-scrollbar py-2 px-1 scroll-snap-x scrollbar-none"
              >
                {devopsCourses.map((course, idx) => (
                  <div 
                    key={course.id || (course as any)._id || `devops-${idx}`} 
                    className="w-48 sm:w-64 flex-shrink-0 transition-transform duration-300 hover:scale-105"
                  >
                    <CourseCard course={course} />
                  </div>
                ))}
              </div>

              <button
                onClick={() => scrollRow('row-devops', 'right')}
                className="absolute right-0 top-0 bottom-0 z-40 w-12 bg-black/60 text-white hidden group-hover/row:flex items-center justify-center hover:bg-black/80 transition"
                aria-label="Scroll right"
              >
                <ChevronRight className="w-8 h-8" />
              </button>
            </div>
          </section>
        )}

      </div>
    </div>
  );
}