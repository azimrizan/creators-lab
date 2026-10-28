'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  Sparkles,
  Star,
  BookOpen,
  Play,
  Award,
  MessageSquareText,
  MonitorPlay,
  Clock,
  Quote
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { MOCK_CATEGORIES, MOCK_REVIEWS } from '@/lib/mockData';
import CourseCard from '@/components/CourseCard';
import { DisciplineMarquee, AiAgentBanner, CertificateBanner } from '@/components/HomeBanners';

const HERO_IMG = '/hero-robot.png';

// Short tab labels for the course category filter
const TAB_LABELS: Record<string, string> = {
  'cinematography-directing': 'Cinematography',
  'photography-visual-arts': 'Photography',
  'video-editing-color-grading': 'Editing & Color',
  'motion-design-3d-vfx': '3D & Motion',
  'music-production-audio': 'Music & Sound',
  'creative-direction-design': 'Design'
};

const FEATURES = [
  { icon: MessageSquareText, title: 'AI Learning Agent', text: 'Ask questions mid-lesson, get quizzes and progress reports.' },
  { icon: Award, title: 'Verifiable Certificates', text: 'Each certificate has a public verification link.' },
  { icon: MonitorPlay, title: 'HD Lesson Streaming', text: 'Theater-mode player with resources and notes.' },
  { icon: Clock, title: 'Lifetime Access', text: 'Learn at your own pace and rewatch any lesson.' }
] as const;

const AVATAR_TONES = [
  'bg-[#E4E6FF] text-[#3D47D6]',
  'bg-[#EDE9FF] text-[#5B4FE0]',
  'bg-[#DFE6FF] text-[#3240B8]'
];

const initialsOf = (name: string) => {
  const parts = name.trim().split(/\s+/);
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
};

function SectionHeading({ eyebrow, title, center = false }: { eyebrow: string; title: React.ReactNode; center?: boolean }) {
  return (
    <div className={`flex flex-col gap-3 ${center ? 'items-center text-center' : ''}`}>
      <span className="text-xs font-semibold tracking-[0.14em] text-brand">{eyebrow}</span>
      <h2 className="font-display font-semibold text-[clamp(28px,3.2vw,42px)] leading-[1.15] tracking-[-0.02em] text-ink">
        {title}
      </h2>
    </div>
  );
}

