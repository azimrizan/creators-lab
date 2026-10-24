'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { PlusCircle, BookOpen, Users, DollarSign, Video, FileText, CheckCircle2, TrendingUp, X } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { Course, getSafeThumbnail } from '@/lib/types';

export default function InstructorPage() {
  const { currentUser, courses, addCourse } = useAppStore();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [price, setPrice] = useState(2999);
  const [discountPrice, setDiscountPrice] = useState(499);
  const [categoryName, setCategoryName] = useState('Cinematography & Directing');
  const [sectionTitle, setSectionTitle] = useState('Section 1: Getting Started');
  const [lessonTitle, setLessonTitle] = useState('1. Overview & Setup');
  const [videoUrl, setVideoUrl] = useState('/vidssave.com Visual Storytelling 101 480P.mp4');

  const myCourses = courses.filter(c => c.instructorId === currentUser.id || c.instructorName === currentUser.name);

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();

    const newCourse: Course = {
      id: `course-${Date.now()}`,
      title,
      slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      subtitle,
      description: subtitle,
      thumbnail: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=800&q=80',
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
    <div className="bg-white text-zinc-900 min-h-screen pt-24 pb-20">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 pb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-zinc-900">Instructor Authoring Studio</h1>
            <p className="text-xs text-zinc-500">Publish courses, construct curriculum sections, and attach Cloudflare video streams</p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-[#d33028] hover:bg-[#b82720] text-white text-xs font-bold px-5 py-3 rounded-md transition shadow-md flex items-center gap-2"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create New Course</span>
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-zinc-50 border border-zinc-200 p-5 rounded-xl space-y-1 shadow-sm">
            <div className="text-xs text-zinc-500">Active Authored Modules</div>
            <div className="text-2xl font-black text-zinc-900">{myCourses.length}</div>
          </div>
          <div className="bg-zinc-50 border border-zinc-200 p-5 rounded-xl space-y-1 shadow-sm">
            <div className="text-xs text-zinc-500">Total Students Reached</div>
            <div className="text-2xl font-black text-[#d33028]">
              {myCourses.reduce((sum, c) => sum + c.studentCount, 0).toLocaleString()}
            </div>
          </div>
          <div className="bg-zinc-50 border border-zinc-200 p-5 rounded-xl space-y-1 shadow-sm">
            <div className="text-xs text-zinc-500">Average Rating</div>
            <div className="text-2xl font-black text-amber-500">4.9 ★</div>
          </div>
        </div>

        {/* Authored Courses */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-zinc-900">My Authored Courses</h2>
          {myCourses.length === 0 ? (
            <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-12 text-center space-y-3">
              <BookOpen className="w-10 h-10 text-zinc-400 mx-auto" />
              <h3 className="text-zinc-900 font-bold text-base">No courses published yet</h3>
              <p className="text-xs text-zinc-500">Click "Create New Course" to author your first module.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {myCourses.map((course, idx) => (
                <div key={course.id || (course as any)._id || `instructor-course-${idx}`} className="bg-white border border-zinc-200 rounded-xl p-5 flex gap-4 shadow-sm">
                  <img src={getSafeThumbnail(course.thumbnail)} alt={course.title} className="w-28 h-20 object-cover rounded-md flex-shrink-0 border border-zinc-200" />
                  <div className="space-y-2 min-w-0 flex-1">
                    <h3 className="font-bold text-zinc-900 text-sm truncate">{course.title}</h3>
                    <p className="text-xs text-zinc-500 line-clamp-1">{course.subtitle}</p>
                    <div className="flex items-center gap-3 text-[11px] text-zinc-500">
                      <span className="text-[#d33028] font-bold">₹{course.discountPrice || course.price}</span>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white border border-zinc-200 rounded-xl max-w-xl w-full p-6 space-y-6 shadow-2xl text-zinc-900">
            <div className="flex justify-between items-center border-b border-zinc-200 pb-4">
              <h3 className="font-bold text-zinc-900 text-base">Author New Course</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-400 hover:text-zinc-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCourse} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-zinc-700 font-medium">Course Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Advanced System Architecture 2026"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full bg-white border border-zinc-300 rounded-md p-2.5 text-zinc-900 focus:outline-none focus:border-[#d33028]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-zinc-700 font-medium">Subtitle Overview</label>
                <input
                  type="text"
                  required
                  placeholder="High-concurrency microservices and database clustering"
                  value={subtitle}
                  onChange={e => setSubtitle(e.target.value)}
                  className="w-full bg-white border border-zinc-300 rounded-md p-2.5 text-zinc-900 focus:outline-none focus:border-[#d33028]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-zinc-700 font-medium">Price (₹)</label>
                  <input
                    type="number"
                    value={discountPrice}
                    onChange={e => setDiscountPrice(Number(e.target.value))}
                    className="w-full bg-white border border-zinc-300 rounded-md p-2.5 text-zinc-900 focus:outline-none focus:border-[#d33028]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-zinc-700 font-medium">Category</label>
                  <select
                    value={categoryName}
                    onChange={e => setCategoryName(e.target.value)}
                    className="w-full bg-white border border-zinc-300 rounded-md p-2.5 text-zinc-900 focus:outline-none focus:border-[#d33028]"
                  >
                    <option value="Cinematography & Directing">Cinematography & Directing</option>
                    <option value="Photography & Visual Arts">Photography & Visual Arts</option>
                    <option value="Video Editing & Color Grading">Video Editing & Color Grading</option>
                    <option value="3D Animation & Motion Design">3D Animation & Motion Design</option>
                    <option value="Music Production & Sound Engineering">Music Production & Sound Engineering</option>
                    <option value="UI/UX & Brand Creative Direction">UI/UX & Brand Creative Direction</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-zinc-200">
                <label className="text-zinc-700 font-medium">First Lesson Video URL (MP4 Stream)</label>
                <input
                  type="text"
                  value={videoUrl}
                  onChange={e => setVideoUrl(e.target.value)}
                  className="w-full bg-white border border-zinc-300 rounded-md p-2.5 text-zinc-900 focus:outline-none focus:border-[#d33028]"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-zinc-100 border border-zinc-300 text-zinc-700 hover:bg-zinc-200 rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#d33028] hover:bg-[#b82720] text-white font-bold rounded-md shadow-md"
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
