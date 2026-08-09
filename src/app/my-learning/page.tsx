'use client';

import React from 'react';
import Link from 'next/link';
import { Play, Award, CheckCircle2, BookOpen, Clock, Sparkles } from 'lucide-react';
import { useAppStore } from '@/lib/store';

export default function MyLearningPage() {
  const { courses, currentUser, userProgress } = useAppStore();

  const enrolledCourses = courses.filter(c =>
    currentUser.enrolledCourseIds.includes(c.id) ||
    currentUser.enrolledCourseIds.includes(c.slug) ||
    currentUser.enrolledCourseIds.includes((c as any)._id)
  );

  return (
    <div className="bg-[#0B0B0B] text-white min-h-screen pt-24 pb-20">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12 space-y-8">
        {/* Page Header */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#E50914]/20 border border-[#E50914]/30 text-red-400 text-xs font-bold uppercase">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Student Dashboard</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">My Enrolled Courses</h1>
          <p className="text-xs text-[#B3B3B3]">Track your active progress, stream video lessons, and claim QR-verified certificates</p>
        </div>

        {/* Course Grid */}
        {enrolledCourses.length === 0 ? (
          <div className="bg-[#141414] border border-white/10 rounded-xl p-12 text-center space-y-4 max-w-md mx-auto">
            <BookOpen className="w-12 h-12 text-slate-600 mx-auto" />
            <div className="space-y-1">
              <h3 className="text-white font-bold text-base">No active course enrollments</h3>
              <p className="text-xs text-[#B3B3B3]">Browse our catalog and start learning today!</p>
            </div>
            <Link
              href="/courses"
              className="inline-flex items-center gap-2 bg-[#E50914] hover:bg-[#b80710] text-white font-bold text-xs px-6 py-3 rounded-md transition shadow-lg"
            >
              <span>Browse Catalog</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {enrolledCourses.map((course, idx) => {
              const courseId = course.id || (course as any)._id || course.slug;
              const prog = userProgress[courseId] || { completedLessonIds: [] };
              const allLessons = course.sections.flatMap(s => s.lessons);
              const completedCount = prog.completedLessonIds.length;
              const percent = allLessons.length > 0 ? Math.round((completedCount / allLessons.length) * 100) : 0;
              const isCompleted = percent === 100;
              const firstLesson = allLessons[0];
              const itemKey = courseId || `my-learn-${idx}`;

              return (
                <div key={itemKey} className="bg-[#141414] border border-white/10 rounded-xl overflow-hidden flex flex-col justify-between p-5 space-y-4 shadow-xl">
                  <div className="space-y-3">
                    <div className="relative aspect-video rounded-lg overflow-hidden bg-black">
                      <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <Link
                          href={`/watch/${course.slug}/${firstLesson?.id || 'les-1'}`}
                          className="w-12 h-12 rounded-full bg-[#E50914] text-white flex items-center justify-center shadow-lg hover:scale-110 transition"
                        >
                          <Play className="w-6 h-6 fill-current translate-x-0.5" />
                        </Link>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-bold text-white text-base line-clamp-1">{course.title}</h3>
                      <p className="text-xs text-[#B3B3B3]">By {course.instructorName}</p>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-[#B3B3B3]">Course Progress</span>
                        <span className="text-red-400 font-bold">{percent}%</span>
                      </div>
                      <div className="w-full bg-[#0B0B0B] h-2 rounded-full overflow-hidden border border-white/10">
                        <div className="bg-[#E50914] h-full rounded-full transition-all duration-500" style={{ width: `${percent}%` }} />
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                    <Link
                      href={`/watch/${course.slug}/${firstLesson?.id || 'les-1'}`}
                      className="bg-[#E50914] hover:bg-[#b80710] text-white font-bold px-4 py-2 rounded-md transition text-xs flex items-center gap-1.5"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>{isCompleted ? 'Review Course' : 'Resume'}</span>
                    </Link>

                    {isCompleted && (
                      <Link
                        href="/certificates"
                        className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold px-3 py-2 rounded-md transition flex items-center gap-1.5"
                      >
                        <Award className="w-3.5 h-3.5 text-amber-400" />
                        <span>Certificate</span>
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