export default function HomePage() {
  const router = useRouter();
  const { courses, currentUser } = useAppStore();
  const [activeTab, setActiveTab] = useState('all');

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

  const featuredCourse = courses[0];

  const enrolledCourses = courses.filter(c =>
    currentUser.enrolledCourseIds.includes(c.id) || currentUser.enrolledCourseIds.includes(c.slug)
  );

  const trendingCourses = useMemo(
    () => courses.slice().sort((a, b) => b.studentCount - a.studentCount),
    [courses]
  );

  // Only show category tabs that actually have courses
  const tabs = useMemo(() => {
    const withCourses = MOCK_CATEGORIES.filter(cat =>
      courses.some(c => c.categoryId === cat.id || c.categoryName === cat.name)
    );
    return [
      { id: 'all', label: 'All Courses', slug: '' },
      ...withCourses.map(cat => ({ id: cat.id, label: TAB_LABELS[cat.slug] || cat.name, slug: cat.slug }))
    ];
  }, [courses]);

  const activeCategory = MOCK_CATEGORIES.find(cat => cat.id === activeTab);
  const shownCourses = activeCategory
    ? trendingCourses.filter(c => c.categoryId === activeCategory.id || c.categoryName === activeCategory.name).slice(0, 6)
    : trendingCourses.slice(0, 6);

  const stats = useMemo(() => {
    const totalStudents = courses.reduce((sum, c) => sum + (c.studentCount || 0), 0);
    const disciplines = new Set(courses.map(c => c.categoryName).filter(Boolean)).size;
    const mentorNames = new Set(
      courses.flatMap(c => (c.instructorName || '').split('&').map(n => n.trim())).filter(Boolean)
    );
    return [
      { value: `${totalStudents.toLocaleString('en-IN')}+`, label: 'Total Students' },
      { value: String(courses.length), label: 'Masterclasses' },
      { value: String(disciplines), label: 'Creative Disciplines' },
      { value: String(mentorNames.size), label: 'Expert Mentors' }
    ];
  }, [courses]);

  const lowestPrice = courses.length
    ? Math.min(...courses.map(c => c.discountPrice || c.price))
    : null;

  // One card per solo instructor (co-taught courses are skipped)
  const mentors = useMemo(() => {
    const seen = new Map<string, { name: string; title: string }>();
    courses.forEach(c => {
      if (c.instructorName && !c.instructorName.includes('&') && !seen.has(c.instructorName)) {
        seen.set(c.instructorName, { name: c.instructorName, title: c.instructorTitle });
      }
    });
    return Array.from(seen.values()).slice(0, 6);
  }, [courses]);

  const reviews = MOCK_REVIEWS.map(r => ({
    ...r,
    courseTitle: courses.find(c => c.id === r.courseId)?.title
  }));

  return (
    <div className="bg-white text-ink min-h-screen font-sans antialiased">

      {/* Hero */}
      <section className="glow-hero relative overflow-hidden pt-[72px] sm:pt-[88px]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 pt-14 sm:pt-[72px] pb-14 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="flex flex-col gap-6">
            <span className="glass self-start inline-flex items-center gap-2 text-xs font-semibold tracking-[0.14em] text-brand px-4 py-2 rounded-full">
              <Sparkles className="w-3.5 h-3.5" />
              LEARN THE CRAFT
            </span>
            <h1 className="font-display font-semibold text-[clamp(36px,4.6vw,58px)] leading-[1.12] tracking-[-0.02em] text-ink">
              Master the Skills That Push Your <span className="text-gradient">Creative Career</span> Forward
            </h1>
            <p className="text-[17px] leading-[1.65] text-ink-body max-w-[520px]">
              Cinematography, color grading, 3D, sound and design — taught by working professionals, with an AI learning agent beside every lesson.
            </p>
            <div className="flex flex-wrap gap-3 pt-1">
              <Link
                href="/courses"
                className="btn-soft inline-flex items-center gap-2 font-semibold text-[15px] px-7 py-[15px] rounded-full"
              >
                <BookOpen className="w-4 h-4" />
                Explore Courses
                <ArrowRight className="w-4 h-4" />
              </Link>
              {featuredCourse && (
                <Link
                  href={`/course/${featuredCourse.slug}`}
                  className="glass-strong inline-flex items-center gap-2.5 text-ink hover:text-brand font-semibold text-[15px] px-6 py-[15px] rounded-full transition"
                >
                  <span className="w-[26px] h-[26px] rounded-full btn-soft inline-flex items-center justify-center">
                    <Play className="w-3 h-3 fill-current" />
                  </span>
                  Watch Free Lesson
                </Link>
              )}
            </div>
          </div>

          <div className="relative flex justify-center items-center min-h-[380px] sm:min-h-[460px]">
            <div className="glow-blob absolute w-[520px] h-[520px] max-w-[110%] rounded-full" />
            <div className="glass absolute opacity-70 w-[340px] h-[340px] sm:w-[400px] sm:h-[400px] max-w-[90%] rounded-full" />
            <img
              src={HERO_IMG}
              alt="Creators Lab robot filming with a camera on a tripod"
              className="relative w-auto max-w-[85%] h-[340px] sm:h-[440px] object-contain drop-shadow-[0_30px_40px_rgba(76,50,214,0.35)]"
            />
            <div className="glass-strong animate-float absolute left-0 bottom-8 sm:bottom-12 rounded-[18px] px-4 py-3.5 flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl bg-lavender text-brand flex items-center justify-center">
                <Award className="w-5 h-5" />
              </span>
              <div>
                <div className="font-display font-semibold text-sm">Verified Certificates</div>
                <div className="text-xs text-ink-muted">On every completed course</div>
              </div>
            </div>
            <div className="glass-strong animate-float-slow absolute right-0 top-6 sm:top-10 rounded-[18px] px-4 py-3 flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl btn-soft flex items-center justify-center">
                <Star className="w-5 h-5 fill-current" />
              </span>
              <div>
                <div className="font-display font-semibold text-sm">4.8 Avg. Rating</div>
                <div className="text-xs text-ink-muted">From real learners</div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Strip */}
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 pb-16">
          <div className="glass rounded-3xl px-4 py-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center md:divide-x md:divide-white/70">
            {stats.map(stat => (
              <div key={stat.label}>
                <div className="font-display font-semibold text-[28px] sm:text-[36px] text-gradient">{stat.value}</div>
                <div className="text-sm text-ink-muted mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <DisciplineMarquee />

      {/* Continue Learning (if enrolled) */}
      {enrolledCourses.length > 0 && (
        <section className="glow-left">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 pt-20 flex flex-col gap-8">
            <SectionHeading eyebrow="PICK UP WHERE YOU LEFT OFF" title={`Continue Learning, ${currentUser.name?.split(' ')[0] || 'Creator'}`} />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {enrolledCourses.slice(0, 3).map((course, idx) => (
                <CourseCard key={course.id || (course as any)._id || `cont-${idx}`} course={course} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Top Courses */}
      <section className="glow-left">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-20 sm:py-[88px] flex flex-col gap-8">
          <div className="flex flex-wrap justify-between items-end gap-4">
            <SectionHeading eyebrow="OUR TOP COURSES" title={<>Learn. Create. Get Hired<br />with Creators Lab</>} />
            <Link
              href={activeCategory ? `/courses?category=${activeCategory.slug}` : '/courses'}
              className="inline-flex items-center gap-1.5 py-3 text-[15px] font-semibold text-ink hover:gap-2.5 transition-all"
            >
              View all courses
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div role="tablist" aria-label="Course categories" className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {tabs.map(tab => {
              const isOn = tab.id === activeTab;
              return (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={isOn}
                  onClick={() => setActiveTab(tab.id)}
                  className={`shrink-0 h-11 px-5 rounded-full text-sm font-semibold border transition ${
                    isOn
                      ? 'btn-soft border-transparent'
                      : 'glass text-[#3F3B57] hover:text-brand'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {shownCourses.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {shownCourses.map((course, idx) => (
                <CourseCard key={course.id || (course as any)._id || `top-${idx}`} course={course} />
              ))}
            </div>
          ) : (
            <p className="text-center text-ink-muted py-16">New courses in this category are coming soon.</p>
          )}

          <div className="flex justify-center">
            <Link
              href="/courses"
              className="btn-soft inline-flex items-center gap-2 font-semibold text-[15px] px-8 py-[15px] rounded-full"
            >
              View All Courses
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      <AiAgentBanner />

      {/* Why Creators Lab */}
      <section className="glow-soft">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-20 sm:py-24 grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
          <div className="flex flex-col gap-5">
            <SectionHeading eyebrow="WHY CREATORS LAB" title="Empowering Creators with Skills That Ship" />
            <p className="text-base leading-[1.7] text-ink-body">
              Every course is built around real productions — the same lenses, nodes, timelines and mixes the pros use. Learn at your own pace, test yourself with AI-generated quizzes, and walk away with a certificate anyone can verify.
            </p>
            <Link
              href="/courses"
              className="btn-soft self-start font-semibold text-[15px] px-7 py-[15px] rounded-full"
            >
              Browse All Courses
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <div key={title} className="glass rounded-[20px] p-6 flex flex-col gap-3 transition hover:-translate-y-1">
                <span className="w-12 h-12 rounded-[14px] flex items-center justify-center bg-lavender text-brand">
                  <Icon className="w-[22px] h-[22px]" />
                </span>
                <h3 className="font-display font-semibold text-[17px] text-ink">{title}</h3>
                <p className="text-sm leading-[1.6] text-ink-muted">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <CertificateBanner lowestPrice={lowestPrice} />

      {/* Testimonials */}
      {reviews.length > 0 && (
        <section className="glow-left">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-20 sm:py-24 flex flex-col gap-10">
            <SectionHeading eyebrow="WHAT CREATORS SAY" title="Our Students' Words" center />
            <div className="flex flex-wrap gap-6 justify-center">
              {reviews.map(review => (
                <figure key={review.id} className="glass rounded-[22px] p-7 flex flex-col gap-5 w-full md:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)]">
                  <Quote className="w-8 h-8 text-[#A99BFF] fill-[#A99BFF]" />
                  <blockquote className="text-[15px] leading-[1.7] text-[#2E2A45]">{review.comment}</blockquote>
                  <figcaption className="flex items-center gap-3 mt-auto">
                    <img src={review.userAvatar} alt={review.userName} className="w-11 h-11 rounded-full object-cover ring-2 ring-white" />
                    <span>
                      <span className="block font-semibold text-sm text-ink">{review.userName}</span>
                      {review.courseTitle && (
                        <span className="block text-[13px] text-ink-muted line-clamp-1">{review.courseTitle}</span>
                      )}
                    </span>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Mentors */}
      {mentors.length > 0 && (
        <section className="glow-soft">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-20 sm:py-24 flex flex-col gap-10">
            <SectionHeading eyebrow="OUR MENTORS" title={<>Learn Fast with<br />Working Professionals</>} />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {mentors.map((mentor, idx) => (
                <div key={mentor.name} className="glass rounded-[20px] p-5 flex items-center gap-4 transition hover:-translate-y-1">
                  <span className={`shrink-0 w-16 h-16 rounded-full flex items-center justify-center font-display font-semibold text-xl ring-4 ring-white/80 ${AVATAR_TONES[idx % AVATAR_TONES.length]}`}>
                    {initialsOf(mentor.name)}
                  </span>
                  <div className="min-w-0">
                    <div className="font-display font-semibold text-base text-ink">{mentor.name}</div>
                    <div className="text-[13px] leading-[1.5] text-ink-muted">{mentor.title}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="glow-left">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-20 sm:py-[88px]">
          <div className="panel-soft relative overflow-hidden rounded-[32px] px-8 sm:px-10 py-12 sm:py-14 flex flex-wrap justify-between items-center gap-6">
            <div className="flex flex-col gap-2.5 max-w-[620px]">
              <h2 className="font-display font-semibold text-[clamp(26px,3vw,38px)] leading-[1.2] text-ink">
                Start your first masterclass today
              </h2>
              <p className="text-base leading-[1.6] text-ink-body">
                {lowestPrice ? `Courses from ₹${lowestPrice} · ` : ''}Lifetime access · Certificate included
              </p>
            </div>
            <Link
              href="/courses"
              className="btn-soft font-semibold text-[15px] px-8 py-4 rounded-full"
            >
              Get Started
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
