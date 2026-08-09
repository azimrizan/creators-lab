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
  const course = courses.find(c => c.slug === slug) || courses[0];
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

  return (
    <div className="bg-[#0B0B0B] text-white min-h-screen pb-24">
      {/* Cinematic Hero Header */}
      <section className="relative w-full min-h-[480px] pt-24 pb-16 flex items-center overflow-hidden border-b border-white/10">
        {/* Background Image / Backdrop */}
        <div className="absolute inset-0 z-0">
          <img
            src={course.thumbnail}
            alt={course.title}
            className="w-full h-full object-cover filter brightness-50"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B0B0B] via-[#0B0B0B]/70 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0B0B0B] via-[#0B0B0B]/80 to-transparent" />
        </div>

        <div className="relative z-10 max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12 grid grid-cols-1 lg:grid-cols-3 gap-8 items-center w-full">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <span className="bg-[#E50914]/20 text-red-300 text-xs font-bold px-3 py-1 rounded-md border border-[#E50914]/30 uppercase">
                {course.categoryName}
              </span>
              <span className="bg-[#1C1C1C] text-slate-300 text-xs font-semibold px-3 py-1 rounded-md border border-white/10">
                {course.level}
              </span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-white leading-tight">
              {course.title}
            </h1>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-2xl">
              {course.subtitle}
            </p>

            <div className="flex flex-wrap items-center gap-4 text-xs pt-2">
              <div className="flex items-center gap-1 text-amber-400 font-bold">
                <Star className="w-4 h-4 fill-amber-400" />
                <span>{course.rating}</span>
                <span className="text-[#B3B3B3] font-normal">({course.reviewCount} reviews)</span>
              </div>
              <div className="flex items-center gap-1 text-slate-300">
                <Users className="w-4 h-4 text-red-400" />
                <span>{course.studentCount.toLocaleString()} enrolled</span>
              </div>
              <div className="text-[#B3B3B3]">
                Instructor: <span className="text-white font-bold">{course.instructorName}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content & Sidebar Grid */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12 mt-10 grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
        {/* Left Column: Details & Curriculum */}
        <div className="lg:col-span-2 space-y-10">
          {/* What You Will Learn */}
          <div className="bg-[#141414] border border-white/10 p-6 rounded-xl space-y-4">
            <h2 className="text-lg font-bold text-white">What You'll Learn</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-300">
              {course.whatYouWillLearn.map((item, idx) => (
                <div key={idx} className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Curriculum Sections */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Course Curriculum</h2>
              <span className="text-xs text-[#B3B3B3]">
                {course.sections.length} Sections • {totalLessons} Lessons • {totalDurationMin} mins total
              </span>
            </div>

            <div className="border border-white/10 rounded-xl overflow-hidden divide-y divide-white/10 bg-[#141414]">
              {course.sections.map(section => (
                <div key={section.id} className="bg-[#141414]">
                  <button
                    onClick={() => toggleSection(section.id)}
                    className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition text-left"
                  >
                    <div className="flex items-center gap-3">
                      {expandedSections[section.id] ? (
                        <ChevronUp className="w-4 h-4 text-[#E50914]" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-[#B3B3B3]" />
                      )}
                      <span className="font-bold text-white text-xs">{section.title}</span>
                    </div>
                    <span className="text-[11px] text-[#B3B3B3]">{section.lessons.length} lessons</span>
                  </button>

                  {expandedSections[section.id] && (
                    <div className="divide-y divide-white/5 bg-[#0B0B0B]">
                      {section.lessons.map(lesson => (
                        <div key={lesson.id} className="p-3.5 pl-11 flex items-center justify-between text-xs hover:bg-white/5 transition">
                          <div className="flex items-center gap-3">
                            {lesson.contentType === 'VIDEO' && <Play className="w-3.5 h-3.5 text-red-400" />}
                            {lesson.contentType === 'PDF' && <FileText className="w-3.5 h-3.5 text-sky-400" />}
                            {lesson.contentType === 'QUIZ' && <HelpCircle className="w-3.5 h-3.5 text-amber-400" />}
                            <span className="text-slate-200">{lesson.title}</span>
                          </div>

                          <div className="flex items-center gap-3">
                            {lesson.isFreePreview && (
                              <button
                                onClick={() => setPreviewVideoUrl(lesson.videoUrl || course.previewVideoUrl)}
                                className="text-[10px] font-bold text-red-400 hover:underline bg-[#E50914]/10 px-2 py-0.5 rounded border border-[#E50914]/20"
                              >
                                Free Preview
                              </button>
                            )}
                            <span className="text-[11px] text-[#B3B3B3]">
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

          {/* Instructor Bio */}
          <div className="bg-[#141414] border border-white/10 p-6 rounded-xl space-y-4">
            <h2 className="text-lg font-bold text-white">Instructor Profile</h2>
            <div className="flex gap-4 items-start">
              <img
                src={course.instructorAvatar}
                alt={course.instructorName}
                className="w-14 h-14 rounded-full object-cover border border-white/20"
              />
              <div className="space-y-1">
                <h3 className="font-bold text-white text-base">{course.instructorName}</h3>
                <p className="text-xs text-red-400">{course.instructorTitle}</p>
                <p className="text-xs text-[#B3B3B3] pt-1 leading-relaxed">
                  Senior Full-Stack Engineer & Educator with 10+ years experience training over 50,000 developers worldwide.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sticky Pricing & Action Card */}
        <div className="bg-[#141414] border border-white/10 p-6 rounded-xl space-y-6 sticky top-24 shadow-2xl">
          {/* Card Media Preview */}
          <div className="relative aspect-video rounded-lg overflow-hidden bg-black group">
            <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
            <button
              onClick={() => setPreviewVideoUrl(course.previewVideoUrl)}
              className="absolute inset-0 bg-black/50 flex items-center justify-center group-hover:bg-black/40 transition"
            >
              <div className="w-12 h-12 rounded-full bg-[#E50914] text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition">
                <Play className="w-6 h-6 fill-current translate-x-0.5" />
              </div>
            </button>
          </div>

          {/* Price Header */}
          <div className="space-y-1">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-white">₹{course.discountPrice || course.price}</span>
              {course.discountPrice && (
                <span className="text-xs text-[#B3B3B3] line-through">₹{course.price}</span>
              )}
            </div>
            <p className="text-[11px] text-emerald-400 font-bold">100% Money Back Guarantee • Lifetime Access</p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleEnrollClick}
              className="w-full bg-[#E50914] hover:bg-[#b80710] text-white font-bold py-3 rounded-md transition shadow-lg flex items-center justify-center gap-2 text-xs"
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
                    ? 'bg-[#1C1C1C] border-white/20 text-red-300'
                    : 'bg-[#1C1C1C] hover:bg-white/10 border-white/15 text-white'
                }`}
              >
                {isInCart ? 'Already in Cart' : 'Add to Cart'}
              </button>
            )}
          </div>

          <div className="pt-2 border-t border-white/10 text-[11px] text-[#B3B3B3] space-y-2">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-400" />
              <span>Verified QR Certificate upon 100% completion</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Instant Server Verification via Webhook</span>
            </div>
          </div>
        </div>
      </div>

      {/* Free Video Preview Modal */}
      {previewVideoUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
          <div className="max-w-3xl w-full bg-[#1C1C1C] border border-white/15 rounded-xl overflow-hidden">
            <div className="p-4 bg-[#141414] border-b border-white/10 flex justify-between items-center">
              <h3 className="font-bold text-white text-sm">Course Video Preview</h3>
              <button onClick={() => setPreviewVideoUrl(null)} className="text-[#B3B3B3] hover:text-white">✕</button>
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
        onSuccess={() => router.push(`/watch/${course.slug}/${course.sections[0]?.lessons[0]?.id || 'les-1'}`)}
      />
    </div>
  );
}
