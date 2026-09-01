'use client';

import React, { useState, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, Filter, SlidersHorizontal, Star } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { MOCK_CATEGORIES } from '@/lib/mockData';
import CourseCard from '@/components/CourseCard';

function CoursesContent() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get('category') || 'ALL';
  const initialSearch = searchParams.get('search') || '';

  const { courses } = useAppStore();
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedLevel, setSelectedLevel] = useState<string>('ALL');
  const [selectedRating, setSelectedRating] = useState<number>(0);
  const [sortBy, setSortBy] = useState<'POPULAR' | 'RATING' | 'PRICE_LOW' | 'PRICE_HIGH'>('POPULAR');

  const filteredCourses = useMemo(() => {
    return courses.filter(c => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = c.title.toLowerCase().includes(q);
        const matchesDesc = c.subtitle.toLowerCase().includes(q);
        const matchesTag = c.tags.some(t => t.toLowerCase().includes(q));
        if (!matchesTitle && !matchesDesc && !matchesTag) return false;
      }

      if (selectedCategory !== 'ALL') {
        if (c.categoryId !== selectedCategory && c.categoryName.toLowerCase() !== selectedCategory.toLowerCase().replace('-', ' ')) {
          return false;
        }
      }

      if (selectedLevel !== 'ALL' && c.level !== selectedLevel) {
        return false;
      }

      if (selectedRating > 0 && c.rating < selectedRating) {
        return false;
      }

      return c.status === 'PUBLISHED';
    }).sort((a, b) => {
      if (sortBy === 'POPULAR') return b.studentCount - a.studentCount;
      if (sortBy === 'RATING') return b.rating - a.rating;
      if (sortBy === 'PRICE_LOW') return (a.discountPrice || a.price) - (b.discountPrice || b.price);
      if (sortBy === 'PRICE_HIGH') return (b.discountPrice || b.price) - (a.discountPrice || a.price);
      return 0;
    });
  }, [courses, searchQuery, selectedCategory, selectedLevel, selectedRating, sortBy]);

  return (
    <div className="bg-black min-h-screen pt-24 pb-20 text-white">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12 space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">Course Discovery Catalog</h1>
          <p className="text-xs text-slate-400">Stream HD modules, attempt quizzes, and earn accredited certificates</p>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-[#141414] border border-white/10 p-4 rounded-xl">
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search course title, tags, technology..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-black border border-white/15 rounded-lg pl-10 pr-4 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-[#E50914]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Level Filter */}
            <select
              value={selectedLevel}
              onChange={e => setSelectedLevel(e.target.value)}
              className="bg-black border border-white/15 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-[#E50914]"
            >
              <option value="ALL">All Skill Levels</option>
              <option value="BEGINNER">Beginner</option>
              <option value="INTERMEDIATE">Intermediate</option>
              <option value="ADVANCED">Advanced</option>
              <option value="ALL_LEVELS">All Levels</option>
            </select>

            {/* Sort By */}
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="bg-black border border-white/15 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-[#E50914]"
            >
              <option value="POPULAR">Most Popular</option>
              <option value="RATING">Highest Rated</option>
              <option value="PRICE_LOW">Price: Low to High</option>
              <option value="PRICE_HIGH">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Sidebar Filters */}
          <div className="space-y-6 bg-[#141414] border border-white/10 p-5 rounded-xl h-fit">
            <div className="flex items-center gap-2 text-sm font-bold text-white pb-3 border-b border-white/10">
              <SlidersHorizontal className="w-4 h-4 text-[#E50914]" />
              <span>Refine Filters</span>
            </div>

            {/* Category List */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Creative Disciplines</label>
              <div className="space-y-1 text-xs">
                <button
                  onClick={() => setSelectedCategory('ALL')}
                  className={`w-full text-left px-3 py-2 rounded-lg transition ${
                    selectedCategory === 'ALL'
                      ? 'bg-[#E50914]/20 text-red-300 font-bold border border-[#E50914]/40'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  All Masterclasses
                </button>
                {MOCK_CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition truncate ${
                      selectedCategory === cat.id || selectedCategory === cat.slug
                        ? 'bg-[#E50914]/20 text-red-300 font-bold border border-[#E50914]/40'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Rating Filter */}
            <div className="space-y-2 pt-3 border-t border-white/10">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Minimum Rating</label>
              <div className="space-y-1 text-xs">
                {[4.5, 4.0, 3.5].map(r => (
                  <button
                    key={r}
                    onClick={() => setSelectedRating(selectedRating === r ? 0 : r)}
                    className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-slate-300 hover:bg-white/5 ${
                      selectedRating === r ? 'bg-[#E50914]/20 text-red-300 border border-[#E50914]/40 font-bold' : ''
                    }`}
                  >
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>{r} & Up</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Course Cards Grid */}
          <div className="lg:col-span-3">
            {filteredCourses.length === 0 ? (
              <div className="bg-[#141414] border border-white/10 rounded-xl p-12 text-center space-y-3">
                <Filter className="w-10 h-10 text-slate-600 mx-auto" />
                <h3 className="text-white font-bold text-base">No courses found</h3>
                <p className="text-slate-400 text-xs">Try clearing or adjusting your search filters.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredCourses.map((course, idx) => (
                  <CourseCard key={course.id || (course as any)._id || `catalog-${idx}`} course={course} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CoursesPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-slate-400">Loading catalog...</div>}>
      <CoursesContent />
    </Suspense>
  );
}
