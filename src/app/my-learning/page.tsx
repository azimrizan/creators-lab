'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Play, Award, BookOpen, BarChart3, CalendarDays, Flame, Layers, Loader2, RefreshCw } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { getSafeThumbnail } from '@/lib/types';
import FlashcardDeck, { DeckCard } from '@/components/agents/FlashcardDeck';
import { agentGet, agentSend } from '@/components/agents/agentClient';

interface StudyPlanView {
  plan: {
    summary: string;
    nudge: string;
    sessions: Array<{ day: string; courseSlug: string; courseTitle: string; lessonIds: string[]; lessonTitles: string[]; minutes: number; focus: string }>;
  } | null;
  streakDays: number;
  activeDaysThisWeek: number;
  message?: string;
}

export default function MyLearningPage() {
  const { courses, currentUser, userProgress, certificates, hydrateCourseProgress } = useAppStore();
  const isGuest = currentUser.id === 'guest';

  const enrolledCourses = courses.filter(c =>
    currentUser.enrolledCourseIds.includes(c.id) ||
    currentUser.enrolledCourseIds.includes(c.slug) ||
    currentUser.enrolledCourseIds.includes((c as any)._id)
  );
  const enrolledKey = enrolledCourses.map(c => c.id).join(',');

  useEffect(() => {
    enrolledCourses.forEach(c => hydrateCourseProgress(c.id || c.slug));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enrolledKey, hydrateCourseProgress]);

  return (
    <div className="bg-[#FBFAFF] text-ink min-h-screen pt-24 sm:pt-28 pb-20">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 space-y-8">
        <div className="space-y-2">
          <span className="text-xs font-semibold tracking-[0.12em] text-ink-muted">MY LEARNING</span>
          <h1 className="font-display font-semibold text-[clamp(28px,3.2vw,40px)] leading-tight text-ink">
            {isGuest ? 'Your learning space' : `Welcome back, ${currentUser.name?.split(' ')[0] || 'Creator'}`}
          </h1>
          <p className="text-sm text-ink-muted">Your courses, this week&apos;s plan, and cards to review, all in one place.</p>
        </div>

        {!isGuest && (
          <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-6">
            <StudyCoachCard />
            <ReviewCard />
          </div>
        )}

        <section className="space-y-4">
          <h2 className="font-display font-semibold text-xl text-ink">Enrolled courses</h2>
          {enrolledCourses.length === 0 ? (
            <div className="bg-white border border-[#ECE9F5] rounded-3xl p-10 text-center space-y-4 max-w-md mx-auto">
              <BookOpen className="w-10 h-10 text-ink-muted mx-auto" />
              <div className="space-y-1">
                <h3 className="font-display font-semibold text-ink">No courses yet</h3>
                <p className="text-sm text-ink-muted">Browse the catalog, or ask the AI guide for a recommendation.</p>
              </div>
              <Link href="/courses" className="inline-flex items-center gap-2 btn-soft font-semibold text-sm px-6 h-11 rounded-full transition">
                Browse catalog
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {enrolledCourses.map((course, idx) => {
                const courseId = course.id || (course as any)._id || course.slug;
                const prog = userProgress[courseId] || { completedLessonIds: [], lastPositionSec: {} };
                const allLessons = course.sections.flatMap(s => s.lessons);
                const completedCount = allLessons.filter(l => prog.completedLessonIds.includes(l.id)).length;
                const percent = allLessons.length > 0 ? Math.round((completedCount / allLessons.length) * 100) : 0;
                const resumeLesson = allLessons.find(l => !prog.completedLessonIds.includes(l.id)) || allLessons[0];
                const certificate = certificates.find(c => c.courseId === courseId || (c as { courseSlug?: string }).courseSlug === course.slug);

                return (
                  <div key={courseId || `my-learn-${idx}`} className="bg-white border border-[#ECE9F5] rounded-[22px] overflow-hidden flex flex-col shadow-[0_10px_30px_-18px_rgba(23,20,43,0.25)]">
                    <div className="relative h-44 bg-lavender">
                      <img src={getSafeThumbnail(course.thumbnail, course.title, course.categoryName)} alt={course.title} className="w-full h-full object-cover" />
                      <Link
                        href={`/watch/${course.slug}/${resumeLesson?.id || 'les-1'}`}
                        aria-label={`Resume ${course.title}`}
                        className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition"
                      >
                        <span className="w-12 h-12 rounded-full bg-white text-ink flex items-center justify-center shadow-lg">
                          <Play className="w-5 h-5 fill-current translate-x-0.5" />
                        </span>
                      </Link>
                    </div>
                    <div className="p-5 flex-1 flex flex-col gap-3">
                      <div>
                        <h3 className="font-display font-semibold text-ink leading-snug line-clamp-2">{course.title}</h3>
                        <p className="text-[13px] text-ink-muted mt-0.5">By {course.instructorName}</p>
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="text-ink-muted">{completedCount}/{allLessons.length} lessons</span>
                          <span className="font-semibold text-ink">{percent}%</span>
                        </div>
                        <div className="w-full bg-lavender h-2 rounded-full overflow-hidden">
                          <div className="bg-brand h-full rounded-full transition-all duration-500" style={{ width: `${percent}%` }} />
                        </div>
                      </div>
                      <div className="mt-auto pt-3 border-t border-[#F0EEF6] flex flex-wrap gap-2">
                        <Link href={`/watch/${course.slug}/${resumeLesson?.id || 'les-1'}`} className="h-10 px-4 rounded-full btn-soft text-[13px] font-semibold inline-flex items-center gap-1.5 transition">
                          <Play className="w-3.5 h-3.5 fill-current" /> {percent === 100 ? 'Review' : 'Resume'}
                        </Link>
                        <Link href={`/my-learning/report/${course.slug}`} className="h-10 px-4 rounded-full bg-lavender hover:bg-[#E2E5FF] text-ink text-[13px] font-semibold inline-flex items-center gap-1.5 transition">
                          <BarChart3 className="w-3.5 h-3.5" /> Report
                        </Link>
                        {certificate ? (
                          <Link href="/certificates" className="h-10 px-4 rounded-full bg-[#FFF1E8] text-[#9A3412] text-[13px] font-semibold inline-flex items-center gap-1.5">
                            <Award className="w-3.5 h-3.5" /> Certificate
                          </Link>
                        ) : percent === 100 ? (
                          <Link href={`/exam/${course.slug}`} className="h-10 px-4 rounded-full bg-[#FFF1E8] text-[#9A3412] text-[13px] font-semibold inline-flex items-center gap-1.5">
                            <Award className="w-3.5 h-3.5" /> Final exam
                          </Link>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function StudyCoachCard() {
  const [data, setData] = useState<StudyPlanView | null>(null);
  const [isBuilding, setIsBuilding] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    agentGet<StudyPlanView>('/api/ai/coach').then(setData).catch(err => setError(err.message));
  }, []);

  const build = async () => {
    setIsBuilding(true);
    setError('');
    try {
      setData(await agentSend<StudyPlanView>('/api/ai/coach', {}));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not build a plan.');
    } finally {
      setIsBuilding(false);
    }
  };

  return (
    <section className="bg-white border border-[#ECE9F5] rounded-3xl p-6 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="w-11 h-11 rounded-2xl bg-lavender text-ink flex items-center justify-center"><CalendarDays className="w-5 h-5" /></span>
          <div>
            <h2 className="font-display font-semibold text-ink">This week&apos;s plan</h2>
            <p className="text-xs text-ink-muted">Built by your AI study coach</p>
          </div>
        </div>
        {data && (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#9A3412] bg-[#FFF1E8] rounded-full px-2.5 py-1">
            <Flame className="w-3.5 h-3.5" /> {data.streakDays}-day streak
          </span>
        )}
      </div>

      {error && <p className="text-sm text-amber-900">{error}</p>}
      {data?.message && <p className="text-sm text-ink-muted">{data.message}</p>}

      {data?.plan ? (
        <>
          <p className="text-sm text-ink-body">{data.plan.summary}</p>
          <ul className="space-y-2">
            {data.plan.sessions.map((s, i) => (
              <li key={i} className="flex gap-3 rounded-2xl bg-[#FBFAFF] border border-[#ECE9F5] p-3">
                <span className="w-12 shrink-0 text-center">
                  <span className="block font-display font-semibold text-ink">{s.day}</span>
                  <span className="block text-[11px] text-ink-muted">{s.minutes} min</span>
                </span>
                <span className="min-w-0">
                  <Link href={`/watch/${s.courseSlug}/${s.lessonIds[0]}`} className="block text-sm font-semibold text-ink hover:underline truncate">{s.lessonTitles.join(', ')}</Link>
                  <span className="block text-xs text-ink-muted truncate">{s.courseTitle}</span>
                  <span className="block text-xs text-ink-body mt-0.5">{s.focus}</span>
                </span>
              </li>
            ))}
          </ul>
          {data.plan.nudge && <p className="text-sm text-ink-body italic">{data.plan.nudge}</p>}
        </>
      ) : (
        !data?.message && <p className="text-sm text-ink-muted">Get a realistic schedule for the week based on your goals and the time you have.</p>
      )}

      <button onClick={build} disabled={isBuilding} className="h-10 px-4 rounded-full border border-[#E2DEEF] text-sm font-semibold text-ink inline-flex items-center gap-2 hover:bg-[#FBFAFF] disabled:opacity-50">
        {isBuilding ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />} {data?.plan ? 'Rebuild plan' : 'Build my plan'}
      </button>
    </section>
  );
}

function ReviewCard() {
  const [cards, setCards] = useState<DeckCard[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    agentGet<{ cards: DeckCard[] }>('/api/ai/revision?due=1').then(d => setCards(d.cards)).catch(err => { setError(err.message); setCards([]); });
  }, []);

  return (
    <section id="review" className="bg-white border border-[#ECE9F5] rounded-3xl p-6 space-y-4 scroll-mt-28">
      <div className="flex items-center gap-3">
        <span className="w-11 h-11 rounded-2xl bg-[#FFF1E8] text-[#C2410C] flex items-center justify-center"><Layers className="w-5 h-5" /></span>
        <div>
          <h2 className="font-display font-semibold text-ink">Review today</h2>
          <p className="text-xs text-ink-muted">{cards ? `${cards.length} card${cards.length === 1 ? '' : 's'} due` : 'Loading…'}</p>
        </div>
      </div>
      {error && <p className="text-sm text-amber-900">{error}</p>}
      {cards && <FlashcardDeck cards={cards} canGrade emptyText="Nothing due. Finish a lesson to unlock its flashcards." />}
    </section>
  );
}
