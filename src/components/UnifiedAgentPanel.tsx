'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { X, Send, MessageSquareText, Layers, BarChart3, Loader2, Award, ArrowRight, RefreshCw, PlayCircle } from 'lucide-react';
import FormattedMarkdown from './FormattedMarkdown';
import FlashcardDeck from './agents/FlashcardDeck';
import { agentGet, agentSend, streamTutor, TutorSource } from './agents/agentClient';
import { useAppStore } from '@/lib/store';
import { formatTimestamp } from '@/lib/courseUtils';
import { Course, Lesson } from '@/lib/types';

export type AgentPanelTab = 'tutor' | 'revise' | 'progress';

interface UnifiedAgentPanelProps {
  isOpen: boolean;
  onClose?: () => void;
  course: Course;
  lesson: Lesson;
  /** Current playback position, so the tutor knows what the learner is looking at. */
  getCurrentTime: () => number;
  /** Jump the player (optionally to another lesson). */
  onSeek: (seconds: number, lessonId?: string) => void;
  tab: AgentPanelTab;
  onTabChange: (tab: AgentPanelTab) => void;
  initialPrompt?: string;
  isEmbedded?: boolean;
}

interface TutorMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: TutorSource[];
  isError?: boolean;
}

const newId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

export default function UnifiedAgentPanel({
  isOpen,
  onClose,
  course,
  lesson,
  getCurrentTime,
  onSeek,
  tab,
  onTabChange: setTab,
  initialPrompt,
  isEmbedded = false
}: UnifiedAgentPanelProps) {
  if (!isOpen) return null;

  const containerClass = isEmbedded
    ? 'flex flex-col h-full bg-white text-ink overflow-hidden font-sans'
    : 'fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-white border-l border-lavender-line shadow-2xl flex flex-col font-sans';

  const tabs: Array<[AgentPanelTab, string, React.ElementType]> = [
    ['tutor', 'Tutor', MessageSquareText],
    ['revise', 'Revise', Layers],
    ['progress', 'Progress', BarChart3]
  ];

  return (
    <div className={containerClass}>
      <div className="px-4 pt-4 pb-3 border-b border-[#F0EEF6] flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <img src="/agent-icon.png" alt="" className="w-9 h-9 object-contain shrink-0" />
          <div className="min-w-0">
            <h2 className="font-display font-semibold text-ink text-[15px] leading-tight">AI Study Buddy</h2>
            <p className="text-xs text-ink-muted truncate">{lesson.title}</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} aria-label="Close AI panel" className="w-10 h-10 rounded-full flex items-center justify-center text-ink-muted hover:bg-lavender hover:text-ink transition">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <div role="tablist" className="px-4 pt-3 flex gap-2 shrink-0">
        {tabs.map(([id, label, Icon]) => (
          <button
            key={id}
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={`h-9 px-3.5 rounded-full text-[13px] font-semibold flex items-center gap-1.5 border transition ${
              tab === id ? 'btn-soft' : 'bg-white text-ink-body border-[#E2DEEF] hover:bg-[#FBFAFF]'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      <div className="flex-1 min-h-0 flex flex-col">
        {tab === 'tutor' && <TutorTab course={course} lesson={lesson} getCurrentTime={getCurrentTime} onSeek={onSeek} initialPrompt={initialPrompt} />}
        {tab === 'revise' && <ReviseTab key={lesson.id} course={course} lesson={lesson} onSeek={onSeek} />}
        {tab === 'progress' && <ProgressTab course={course} onSeek={onSeek} />}
      </div>
    </div>
  );
}

function TutorTab({ course, lesson, getCurrentTime, onSeek, initialPrompt }: { course: Course; lesson: Lesson; getCurrentTime: () => number; onSeek: (s: number, lessonId?: string) => void; initialPrompt?: string }) {
  const { currentUser } = useAppStore();
  const isGuest = currentUser.id === 'guest';
  const [messages, setMessages] = useState<TutorMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const feedRef = useRef<HTMLDivElement>(null);
  const sentInitial = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (isGuest) return;
    agentGet<{ history: Array<{ role: 'user' | 'assistant'; content: string; sources?: TutorSource[] }> }>(`/api/ai/tutor?courseId=${encodeURIComponent(course.slug)}`)
      .then(data => setMessages(prev => (prev.length ? prev : data.history.map(h => ({ id: newId(), ...h })))))
      .catch(() => {});
  }, [course.slug, isGuest]);

  useEffect(() => {
    if (feedRef.current) feedRef.current.scrollTop = feedRef.current.scrollHeight;
  }, [messages, isLoading]);

  const send = useCallback(async (text?: string) => {
    const message = (text ?? input).trim();
    if (!message || isLoading) return;
    const assistantId = newId();
    const history = isGuest ? messages.filter(m => !m.isError).map(m => ({ role: m.role, content: m.content })) : undefined;

    setMessages(prev => [...prev, { id: newId(), role: 'user', content: message }, { id: assistantId, role: 'assistant', content: '' }]);
    setInput('');
    setIsLoading(true);

    try {
      await streamTutor(
        { courseId: course.slug, lessonId: lesson.id, atSec: getCurrentTime(), message, history },
        {
          onSources: sources => setMessages(prev => prev.map(m => (m.id === assistantId ? { ...m, sources } : m))),
          onDelta: delta => setMessages(prev => prev.map(m => (m.id === assistantId ? { ...m, content: m.content + delta } : m)))
        }
      );
    } catch (err) {
      setMessages(prev => prev.map(m => (m.id === assistantId ? { ...m, content: err instanceof Error ? err.message : 'The tutor is unavailable.', isError: true, sources: [] } : m)));
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, isGuest, messages, course.slug, lesson.id, getCurrentTime]);

  useEffect(() => {
    if (initialPrompt && sentInitial.current !== initialPrompt) {
      sentInitial.current = initialPrompt;
      send(initialPrompt);
    }
  }, [initialPrompt, send]);

  const seekInLesson = (seconds: number) => onSeek(seconds);
  const prompts = ['Explain what I just watched', 'Summarize this lesson', 'Give me a real-world example', 'Ask me a question to check my understanding'];

  return (
    <>
      <div ref={feedRef} className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-3 bg-[#FBFAFF]">
        {messages.length === 0 && (
          <div className="text-center py-6">
            <img src="/agent-icon.png" alt="" className="w-16 h-16 object-contain mx-auto" />
            <p className="font-display font-semibold text-ink mt-3">Ask about this course</p>
            <p className="text-[13px] text-ink-muted mt-1 px-4">Answers come from the lessons, with timestamps you can click to jump the video.</p>
            <div className="grid grid-cols-2 gap-2 mt-4">
              {prompts.map(p => (
                <button key={p} onClick={() => send(p)} className="min-h-12 px-3 py-2 rounded-xl bg-white border border-[#E2DEEF] hover:border-[#CFC8E6] text-[13px] font-medium text-ink text-left transition">
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map(msg =>
          msg.role === 'user' ? (
            <div key={msg.id} className="flex justify-end">
              <div className="max-w-[85%] btn-soft px-3.5 py-2.5 rounded-2xl rounded-br-md text-[13px] leading-relaxed">{msg.content}</div>
            </div>
          ) : (
            <div key={msg.id} className="space-y-2">
              <div className={`max-w-[95%] px-3.5 py-2.5 rounded-2xl rounded-bl-md border ${msg.isError ? 'bg-amber-50 border-amber-200' : 'bg-white border-[#ECE9F5]'}`}>
                {msg.content ? (
                  <FormattedMarkdown content={msg.content} onTimestampClick={seekInLesson} />
                ) : (
                  <span className="inline-flex items-center gap-2 text-[13px] text-ink-muted"><Loader2 className="w-4 h-4 animate-spin" /> Looking through the lessons…</span>
                )}
              </div>
              {!!msg.sources?.length && msg.content && !msg.isError && (
                <div className="flex flex-wrap gap-1.5">
                  {msg.sources.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => onSeek(s.startSec, s.lessonId === lesson.id ? undefined : s.lessonId)}
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-ink-body bg-white border border-[#E2DEEF] hover:border-[#CFC8E6] rounded-full px-2.5 py-1 max-w-full"
                      title={s.lessonId === lesson.id ? 'Jump to this moment' : `Open "${s.lessonTitle}"`}
                    >
                      <PlayCircle className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{s.lessonId === lesson.id ? '' : `${s.lessonTitle} · `}{formatTimestamp(s.startSec)} {s.topic}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )
        )}
      </div>

      <form onSubmit={e => { e.preventDefault(); send(); }} className="p-3 border-t border-[#F0EEF6] bg-white flex items-center gap-2 shrink-0">
        <label htmlFor="tutor-input" className="sr-only">Ask the tutor</label>
        <input
          id="tutor-input"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ask about this lesson…"
          maxLength={2000}
          className="flex-1 min-w-0 h-11 px-4 rounded-full bg-[#FBFAFF] border border-[#E2DEEF] text-sm text-ink placeholder:text-zinc-400 focus:outline-none focus:border-ink-muted"
        />
        <button type="submit" disabled={isLoading || !input.trim()} aria-label="Send" className="w-11 h-11 rounded-full btn-soft flex items-center justify-center disabled:opacity-40 transition shrink-0">
          <Send className="w-4 h-4" />
        </button>
      </form>
    </>
  );
}

interface StudyKitView {
  summary: string;
  keyPoints: string[];
  cards: Array<{ cardId: string; front: string; back: string; timestampSec: number; due: boolean }>;
}

function ReviseTab({ course, lesson, onSeek }: { course: Course; lesson: Lesson; onSeek: (s: number) => void }) {
  const { currentUser } = useAppStore();
  const [kit, setKit] = useState<StudyKitView | null | undefined>(undefined);
  const [error, setError] = useState('');

  useEffect(() => {
    agentGet<{ kit: StudyKitView | null }>(`/api/ai/revision?courseId=${encodeURIComponent(course.slug)}&lessonId=${encodeURIComponent(lesson.id)}`)
      .then(data => setKit(data.kit))
      .catch(err => { setError(err.message); setKit(null); });
  }, [course.slug, lesson.id]);

  if (kit === undefined) return <PanelLoading />;
  if (!kit) {
    return (
      <div className="flex-1 overflow-y-auto p-5 bg-[#FBFAFF]">
        <p className="text-sm text-ink-muted">{error || 'Revision notes for this lesson are not ready yet. Your instructor is preparing them.'}</p>
      </div>
    );
  }

  const dueCards = kit.cards.filter(c => c.due).map(c => ({ ...c, courseSlug: course.slug, lessonId: lesson.id }));

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-5 bg-[#FBFAFF]">
      <section className="bg-white border border-[#ECE9F5] rounded-2xl p-4">
        <h3 className="font-display font-semibold text-ink text-sm">Lesson summary</h3>
        <p className="text-[13px] text-ink-body leading-relaxed mt-2">{kit.summary}</p>
        {kit.keyPoints.length > 0 && (
          <ul className="mt-3 space-y-1.5">
            {kit.keyPoints.map((p, i) => (
              <li key={i} className="text-[13px] text-ink-body flex gap-2"><span className="text-ink-muted">•</span>{p}</li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-display font-semibold text-ink text-sm">Flashcards</h3>
          <span className="text-xs text-ink-muted">{dueCards.length} due · {kit.cards.length} total</span>
        </div>
        <FlashcardDeck cards={dueCards} canGrade={currentUser.id !== 'guest'} emptyText="You're up to date on this lesson's cards." />
        {kit.cards.some(c => c.timestampSec > 0) && (
          <p className="text-xs text-ink-muted">
            Unsure about a card? <button className="underline font-medium text-ink" onClick={() => onSeek(kit.cards[0].timestampSec)}>Rewatch where it&apos;s taught</button>.
          </p>
        )}
      </section>
    </div>
  );
}

interface ReportView {
  createdAt: string;
  stats: { completionPercent: number; accuracyPercent: number | null; questionsAnswered: number; examBestPercent: number | null };
  insights: { headline: string; masteryLevel: string; weaknesses: Array<{ topic: string; evidence: string }>; studyPlan: Array<{ title: string; lessonId: string; timestampSec: number; minutes: number }> };
}

interface ExamStatusView {
  canStart: boolean;
  blockedReason: string;
  passed: boolean;
  certificateNumber: string | null;
  lessonsCompleted: number;
  lessonsTotal: number;
  attemptsUsed: number;
  rules: { maxAttempts: number; passPercent: number };
  lastResult: { percent: number; passed: boolean } | null;
}

function ProgressTab({ course, onSeek }: { course: Course; onSeek: (s: number, lessonId?: string) => void }) {
  const { currentUser } = useAppStore();
  const [report, setReport] = useState<ReportView | null | undefined>(undefined);
  const [exam, setExam] = useState<ExamStatusView | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (currentUser.id === 'guest') return;
    agentGet<{ report: ReportView | null }>(`/api/ai/report?courseId=${encodeURIComponent(course.slug)}`).then(d => setReport(d.report)).catch(() => setReport(null));
    agentGet<{ status: ExamStatusView }>(`/api/ai/exam?courseId=${encodeURIComponent(course.slug)}`).then(d => setExam(d.status)).catch(() => {});
  }, [course.slug, currentUser.id]);

  if (currentUser.id === 'guest') {
    return <div className="flex-1 p-5 bg-[#FBFAFF] text-sm text-ink-muted">Sign in to track your progress, get a performance report and take the final exam.</div>;
  }

  const generate = async () => {
    setIsGenerating(true);
    setError('');
    try {
      const data = await agentSend<{ report: ReportView }>('/api/ai/report', { courseId: course.slug });
      setReport(data.report);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create the report.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#FBFAFF]">
      {exam && (
        <section className="bg-white border border-[#ECE9F5] rounded-2xl p-4">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-[#C2410C]" />
            <h3 className="font-display font-semibold text-ink text-sm">Final exam</h3>
          </div>
          {exam.passed ? (
            <p className="text-[13px] text-emerald-800 mt-2">Passed! Certificate {exam.certificateNumber}.</p>
          ) : (
            <p className="text-[13px] text-ink-body mt-2">
              {exam.canStart ? `You're ready. Pass mark ${exam.rules.passPercent}%, ${exam.rules.maxAttempts - exam.attemptsUsed} attempt(s) left.` : exam.blockedReason}
            </p>
          )}
          <Link
            href={exam.passed ? '/certificates' : `/exam/${course.slug}`}
            className={`mt-3 h-10 px-4 rounded-full text-sm font-semibold inline-flex items-center gap-2 transition ${exam.canStart || exam.passed ? 'btn-soft hover:bg-brand-hover' : 'bg-lavender text-ink'}`}
          >
            {exam.passed ? 'View certificate' : exam.canStart ? 'Start exam' : 'Exam details'} <ArrowRight className="w-4 h-4" />
          </Link>
        </section>
      )}

      <section className="bg-white border border-[#ECE9F5] rounded-2xl p-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-display font-semibold text-ink text-sm">Performance report</h3>
          <button onClick={generate} disabled={isGenerating} className="h-9 px-3 rounded-full border border-[#E2DEEF] text-xs font-semibold text-ink inline-flex items-center gap-1.5 hover:bg-[#FBFAFF] disabled:opacity-50">
            {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />} {report ? 'Refresh' : 'Generate'}
          </button>
        </div>
        {report === undefined && <p className="text-[13px] text-ink-muted mt-2">Loading…</p>}
        {report === null && !isGenerating && <p className="text-[13px] text-ink-muted mt-2">Get an AI analysis of where you&apos;re strong, what to improve and exactly what to rewatch.</p>}
        {error && <p className="text-[13px] text-amber-800 mt-2">{error}</p>}
        {report && (
          <div className="mt-3 space-y-3">
            <p className="text-[13px] text-ink"><span className="font-semibold">{report.insights.masteryLevel}:</span> {report.insights.headline}</p>
            <div className="grid grid-cols-3 gap-2 text-center">
              <Stat label="Completed" value={`${report.stats.completionPercent}%`} />
              <Stat label="Accuracy" value={report.stats.accuracyPercent === null ? '–' : `${report.stats.accuracyPercent}%`} />
              <Stat label="Exam" value={report.stats.examBestPercent === null ? '–' : `${report.stats.examBestPercent}%`} />
            </div>
            {report.insights.studyPlan.slice(0, 3).map((step, i) => (
              <button
                key={i}
                disabled={!step.lessonId}
                onClick={() => step.lessonId && onSeek(Math.max(0, step.timestampSec), step.lessonId)}
                className="w-full text-left text-[13px] bg-[#FBFAFF] border border-[#ECE9F5] rounded-xl px-3 py-2 disabled:cursor-default"
              >
                <span className="font-semibold text-ink">{step.title}</span>
                <span className="text-ink-muted"> · {step.minutes} min{step.lessonId && step.timestampSec >= 0 ? ` · from ${formatTimestamp(step.timestampSec)}` : ''}</span>
              </button>
            ))}
            <Link href={`/my-learning/report/${course.slug}`} className="text-[13px] font-semibold text-ink underline">Open full report</Link>
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[#FBFAFF] rounded-xl py-2">
      <div className="font-display font-semibold text-ink">{value}</div>
      <div className="text-[11px] text-ink-muted">{label}</div>
    </div>
  );
}

function PanelLoading() {
  return (
    <div className="flex-1 flex items-center justify-center bg-[#FBFAFF] text-ink-muted text-sm gap-2">
      <Loader2 className="w-4 h-4 animate-spin" /> Loading…
    </div>
  );
}
