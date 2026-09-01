'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { PlusCircle, BookOpen, Users, DollarSign, Video, FileText, CheckCircle2, TrendingUp, X } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { Course } from '@/lib/types';

export default function InstructorPage() {
  const { currentUser, courses, addCourse } = useAppStore();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [price, setPrice] = useState(2999);
  const [discountPrice, setDiscountPrice] = useState(499);
  const [categoryName, setCategoryName] = useState('Web Development');
  const [sectionTitle, setSectionTitle] = useState('Section 1: Getting Started');
  const [lessonTitle, setLessonTitle] = useState('1. Overview & Setup');
  const [videoUrl, setVideoUrl] = useState('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4');

  const myCourses = courses.filter(c => c.instructorId === currentUser.id || c.instructorName === currentUser.name);

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();

    const newCourse: Course = {
      id: `course-${Date.now()}`,
      title,
      slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      subtitle,
      description: subtitle,
      thumbnail: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80',
      previewVideoUrl: videoUrl,
      price,
      discountPrice,
      status: 'PUBLISHED',
      level: 'BEGINNER',
      language: 'English',
      categoryId: 'cat-1',
      categoryName,
      subcategory: 'General',
      tags: [categoryName],
      instructorId: currentUser.id,
      instructorName: currentUser.name,
      instructorAvatar: currentUser.avatar,
      instructorTitle: currentUser.bio || 'Accredited Educator',
      rating: 5.0,
      reviewCount: 1,
      studentCount: 0,
      whatYouWillLearn: ['Master core concepts with hands-on projects'],
      prerequisites: ['No prior experience needed'],
      sections: [
        {
          id: `sec-${Date.now()}`,
          title: sectionTitle,
          order: 1,
          lessons: [
            {
              id: `les-${Date.now()}`,
              title: lessonTitle,
              order: 1,
              contentType: 'VIDEO',
              durationSeconds: 600,
              videoUrl,
              isFreePreview: true
            }
          ]
        }
      ],
      updatedAt: new Date().toISOString().split('T')[0]
    };

    await addCourse(newCourse);
    setIsModalOpen(false);
  };

  return (
    <div className="bg-[#0B0B0B] text-white min-h-screen pt-24 pb-20">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-white">Instructor Authoring Studio</h1>
            <p className="text-xs text-[#B3B3B3]">Publish courses, construct curriculum sections, and attach Cloudflare video streams</p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-[#E50914] hover:bg-[#b80710] text-white text-xs font-bold px-5 py-3 rounded-md transition shadow-lg flex items-center gap-2"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create New Course</span>
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-[#141414] border border-white/10 p-5 rounded-xl space-y-1">
            <div className="text-xs text-[#B3B3B3]">Active Authored Modules</div>
            <div className="text-2xl font-black text-white">{myCourses.length}</div>
          </div>
          <div className="bg-[#141414] border border-white/10 p-5 rounded-xl space-y-1">
            <div className="text-xs text-[#B3B3B3]">Total Students Reached</div>
            <div className="text-2xl font-black text-red-400">
              {myCourses.reduce((sum, c) => sum + c.studentCount, 0).toLocaleString()}
            </div>
          </div>
          <div className="bg-[#141414] border border-white/10 p-5 rounded-xl space-y-1">
            <div className="text-xs text-[#B3B3B3]">Average Rating</div>
            <div className="text-2xl font-black text-amber-400">4.9 ★</div>
          </div>
        </div>

        {/* Authored Courses */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-white">My Authored Courses</h2>
          {myCourses.length === 0 ? (
            <div className="bg-[#141414] border border-white/10 rounded-xl p-12 text-center space-y-3">
              <BookOpen className="w-10 h-10 text-slate-600 mx-auto" />
              <h3 className="text-white font-bold text-base">No courses published yet</h3>
              <p className="text-xs text-[#B3B3B3]">Click "Create New Course" to author your first module.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {myCourses.map((course, idx) => (
                <div key={course.id || (course as any)._id || `instructor-course-${idx}`} className="bg-[#141414] border border-white/10 rounded-xl p-5 flex gap-4 shadow-xl">
                  <img src={course.thumbnail} alt={course.title} className="w-28 h-20 object-cover rounded-md flex-shrink-0" />
                  <div className="space-y-2 min-w-0 flex-1">
                    <h3 className="font-bold text-white text-sm truncate">{course.title}</h3>
                    <p className="text-xs text-[#B3B3B3] line-clamp-1">{course.subtitle}</p>
                    <div className="flex items-center gap-3 text-[11px] text-slate-400">
                      <span className="text-emerald-400 font-bold">₹{course.discountPrice || course.price}</span>
                      <span>•</span>
                      <span>{course.studentCount} Students</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Course Authoring Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#1C1C1C] border border-white/15 rounded-xl max-w-xl w-full p-6 space-y-6 shadow-2xl">
            <div className="flex justify-between items-center border-b border-white/10 pb-4">
              <h3 className="font-bold text-white text-base">Author New Course</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-[#B3B3B3] hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCourse} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-white font-medium">Course Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Advanced System Architecture 2026"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full bg-[#0B0B0B] border border-white/15 rounded-md p-2.5 text-white focus:outline-none focus:border-[#E50914]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-white font-medium">Subtitle Overview</label>
                <input
                  type="text"
                  required
                  placeholder="High-concurrency microservices and database clustering"
                  value={subtitle}
                  onChange={e => setSubtitle(e.target.value)}
                  className="w-full bg-[#0B0B0B] border border-white/15 rounded-md p-2.5 text-white focus:outline-none focus:border-[#E50914]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-white font-medium">Price (₹)</label>
                  <input
                    type="number"
                    value={discountPrice}
                    onChange={e => setDiscountPrice(Number(e.target.value))}
                    className="w-full bg-[#0B0B0B] border border-white/15 rounded-md p-2.5 text-white focus:outline-none focus:border-[#E50914]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-white font-medium">Category</label>
                  <select
                    value={categoryName}
                    onChange={e => setCategoryName(e.target.value)}
                    className="w-full bg-[#0B0B0B] border border-white/15 rounded-md p-2.5 text-white focus:outline-none focus:border-[#E50914]"
                  >
                    <option value="Web Development">Web Development</option>
                    <option value="Python & Data Science">Python & Data Science</option>
                    <option value="UI/UX & Product Design">UI/UX & Product Design</option>
                    <option value="Cloud & DevOps">Cloud & DevOps</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-white/10">
                <label className="text-white font-medium">First Lesson Video URL (MP4 Stream)</label>
                <input
                  type="text"
                  value={videoUrl}
                  onChange={e => setVideoUrl(e.target.value)}
                  className="w-full bg-[#0B0B0B] border border-white/15 rounded-md p-2.5 text-white focus:outline-none focus:border-[#E50914]"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-[#141414] border border-white/15 text-[#B3B3B3] hover:text-white rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#E50914] hover:bg-[#b80710] text-white font-bold rounded-md shadow-lg"
                >
                  Publish Course
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
