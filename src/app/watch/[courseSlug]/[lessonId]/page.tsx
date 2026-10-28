'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Play, CheckCircle2, FileText, HelpCircle, Download, Send, ChevronLeft, ChevronRight, Sparkles, BookOpen, MessageSquare } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { MOCK_QA } from '@/lib/mockData';
import { QuizQuestion } from '@/lib/types';

import UnifiedAgentPanel, { AgentPanelTab } from '@/components/UnifiedAgentPanel';
import CheckpointOverlay, { LearnerCheckpoint } from '@/components/agents/CheckpointOverlay';
import DubbedAudio from '@/components/DubbedAudio';
import { agentGet, agentSend } from '@/components/agents/agentClient';

const PROGRESS_SYNC_SECONDS = 15;

interface QuizResult {
  scorePercent: number;
  passed: boolean;
  passingScorePercent: number;
  correctCount: number;
  totalQuestions: number;
  questionResults: Array<{ questionId: string; userSelected: number; correctOptionIndex: number; isCorrect: boolean; explanation: string }>;
}

export default function WatchLessonPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseSlug = params.courseSlug as string;
  const lessonId = params.lessonId as string;

  const { courses, currentUser, userProgress, markLessonComplete, updateWatchPosition, hydrateCourseProgress } = useAppStore();
  const isGuest = currentUser.id === 'guest';

  const course = courses.find(c => c.slug === courseSlug || c.id === courseSlug) || courses.find(c => c.slug === 'introduction-to-visual-storytelling') || courses[0];
  const courseId = course.id || (course as any)._id || course.slug;
  const allLessons = course.sections.flatMap(s => s.lessons);
  const currentLesson = allLessons.find(l => l.id === lessonId) || allLessons[0];
  const currentSection = course.sections.find(s => s.lessons.some(l => l.id === currentLesson.id));
  const lessonVideoUrl = currentLesson.videoUrl || course.previewVideoUrl || '/vidssave.com Visual Storytelling 101 480P.mp4';

  // Lesson quiz state (graded on the server; answers never reach the browser)
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
  const [isQuizSubmitting, setIsQuizSubmitting] = useState(false);
  const [quizError, setQuizError] = useState('');


  const quizSubmitted = Boolean(quizResult);
  const totalQuizQuestions = currentLesson.quiz?.questions.length || 0;
  const quizCorrectCount = quizResult?.correctCount || 0;
  const quizScorePercent = quizResult?.scorePercent || 0;
  const isQuizPassed = Boolean(quizResult?.passed);
  const resultFor = (questionId: string) => quizResult?.questionResults.find(r => r.questionId === questionId);

  // Q&A State
  const [qaList, setQaList] = useState(MOCK_QA);
  const [newQuestionText, setNewQuestionText] = useState('');

  // Right Column Active View ('curriculum' | 'overview' | 'discussion' | 'agent')
  type ActiveSection = 'curriculum' | 'overview' | 'discussion' | 'agent';
  const [activeSection, setActiveSection] = useState<ActiveSection>('curriculum');
  const [agentTab, setAgentTab] = useState<AgentPanelTab>('tutor');
  const [initialAgentPrompt, setInitialAgentPrompt] = useState<string | undefined>(undefined);

  const videoRef = useRef<HTMLVideoElement>(null);
  const progress = userProgress[courseId] || { completedLessonIds: [], lastPositionSec: {} };
  const isCompleted = progress.completedLessonIds.includes(currentLesson.id);

  const currentIndex = allLessons.findIndex(l => l.id === currentLesson.id);
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;
  const completedCount = progress.completedLessonIds.length;
  const progressPercent = allLessons.length > 0 ? Math.round((completedCount / allLessons.length) * 100) : 0;

  // In-video checkpoints (pause points with questions)
  const [checkpoints, setCheckpoints] = useState<LearnerCheckpoint[]>([]);
  const [activeCheckpointId, setActiveCheckpointId] = useState<string | null>(null);
  const activeCheckpoint = checkpoints.find(c => c.id === activeCheckpointId) || null;

  // Reset per-lesson state when the learner moves to another lesson
  const [stateLessonId, setStateLessonId] = useState(currentLesson.id);
  if (stateLessonId !== currentLesson.id) {
    setStateLessonId(currentLesson.id);
    setQuizResult(null);
    setQuizAnswers({});
    setQuizError('');
    setCheckpoints([]);
    setActiveCheckpointId(null);
  }

  // Progress tracking between server syncs
  const watchedSinceSync = useRef(0);
  const lastTickTime = useRef(0);
  const lastSyncAt = useRef(0);
  const positionBeforeSeek = useRef(0);

  useEffect(() => {
    hydrateCourseProgress(courseId);
  }, [courseId, currentUser.id, hydrateCourseProgress]);

  useEffect(() => {
    if (currentLesson.contentType !== 'VIDEO') return;
    agentGet<{ checkpoints: LearnerCheckpoint[] }>(`/api/ai/checkpoints?courseId=${encodeURIComponent(course.slug)}&lessonId=${encodeURIComponent(currentLesson.id)}`)
      .then(data => setCheckpoints(data.checkpoints))
      .catch(() => {});
  }, [course.slug, currentLesson.id, currentLesson.contentType]);

  const syncProgress = useCallback((extra: Record<string, unknown> = {}) => {
    if (isGuest) return;
    const video = videoRef.current;
    const watchedDelta = Math.round(watchedSinceSync.current);
    watchedSinceSync.current = 0;
    lastSyncAt.current = Date.now();
    fetch('/api/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        courseId,
        lessonId: currentLesson.id,
        positionSec: video ? Math.floor(video.currentTime) : undefined,
        durationSec: video && Number.isFinite(video.duration) ? Math.floor(video.duration) : undefined,
        watchedDelta,
        ...extra
      })
    }).catch(() => {});
  }, [isGuest, courseId, currentLesson.id]);

  // Save progress when leaving the lesson
  useEffect(() => {
    return () => {
      if (watchedSinceSync.current > 1) syncProgress();
    };
  }, [syncProgress]);

  // Resume: ?t= from a tutor/report link wins over the saved position
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const t = Number(searchParams.get('t'));
    const start = Number.isFinite(t) && t > 0 ? t : progress.lastPositionSec[currentLesson.id] || 0;
    if (start > 0) {
      const apply = () => { video.currentTime = start; positionBeforeSeek.current = start; };
      if (video.readyState >= 1) apply();
      else video.addEventListener('loadedmetadata', apply, { once: true });
    }
    lastTickTime.current = start;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentLesson.id]);

  const firstOpenCheckpoint = checkpoints.find(c => !c.cleared) || null;

  // Keep the video paused while a checkpoint is open, even if playback is resumed from the
  // keyboard, media keys, headphones or the browser's media controls.
  const checkpointOpenRef = useRef(false);
  useEffect(() => {
    checkpointOpenRef.current = false;
    const video = videoRef.current;
    if (!video) return;
    const holdPause = () => { if (checkpointOpenRef.current) video.pause(); };
    video.addEventListener('play', holdPause);
    return () => video.removeEventListener('play', holdPause);
  }, [currentLesson.id]);

  const openCheckpoint = (checkpoint: LearnerCheckpoint) => {
    const video = videoRef.current;
    if (video) {
      video.pause();
      if (video.currentTime > checkpoint.atSec + 1) video.currentTime = checkpoint.atSec;
    }
    checkpointOpenRef.current = true;
    setActiveCheckpointId(checkpoint.id);
  };

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;
    const current = video.currentTime;

    // Count real playback time (ignore jumps from seeking)
    const delta = current - lastTickTime.current;
    if (delta > 0 && delta < 2 && !video.paused) watchedSinceSync.current += delta;
    lastTickTime.current = current;
    if (!video.seeking) positionBeforeSeek.current = current;

    updateWatchPosition(courseId, currentLesson.id, Math.floor(current));
    if (Date.now() - lastSyncAt.current > PROGRESS_SYNC_SECONDS * 1000 && watchedSinceSync.current > 0) syncProgress();

    // Pause at the next checkpoint the learner hasn't cleared
    if (firstOpenCheckpoint && !activeCheckpointId && current >= firstOpenCheckpoint.atSec) {
      openCheckpoint(firstOpenCheckpoint);
    }

    // Auto mark completed at 90%
    const duration = video.duration;
    if (duration && current / duration >= 0.9 && !isCompleted && !firstOpenCheckpoint) {
      markLessonComplete(courseId, currentLesson.id);
    }
  };

  // Learners can't skip past a checkpoint they haven't answered; rewatches and skips are recorded for reports.
  const handleSeeked = () => {
    const video = videoRef.current;
    if (!video) return;
    const from = positionBeforeSeek.current;
    if (firstOpenCheckpoint && video.currentTime > firstOpenCheckpoint.atSec + 0.5) {
      openCheckpoint(firstOpenCheckpoint);
      return;
    }
    lastTickTime.current = video.currentTime;
    if (Math.abs(video.currentTime - from) > 5) syncProgress({ seek: { fromSec: from, toSec: video.currentTime } });
    positionBeforeSeek.current = video.currentTime;
  };

  const handleCheckpointComplete = () => {
    setCheckpoints(prev => prev.map(c => (c.id === activeCheckpointId ? { ...c, cleared: true, questions: c.questions.map(q => ({ ...q, answered: true })) } : c)));
    setActiveCheckpointId(null);
    checkpointOpenRef.current = false;
    videoRef.current?.play().catch(() => {});
  };

  const handleCheckpointRewatch = (seconds: number) => {
    setCheckpoints(prev => prev.map(c => (c.id === activeCheckpointId ? { ...c, cleared: true, questions: c.questions.map(q => ({ ...q, answered: true })) } : c)));
    setActiveCheckpointId(null);
    checkpointOpenRef.current = false;
    const video = videoRef.current;
    if (video) {
      syncProgress({ seek: { fromSec: video.currentTime, toSec: seconds } });
      video.currentTime = seconds;
      lastTickTime.current = seconds;
      positionBeforeSeek.current = seconds;
      video.play().catch(() => {});
    }
  };

  // Jump the player (from tutor timestamps, sources, flashcards, report steps)
  const seekTo = useCallback((seconds: number, targetLessonId?: string) => {
    if (targetLessonId && targetLessonId !== currentLesson.id) {
      router.push(`/watch/${course.slug}/${targetLessonId}${seconds > 0 ? `?t=${Math.floor(seconds)}` : ''}`);
      return;
    }
    const video = videoRef.current;
    if (!video) return;
    const barrier = checkpoints.find(c => !c.cleared);
    video.currentTime = barrier && seconds > barrier.atSec ? barrier.atSec : seconds;
    video.play().catch(() => {});
  }, [currentLesson.id, course.slug, router, checkpoints]);

  const getCurrentTime = useCallback(() => videoRef.current?.currentTime || 0, []);

  // Video completion: open revision for this lesson (or progress/exam after the last lesson)
  const handleVideoEnded = () => {
    syncProgress({ isCompleted: true });
    markLessonComplete(courseId, currentLesson.id);
    setAgentTab(nextLesson ? 'revise' : 'progress');
    setActiveSection('agent');
  };

  const handleOpenAgentChat = (prompt?: string) => {
    if (prompt) setInitialAgentPrompt(prompt);
    setAgentTab('tutor');
    setActiveSection('agent');
  };

  const handleOpenAgentTab = (tab: AgentPanelTab) => {
    setAgentTab(tab);
    setActiveSection('agent');
  };

  const handleCloseAgentPanel = () => {
    setActiveSection('curriculum');
  };

  const handlePostQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestionText.trim()) return;

    const newQa = {
      id: `qa-${Date.now()}`,
      lessonId: currentLesson.id,
      userId: currentUser.id,
      userName: currentUser.name,
      userAvatar: currentUser.avatar,
      isInstructor: false,
      question: newQuestionText,
      createdAt: 'Just now',
      replies: []
    };

    setQaList([newQa, ...qaList]);
    setNewQuestionText('');
  };

  const handleQuizSubmit = async () => {
    if (!currentLesson.quiz) return;
    setIsQuizSubmitting(true);
    setQuizError('');
    try {
      const data = await agentSend<QuizResult>(`/api/quizzes/${currentLesson.quiz.id}/submit`, { answers: quizAnswers, courseId: course.slug, lessonId: currentLesson.id });
      setQuizResult(data);
      if (data.passed) markLessonComplete(courseId, currentLesson.id);
    } catch (err) {
      setQuizError(err instanceof Error ? err.message : 'Could not submit the quiz.');
    } finally {
      setIsQuizSubmitting(false);
    }
  };

  return (
    <div className="h-screen max-h-screen bg-white text-zinc-900 flex flex-col pt-[72px] sm:pt-[88px] font-sans overflow-hidden">
      {/* Top Header / Player Controls */}
      <header className="h-14 sm:h-16 bg-white border-b border-zinc-200 px-4 sm:px-6 flex items-center justify-between text-xs z-20 shrink-0 shadow-sm">
        {/* Left: Back & Course Hierarchy */}
        <div className="flex items-center gap-3 min-w-0">
          <Link 
            href={`/course/${course.slug}`} 
            title="Back to Course Details"
            className="p-2 rounded-full text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="truncate min-w-0 flex items-center gap-2">
            <span className="font-bold text-zinc-900 truncate text-xs sm:text-sm">{course.title}</span>
            <span className="text-zinc-300 hidden sm:inline">•</span>
            <span className="text-brand font-semibold truncate hidden md:inline">{currentLesson.title}</span>
          </div>
        </div>

        {/* Right: Lesson Navigation, AI Agent Toggle, Mark Complete */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Prev / Next Lesson Navigation */}
          <div className="hidden sm:flex items-center border border-zinc-200 rounded-lg overflow-hidden bg-zinc-50 shadow-sm">
            {prevLesson ? (
              <Link
                href={`/watch/${course.slug}/${prevLesson.id}`}
                className="px-2.5 py-1.5 hover:bg-zinc-100 text-zinc-700 flex items-center gap-1 transition text-[11px] font-medium border-r border-zinc-200"
                title={`Previous: ${prevLesson.title}`}
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Prev</span>
              </Link>
            ) : (
              <span className="px-2.5 py-1.5 text-zinc-300 flex items-center gap-1 text-[11px] font-medium border-r border-zinc-200 cursor-not-allowed">
                <ChevronLeft className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Prev</span>
              </span>
            )}

            {nextLesson ? (
              <Link
                href={`/watch/${course.slug}/${nextLesson.id}`}
                className="px-2.5 py-1.5 hover:bg-zinc-100 text-zinc-700 flex items-center gap-1 transition text-[11px] font-medium"
                title={`Next: ${nextLesson.title}`}
              >
                <span className="hidden md:inline">Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <span className="px-2.5 py-1.5 text-zinc-300 flex items-center gap-1 text-[11px] font-medium cursor-not-allowed">
                <span className="hidden md:inline">Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </span>
            )}
          </div>

          {/* Ask AI Agent Button */}
          <button
            onClick={() => handleOpenAgentChat()}
            className={`px-3 sm:px-3.5 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-2 border shadow-sm ${
              activeSection === 'agent'
                ? 'btn-soft'
                : 'bg-white hover:bg-zinc-50 border-zinc-300 text-zinc-800'
            }`}
          >
            <img src="/agent-icon.png" alt="AI Agent" className="w-4 h-4 sm:w-5 sm:h-5 object-contain" />
            <span className="hidden sm:inline">Ask AI Agent</span>
            <span className="sm:hidden">AI</span>
          </button>

          {/* Mark Complete Button */}
          <button
            onClick={() => markLessonComplete(courseId, currentLesson.id)}
            className={`px-3 sm:px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shadow-sm ${
              isCompleted
                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                : 'btn-soft hover:bg-brand-hover'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isCompleted ? 'Completed ✓' : 'Mark Complete'}</span>
          </button>
        </div>
      </header>

      {/* Main Integrated Theater Grid */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Column: Video Theater Player & Tabs */}
        <div className="flex-1 flex flex-col overflow-y-auto min-h-0 bg-zinc-50/50">
          {/* Dynamic Playing Window (Video Player, PDF Resource, or Interactive Assessment Window) */}
          {currentLesson.contentType === 'VIDEO' && (
            <div className="relative aspect-video max-h-[62vh] w-full bg-black flex items-center justify-center border-b border-zinc-200 shadow-sm shrink-0 overflow-hidden">
              <video
                ref={videoRef}
                src={lessonVideoUrl}
                controls
                autoPlay
                onTimeUpdate={handleTimeUpdate}
                onSeeked={handleSeeked}
                onPause={() => { if (watchedSinceSync.current > 1) syncProgress(); }}
                onEnded={handleVideoEnded}
                className="w-full h-full object-contain"
              />
              <DubbedAudio videoRef={videoRef} videoUrl={lessonVideoUrl} hidden={Boolean(activeCheckpoint)} />
              {activeCheckpoint && (
                <CheckpointOverlay
                  key={activeCheckpoint.id}
                  checkpoint={activeCheckpoint}
                  checkpointNumber={checkpoints.findIndex(c => c.id === activeCheckpoint.id) + 1}
                  totalCheckpoints={checkpoints.length}
                  onRewatch={handleCheckpointRewatch}
                  onComplete={handleCheckpointComplete}
                />
              )}
              {checkpoints.length > 0 && !activeCheckpoint && (
                <span className="absolute top-3 left-3 z-10 text-[11px] font-semibold text-white bg-black/55 backdrop-blur-sm rounded-full px-3 py-1.5 pointer-events-none">
                  {checkpoints.filter(c => c.cleared).length}/{checkpoints.length} checkpoints
                </span>
              )}
            </div>
          )}

          {currentLesson.contentType === 'PDF' && (
            <div className="relative h-[55vh] min-h-[400px] max-h-[62vh] w-full bg-zinc-100/80 flex items-center justify-center border-b border-zinc-200 shadow-sm shrink-0 p-6">
              <div className="p-8 text-center space-y-4 max-w-md bg-white rounded-2xl border border-zinc-200 shadow-sm">
                <div className="w-16 h-16 bg-red-50 text-brand rounded-2xl flex items-center justify-center mx-auto border border-red-100 shadow-xs">
                  <FileText className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-black text-zinc-900 tracking-tight">{currentLesson.title}</h3>
                  <p className="text-xs text-zinc-500">Official Course PDF Resource & Reference Guide</p>
                </div>
                <a
                  href={currentLesson.pdfUrl || '#'}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 btn-soft font-bold text-xs px-6 py-3 rounded-xl transition"
                >
                  <Download className="w-4 h-4" />
                  <span>Download PDF Document</span>
                </a>
              </div>
            </div>
          )}

          {currentLesson.contentType === 'QUIZ' && currentLesson.quiz && (
            <div className="relative h-[60vh] min-h-[460px] max-h-[64vh] w-full bg-zinc-100/80 border-b border-zinc-200 flex flex-col shrink-0 overflow-hidden">
              {/* 1. Assessment Header Bar */}
              <div className="bg-white border-b border-zinc-200 px-6 py-3.5 flex items-center justify-between shrink-0 shadow-2xs">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-brand/10 text-brand border border-brand/20 flex items-center justify-center shrink-0">
                    <HelpCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-brand/10 text-brand tracking-wider">
                        Lesson Assessment
                      </span>
                      <span className="text-[11px] text-zinc-500 font-medium">
                        Passing Score: {currentLesson.quiz.passingScorePercent}%
                      </span>
                    </div>
                    <h2 className="text-sm sm:text-base font-black text-zinc-900 tracking-tight">
                      {currentLesson.quiz.title}
                    </h2>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right hidden sm:block">
                    <p className="text-[11px] text-zinc-500 font-medium">
                      {quizSubmitted ? 'Assessment Finished' : 'Progress'}
                    </p>
                    <p className="text-xs font-bold text-zinc-800">
                      {Object.keys(quizAnswers).length} of {totalQuizQuestions} answered
                    </p>
                  </div>
                </div>
              </div>

              {/* 2. Scrollable Questions List inside the Video Playing Section */}
              <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-5 space-y-4 max-w-3xl w-full mx-auto">
                {quizSubmitted && (
                  <div className={`p-4 rounded-xl border flex items-center justify-between gap-4 ${
                    isQuizPassed 
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
                      : 'bg-amber-50 border-amber-200 text-amber-900'
                  }`}>
                    <div className="flex items-center gap-3">
                      {isQuizPassed ? (
                        <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                      ) : (
                        <HelpCircle className="w-6 h-6 text-amber-600 shrink-0" />
                      )}
                      <div>
                        <p className="font-bold text-sm">
                          {isQuizPassed ? 'Assessment Completed! You passed.' : 'Assessment Completed — Passing score not met.'}
                        </p>
                        <p className="text-xs opacity-85">
                          Score: {quizScorePercent}% ({quizCorrectCount}/{totalQuizQuestions} correct) • Required: {currentLesson.quiz.passingScorePercent}%
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setQuizResult(null);
                        setQuizAnswers({});
                      }}
                      className="text-xs font-bold px-3 py-1.5 rounded-lg border border-current hover:bg-black/5 transition shrink-0"
                    >
                      Retake Quiz
                    </button>
                  </div>
                )}

                {currentLesson.quiz.questions.map((q: QuizQuestion, qIdx: number) => {
                  const isAnswered = quizAnswers[q.id] !== undefined;
                  const result = resultFor(q.id);
                  const isCorrect = quizSubmitted && Boolean(result?.isCorrect);
                  const isWrong = quizSubmitted && isAnswered && !isCorrect;

                  return (
                    <div
                      key={q.id}
                      className={`p-5 bg-white rounded-xl border transition-all shadow-xs space-y-3.5 ${
                        quizSubmitted
                          ? isCorrect
                            ? 'border-emerald-300 ring-1 ring-emerald-200'
                            : isWrong
                            ? 'border-red-300 ring-1 ring-red-200'
                            : 'border-zinc-200'
                          : 'border-zinc-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className="font-bold text-zinc-900 text-sm leading-snug">
                          <span className="text-brand font-black mr-2">{qIdx + 1}.</span>
                          {q.question}
                        </p>
                        {quizSubmitted && (
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                            isCorrect ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {isCorrect ? 'Correct' : 'Incorrect'}
                          </span>
                        )}
                      </div>

                      <div className="space-y-2">
                        {q.options.map((opt: string, optIdx: number) => {
                          const isSelected = quizAnswers[q.id] === optIdx;
                          const isTheCorrectOne = quizSubmitted && optIdx === result?.correctOptionIndex;

                          return (
                            <label
                              key={optIdx}
                              className={`flex items-center gap-3 p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                                quizSubmitted
                                  ? isTheCorrectOne
                                    ? 'bg-emerald-50/80 border-emerald-400 text-emerald-950 font-semibold'
                                    : isSelected
                                    ? 'bg-red-50/80 border-red-300 text-red-950 font-medium line-through'
                                    : 'bg-zinc-50 border-zinc-200 text-zinc-500'
                                  : isSelected
                                  ? 'bg-brand/10 border-brand text-brand font-bold shadow-2xs'
                                  : 'bg-zinc-50/70 border-zinc-200 text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950 hover:border-zinc-300'
                              }`}
                            >
                              <input
                                type="radio"
                                name={`q-${q.id}`}
                                checked={isSelected}
                                disabled={quizSubmitted}
                                onChange={() => setQuizAnswers(prev => ({ ...prev, [q.id]: optIdx }))}
                                className="accent-brand w-4 h-4 cursor-pointer"
                              />
                              <span className="leading-relaxed">{opt}</span>
                            </label>
                          );
                        })}
                      </div>

                      {quizSubmitted && result?.explanation && (
                        <div className="pt-2 text-[11px] text-zinc-600 bg-zinc-50 p-2.5 rounded-lg border border-zinc-200 leading-relaxed">
                          <span className="font-bold text-zinc-800">Explanation: </span>
                          {result?.explanation}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* 3. Sticky Assessment Footer inside the Playing Section */}
              <div className="bg-white border-t border-zinc-200 px-6 py-3.5 flex items-center justify-between shrink-0 shadow-sm">
                <div className="text-xs text-zinc-600 font-medium">
                  {quizError ? (
                    <span className="font-semibold text-red-600">{quizError}</span>
                  ) : quizSubmitted ? (
                    <span className="font-bold text-zinc-900">
                      Status: {isQuizPassed ? 'Passed ✓' : 'Needs Review'}
                    </span>
                  ) : (
                    <span>
                      Answered <strong className="text-zinc-900">{Object.keys(quizAnswers).length}</strong> of{' '}
                      <strong className="text-zinc-900">{totalQuizQuestions}</strong> questions
                    </span>
                  )}
                </div>

                {!quizSubmitted ? (
                  <button
                    onClick={handleQuizSubmit}
                    disabled={Object.keys(quizAnswers).length === 0 || isQuizSubmitting}
                    className="btn-soft disabled:opacity-50 disabled:cursor-not-allowed font-bold text-xs px-6 py-2.5 rounded-xl transition flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isQuizSubmitting ? 'Checking…' : 'Submit Quiz Answers'}</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      if (nextLesson) {
                        router.push(`/watch/${course.slug}/${nextLesson.id}`);
                      }
                    }}
                    className="bg-zinc-900 hover:bg-black text-white font-bold text-xs px-6 py-2.5 rounded-xl transition shadow-sm flex items-center gap-2"
                  >
                    <span>Continue to Next Lesson</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Attached Video Details & Description Section (Directly below video) */}
          <div className="bg-white border-b border-zinc-200 px-4 sm:px-8 py-5 sm:py-6 space-y-3 shrink-0 shadow-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-brand/10 text-brand text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-brand/20 uppercase">
                {currentSection?.title || 'Section'}
              </span>
              <span className="bg-zinc-100 text-zinc-600 text-[10px] font-semibold px-2 py-0.5 rounded">
                {Math.round(currentLesson.durationSeconds / 60)} mins
              </span>
              {isCompleted && (
                <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3" />
                  Completed
                </span>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight">
              {currentLesson.title}
            </h1>

            <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed max-w-4xl">
              Master key creative and technical principles in {currentLesson.title}. Learn hands-on workflow best practices from industry educator {course.instructorName}.
            </p>
          </div>

          {/* Bottom Bar: light brand gradient with white buttons */}
          <div className="panel-soft border-x-0 px-4 sm:px-8 py-3.5 flex flex-wrap items-center gap-2.5 sm:gap-3 shrink-0 shadow-sm">
            {/* Button 1: Course Curriculum */}
            <button
              onClick={() => setActiveSection('curriculum')}
              className={`px-4 sm:px-5 py-2.5 rounded-xl transition-all duration-200 flex items-center gap-2 text-xs font-bold shadow-sm ${
                activeSection === 'curriculum'
                  ? 'bg-white text-brand shadow-md scale-[1.02]'
                  : 'bg-white text-zinc-800 hover:text-black hover:bg-zinc-50 hover:scale-[1.01]'
              }`}
            >
              <BookOpen className={`w-4 h-4 ${activeSection === 'curriculum' ? 'text-brand' : 'text-zinc-600'}`} />
              <span>Course Curriculum</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                activeSection === 'curriculum' ? 'bg-brand/10 text-brand' : 'bg-zinc-100 text-zinc-700'
              }`}>
                {completedCount}/{allLessons.length}
              </span>
              {activeSection === 'curriculum' && <span className="w-1.5 h-1.5 rounded-full bg-brand flex-shrink-0" />}
            </button>

            {/* Button 2: Overview & Notes */}
            <button
              onClick={() => setActiveSection('overview')}
              className={`px-4 sm:px-5 py-2.5 rounded-xl transition-all duration-200 flex items-center gap-2 text-xs font-bold shadow-sm ${
                activeSection === 'overview'
                  ? 'bg-white text-brand shadow-md scale-[1.02]'
                  : 'bg-white text-zinc-800 hover:text-black hover:bg-zinc-50 hover:scale-[1.01]'
              }`}
            >
              <FileText className={`w-4 h-4 ${activeSection === 'overview' ? 'text-brand' : 'text-zinc-600'}`} />
              <span>Overview & Notes</span>
              {activeSection === 'overview' && <span className="w-1.5 h-1.5 rounded-full bg-brand flex-shrink-0" />}
            </button>

            {/* Button 3: Lesson Discussion */}
            <button
              onClick={() => setActiveSection('discussion')}
              className={`px-4 sm:px-5 py-2.5 rounded-xl transition-all duration-200 flex items-center gap-2 text-xs font-bold shadow-sm ${
                activeSection === 'discussion'
                  ? 'bg-white text-brand shadow-md scale-[1.02]'
                  : 'bg-white text-zinc-800 hover:text-black hover:bg-zinc-50 hover:scale-[1.01]'
              }`}
            >
              <MessageSquare className={`w-4 h-4 ${activeSection === 'discussion' ? 'text-brand' : 'text-zinc-600'}`} />
              <span>Lesson Discussion</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                activeSection === 'discussion' ? 'bg-brand/10 text-brand' : 'bg-zinc-100 text-zinc-700'
              }`}>
                {qaList.length}
              </span>
              {activeSection === 'discussion' && <span className="w-1.5 h-1.5 rounded-full bg-brand flex-shrink-0" />}
            </button>

            {/* Button 4: AI Study Buddy */}
            <button
              onClick={() => handleOpenAgentChat()}
              className={`px-4 sm:px-5 py-2.5 rounded-xl transition-all duration-200 flex items-center gap-2 text-xs font-bold shadow-sm ${
                activeSection === 'agent'
                  ? 'bg-white text-brand shadow-md scale-[1.02]'
                  : 'bg-white text-zinc-800 hover:text-black hover:bg-zinc-50 hover:scale-[1.01]'
              }`}
            >
              <img src="/agent-icon.png" alt="AI Agent" className="w-4 h-4 object-contain" />
              <span>AI Study Buddy</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              {activeSection === 'agent' && <span className="w-1.5 h-1.5 rounded-full bg-brand flex-shrink-0" />}
            </button>
          </div>
        </div>

        {/* Right Integrated Column: Dynamic Content Panel (opens clicked section) */}
        <div className="w-full lg:w-[420px] xl:w-[480px] bg-white border-l border-zinc-200 flex flex-col flex-shrink-0 h-full min-h-0 overflow-hidden shadow-sm">
          {/* 1. Course Curriculum View */}
          {activeSection === 'curriculum' && (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Header with Progress Bar */}
              <div className="p-4 sm:p-5 border-b border-zinc-200 bg-zinc-50/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-zinc-900 text-xs uppercase tracking-wider flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-brand" />
                    <span>Course Curriculum</span>
                  </h3>
                  <span className="text-xs font-bold text-brand">{progressPercent}% Completed</span>
                </div>
                {/* Sleek Progress Bar */}
                <div className="w-full bg-zinc-200 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-brand h-full transition-all duration-500 rounded-full"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <p className="text-[11px] text-zinc-500">
                  {completedCount} of {allLessons.length} lessons completed
                </p>
              </div>

              {/* Lesson Items */}
              <div className="flex-1 overflow-y-auto divide-y divide-zinc-200">
                {course.sections.map(section => (
                  <div key={section.id} className="bg-white">
                    <div className="p-3 px-4 bg-zinc-100/60 text-xs font-bold text-zinc-800 flex items-center justify-between">
                      <span className="truncate">{section.title}</span>
                      <span className="text-[10px] text-zinc-500 shrink-0 font-normal">
                        {section.lessons.length} {section.lessons.length === 1 ? 'lesson' : 'lessons'}
                      </span>
                    </div>
                    <div className="divide-y divide-zinc-100">
                      {section.lessons.map(lesson => {
                        const isCurrent = lesson.id === currentLesson.id;
                        const isLessonDone = progress.completedLessonIds.includes(lesson.id);

                        return (
                          <Link
                            key={lesson.id}
                            href={`/watch/${course.slug}/${lesson.id}`}
                            className={`p-3.5 px-4 flex items-center justify-between text-xs transition ${
                              isCurrent
                                ? 'bg-brand/10 text-brand font-bold border-l-4 border-brand'
                                : 'text-zinc-700 hover:text-zinc-900 hover:bg-zinc-50'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0 pr-2">
                              {isLessonDone ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                              ) : isCurrent ? (
                                <Play className="w-4 h-4 text-brand fill-current flex-shrink-0" />
                              ) : (
                                <Play className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
                              )}
                              <span className="truncate">{lesson.title}</span>
                            </div>
                            <span className="text-[11px] text-zinc-400 flex-shrink-0 font-normal">
                              {Math.round(lesson.durationSeconds / 60)}m
                            </span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Bottom Quick AI Agent Action Card */}
              <div className="p-3.5 bg-zinc-50 border-t border-zinc-200">
                <button
                  onClick={() => handleOpenAgentChat()}
                  className="w-full bg-white hover:bg-zinc-100 border border-zinc-300 hover:border-brand text-zinc-900 font-bold rounded-xl py-3 px-4 text-xs transition flex items-center justify-center gap-2.5 shadow-sm"
                >
                  <img src="/agent-icon.png" alt="AI Agent" className="w-5 h-5 object-contain" />
                  <span>Ask AI Agent about this lesson</span>
                </button>
              </div>
            </div>
          )}

          {/* 2. Overview & Notes View */}
          {activeSection === 'overview' && (
            <div className="flex-1 flex flex-col overflow-y-auto p-5 sm:p-6 space-y-6">
              <div className="border-b border-zinc-200 pb-3">
                <h3 className="font-bold text-zinc-900 text-xs uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-4 h-4 text-brand" />
                  <span>Overview & Notes</span>
                </h3>
                <p className="text-[11px] text-zinc-500 mt-0.5">Lesson takeaways, instructor details & quick review</p>
              </div>

              {/* Highlighted AI Study Buddy Card */}
              <div className="relative overflow-hidden p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 text-white border-2 border-brand shadow-xl shadow-brand/20 ring-4 ring-brand/10 space-y-4">
                <div className="absolute -right-10 -bottom-10 w-44 h-44 bg-brand/25 rounded-full blur-3xl pointer-events-none" />
                <div className="relative z-10 flex items-start gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand to-brand-hover p-0.5 shadow-lg flex items-center justify-center shrink-0">
                    <div className="w-full h-full bg-zinc-950 rounded-[10px] flex items-center justify-center">
                      <img src="/agent-icon.png" alt="AI Agent" className="w-7 h-7 object-contain" />
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-white flex items-center gap-1.5">
                      <span>AI Study Buddy & Quiz Ready</span>
                      <Sparkles className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    </h4>
                    <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
                      Ask the tutor about any moment, revise with a summary and flashcards, and track your progress.
                    </p>
                  </div>
                </div>

                <div className="relative z-10 flex items-center gap-2 pt-1">
                  <button
                    onClick={() => handleOpenAgentTab('revise')}
                    className="flex-1 px-4 py-2.5 btn-soft font-extrabold rounded-xl text-xs transition flex items-center justify-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5 fill-current" />
                    <span>Revise</span>
                  </button>
                  <button
                    onClick={() => handleOpenAgentChat('Summarize the key points of this lesson')}
                    className="flex-1 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl text-xs transition border border-white/20 flex items-center justify-center gap-1.5"
                  >
                    <span>Summarize</span>
                  </button>
                </div>
              </div>

              {/* Lesson Learning Takeaways */}
              <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 sm:p-5 space-y-2.5">
                <h4 className="font-bold text-zinc-900 text-xs uppercase tracking-wider">Lesson Highlights</h4>
                <ul className="text-xs text-zinc-600 space-y-2 list-disc pl-4 leading-relaxed">
                  <li>Mastering composition techniques, Rule of Thirds, and lens compression.</li>
                  <li>Real-world camera setups and lighting contrast from {course.instructorName}.</li>
                  <li>Practical workflow methods and client delivery standards.</li>
                </ul>
              </div>

              {/* Up Next Card */}
              {nextLesson && (
                <div className="bg-white border border-zinc-200 rounded-xl p-4 flex items-center justify-between gap-3 shadow-sm hover:border-zinc-300 transition">
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Up Next</span>
                    <h5 className="text-xs font-bold text-zinc-900 truncate mt-0.5">{nextLesson.title}</h5>
                    <span className="text-[11px] text-zinc-500">{Math.round(nextLesson.durationSeconds / 60)} mins</span>
                  </div>
                  <Link
                    href={`/watch/${course.slug}/${nextLesson.id}`}
                    className="px-3.5 py-1.5 bg-zinc-900 hover:bg-black text-white font-semibold rounded-lg text-xs transition flex items-center gap-1 shrink-0"
                  >
                    <span>Play Next</span>
                    <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* 3. Lesson Discussion (Q&A) View */}
          {activeSection === 'discussion' && (
            <div className="flex-1 flex flex-col overflow-y-auto p-5 sm:p-6 space-y-5">
              <div className="border-b border-zinc-200 pb-3">
                <h3 className="font-bold text-zinc-900 text-xs uppercase tracking-wider flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-brand" />
                  <span>Lesson Discussion & Q&A</span>
                </h3>
                <p className="text-[11px] text-zinc-500 mt-0.5">Ask questions and collaborate with peer creators</p>
              </div>

              <form onSubmit={handlePostQuestion} className="space-y-2.5 bg-zinc-50 border border-zinc-200 rounded-xl p-4 shadow-sm">
                <h4 className="font-bold text-zinc-900 text-xs">Ask a Question</h4>
                <textarea
                  rows={3}
                  placeholder="Ask a technical or creative question about this lesson..."
                  value={newQuestionText}
                  onChange={e => setNewQuestionText(e.target.value)}
                  className="w-full bg-white border border-zinc-300 rounded-md p-3 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-brand"
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="btn-soft font-bold text-xs px-4 py-2 rounded-md transition flex items-center gap-1.5 shadow"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Post Question</span>
                  </button>
                </div>
              </form>

              <div className="space-y-3">
                {qaList.map(qa => (
                  <div key={qa.id} className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl space-y-2 text-xs shadow-sm">
                    <div className="flex items-center gap-2.5">
                      <img src={qa.userAvatar} alt={qa.userName} className="w-7 h-7 rounded-full object-cover border border-zinc-200" />
                      <div>
                        <span className="font-bold text-zinc-900">{qa.userName}</span>
                        <span className="text-[10px] text-zinc-400 ml-2">{qa.createdAt}</span>
                      </div>
                    </div>
                    <p className="text-zinc-700 pl-9 leading-relaxed">{qa.question}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. AI Agent View */}
          {activeSection === 'agent' && (
            <div className="flex-1 min-h-0 h-full overflow-hidden">
              <UnifiedAgentPanel
                isOpen={true}
                isEmbedded={true}
                onClose={handleCloseAgentPanel}
                course={course}
                lesson={currentLesson}
                getCurrentTime={getCurrentTime}
                onSeek={seekTo}
                tab={agentTab}
                onTabChange={setAgentTab}
                initialPrompt={initialAgentPrompt}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
