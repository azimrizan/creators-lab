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

  const HERO_BANNER_IMG = "https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=2000&q=80";

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
      const scrollAmount = direction === 'left' ? -600 : 600;
      el.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className="bg-[#141414] text-white min-h-screen pb-20 font-sans antialiased selection:bg-red-600 selection:text-white">
      
      {/* Hero Showcase Section */}
      <section className="relative w-full h-[85vh] min-h-[620px] flex items-center">
        {/* Background Image Container */}
        <div className="absolute inset-0 z-0">
          <img
            src={featuredCourse.thumbnail || HERO_BANNER_IMG}
            alt={featuredCourse.title}
            className="w-full h-full object-cover object-center filter brightness-90"
          />
          {/* Gradient Overlays matching Netflix Vignette */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#141414] via-[#141414]/60 to-transparent w-full md:w-2/3" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-transparent to-black/40" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 px-4 sm:px-12 max-w-2xl mt-12 space-y-4">
          {/* Category Dropdown Indicator / Brand Header */}
          <div className="flex items-center gap-3">
            <span className="bg-[#E50914] text-white font-extrabold text-xs px-2.5 py-1 rounded tracking-wider uppercase flex items-center gap-1.5 shadow-lg">
              <Sparkles className="w-3.5 h-3.5" />
              Creators Masterclass
            </span>
          </div>

          {/* Masterclass Title */}
          <div className="pt-2">
            <h1 className="text-3xl sm:text-5xl font-black italic tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-rose-400 to-red-500 drop-shadow-md">
              {featuredCourse.title}
            </h1>
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
              <Play className="w-5 h-5 fill-black translate-x-0.5" />
              <span className="text-base">Stream Masterclass</span>
            </Link>

            <Link
              href={`/course/${featuredCourse.slug}`}
              className="inline-flex items-center gap-2 bg-gray-500/70 hover:bg-gray-500/50 text-white font-semibold px-6 py-2.5 rounded transition backdrop-blur-sm"
            >
              <Info className="w-5 h-5" />
              <span className="text-base">Curriculum & Details</span>
            </Link>
          </div>
        </div>

        {/* Studio Badge */}
        <div className="absolute right-0 bottom-36 bg-zinc-900/90 border-l-4 border-[#E50914] text-gray-200 text-xs font-bold px-4 py-1.5 backdrop-blur-sm">
          CREATORS LAB ORIGINAL
        </div>
      </section>

      {/* Main Content Rows Section */}
      <div className="relative z-20 px-4 sm:px-12 -mt-24 space-y-12">

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
              Continue Learning for {currentUser.name || 'Creator'}
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

        {/* Top Rated Masterclasses */}
        <section className="space-y-3 relative group/row">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-wide">
              Acclaimed Masterclasses & Originals
            </h2>
          </div>

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

        {/* Cinematography & Directing Row */}
        {cinemaCourses.length > 0 && (
          <section className="space-y-3 relative group/row">
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-wide">
              Cinematography, Directing & Visual Storytelling
            </h2>

            <div className="relative">
              <button
                onClick={() => scrollRow('row-cinema', 'left')}
                className="absolute left-0 top-0 bottom-0 z-40 w-12 bg-black/60 text-white hidden group-hover/row:flex items-center justify-center hover:bg-black/80 transition"
                aria-label="Scroll left"
              >
                <ChevronLeft className="w-8 h-8" />
              </button>

              <div 
                id="row-cinema" 
                className="flex items-center gap-3 overflow-x-auto no-scrollbar py-2 px-1 scroll-snap-x scrollbar-none"
              >
                {cinemaCourses.map((course, idx) => (
                  <div 
                    key={course.id || (course as any)._id || `cinema-${idx}`} 
                    className="w-48 sm:w-64 flex-shrink-0 transition-transform duration-300 hover:scale-105"
                  >
                    <CourseCard course={course} />
                  </div>
                ))}
              </div>

              <button
                onClick={() => scrollRow('row-cinema', 'right')}
                className="absolute right-0 top-0 bottom-0 z-40 w-12 bg-black/60 text-white hidden group-hover/row:flex items-center justify-center hover:bg-black/80 transition"
                aria-label="Scroll right"
              >
                <ChevronRight className="w-8 h-8" />
              </button>
            </div>
          </section>
        )}

        {/* Video Editing & Color Grading Row */}
        {editingCourses.length > 0 && (
          <section className="space-y-3 relative group/row">
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-wide">
              Video Editing, Color Grading & Post-Production
            </h2>

            <div className="relative">
              <button
                onClick={() => scrollRow('row-editing', 'left')}
                className="absolute left-0 top-0 bottom-0 z-40 w-12 bg-black/60 text-white hidden group-hover/row:flex items-center justify-center hover:bg-black/80 transition"
                aria-label="Scroll left"
              >
                <ChevronLeft className="w-8 h-8" />
              </button>

              <div 
                id="row-editing" 
                className="flex items-center gap-3 overflow-x-auto no-scrollbar py-2 px-1 scroll-snap-x scrollbar-none"
              >
                {editingCourses.map((course, idx) => (
                  <div 
                    key={course.id || (course as any)._id || `editing-${idx}`} 
                    className="w-48 sm:w-64 flex-shrink-0 transition-transform duration-300 hover:scale-105"
                  >
                    <CourseCard course={course} />
                  </div>
                ))}
              </div>

              <button
                onClick={() => scrollRow('row-editing', 'right')}
                className="absolute right-0 top-0 bottom-0 z-40 w-12 bg-black/60 text-white hidden group-hover/row:flex items-center justify-center hover:bg-black/80 transition"
                aria-label="Scroll right"
              >
                <ChevronRight className="w-8 h-8" />
              </button>
            </div>
          </section>
        )}

        {/* 3D Animation & Motion Design Row */}
        {motion3dCourses.length > 0 && (
          <section className="space-y-3 relative group/row">
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-wide">
              3D Animation, Blender Worlds & Motion Graphics
            </h2>

            <div className="relative">
              <button
                onClick={() => scrollRow('row-motion3d', 'left')}
                className="absolute left-0 top-0 bottom-0 z-40 w-12 bg-black/60 text-white hidden group-hover/row:flex items-center justify-center hover:bg-black/80 transition"
                aria-label="Scroll left"
              >
                <ChevronLeft className="w-8 h-8" />
              </button>

              <div 
                id="row-motion3d" 
                className="flex items-center gap-3 overflow-x-auto no-scrollbar py-2 px-1 scroll-snap-x scrollbar-none"
              >
                {motion3dCourses.map((course, idx) => (
                  <div 
                    key={course.id || (course as any)._id || `motion3d-${idx}`} 
                    className="w-48 sm:w-64 flex-shrink-0 transition-transform duration-300 hover:scale-105"
                  >
                    <CourseCard course={course} />
                  </div>
                ))}
              </div>

              <button
                onClick={() => scrollRow('row-motion3d', 'right')}
                className="absolute right-0 top-0 bottom-0 z-40 w-12 bg-black/60 text-white hidden group-hover/row:flex items-center justify-center hover:bg-black/80 transition"
                aria-label="Scroll right"
              >
                <ChevronRight className="w-8 h-8" />
              </button>
            </div>
          </section>
        )}

        {/* Photography & Visual Arts Row */}
        {photoCourses.length > 0 && (
          <section className="space-y-3 relative group/row">
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-wide">
              Photography, Portraiture & Visual Arts
            </h2>

            <div className="relative">
              <button
                onClick={() => scrollRow('row-photo', 'left')}
                className="absolute left-0 top-0 bottom-0 z-40 w-12 bg-black/60 text-white hidden group-hover/row:flex items-center justify-center hover:bg-black/80 transition"
                aria-label="Scroll left"
              >
                <ChevronLeft className="w-8 h-8" />
              </button>

              <div 
                id="row-photo" 
                className="flex items-center gap-3 overflow-x-auto no-scrollbar py-2 px-1 scroll-snap-x scrollbar-none"
              >
                {photoCourses.map((course, idx) => (
                  <div 
                    key={course.id || (course as any)._id || `photo-${idx}`} 
                    className="w-48 sm:w-64 flex-shrink-0 transition-transform duration-300 hover:scale-105"
                  >
                    <CourseCard course={course} />
                  </div>
                ))}
              </div>

              <button
                onClick={() => scrollRow('row-photo', 'right')}
                className="absolute right-0 top-0 bottom-0 z-40 w-12 bg-black/60 text-white hidden group-hover/row:flex items-center justify-center hover:bg-black/80 transition"
                aria-label="Scroll right"
              >
                <ChevronRight className="w-8 h-8" />
              </button>
            </div>
          </section>
        )}

        {/* Music Production & Film Scoring Row */}
        {musicAudioCourses.length > 0 && (
          <section className="space-y-3 relative group/row">
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-wide">
              Music Production, Film Scoring & Sound Engineering
            </h2>

            <div className="relative">
              <button
                onClick={() => scrollRow('row-music', 'left')}
                className="absolute left-0 top-0 bottom-0 z-40 w-12 bg-black/60 text-white hidden group-hover/row:flex items-center justify-center hover:bg-black/80 transition"
                aria-label="Scroll left"
              >
                <ChevronLeft className="w-8 h-8" />
              </button>

              <div 
                id="row-music" 
                className="flex items-center gap-3 overflow-x-auto no-scrollbar py-2 px-1 scroll-snap-x scrollbar-none"
              >
                {musicAudioCourses.map((course, idx) => (
                  <div 
                    key={course.id || (course as any)._id || `music-${idx}`} 
                    className="w-48 sm:w-64 flex-shrink-0 transition-transform duration-300 hover:scale-105"
                  >
                    <CourseCard course={course} />
                  </div>
                ))}
              </div>

              <button
                onClick={() => scrollRow('row-music', 'right')}
                className="absolute right-0 top-0 bottom-0 z-40 w-12 bg-black/60 text-white hidden group-hover/row:flex items-center justify-center hover:bg-black/80 transition"
                aria-label="Scroll right"
              >
                <ChevronRight className="w-8 h-8" />
              </button>
            </div>
          </section>
        )}

        {/* Creative Art Direction & Brand Systems Row */}
        {designArtCourses.length > 0 && (
          <section className="space-y-3 relative group/row">
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-wide">
              Creative Art Direction, Figma & Brand Systems
            </h2>

            <div className="relative">
              <button
                onClick={() => scrollRow('row-designart', 'left')}
                className="absolute left-0 top-0 bottom-0 z-40 w-12 bg-black/60 text-white hidden group-hover/row:flex items-center justify-center hover:bg-black/80 transition"
                aria-label="Scroll left"
              >
                <ChevronLeft className="w-8 h-8" />
              </button>

              <div 
                id="row-designart" 
                className="flex items-center gap-3 overflow-x-auto no-scrollbar py-2 px-1 scroll-snap-x scrollbar-none"
              >
                {designArtCourses.map((course, idx) => (
                  <div 
                    key={course.id || (course as any)._id || `designart-${idx}`} 
                    className="w-48 sm:w-64 flex-shrink-0 transition-transform duration-300 hover:scale-105"
                  >
                    <CourseCard course={course} />
                  </div>
                ))}
              </div>

              <button
                onClick={() => scrollRow('row-designart', 'right')}
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