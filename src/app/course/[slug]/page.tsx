'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Star, Users, CheckCircle2, Play, Lock, FileText, HelpCircle, ChevronDown, ChevronUp, ShieldCheck, Heart, ShoppingBag, ArrowRight, Award, MessageSquare } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import RazorpayModal from '@/components/RazorpayModal';
import { MOCK_REVIEWS, MOCK_QA } from '@/lib/mockData';

export default function CourseDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { courses, currentUser, cartCourseIds, addToCart, wishlistCourseIds, toggleWishlist, enrollUserInCourse } = useAppStore();

  const slug = params.slug as string;
  const course = courses.find(c => c.slug === slug || c.id === slug) || courses.find(c => c.slug === 'introduction-to-visual-storytelling') || courses[0];
  const courseId = course.id || (course as any)._id || course.slug;

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    'sec-1': true,
    'sec-2': true
  });
  const [previewVideoUrl, setPreviewVideoUrl] = useState<string | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  const isEnrolled = currentUser.enrolledCourseIds.includes(courseId);
  const isInCart = cartCourseIds.includes(courseId);
  const isWishlisted = wishlistCourseIds.includes(courseId);

  const toggleSection = (id: string) => {
    setExpandedSections(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const totalLessons = course.sections.reduce((sum, s) => sum + s.lessons.length, 0);
  const totalDurationMin = Math.round(
    course.sections.reduce((sum, s) => sum + s.lessons.reduce((lSum, l) => lSum + l.durationSeconds, 0), 0) / 60
  );

  const handleEnrollClick = () => {
    if (isEnrolled) {
      const firstLesson = course.sections[0]?.lessons[0];
      if (firstLesson) {
        router.push(`/watch/${course.slug}/${firstLesson.id}`);
      }
    } else {
      setIsCheckoutOpen(true);
    }
  };

  const OLD_REACT_IMG = '1633356122544-f134324a6cee';
  const NEW_CODE_IMG = 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80';
  const displayThumbnail = (!course.thumbnail || course.thumbnail.includes(OLD_REACT_IMG))
    ? NEW_CODE_IMG
    : course.thumbnail;

  return (
    <div className="bg-white text-zinc-900 min-h-screen pb-24">
      {/* Cinematic Hero Header */}
      <section className="relative w-full min-h-[480px] pt-24 pb-16 flex items-center overflow-hidden border-b border-zinc-200">
        {/* Background Image / Backdrop */}
        <div className="absolute inset-0 z-0">
          <img
            src={displayThumbnail}
            alt={course.title}
            className="w-full h-full object-cover filter brightness-95"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-white via-white/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/90 to-transparent" />
        </div>

        <div className="relative z-10 max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12 grid grid-cols-1 lg:grid-cols-3 gap-8 items-center w-full">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <span className="bg-[#d33028]/10 text-[#d33028] text-xs font-bold px-3 py-1 rounded-md border border-[#d33028]/30 uppercase">
                {course.categoryName}
              </span>
              <span className="bg-zinc-100 text-zinc-700 text-xs font-semibold px-3 py-1 rounded-md border border-zinc-200">
                {course.level}
              </span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-zinc-900 leading-tight">
              {course.title}
            </h1>

            <p className="text-zinc-600 text-sm sm:text-base leading-relaxed max-w-2xl">
              {course.subtitle}
            </p>

            <div className="flex flex-wrap items-center gap-4 text-xs pt-2">
              <div className="flex items-center gap-1 text-amber-500 font-bold">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span>{course.rating}</span>
                <span className="text-zinc-500 font-normal">({course.reviewCount} reviews)</span>
              </div>
              <div className="flex items-center gap-1 text-zinc-600">
                <Users className="w-4 h-4 text-[#d33028]" />
                <span>{course.studentCount.toLocaleString()} enrolled</span>
              </div>
              <div className="text-zinc-500">
                Instructor: <span className="text-zinc-900 font-bold">{course.instructorName}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content & Sidebar Grid (60% / 40%) */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12 mt-10 grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-10 items-start">
        {/* Left Column: Single Container for all Details & Curriculum (60% width) */}
        <div className="lg:col-span-3 bg-white border border-zinc-200 p-6 sm:p-8 rounded-xl shadow-sm space-y-8 overflow-hidden">
          {/* What You Will Learn */}
          <div className="space-y-4">
            <h2 className="text-lg sm:text-xl font-bold text-zinc-900">What You'll Learn</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-zinc-700">
              {course.whatYouWillLearn.map((item, idx) => (
                <div key={idx} className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <hr className="border-zinc-200" />

          {/* Curriculum Sections - Clean list without nested container */}
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
              <h2 className="text-lg sm:text-xl font-bold text-zinc-900">Course Curriculum</h2>
              <span className="text-xs text-zinc-500">
                {course.sections.length} Sections • {totalLessons} Lessons • {totalDurationMin} mins total
              </span>
            </div>

            <div className="divide-y divide-zinc-200">
              {course.sections.map(section => (
                <div key={section.id} className="py-1">
                  <button
                    onClick={() => toggleSection(section.id)}
                    className="w-full py-3 flex items-center justify-between hover:text-[#d33028] transition text-left group"
                  >
                    <div className="flex items-center gap-3">
                      {expandedSections[section.id] ? (
                        <ChevronUp className="w-4 h-4 text-[#d33028]" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-zinc-400 group-hover:text-[#d33028]" />
                      )}
                      <span className="font-bold text-zinc-900 group-hover:text-[#d33028] text-sm">{section.title}</span>
                    </div>
                    <span className="text-xs text-zinc-500">{section.lessons.length} lessons</span>
                  </button>

                  {expandedSections[section.id] && (
                    <div className="divide-y divide-zinc-100 pl-4 sm:pl-7 pb-2">
                      {section.lessons.map(lesson => (
                        <div key={lesson.id} className="py-2.5 flex items-center justify-between text-xs hover:bg-zinc-50 rounded-md px-2 -mx-2 transition">
                          <div className="flex items-center gap-3">
                            {lesson.contentType === 'VIDEO' && <Play className="w-3.5 h-3.5 text-[#d33028]" />}
                            {lesson.contentType === 'PDF' && <FileText className="w-3.5 h-3.5 text-sky-500" />}
                            {lesson.contentType === 'QUIZ' && <HelpCircle className="w-3.5 h-3.5 text-amber-500" />}
                            <span className="text-zinc-800">{lesson.title}</span>
                          </div>

                          <div className="flex items-center gap-3">
                            {lesson.isFreePreview && (
                              <button
                                onClick={() => setPreviewVideoUrl(lesson.videoUrl || course.previewVideoUrl)}
                                className="text-[10px] font-bold text-[#d33028] hover:underline bg-[#d33028]/10 px-2 py-0.5 rounded border border-[#d33028]/20"
                              >
                                Free Preview
                              </button>
                            )}
                            <span className="text-[11px] text-zinc-500">
                              {Math.round(lesson.durationSeconds / 60)} min
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Instructor Bio with Full-Width Red Background (flushed to sides and bottom) */}
          <div className="-mx-6 sm:-mx-8 -mb-6 sm:-mb-8 p-6 sm:p-8 bg-[#d33028] text-white rounded-b-xl space-y-4">
            <h2 className="text-lg sm:text-xl font-bold text-white">Instructor Profile</h2>
            <div className="flex gap-4 items-start">
              <img
                src={course.instructorAvatar}
                alt={course.instructorName}
                className="w-14 h-14 rounded-full object-cover border-2 border-white/90 shadow-md shrink-0"
              />
              <div className="space-y-1">
                <h3 className="font-bold text-white text-base">{course.instructorName}</h3>
                <p className="text-xs text-white/90 font-medium">{course.instructorTitle}</p>
                <p className="text-xs text-white/85 pt-1 leading-relaxed">
                  Senior Full-Stack Engineer & Educator with 10+ years experience training over 50,000 developers worldwide.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sticky Pricing & Action Card (40% width) */}
        <div className="lg:col-span-2 bg-white border border-zinc-200 p-6 rounded-xl space-y-6 sticky top-24 shadow-xl">
          {/* Card Media Preview */}
          <div className="relative aspect-video rounded-lg overflow-hidden bg-zinc-100 group">
            <img src={displayThumbnail} alt={course.title} className="w-full h-full object-cover" />
            <button
              onClick={() => setPreviewVideoUrl(course.previewVideoUrl)}
              className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:bg-black/20 transition"
            >
              <div className="w-12 h-12 rounded-full bg-[#d33028] text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition">
                <Play className="w-6 h-6 fill-current translate-x-0.5" />
              </div>
            </button>
          </div>

          {/* Price Header */}
          <div className="space-y-1">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-zinc-900">₹{course.discountPrice || course.price}</span>
              {course.discountPrice && (
                <span className="text-xs text-zinc-400 line-through">₹{course.price}</span>
              )}
            </div>
            <p className="text-[11px] text-emerald-600 font-bold">100% Money Back Guarantee • Lifetime Access</p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleEnrollClick}
              className="w-full bg-[#d33028] hover:bg-[#b82720] text-white font-bold py-3 rounded-md transition shadow-lg flex items-center justify-center gap-2 text-xs"
            >
              {isEnrolled ? (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Go to Course Video Player</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-4 h-4" />
                  <span>Buy Now (Razorpay API)</span>
                </>
              )}
            </button>

            {!isEnrolled && (
              <button
                onClick={() => addToCart(courseId)}
                disabled={isInCart}
                className={`w-full py-2.5 rounded-md border text-xs font-semibold flex items-center justify-center gap-2 transition ${
                  isInCart
                    ? 'bg-zinc-100 border-zinc-200 text-[#d33028]'
                    : 'bg-zinc-100 hover:bg-zinc-200 border-zinc-300 text-zinc-800'
                }`}
              >
                {isInCart ? 'Already in Cart' : 'Add to Cart'}
              </button>
            )}
          </div>

          <div className="pt-2 border-t border-zinc-200 text-[11px] text-zinc-500 space-y-2">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" />
              <span>Verified QR Certificate upon 100% completion</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Instant Server Verification via Webhook</span>
            </div>
          </div>
        </div>
      </div>

      {/* Free Video Preview Modal */}
      {previewVideoUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="max-w-3xl w-full bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-2xl">
            <div className="p-4 bg-zinc-50 border-b border-zinc-200 flex justify-between items-center">
              <h3 className="font-bold text-zinc-900 text-sm">Course Video Preview</h3>
              <button onClick={() => setPreviewVideoUrl(null)} className="text-zinc-500 hover:text-zinc-900">✕</button>
            </div>
            <div className="aspect-video bg-black">
              <video src={previewVideoUrl} controls autoPlay className="w-full h-full" />
            </div>
          </div>
        </div>
      )}

      <RazorpayModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        course={course}
        onSuccess={(payId) => {
          enrollUserInCourse(courseId, payId || `pay_${Date.now()}`, 'RAZORPAY');
          const firstLessonId = course.sections[0]?.lessons[0]?.id || 'les-1';
          router.push(`/watch/${course.slug}/${firstLessonId}`);
        }}
      />
    </div>
  );
}
