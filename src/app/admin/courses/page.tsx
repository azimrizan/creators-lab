'use client';

import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, Search, Edit3, Eye, Trash2, X, Upload, Video, FileText, CheckCircle2, Play } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { Course, User, getSafeThumbnail } from '@/lib/types';

export default function AdminCoursesPage() {
  const { courses, addCourse, updateCourseStatus } = useAppStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [instructorsList, setInstructorsList] = useState<User[]>([]);

  // Form State
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState(2999);
  const [discountPrice, setDiscountPrice] = useState(499);
  const [categoryName, setCategoryName] = useState('Cinematography & Directing');
  const [level, setLevel] = useState<'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'ALL_LEVELS'>('BEGINNER');
  const [instructorId, setInstructorId] = useState('');
  const [thumbnail, setThumbnail] = useState('https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=800&q=80');

  // Media Lesson State
  const [sectionTitle, setSectionTitle] = useState('Section 1: Core Fundamentals');
  const [lessonTitle, setLessonTitle] = useState('1. Introduction & Setup');
  const [videoUrl, setVideoUrl] = useState('/vidssave.com Visual Storytelling 101 480P.mp4');
  const [pdfUrl, setPdfUrl] = useState('');

  // Fetch live instructors from MongoDB Atlas
  useEffect(() => {
    fetch('/api/users')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.users) {
          const insts = data.users.filter((u: User) => u.role === 'INSTRUCTOR' || u.role === 'SUPER_ADMIN');
          setInstructorsList(insts);
          if (insts.length > 0) setInstructorId(insts[0].id || (insts[0] as any)._id);
        }
      })
      .catch(() => {});
  }, []);

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    const selInst = instructorsList.find(i => i.id === instructorId || (i as any)._id === instructorId);

    const newCourse: Course = {
      id: `course-${Date.now()}`,
      title,
      slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      subtitle,
      description,
      thumbnail,
      previewVideoUrl: videoUrl,
      price,
      discountPrice,
      status: 'PUBLISHED',
      level,
      language: 'English',
      categoryId: 'cat-1',
      categoryName,
      subcategory: 'General',
      tags: [categoryName, level],
      instructorId: instructorId || 'user-2',
      instructorName: selInst?.name || 'Dr. Rahul Verma',
      instructorAvatar: selInst?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
      instructorTitle: selInst?.bio || 'Senior Instructor',
      rating: 5.0,
      reviewCount: 1,
      studentCount: 0,
      whatYouWillLearn: ['Master core concepts with hands-on projects', 'Build real-world applications'],
      prerequisites: ['Basic enthusiasm for learning'],
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
              contentType: videoUrl ? 'VIDEO' : 'PDF',
              durationSeconds: 600,
              videoUrl: videoUrl || '',
              pdfUrl: pdfUrl || '',
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
      <div className="max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 pb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-zinc-900">Course Management & Media Authoring</h1>
            <p className="text-xs text-zinc-500">Publish courses, assign instructors, and attach Cloudflare video streams or PDFs</p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="btn-soft text-xs font-bold px-4 py-2.5 rounded-md transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Course</span>
          </button>
        </div>

        {/* Courses Table */}
        <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs text-zinc-600">
            <thead className="bg-zinc-50 text-zinc-800 font-bold uppercase text-[10px] tracking-wider border-b border-zinc-200">
              <tr>
                <th className="p-4">Course</th>
                <th className="p-4">Assigned Instructor</th>
                <th className="p-4">Price</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {courses.map((course, idx) => {
                const cId = course.id || (course as any)._id || course.slug;
                return (
                  <tr key={cId || `adm-c-${idx}`} className="hover:bg-zinc-50 transition">
                    <td className="p-4 flex items-center gap-3">
                      <img src={getSafeThumbnail(course.thumbnail)} alt={course.title} className="w-12 h-9 object-cover rounded-md border border-zinc-200" />
                      <div>
                        <div className="font-bold text-zinc-900 max-w-xs truncate">{course.title}</div>
                        <div className="text-[11px] text-zinc-500">{course.categoryName}</div>
                      </div>
                    </td>
                    <td className="p-4 font-medium text-zinc-900">{course.instructorName}</td>
                    <td className="p-4 font-extrabold text-brand">₹{course.discountPrice || course.price}</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        course.status === 'PUBLISHED'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                          : 'bg-amber-50 text-amber-800 border-amber-300'
                      }`}>
                        {course.status}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button
                        onClick={() => updateCourseStatus(cId, course.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED')}
                        className="px-2.5 py-1 rounded border border-zinc-300 text-[11px] font-semibold hover:bg-zinc-100 text-zinc-800 transition"
                      >
                        {course.status === 'PUBLISHED' ? 'Unpublish' : 'Publish'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for Creating Course */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white border border-zinc-200 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-6 text-zinc-900">
            <div className="flex justify-between items-center border-b border-zinc-200 pb-4">
              <h2 className="text-base font-bold text-zinc-900">Create New Course & Attach Curriculum</h2>
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
                  placeholder="e.g. Master Docker & Kubernetes"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full bg-white border border-zinc-300 rounded-md p-2.5 text-zinc-900 focus:outline-none focus:border-brand"
                />
              </div>

              <div className="space-y-1">
                <label className="text-zinc-700 font-medium">Subtitle Description</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. From containers to production cluster deployment"
                  value={subtitle}
                  onChange={e => setSubtitle(e.target.value)}
                  className="w-full bg-white border border-zinc-300 rounded-md p-2.5 text-zinc-900 focus:outline-none focus:border-brand"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-zinc-700 font-medium">Assign Instructor</label>
                  <select
                    value={instructorId}
                    onChange={e => setInstructorId(e.target.value)}
                    className="w-full bg-white border border-zinc-300 rounded-md p-2.5 text-zinc-900 focus:outline-none focus:border-brand"
                  >
                    {instructorsList.map(inst => (
                      <option key={inst.id || (inst as any)._id} value={inst.id || (inst as any)._id}>
                        {inst.name} ({inst.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-zinc-700 font-medium">Category</label>
                  <select
                    value={categoryName}
                    onChange={e => setCategoryName(e.target.value)}
                    className="w-full bg-white border border-zinc-300 rounded-md p-2.5 text-zinc-900 focus:outline-none focus:border-brand"
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-zinc-700 font-medium">Offer Price (₹)</label>
                  <input
                    type="number"
                    value={discountPrice}
                    onChange={e => setDiscountPrice(Number(e.target.value))}
                    className="w-full bg-white border border-zinc-300 rounded-md p-2.5 text-zinc-900 focus:outline-none focus:border-brand"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-zinc-700 font-medium">Thumbnail Image URL</label>
                  <input
                    type="text"
                    value={thumbnail}
                    onChange={e => setThumbnail(e.target.value)}
                    className="w-full bg-white border border-zinc-300 rounded-md p-2.5 text-zinc-900 focus:outline-none focus:border-brand"
                  />
                </div>
              </div>

              {/* Curriculum Section */}
              <div className="pt-2 border-t border-zinc-200 space-y-3">
                <h4 className="font-bold uppercase text-[10px] tracking-wider text-brand">Curriculum & Video Attachment</h4>
                <div className="space-y-2 bg-zinc-50 p-3 rounded-md border border-zinc-200">
                  <input
                    type="text"
                    placeholder="Lesson Title"
                    value={lessonTitle}
                    onChange={e => setLessonTitle(e.target.value)}
                    className="w-full bg-white border border-zinc-300 rounded-md p-2 text-zinc-900 text-xs"
                  />
                  <input
                    type="text"
                    placeholder="MP4 Video Stream URL"
                    value={videoUrl}
                    onChange={e => setVideoUrl(e.target.value)}
                    className="w-full bg-white border border-zinc-300 rounded-md p-2 text-zinc-900 text-xs"
                  />
                </div>
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
                  className="px-5 py-2 btn-soft font-bold rounded-md"
                >
                  Publish Course to Atlas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
