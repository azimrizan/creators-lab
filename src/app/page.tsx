'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Play, 
  Info, 
  ChevronLeft, 
  ChevronRight, 
  ChevronDown,
  Sparkles,
  Award,
  Flame
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

  const HERO_BANNER_IMG = "/creators lab.jpg.jpeg";

  const featuredCourse = courses[0] || {
    id: 'course-1',
    title: 'Cinematic Visual Storytelling: Composition, Lenses & Framing',
    slug: 'cinematic-visual-storytelling-composition-lenses',
    subtitle: 'Master camera language, Rule of Thirds, lens focal lengths, lighting contrast and visual composition with legendary cinematographer Philip Bloom.',
    thumbnail: HERO_BANNER_IMG,
    discountPrice: 699,
    price: 3499
  };

  const enrolledCourses = courses.filter(c =>
    currentUser.enrolledCourseIds.includes(c.id) || currentUser.enrolledCourseIds.includes(c.slug)
  );

  const trendingCourses = courses.slice().sort((a, b) => b.studentCount - a.studentCount);
  const topRatedCourses = courses.slice().sort((a, b) => b.rating - a.rating);

  // Creative Shelves
  const cinemaCourses = courses.filter(c => {
    const text = `${c.title || ''} ${c.categoryName || ''} ${(c.tags || []).join(' ')}`.toLowerCase();
    return text.includes('cinemat') || text.includes('film') || text.includes('direct') || text.includes('camera') || text.includes('storytell');
  });

  const photoCourses = courses.filter(c => {
    const text = `${c.title || ''} ${c.categoryName || ''} ${(c.tags || []).join(' ')}`.toLowerCase();
    return text.includes('photo') || text.includes('street') || text.includes('portrait');
  });

  const editingCourses = courses.filter(c => {
    const text = `${c.title || ''} ${c.categoryName || ''} ${(c.tags || []).join(' ')}`.toLowerCase();
    return text.includes('edit') || text.includes('davinci') || text.includes('color') || text.includes('grade') || text.includes('premiere');
  });

  const motion3dCourses = courses.filter(c => {
    const text = `${c.title || ''} ${c.categoryName || ''} ${(c.tags || []).join(' ')}`.toLowerCase();
    return text.includes('3d') || text.includes('blender') || text.includes('motion') || text.includes('vfx') || text.includes('unreal') || text.includes('after effects');
  });

  const musicAudioCourses = courses.filter(c => {
    const text = `${c.title || ''} ${c.categoryName || ''} ${(c.tags || []).join(' ')}`.toLowerCase();
    return text.includes('music') || text.includes('audio') || text.includes('sound') || text.includes('score') || text.includes('mix') || text.includes('ableton');
  });

  const designArtCourses = courses.filter(c => {
    const text = `${c.title || ''} ${c.categoryName || ''} ${(c.tags || []).join(' ')}`.toLowerCase();
    return text.includes('design') || text.includes('figma') || text.includes('brand') || text.includes('creative direction') || text.includes('typography');
  });

  // Horizontal Scroll Controls
  const scrollRow = (rowId: string, direction: 'left' | 'right') => {
    const el = document.getElementById(rowId);
    if (el) {
      const scrollAmount = direction === 'left' ? -Math.round(el.clientWidth * 0.75) : Math.round(el.clientWidth * 0.75);
      el.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className="bg-white text-zinc-900 min-h-screen pb-20 font-sans antialiased selection:bg-[#d33028] selection:text-white">
      
      {/* Hero Showcase Section */}
      <section className="relative w-full h-[85vh] min-h-[620px] flex items-center">
        {/* Background Image Container */}
        <div className="absolute inset-0 z-0">
          <img
            src={HERO_BANNER_IMG}
            alt={featuredCourse.title}
            className="w-full h-full object-cover object-center filter brightness-100"
          />
          {/* Gradient Overlays fading into white */}
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/80 to-transparent w-full md:w-2/3" />
          <div className="absolute inset-0 bg-gradient-to-t from-white via-white/20 to-transparent" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 px-4 sm:px-12 max-w-2xl mt-12 space-y-4">
         

          {/* Masterclass Title */}
          <div className="pt-2">
            <h1 className="text-3xl sm:text-5xl font-black italic tracking-tight text-black drop-shadow-sm">
              {featuredCourse.title}
            </h1>
          </div>

          {/* Subtitle / Description */}
          <p className="text-zinc-700 text-sm sm:text-base line-clamp-3 leading-relaxed max-w-xl font-normal drop-shadow-sm">
            {featuredCourse.subtitle}
          </p>

          {/* Hero CTA Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <Link
              href={`/course/${featuredCourse.slug}`}
              className="inline-flex items-center gap-2 bg-[#d33028] hover:bg-[#b82720] text-white font-bold px-6 py-2.5 rounded transition shadow"
            >
              <Play className="w-5 h-5 fill-white translate-x-0.5" />
              <span className="text-base">Stream Masterclass</span>
            </Link>

            <Link
              href={`/course/${featuredCourse.slug}`}
              className="inline-flex items-center gap-2 bg-white/90 hover:bg-white text-zinc-900 font-semibold px-6 py-2.5 rounded border border-zinc-300 transition shadow-sm backdrop-blur-sm"
            >
              <Info className="w-5 h-5 text-zinc-700" />
              <span className="text-base">Curriculum & Details</span>
            </Link>
          </div>
        </div>

        {/* Studio Badge */}
        <div className="absolute right-0 bottom-36 bg-white border-l-4 border-[#d33028] text-zinc-800 text-xs font-bold px-4 py-1.5 shadow-md">
          CREATORS LAB ORIGINAL
        </div>
      </section>

      {/* Main Content Rows Section */}
      <div className="relative z-20 -mt-20">

        {/* Top 10 Ranked Row */}
        <section className="relative group/row py-6 sm:py-8 bg-white">
          <div className="w-full bg-[#d33028] px-4 sm:px-12 py-2 sm:py-2.5 mb-4 flex items-center shadow-sm">
            <h2 className="text-white font-bold text-sm sm:text-base tracking-wide flex items-center gap-2">
              Top 10 Movies in India Today
            </h2>
          </div>

          <div className="relative">
            <button
              onClick={() => scrollRow('row-top10', 'left')}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-40 w-11 h-11 rounded-full bg-white/95 text-zinc-900 shadow-xl hidden group-hover/row:flex items-center justify-center hover:bg-white hover:scale-110 transition border-none"
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <div 
              id="row-top10" 
              className="flex items-center gap-5 sm:gap-6 overflow-x-auto no-scrollbar py-2 px-4 sm:px-12 scroll-snap-x scrollbar-none w-full"
            >
              {trendingCourses.slice(0, 10).map((course, idx) => (
                <div 
                  key={course.id || (course as any)._id || `top10-${idx}`} 
                  className="w-[75vw] sm:w-[44vw] md:w-[30vw] lg:w-[calc((100vw-210px)/4.3)] flex-shrink-0 transition-transform duration-300 hover:scale-105"
                >
                  <CourseCard course={course} imageClassName="h-44 sm:h-52 w-full object-cover" />
                </div>
              ))}
            </div>

            <button
              onClick={() => scrollRow('row-top10', 'right')}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-40 w-11 h-11 rounded-full bg-white/95 text-zinc-900 shadow-xl hidden group-hover/row:flex items-center justify-center hover:bg-white hover:scale-110 transition border-none"
              aria-label="Scroll right"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </section>

        {/* Continue Watching Row (If enrolled) */}
        {enrolledCourses.length > 0 && (
          <section className="relative group/row py-6 sm:py-8 bg-white">
            <div className="w-full bg-[#d33028] px-4 sm:px-12 py-2 sm:py-2.5 mb-4 flex items-center shadow-sm">
              <h2 className="text-white font-bold text-sm sm:text-base tracking-wide flex items-center gap-2">
                Continue Learning for {currentUser.name || 'Creator'}
              </h2>
            </div>

            <div className="relative">
              <button
                onClick={() => scrollRow('row-continue', 'left')}
                className="absolute left-2 top-1/2 -translate-y-1/2 z-40 w-11 h-11 rounded-full bg-white/95 text-zinc-900 shadow-xl hidden group-hover/row:flex items-center justify-center hover:bg-white hover:scale-110 transition border-none"
                aria-label="Scroll left"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>

              <div 
                id="row-continue" 
                className="flex items-center gap-5 sm:gap-6 overflow-x-auto no-scrollbar py-2 px-4 sm:px-12 scroll-snap-x scrollbar-none w-full"
              >
                {enrolledCourses.map((course, idx) => (
                  <div 
                    key={course.id || (course as any)._id || `cont-${idx}`} 
                    className="w-[75vw] sm:w-[44vw] md:w-[30vw] lg:w-[calc((100vw-210px)/4.3)] flex-shrink-0 transition-transform duration-300 hover:scale-105"
                  >
                    <CourseCard course={course} />
                  </div>
                ))}
              </div>

              <button
                onClick={() => scrollRow('row-continue', 'right')}
                className="absolute right-2 top-1/2 -translate-y-1/2 z-40 w-11 h-11 rounded-full bg-white/95 text-zinc-900 shadow-xl hidden group-hover/row:flex items-center justify-center hover:bg-white hover:scale-110 transition border-none"
                aria-label="Scroll right"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
          </section>
        )}

        {/* Top Rated Masterclasses */}
        <section className="relative group/row py-6 sm:py-8 bg-white">
          <div className="w-full bg-[#d33028] px-4 sm:px-12 py-2 sm:py-2.5 mb-4 flex items-center shadow-sm">
            <h2 className="text-white font-bold text-sm sm:text-base tracking-wide flex items-center gap-2">
              <Award className="w-4 h-4 text-white" />
              <span>Acclaimed Masterclasses & Originals</span>
            </h2>
          </div>

          <div className="relative">
            <button
              onClick={() => scrollRow('row-toprated', 'left')}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-40 w-11 h-11 rounded-full bg-white/95 text-zinc-900 shadow-xl hidden group-hover/row:flex items-center justify-center hover:bg-white hover:scale-110 transition border-none"
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <div 
              id="row-toprated" 
              className="flex items-center gap-5 sm:gap-6 overflow-x-auto no-scrollbar py-2 px-4 sm:px-12 scroll-snap-x scrollbar-none w-full"
            >
              {topRatedCourses.map((course, idx) => (
                <div 
                  key={course.id || (course as any)._id || `top-${idx}`} 
                  className="w-[75vw] sm:w-[44vw] md:w-[30vw] lg:w-[calc((100vw-210px)/4.3)] flex-shrink-0 transition-transform duration-300 hover:scale-105"
                >
                  <CourseCard course={course} />
                </div>
              ))}
            </div>

            <button
              onClick={() => scrollRow('row-toprated', 'right')}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-40 w-11 h-11 rounded-full bg-white/95 text-zinc-900 shadow-xl hidden group-hover/row:flex items-center justify-center hover:bg-white hover:scale-110 transition border-none"
              aria-label="Scroll right"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </section>

        {/* Cinematography & Directing Row */}
        {cinemaCourses.length > 0 && (
          <section className="relative group/row py-6 sm:py-8 bg-white">
            <div className="w-full bg-[#d33028] px-4 sm:px-12 py-2 sm:py-2.5 mb-4 flex items-center shadow-sm">
              <h2 className="text-white font-bold text-sm sm:text-base tracking-wide flex items-center gap-2">
                Cinematography, Directing & Visual Storytelling
              </h2>
            </div>

            <div className="relative">
              <button
                onClick={() => scrollRow('row-cinema', 'left')}
                className="absolute left-2 top-1/2 -translate-y-1/2 z-40 w-11 h-11 rounded-full bg-white/95 text-zinc-900 shadow-xl hidden group-hover/row:flex items-center justify-center hover:bg-white hover:scale-110 transition border-none"
                aria-label="Scroll left"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>

              <div 
                id="row-cinema" 
                className="flex items-center gap-5 sm:gap-6 overflow-x-auto no-scrollbar py-2 px-4 sm:px-12 scroll-snap-x scrollbar-none w-full"
              >
                {cinemaCourses.map((course, idx) => (
                  <div 
                    key={course.id || (course as any)._id || `cinema-${idx}`} 
                    className="w-[75vw] sm:w-[44vw] md:w-[30vw] lg:w-[calc((100vw-210px)/4.3)] flex-shrink-0 transition-transform duration-300 hover:scale-105"
                  >
                    <CourseCard course={course} />
                  </div>
                ))}
              </div>

              <button
                onClick={() => scrollRow('row-cinema', 'right')}
                className="absolute right-2 top-1/2 -translate-y-1/2 z-40 w-11 h-11 rounded-full bg-white/95 text-zinc-900 shadow-xl hidden group-hover/row:flex items-center justify-center hover:bg-white hover:scale-110 transition border-none"
                aria-label="Scroll right"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
          </section>
        )}

        {/* Video Editing & Color Grading Row */}
        {editingCourses.length > 0 && (
          <section className="relative group/row py-6 sm:py-8 bg-white">
            <div className="w-full bg-[#d33028] px-4 sm:px-12 py-2 sm:py-2.5 mb-4 flex items-center shadow-sm">
              <h2 className="text-white font-bold text-sm sm:text-base tracking-wide flex items-center gap-2">
                Video Editing, Color Grading & Post-Production
              </h2>
            </div>

            <div className="relative">
              <button
                onClick={() => scrollRow('row-editing', 'left')}
                className="absolute left-2 top-1/2 -translate-y-1/2 z-40 w-11 h-11 rounded-full bg-white/95 text-zinc-900 shadow-xl hidden group-hover/row:flex items-center justify-center hover:bg-white hover:scale-110 transition border-none"
                aria-label="Scroll left"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>

              <div 
                id="row-editing" 
                className="flex items-center gap-5 sm:gap-6 overflow-x-auto no-scrollbar py-2 px-4 sm:px-12 scroll-snap-x scrollbar-none w-full"
              >
                {editingCourses.map((course, idx) => (
                  <div 
                    key={course.id || (course as any)._id || `editing-${idx}`} 
                    className="w-[75vw] sm:w-[44vw] md:w-[30vw] lg:w-[calc((100vw-210px)/4.3)] flex-shrink-0 transition-transform duration-300 hover:scale-105"
                  >
                    <CourseCard course={course} />
                  </div>
                ))}
              </div>

              <button
                onClick={() => scrollRow('row-editing', 'right')}
                className="absolute right-2 top-1/2 -translate-y-1/2 z-40 w-11 h-11 rounded-full bg-white/95 text-zinc-900 shadow-xl hidden group-hover/row:flex items-center justify-center hover:bg-white hover:scale-110 transition border-none"
                aria-label="Scroll right"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
          </section>
        )}

        {/* 3D Animation & Motion Design Row */}
        {motion3dCourses.length > 0 && (
          <section className="relative group/row py-6 sm:py-8 bg-white">
            <div className="w-full bg-[#d33028] px-4 sm:px-12 py-2 sm:py-2.5 mb-4 flex items-center shadow-sm">
              <h2 className="text-white font-bold text-sm sm:text-base tracking-wide flex items-center gap-2">
                3D Animation, Blender Worlds & Motion Graphics
              </h2>
            </div>

            <div className="relative">
              <button
                onClick={() => scrollRow('row-motion3d', 'left')}
                className="absolute left-2 top-1/2 -translate-y-1/2 z-40 w-11 h-11 rounded-full bg-white/95 text-zinc-900 shadow-xl hidden group-hover/row:flex items-center justify-center hover:bg-white hover:scale-110 transition border-none"
                aria-label="Scroll left"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>

              <div 
                id="row-motion3d" 
                className="flex items-center gap-5 sm:gap-6 overflow-x-auto no-scrollbar py-2 px-4 sm:px-12 scroll-snap-x scrollbar-none w-full"
              >
                {motion3dCourses.map((course, idx) => (
                  <div 
                    key={course.id || (course as any)._id || `motion3d-${idx}`} 
                    className="w-[75vw] sm:w-[44vw] md:w-[30vw] lg:w-[calc((100vw-210px)/4.3)] flex-shrink-0 transition-transform duration-300 hover:scale-105"
                  >
                    <CourseCard course={course} />
                  </div>
                ))}
              </div>

              <button
                onClick={() => scrollRow('row-motion3d', 'right')}
                className="absolute right-2 top-1/2 -translate-y-1/2 z-40 w-11 h-11 rounded-full bg-white/95 text-zinc-900 shadow-xl hidden group-hover/row:flex items-center justify-center hover:bg-white hover:scale-110 transition border-none"
                aria-label="Scroll right"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
          </section>
        )}

        {/* Photography & Visual Arts Row */}
        {photoCourses.length > 0 && (
          <section className="relative group/row py-6 sm:py-8 bg-white">
            <div className="w-full bg-[#d33028] px-4 sm:px-12 py-2 sm:py-2.5 mb-4 flex items-center shadow-sm">
              <h2 className="text-white font-bold text-sm sm:text-base tracking-wide flex items-center gap-2">
                Photography, Portraiture & Visual Arts
              </h2>
            </div>

            <div className="relative">
              <button
                onClick={() => scrollRow('row-photo', 'left')}
                className="absolute left-2 top-1/2 -translate-y-1/2 z-40 w-11 h-11 rounded-full bg-white/95 text-zinc-900 shadow-xl hidden group-hover/row:flex items-center justify-center hover:bg-white hover:scale-110 transition border-none"
                aria-label="Scroll left"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>

              <div 
                id="row-photo" 
                className="flex items-center gap-5 sm:gap-6 overflow-x-auto no-scrollbar py-2 px-4 sm:px-12 scroll-snap-x scrollbar-none w-full"
              >
                {photoCourses.map((course, idx) => (
                  <div 
                    key={course.id || (course as any)._id || `photo-${idx}`} 
                    className="w-[75vw] sm:w-[44vw] md:w-[30vw] lg:w-[calc((100vw-210px)/4.3)] flex-shrink-0 transition-transform duration-300 hover:scale-105"
                  >
                    <CourseCard course={course} />
                  </div>
                ))}
              </div>

              <button
                onClick={() => scrollRow('row-photo', 'right')}
                className="absolute right-2 top-1/2 -translate-y-1/2 z-40 w-11 h-11 rounded-full bg-white/95 text-zinc-900 shadow-xl hidden group-hover/row:flex items-center justify-center hover:bg-white hover:scale-110 transition border-none"
                aria-label="Scroll right"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
          </section>
        )}

        {/* Music Production & Film Scoring Row */}
        {musicAudioCourses.length > 0 && (
          <section className="relative group/row py-6 sm:py-8 bg-white">
            <div className="w-full bg-[#d33028] px-4 sm:px-12 py-2 sm:py-2.5 mb-4 flex items-center shadow-sm">
              <h2 className="text-white font-bold text-sm sm:text-base tracking-wide flex items-center gap-2">
                Music Production, Film Scoring & Sound Engineering
              </h2>
            </div>

            <div className="relative">
              <button
                onClick={() => scrollRow('row-music', 'left')}
                className="absolute left-2 top-1/2 -translate-y-1/2 z-40 w-11 h-11 rounded-full bg-white/95 text-zinc-900 shadow-xl hidden group-hover/row:flex items-center justify-center hover:bg-white hover:scale-110 transition border-none"
                aria-label="Scroll left"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>

              <div 
                id="row-music" 
                className="flex items-center gap-5 sm:gap-6 overflow-x-auto no-scrollbar py-2 px-4 sm:px-12 scroll-snap-x scrollbar-none w-full"
              >
                {musicAudioCourses.map((course, idx) => (
                  <div 
                    key={course.id || (course as any)._id || `music-${idx}`} 
                    className="w-[75vw] sm:w-[44vw] md:w-[30vw] lg:w-[calc((100vw-210px)/4.3)] flex-shrink-0 transition-transform duration-300 hover:scale-105"
                  >
                    <CourseCard course={course} />
                  </div>
                ))}
              </div>

              <button
                onClick={() => scrollRow('row-music', 'right')}
                className="absolute right-2 top-1/2 -translate-y-1/2 z-40 w-11 h-11 rounded-full bg-white/95 text-zinc-900 shadow-xl hidden group-hover/row:flex items-center justify-center hover:bg-white hover:scale-110 transition border-none"
                aria-label="Scroll right"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
          </section>
        )}

        {/* Creative Art Direction & Brand Systems Row */}
        {designArtCourses.length > 0 && (
          <section className="relative group/row py-6 sm:py-8 bg-white">
            <div className="w-full bg-[#d33028] px-4 sm:px-12 py-2 sm:py-2.5 mb-4 flex items-center shadow-sm">
              <h2 className="text-white font-bold text-sm sm:text-base tracking-wide flex items-center gap-2">
                Creative Art Direction, Figma & Brand Systems
              </h2>
            </div>

            <div className="relative">
              <button
                onClick={() => scrollRow('row-designart', 'left')}
                className="absolute left-2 top-1/2 -translate-y-1/2 z-40 w-11 h-11 rounded-full bg-white/95 text-zinc-900 shadow-xl hidden group-hover/row:flex items-center justify-center hover:bg-white hover:scale-110 transition border-none"
                aria-label="Scroll left"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>

              <div 
                id="row-designart" 
                className="flex items-center gap-5 sm:gap-6 overflow-x-auto no-scrollbar py-2 px-4 sm:px-12 scroll-snap-x scrollbar-none w-full"
              >
                {designArtCourses.map((course, idx) => (
                  <div 
                    key={course.id || (course as any)._id || `designart-${idx}`} 
                    className="w-[75vw] sm:w-[44vw] md:w-[30vw] lg:w-[calc((100vw-210px)/4.3)] flex-shrink-0 transition-transform duration-300 hover:scale-105"
                  >
                    <CourseCard course={course} />
                  </div>
                ))}
              </div>

              <button
                onClick={() => scrollRow('row-designart', 'right')}
                className="absolute right-2 top-1/2 -translate-y-1/2 z-40 w-11 h-11 rounded-full bg-white/95 text-zinc-900 shadow-xl hidden group-hover/row:flex items-center justify-center hover:bg-white hover:scale-110 transition border-none"
                aria-label="Scroll right"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
          </section>
        )}

      </div>
    </div>
  );
}
