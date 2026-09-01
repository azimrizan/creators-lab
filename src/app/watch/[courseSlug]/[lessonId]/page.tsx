'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Play, CheckCircle2, FileText, HelpCircle, Download, Send, Clock, Award, ShieldCheck, ChevronRight, Sparkles, BookOpen } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { MOCK_QA } from '@/lib/mockData';
import { QuizQuestion } from '@/lib/types';

import UnifiedAgentPanel from '@/components/UnifiedAgentPanel';

export default function WatchLessonPage() {
  const params = useParams();
  const router = useRouter();
  const courseSlug = params.courseSlug as string;
  const lessonId = params.lessonId as string;

  const { courses, userProgress, markLessonComplete, updateWatchPosition } = useAppStore();

  const course = courses.find(c => c.slug === courseSlug || c.id === courseSlug) || courses.find(c => c.slug === 'introduction-to-visual-storytelling') || courses[0];
  const courseId = course.id || (course as any)._id || course.slug;
  const allLessons = course.sections.flatMap(s => s.lessons);
  const currentLesson = allLessons.find(l => l.id === lessonId) || allLessons[0];
  const currentSection = course.sections.find(s => s.lessons.some(l => l.id === currentLesson.id));

  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [activeTab, setActiveTab] = useState<'overview' | 'qa' | 'resources' | 'quiz'>('overview');

  // Q&A State
  const [qaList, setQaList] = useState(MOCK_QA);
  const [newQuestionText, setNewQuestionText] = useState('');

  // Native Course Quiz State
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  // Right Column View ('curriculum' vs 'agent')
  const [rightSidebarTab, setRightSidebarTab] = useState<'curriculum' | 'agent'>('curriculum');
  const [agentPanelMode, setAgentPanelMode] = useState<'chat' | 'quiz'>('chat');
  const [initialAgentPrompt, setInitialAgentPrompt] = useState<string | undefined>(undefined);

  const videoRef = useRef<HTMLVideoElement>(null);
  const progress = userProgress[courseId] || { completedLessonIds: [], lastPositionSec: {} };
  const isCompleted = progress.completedLessonIds.includes(currentLesson.id);

  // Auto-resume watch position
  useEffect(() => {
    if (videoRef.current && progress.lastPositionSec[currentLesson.id]) {
      videoRef.current.currentTime = progress.lastPositionSec[currentLesson.id];
    }
  }, [currentLesson.id]);

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const current = Math.floor(videoRef.current.currentTime);
      const duration = videoRef.current.duration;
      updateWatchPosition(courseId, currentLesson.id, current);

      // Auto mark completed at 90%
      if (duration && current / duration >= 0.9 && !isCompleted) {
        markLessonComplete(courseId, currentLesson.id);
      }
    }
  };

  // Video completion callback: auto-switch right column to AI Agent Quiz mode
  const handleVideoEnded = () => {
    markLessonComplete(courseId, currentLesson.id);
    setAgentPanelMode('quiz');
    setRightSidebarTab('agent');
  };

  const handleOpenAgentChat = (prompt?: string) => {
    if (prompt) setInitialAgentPrompt(prompt);
    setAgentPanelMode('chat');
    setRightSidebarTab('agent');
  };

  const handleOpenAgentQuiz = () => {
    setAgentPanelMode('quiz');
    setRightSidebarTab('agent');
  };

  const handleCloseAgentPanel = () => {
    setRightSidebarTab('curriculum');
  };

  const handlePostQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestionText.trim()) return;

    const newQa = {
      id: `qa-${Date.now()}`,
      lessonId: currentLesson.id,
      userId: 'user-1',
      userName: 'Maya Sharma',
      userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=250&q=80',
      isInstructor: false,
      question: newQuestionText,
      createdAt: 'Just now',
      replies: []
    };

    setQaList([newQa, ...qaList]);
    setNewQuestionText('');
  };

  const handleQuizSubmit = () => {
    setQuizSubmitted(true);
    if (currentLesson.quiz) {
      markLessonComplete(courseId, currentLesson.id);
    }
  };

  return (
    <div className="h-screen max-h-screen bg-[#0B0B0B] text-white flex flex-col pt-16 font-sans overflow-hidden">
      {/* Top Navigation Bar */}
      <header className="h-14 bg-[#141414] border-b border-white/10 px-4 sm:px-6 flex items-center justify-between text-xs z-20 shrink-0">
        <div className="flex items-center gap-3">
          <Link href={`/course/${course.slug}`} className="p-1.5 rounded-md text-[#B3B3B3] hover:text-white hover:bg-white/10 transition">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="truncate max-w-md">
            <span className="font-bold text-white truncate">{course.title}</span>
            <span className="text-slate-500 mx-2">•</span>
            <span className="text-amber-400 font-medium">{currentLesson.title}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => handleOpenAgentChat()}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-2 border ${
              rightSidebarTab === 'agent'
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-sm'
                : 'bg-[#1F1F1F] hover:bg-[#2A2A2A] border-white/15 text-white'
            }`}
          >
            <img src="/IMG_2796.PNG" alt="AI Agent" className="w-5 h-5 object-contain" />
            <span>Ask AI Agent</span>
          </button>

          <button
            onClick={() => markLessonComplete(courseId, currentLesson.id)}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition ${
              isCompleted
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-[#1C1C1C] border border-white/15 text-white hover:bg-white/10'
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
        <div className="flex-1 flex flex-col overflow-y-auto no-scrollbar">
          {/* Theater Mode Video Container */}
          <div className="relative aspect-video w-full bg-black flex items-center justify-center border-b border-white/10 shadow-2xl group">
            {currentLesson.contentType === 'VIDEO' && (
              <video
                ref={videoRef}
                src={currentLesson.videoUrl || course.previewVideoUrl || '/vidssave.com Visual Storytelling 101 480P.mp4'}
                controls
                autoPlay
                onTimeUpdate={handleTimeUpdate}
                onEnded={handleVideoEnded}
                className="w-full h-full object-contain"
              />
            )}

            {currentLesson.contentType === 'PDF' && (
              <div className="p-8 text-center space-y-4 max-w-md">
                <div className="w-16 h-16 bg-sky-500/20 text-sky-400 rounded-full flex items-center justify-center mx-auto border border-sky-500/30">
                  <FileText className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-white">{currentLesson.title}</h3>
                <p className="text-xs text-[#B3B3B3]">PDF Resource & Architecture Guide</p>
                <a
                  href={currentLesson.pdfUrl || '#'}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 bg-[#E50914] hover:bg-[#b80710] text-white font-bold text-xs px-5 py-2.5 rounded-md transition"
                >
                  <Download className="w-4 h-4" />
                  <span>Download PDF Document</span>
                </a>
              </div>
            )}

            {currentLesson.contentType === 'QUIZ' && currentLesson.quiz && (
              <div className="p-8 max-w-xl w-full space-y-6 bg-[#141414] border border-white/10 rounded-xl my-4">
                <div className="flex items-center gap-3">
                  <HelpCircle className="w-6 h-6 text-amber-400" />
                  <div>
                    <h3 className="text-base font-bold text-white">{currentLesson.quiz.title}</h3>
                    <p className="text-xs text-[#B3B3B3]">Passing Score: {currentLesson.quiz.passingScorePercent}%</p>
                  </div>
                </div>

                <div className="space-y-4 text-xs">
                  {currentLesson.quiz.questions.map((q: QuizQuestion, qIdx: number) => (
                    <div key={q.id} className="space-y-2 p-3 bg-[#0B0B0B] border border-white/10 rounded-md">
                      <p className="font-semibold text-white">{qIdx + 1}. {q.question}</p>
                      <div className="space-y-1 pl-2">
                        {q.options.map((opt: string, optIdx: number) => (
                          <label key={optIdx} className="flex items-center gap-2 text-[#B3B3B3] hover:text-white cursor-pointer py-1">
                            <input
                              type="radio"
                              name={`q-${q.id}`}
                              checked={quizAnswers[q.id] === optIdx}
                              onChange={() => setQuizAnswers(prev => ({ ...prev, [q.id]: optIdx }))}
                              className="accent-[#E50914]"
                            />
                            <span>{opt}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleQuizSubmit}
                  className="w-full bg-[#E50914] hover:bg-[#b80710] text-white font-bold py-2.5 rounded-md transition text-xs"
                >
                  {quizSubmitted ? 'Assessment Submitted ✓' : 'Submit Quiz Answers'}
                </button>
              </div>
            )}
          </div>

          {/* Navigation Tabs */}
          <div className="bg-[#141414] border-b border-white/10 px-6 flex gap-6 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-3.5 border-b-2 transition ${
                activeTab === 'overview' ? 'border-emerald-400 text-white' : 'border-transparent text-[#B3B3B3] hover:text-white'
              }`}
            >
              Overview & Resources
            </button>
            <button
              onClick={() => setActiveTab('qa')}
              className={`py-3.5 border-b-2 transition ${
                activeTab === 'qa' ? 'border-emerald-400 text-white' : 'border-transparent text-[#B3B3B3] hover:text-white'
              }`}
            >
              Lesson Q&A Discussion
            </button>
            <button
              onClick={() => handleOpenAgentChat()}
              className="py-3.5 border-b-2 border-transparent text-emerald-400 hover:text-emerald-300 transition flex items-center gap-2 font-bold"
            >
              <img src="/IMG_2796.PNG" alt="AI Agent" className="w-4 h-4 object-contain" />
              <span>Learn with AI Agent</span>
            </button>
          </div>

          {/* Tab Body */}
          <div className="p-6 max-w-[1400px] w-full space-y-6">
            {activeTab === 'overview' && (
              <div className="space-y-4 text-xs text-[#B3B3B3]">
                <h3 className="text-base font-bold text-white">{currentLesson.title}</h3>
                <p className="leading-relaxed">
                  Welcome to {currentLesson.title}! Master composition techniques, Rule of Thirds, central framing, one-point perspective, and lens compression with acclaimed cinematographer Philip Bloom.
                </p>
                <div className="p-4 rounded-xl bg-[#141414] border border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img src="/IMG_2796.PNG" alt="AI Agent" className="w-8 h-8 object-contain" />
                    <div>
                      <h4 className="text-sm font-bold text-white">AI Agent Knowledge Assessment Ready</h4>
                      <p className="text-[11px] text-slate-400">Finish the video to automatically trigger the 10-question MCQ assessment or ask doubts below.</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleOpenAgentQuiz()}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-full text-xs transition"
                  >
                    Take Quiz Now
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'qa' && (
              <div className="space-y-6">
                <form onSubmit={handlePostQuestion} className="space-y-2">
                  <textarea
                    rows={3}
                    placeholder="Ask a technical question about this lesson..."
                    value={newQuestionText}
                    onChange={e => setNewQuestionText(e.target.value)}
                    className="w-full bg-[#141414] border border-white/15 rounded-md p-3 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-400"
                  />
                  <button
                    type="submit"
                    className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs px-4 py-2 rounded-md transition flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Post Question</span>
                  </button>
                </form>

                <div className="space-y-3">
                  {qaList.map(qa => (
                    <div key={qa.id} className="p-4 bg-[#141414] border border-white/10 rounded-md space-y-2 text-xs">
                      <div className="flex items-center gap-2">
                        <img src={qa.userAvatar} alt={qa.userName} className="w-6 h-6 rounded-full object-cover" />
                        <span className="font-bold text-white">{qa.userName}</span>
                        <span className="text-[10px] text-slate-500">• {qa.createdAt}</span>
                      </div>
                      <p className="text-[#B3B3B3] pl-8">{qa.question}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Integrated Column: Enlarged Width (w-full lg:w-[480px] xl:w-[520px]) */}
        <div className="w-full lg:w-[480px] xl:w-[520px] bg-[#141414] border-l border-white/10 flex flex-col flex-shrink-0 h-full min-h-0 overflow-hidden">
          {/* Curriculum View */}
          {rightSidebarTab === 'curriculum' ? (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="p-4 border-b border-white/10 bg-[#1C1C1C]">
                <h3 className="font-bold text-white text-xs uppercase tracking-wider">Course Curriculum</h3>
                <p className="text-[11px] text-[#B3B3B3] mt-0.5">
                  {progress.completedLessonIds.length} of {allLessons.length} Completed
                </p>
              </div>

              <div className="flex-1 overflow-y-auto divide-y divide-white/10">
                {course.sections.map(section => (
                  <div key={section.id} className="bg-[#141414]">
                    <div className="p-3 bg-[#1C1C1C]/60 text-[11px] font-bold text-white">
                      {section.title}
                    </div>
                    <div className="divide-y divide-white/5">
                      {section.lessons.map(lesson => {
                        const isCurrent = lesson.id === currentLesson.id;
                        const isLessonDone = progress.completedLessonIds.includes(lesson.id);

                        return (
                          <Link
                            key={lesson.id}
                            href={`/watch/${course.slug}/${lesson.id}`}
                            className={`p-3.5 pl-4 flex items-center justify-between text-xs transition ${
                              isCurrent
                                ? 'bg-emerald-500/20 text-white font-bold border-l-4 border-emerald-400'
                                : 'text-[#B3B3B3] hover:text-white hover:bg-white/5'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0 pr-2">
                              {isLessonDone ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                              ) : (
                                <Play className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                              )}
                              <span className="truncate">{lesson.title}</span>
                            </div>
                            <span className="text-[10px] text-slate-500 flex-shrink-0">
                              {Math.round(lesson.durationSeconds / 60)}m
                            </span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Bottom Action Button: Ask AI Agent / Learn with AI Agent featuring IMG_2796.PNG icon */}
              <div className="p-4 bg-[#1C1C1C] border-t border-white/10">
                <button
                  onClick={() => handleOpenAgentChat()}
                  className="w-full bg-[#1F1F1F] hover:bg-[#282828] border border-white/12 hover:border-amber-400/50 text-white font-extrabold rounded-2xl py-3.5 px-5 text-xs transition-all duration-200 hover:scale-[1.01] flex items-center justify-center gap-3 shadow-md"
                >
                  <img src="/IMG_2796.PNG" alt="AI Agent" className="w-6 h-6 object-contain" />
                  <span>Ask AI Agent / Learn with AI Agent</span>
                </button>
              </div>
            </div>
          ) : (
            /* AI Agent View: Displays in front of Course Curriculum with Close X button */
            <div className="flex-1 min-h-0 h-full overflow-hidden">
              <UnifiedAgentPanel
                isOpen={true}
                isEmbedded={true}
                onClose={handleCloseAgentPanel}
                initialMode={agentPanelMode}
                initialPrompt={initialAgentPrompt}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
