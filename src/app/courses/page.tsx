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
    <div className="bg-white min-h-screen pt-20 text-zinc-900 w-full">
      <div className="flex flex-col lg:flex-row w-full min-h-[calc(100vh-5rem)]">
        {/* Left Menu Bar */}
        <aside className="w-full lg:w-72 xl:w-80 flex-shrink-0 bg-white border-b lg:border-b-0 lg:border-r border-zinc-200 p-6 lg:py-8 lg:px-6 lg:min-h-[calc(100vh-5rem)] lg:sticky lg:top-20 space-y-7">
        

          {/* Creative Disciplines Menu List */}
          <div className="space-y-3">
           
            <div className="space-y-1">
              <button
                onClick={() => setSelectedCategory('ALL')}
                className={`w-full flex items-center justify-between text-left px-3.5 py-2.5 rounded-lg text-xs transition ${
                  selectedCategory === 'ALL'
                    ? 'bg-[#d33028] text-white font-bold shadow-sm'
                    : 'text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100 font-medium'
                }`}
              >
                <span>All Masterclasses</span>
                {selectedCategory === 'ALL' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
              </button>
              {MOCK_CATEGORIES.map(cat => {
                const isSelected = selectedCategory === cat.id || selectedCategory === cat.slug;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`w-full flex items-center justify-between text-left px-3.5 py-2.5 rounded-lg text-xs transition truncate ${
                      isSelected
                        ? 'bg-[#d33028] text-white font-bold shadow-sm'
                        : 'text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100 font-medium'
                    }`}
                  >
                    <span className="truncate">{cat.name}</span>
                    {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

        </aside>

        {/* Right Content Area (Starts with 0 gap directly against the menu bar's border) */}
        <main className="flex-1 min-w-0 p-6 sm:p-8 lg:p-10 space-y-8 bg-zinc-50/30">
          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-zinc-900 tracking-tight">
              Course Discovery Catalog
            </h1>
          
          </div>


          {/* Course Cards Grid */}
          <div>
            {filteredCourses.length === 0 ? (
              <div className="bg-white border border-zinc-200 rounded-xl p-12 text-center space-y-3">
                <Filter className="w-10 h-10 text-zinc-400 mx-auto" />
                <h3 className="text-zinc-900 font-bold text-base">No courses found</h3>
                <p className="text-zinc-500 text-xs">Try clearing or adjusting your search filters.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
                {filteredCourses.map((course, idx) => (
                  <CourseCard key={course.id || (course as any)._id || `catalog-${idx}`} course={course} />
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function CoursesPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-zinc-500">Loading catalog...</div>}>
      <CoursesContent />
    </Suspense>
  );
}
