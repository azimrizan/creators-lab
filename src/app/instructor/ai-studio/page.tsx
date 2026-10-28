'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Wand2, Mic, CheckCheck, Eye, EyeOff, Loader2, Trash2, BarChart3, FileText, Sparkles, AlertTriangle, Languages, Play } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { formatTimestamp } from '@/lib/courseUtils';
import { agentGet, agentSend } from '@/components/agents/agentClient';
import { DUB_LANGUAGES, DubbingInfo, DubVoice, findDubLanguage } from '@/lib/dubbing/languages';

interface LessonStatus {
  lessonId: string;
  title: string;
  contentType: string;
  hasVideo: boolean;
  transcriptChunks: number;
  checkpoints: { draft: number; approved: number };
  examQuestions: { draft: number; approved: number; short: number };
  studyKit: { status: string; cards: number } | null;
}

interface Review {
  checkpoints: Array<{ _id: string; atSec: number; rewatchFromSec: number; topic: string; status: string; questions: Array<{ qid: string; question: string; options: string[]; correctIndex: number; explanation: string }> }>;
  examQuestions: Array<{ _id: string; type: 'MCQ' | 'SHORT'; topic: string; question: string; options: string[]; correctIndex: number; rubric: string; modelAnswer: string; status: string }>;
  studyKit: { summary: string; keyPoints: string[]; cards: Array<{ cardId: string; front: string; back: string }>; status: string } | null;
}

interface Analytics {
  learners: number;
  exam: { attempts: number; passRate: number | null; averagePercent: number | null };
  lessons: Array<{ lessonId: string; title: string; started: number; completed: number; completionRate: number | null; medianDropOffSec: number | null; rewatchHotspotSec: number | null; rewatchHotspotCount: number; quizAccuracy: number | null }>;
  hardestQuestions: Array<{ question: string; topic: string; accuracyPercent: number; total: number }>;
  tutorTopics: Array<{ topic: string; count: number }>;
}

interface InsightSummary {
  headline: string;
  findings: Array<{ severity: 'high' | 'medium' | 'low'; title: string; detail: string; lessonId: string }>;
  recommendations: string[];
}

/** Instructor tools: the Course Builder agent (transcribe → generate → review → approve) and Course Insights. */
export default function AIStudioPage() {
  const { courses, currentUser } = useAppStore();
  const isAdminUser = currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN' || currentUser.role === 'CONTENT_MANAGER';
  const myCourses = useMemo(
    () => courses.filter(c => isAdminUser || c.instructorId === currentUser.id || c.instructorName.includes(currentUser.name)),
    [courses, isAdminUser, currentUser.id, currentUser.name]
  );

  const [pickedSlug, setCourseSlug] = useState('');
  const [tab, setTab] = useState<'content' | 'insights'>('content');
  const courseSlug = pickedSlug || myCourses[0]?.slug || '';

  return (
    <div className="min-h-screen bg-[#FBFAFF] pt-24 sm:pt-28 pb-20">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 space-y-6">
        <Link href={isAdminUser ? '/admin' : '/instructor'} className="inline-flex items-center gap-2 text-sm font-medium text-ink-muted hover:text-ink">
          <ArrowLeft className="w-4 h-4" /> Back to dashboard
        </Link>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-[0.12em] text-ink-muted">AI STUDIO</p>
            <h1 className="font-display font-semibold text-[clamp(26px,3vw,36px)] text-ink leading-tight">Course content &amp; insights</h1>
            <p className="text-sm text-ink-muted mt-1">The AI drafts transcripts, checkpoints, flashcards and exam questions. Nothing reaches students until you approve it.</p>
          </div>
          <div>
            <label htmlFor="course-select" className="block text-xs font-semibold text-ink-muted mb-1">Course</label>
            <select
              id="course-select"
              value={courseSlug}
              onChange={e => setCourseSlug(e.target.value)}
              className="h-11 min-w-[260px] max-w-full rounded-full border border-[#E2DEEF] bg-white px-4 text-sm text-ink"
            >
              {myCourses.map(c => <option key={c.slug} value={c.slug}>{c.title}</option>)}
            </select>
          </div>
        </div>

        <div role="tablist" className="flex gap-2">
          {([['content', 'Content pipeline', Wand2], ['insights', 'Insights', BarChart3]] as const).map(([id, label, Icon]) => (
            <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)}
              className={`h-10 px-4 rounded-full text-sm font-semibold inline-flex items-center gap-2 border transition ${tab === id ? 'btn-soft' : 'bg-white text-ink-body border-[#E2DEEF] hover:bg-white'}`}>
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
        </div>

        {!myCourses.length && <p className="text-ink-muted">You don&apos;t have any courses yet.</p>}
        {courseSlug && tab === 'content' && <ContentPipeline key={courseSlug} courseSlug={courseSlug} />}
        {courseSlug && tab === 'insights' && <InsightsPanel key={courseSlug} courseSlug={courseSlug} />}
      </div>
    </div>
  );
}

function ContentPipeline({ courseSlug }: { courseSlug: string }) {
  const [lessons, setLessons] = useState<LessonStatus[] | null>(null);
  const [busy, setBusy] = useState<Record<string, string>>({});
  const [messages, setMessages] = useState<Record<string, string>>({});
  const [openReview, setOpenReview] = useState<string | null>(null);
  const [openDubbing, setOpenDubbing] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [isBatch, setIsBatch] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await agentGet<{ lessons: LessonStatus[] }>(`/api/ai/course-builder?courseId=${encodeURIComponent(courseSlug)}`);
      setLessons(data.lessons);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load the course.');
    }
  }, [courseSlug]);

  useEffect(() => { load(); }, [load]);

  const run = async (lessonId: string, action: 'transcribe' | 'generate' | 'approve') => {
    const labels = { transcribe: 'Transcribing…', generate: 'Generating…', approve: 'Approving…' };
    setBusy(b => ({ ...b, [lessonId]: labels[action] }));
    setMessages(m => ({ ...m, [lessonId]: '' }));
    try {
      const data = await agentSend<{ result: Record<string, number | boolean> }>('/api/ai/course-builder', { courseId: courseSlug, lessonId, action });
      const r = data.result;
      const msg = action === 'transcribe'
        ? `Transcribed into ${r.chunks} passages${r.cached ? ' (reused an existing transcript)' : ''}.`
        : action === 'generate'
          ? `Drafted ${r.checkpoints} checkpoints, ${r.examQuestions} exam questions and ${r.flashcards} flashcards. Review, then approve.`
          : 'Approved. Students can now see this content.';
      setMessages(m => ({ ...m, [lessonId]: msg }));
      await load();
      return true;
    } catch (err) {
      setMessages(m => ({ ...m, [lessonId]: err instanceof Error ? err.message : 'Failed.' }));
      return false;
    } finally {
      setBusy(b => {
        const next = { ...b };
        delete next[lessonId];
        return next;
      });
    }
  };

  // Transcribe and draft content for every video lesson that doesn't have any yet.
  const processAll = async () => {
    if (!lessons) return;
    setIsBatch(true);
    for (const lesson of lessons.filter(l => l.hasVideo)) {
      if (!lesson.transcriptChunks && !(await run(lesson.lessonId, 'transcribe'))) continue;
      if (!lesson.checkpoints.draft && !lesson.checkpoints.approved) await run(lesson.lessonId, 'generate');
    }
    setIsBatch(false);
  };

  if (error) return <p className="text-sm text-amber-900 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3">{error}</p>;
  if (!lessons) return <div className="flex items-center gap-2 text-ink-muted"><Loader2 className="w-5 h-5 animate-spin" /> Loading lessons…</div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-[#ECE9F5] rounded-3xl p-5">
        <div className="text-sm text-ink-body">
          <p className="font-semibold text-ink">How it works</p>
          <p>1. Transcribe each video with Whisper · 2. Generate drafts with the reasoning model · 3. Review and approve.</p>
        </div>
        <button onClick={processAll} disabled={isBatch} className="h-11 px-5 rounded-full btn-soft text-sm font-semibold inline-flex items-center gap-2 disabled:opacity-60">
          {isBatch ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} Process all new lessons
        </button>
      </div>

      {lessons.map(lesson => {
        const hasDrafts = lesson.checkpoints.draft + lesson.examQuestions.draft > 0 || lesson.studyKit?.status === 'DRAFT';
        const isBusy = Boolean(busy[lesson.lessonId]);
        return (
          <div key={lesson.lessonId} className="bg-white border border-[#ECE9F5] rounded-3xl p-5 space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-display font-semibold text-ink">{lesson.title}</p>
                <div className="mt-2 flex flex-wrap gap-1.5 text-xs">
                  <Badge tone={lesson.contentType === 'VIDEO' ? 'neutral' : 'muted'}>{lesson.contentType}</Badge>
                  {lesson.hasVideo && <Badge tone={lesson.transcriptChunks ? 'good' : 'muted'}>{lesson.transcriptChunks ? `Transcript · ${lesson.transcriptChunks} passages` : 'No transcript'}</Badge>}
                  {(lesson.checkpoints.draft + lesson.checkpoints.approved > 0) && <Badge tone={lesson.checkpoints.draft ? 'warn' : 'good'}>Checkpoints {lesson.checkpoints.approved} approved{lesson.checkpoints.draft ? ` · ${lesson.checkpoints.draft} draft` : ''}</Badge>}
                  {(lesson.examQuestions.draft + lesson.examQuestions.approved > 0) && <Badge tone={lesson.examQuestions.draft ? 'warn' : 'good'}>Exam questions {lesson.examQuestions.approved} approved{lesson.examQuestions.draft ? ` · ${lesson.examQuestions.draft} draft` : ''}</Badge>}
                  {lesson.studyKit && <Badge tone={lesson.studyKit.status === 'DRAFT' ? 'warn' : 'good'}>Flashcards {lesson.studyKit.cards} · {lesson.studyKit.status.toLowerCase()}</Badge>}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {lesson.hasVideo && (
                  <ActionButton onClick={() => run(lesson.lessonId, 'transcribe')} disabled={isBusy || isBatch} icon={<Mic className="w-4 h-4" />}>
                    {lesson.transcriptChunks ? 'Re-transcribe' : 'Transcribe'}
                  </ActionButton>
                )}
                {lesson.transcriptChunks > 0 && (
                  <ActionButton onClick={() => run(lesson.lessonId, 'generate')} disabled={isBusy || isBatch} icon={<Wand2 className="w-4 h-4" />}>
                    {lesson.checkpoints.draft + lesson.checkpoints.approved ? 'Regenerate' : 'Generate'}
                  </ActionButton>
                )}
                {(hasDrafts || lesson.checkpoints.approved > 0) && (
                  <ActionButton onClick={() => setOpenReview(openReview === lesson.lessonId ? null : lesson.lessonId)} disabled={false} icon={openReview === lesson.lessonId ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}>
                    Review
                  </ActionButton>
                )}
                {lesson.hasVideo && (
                  <ActionButton onClick={() => setOpenDubbing(openDubbing === lesson.lessonId ? null : lesson.lessonId)} disabled={false} icon={<Languages className="w-4 h-4" />}>
                    Dub
                  </ActionButton>
                )}
                {hasDrafts && (
                  <ActionButton primary onClick={() => run(lesson.lessonId, 'approve')} disabled={isBusy || isBatch} icon={<CheckCheck className="w-4 h-4" />}>
                    Approve all
                  </ActionButton>
                )}
              </div>
            </div>
            {busy[lesson.lessonId] && <p className="text-sm text-ink-muted inline-flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> {busy[lesson.lessonId]}</p>}
            {messages[lesson.lessonId] && <p className="text-sm text-ink-body">{messages[lesson.lessonId]}</p>}
            {openReview === lesson.lessonId && <ReviewPanel courseSlug={courseSlug} lessonId={lesson.lessonId} onChanged={load} />}
            {openDubbing === lesson.lessonId && <DubbingPanel courseSlug={courseSlug} lessonId={lesson.lessonId} />}
          </div>
        );
      })}
    </div>
  );
}

function ReviewPanel({ courseSlug, lessonId, onChanged }: { courseSlug: string; lessonId: string; onChanged: () => void }) {
  const [review, setReview] = useState<Review | null>(null);

  const load = useCallback(() => {
    agentGet<{ review: Review }>(`/api/ai/course-builder?courseId=${encodeURIComponent(courseSlug)}&lessonId=${encodeURIComponent(lessonId)}`).then(d => setReview(d.review)).catch(() => {});
  }, [courseSlug, lessonId]);

  useEffect(() => { load(); }, [load]);

  const remove = async (kind: 'checkpoint' | 'question', id: string) => {
    await agentSend('/api/ai/course-builder', { courseId: courseSlug, action: 'delete_item', kind, id }).catch(() => {});
    load();
    onChanged();
  };

  if (!review) return <p className="text-sm text-ink-muted">Loading drafts…</p>;

  return (
    <div className="border-t border-[#F0EEF6] pt-4 space-y-5">
      {review.studyKit && (
        <div>
          <h4 className="text-sm font-semibold text-ink flex items-center gap-2"><FileText className="w-4 h-4" /> Summary <Status s={review.studyKit.status} /></h4>
          <p className="text-sm text-ink-body mt-1">{review.studyKit.summary}</p>
          <ul className="mt-2 text-sm text-ink-body list-disc pl-5 space-y-0.5">{review.studyKit.keyPoints.map((k, i) => <li key={i}>{k}</li>)}</ul>
          <details className="mt-2">
            <summary className="text-sm font-semibold text-ink cursor-pointer">{review.studyKit.cards.length} flashcards</summary>
            <ul className="mt-2 space-y-1.5">{review.studyKit.cards.map(c => <li key={c.cardId} className="text-sm"><span className="font-medium text-ink">{c.front}</span> <span className="text-ink-muted">→ {c.back}</span></li>)}</ul>
          </details>
        </div>
      )}

      <div>
        <h4 className="text-sm font-semibold text-ink">In-video checkpoints</h4>
        <div className="mt-2 space-y-3">
          {review.checkpoints.map(cp => (
            <div key={cp._id} className="rounded-2xl bg-[#FBFAFF] border border-[#ECE9F5] p-4">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm text-ink"><span className="font-semibold">Pauses at {formatTimestamp(cp.atSec)}</span> · rewatch from {formatTimestamp(cp.rewatchFromSec)} · {cp.topic} <Status s={cp.status} /></p>
                <button onClick={() => remove('checkpoint', cp._id)} aria-label="Delete checkpoint" className="w-9 h-9 rounded-full flex items-center justify-center text-ink-muted hover:bg-red-50 hover:text-red-600 shrink-0"><Trash2 className="w-4 h-4" /></button>
              </div>
              {cp.questions.map(q => <QuestionPreview key={q.qid} question={q.question} options={q.options} correctIndex={q.correctIndex} note={q.explanation} />)}
            </div>
          ))}
          {!review.checkpoints.length && <p className="text-sm text-ink-muted">None.</p>}
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-ink">Exam question bank</h4>
        <div className="mt-2 space-y-3">
          {review.examQuestions.map(q => (
            <div key={q._id} className="rounded-2xl bg-[#FBFAFF] border border-[#ECE9F5] p-4">
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs text-ink-muted">{q.type === 'MCQ' ? 'Multiple choice' : 'Written answer (3 pts)'} · {q.topic} <Status s={q.status} /></p>
                <button onClick={() => remove('question', q._id)} aria-label="Delete question" className="w-9 h-9 rounded-full flex items-center justify-center text-ink-muted hover:bg-red-50 hover:text-red-600 shrink-0"><Trash2 className="w-4 h-4" /></button>
              </div>
              {q.type === 'MCQ'
                ? <QuestionPreview question={q.question} options={q.options} correctIndex={q.correctIndex} />
                : (
                  <div className="text-sm mt-1 space-y-1">
                    <p className="font-medium text-ink">{q.question}</p>
                    <p className="text-ink-body"><span className="text-ink-muted">Rubric:</span> {q.rubric}</p>
                    <p className="text-ink-body"><span className="text-ink-muted">Model answer:</span> {q.modelAnswer}</p>
                  </div>
                )}
            </div>
          ))}
          {!review.examQuestions.length && <p className="text-sm text-ink-muted">None.</p>}
        </div>
      </div>
    </div>
  );
}

function QuestionPreview({ question, options, correctIndex, note }: { question: string; options: string[]; correctIndex: number; note?: string }) {
  return (
    <div className="mt-2 text-sm">
      <p className="font-medium text-ink">{question}</p>
      <ul className="mt-1 space-y-0.5">
        {options.map((o, i) => <li key={i} className={i === correctIndex ? 'text-emerald-800 font-semibold' : 'text-ink-body'}>{String.fromCharCode(65 + i)}. {o}{i === correctIndex ? ' ✓' : ''}</li>)}
      </ul>
      {note && <p className="mt-1 text-ink-muted">{note}</p>}
    </div>
  );
}

function InsightsPanel({ courseSlug }: { courseSlug: string }) {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [summary, setSummary] = useState<InsightSummary | null>(null);
  const [isAnalysing, setIsAnalysing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    agentGet<{ analytics: Analytics }>(`/api/ai/insights?courseId=${encodeURIComponent(courseSlug)}`).then(d => setAnalytics(d.analytics)).catch(err => setError(err.message));
  }, [courseSlug]);

  const analyse = async () => {
    setIsAnalysing(true);
    setError('');
    try {
      const data = await agentSend<{ analytics: Analytics; summary: InsightSummary | null; message?: string }>('/api/ai/insights', { courseId: courseSlug });
      setAnalytics(data.analytics);
      setSummary(data.summary);
      if (data.message) setError(data.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed.');
    } finally {
      setIsAnalysing(false);
    }
  };

  if (!analytics) return error ? <p className="text-sm text-amber-900">{error}</p> : <div className="flex items-center gap-2 text-ink-muted"><Loader2 className="w-5 h-5 animate-spin" /> Loading…</div>;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Tile label="Active learners" value={String(analytics.learners)} />
        <Tile label="Exam attempts" value={String(analytics.exam.attempts)} />
        <Tile label="Exam pass rate" value={analytics.exam.passRate === null ? '–' : `${analytics.exam.passRate}%`} />
        <Tile label="Average exam score" value={analytics.exam.averagePercent === null ? '–' : `${analytics.exam.averagePercent}%`} />
      </div>

      <div className="bg-white border border-[#ECE9F5] rounded-3xl p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-display font-semibold text-ink">AI analysis</h3>
          <button onClick={analyse} disabled={isAnalysing} className="h-10 px-4 rounded-full btn-soft text-sm font-semibold inline-flex items-center gap-2 disabled:opacity-60">
            {isAnalysing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} Analyse with AI
          </button>
        </div>
        {error && <p className="text-sm text-ink-muted">{error}</p>}
        {summary && (
          <div className="space-y-3">
            <p className="text-ink font-semibold">{summary.headline}</p>
            {summary.findings.map((f, i) => (
              <div key={i} className="flex gap-3 rounded-2xl bg-[#FBFAFF] border border-[#ECE9F5] p-4">
                <AlertTriangle className={`w-5 h-5 shrink-0 ${f.severity === 'high' ? 'text-red-600' : f.severity === 'medium' ? 'text-amber-600' : 'text-ink-muted'}`} />
                <div className="text-sm"><p className="font-semibold text-ink">{f.title}</p><p className="text-ink-body">{f.detail}</p></div>
              </div>
            ))}
            <ul className="text-sm text-ink-body list-disc pl-5 space-y-1">{summary.recommendations.map((r, i) => <li key={i}>{r}</li>)}</ul>
          </div>
        )}
      </div>

      <div className="bg-white border border-[#ECE9F5] rounded-3xl p-5 overflow-x-auto">
        <h3 className="font-display font-semibold text-ink mb-3">Lessons</h3>
        <table className="w-full min-w-[640px] text-sm">
          <thead><tr className="text-left text-xs text-ink-muted"><th className="py-2 pr-3 font-semibold">Lesson</th><th className="pr-3 font-semibold">Started</th><th className="pr-3 font-semibold">Completion</th><th className="pr-3 font-semibold">Median drop-off</th><th className="pr-3 font-semibold">Most rewatched</th><th className="font-semibold">Quiz accuracy</th></tr></thead>
          <tbody>
            {analytics.lessons.map(l => (
              <tr key={l.lessonId} className="border-t border-[#F0EEF6]">
                <td className="py-2.5 pr-3 text-ink">{l.title}</td>
                <td className="pr-3 text-ink-body">{l.started}</td>
                <td className="pr-3 text-ink-body">{l.completionRate === null ? '–' : `${l.completionRate}%`}</td>
                <td className="pr-3 text-ink-body">{l.medianDropOffSec === null ? '–' : formatTimestamp(l.medianDropOffSec)}</td>
                <td className="pr-3 text-ink-body">{l.rewatchHotspotSec === null ? '–' : `${formatTimestamp(l.rewatchHotspotSec)} (${l.rewatchHotspotCount}×)`}</td>
                <td className="text-ink-body">{l.quizAccuracy === null ? '–' : `${l.quizAccuracy}%`}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {(analytics.hardestQuestions.length > 0 || analytics.tutorTopics.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white border border-[#ECE9F5] rounded-3xl p-5">
            <h3 className="font-display font-semibold text-ink">Hardest questions</h3>
            <ul className="mt-3 space-y-2 text-sm">{analytics.hardestQuestions.map((q, i) => <li key={i}><span className="font-semibold text-ink">{q.accuracyPercent}%</span> <span className="text-ink-body">of {q.total} · {q.question}</span></li>)}</ul>
          </div>
          <div className="bg-white border border-[#ECE9F5] rounded-3xl p-5">
            <h3 className="font-display font-semibold text-ink">What students ask the tutor</h3>
            <ul className="mt-3 space-y-2 text-sm">{analytics.tutorTopics.map(t => <li key={t.topic} className="flex justify-between"><span className="text-ink-body">{t.topic}</span><span className="font-semibold text-ink">{t.count}</span></li>)}</ul>
          </div>
        </div>
      )}
    </div>
  );
}

const DUB_STEP_LABELS: Record<string, string> = {
  queued: 'Queued',
  transcribing: 'Transcribing',
  translating: 'Translating',
  voicing: 'Recording voice',
  mixing: 'Mixing audio'
};

/** Auto-dubbing: generate AI voice-over tracks in other languages that learners can pick in the player. */
function DubbingPanel({ courseSlug, lessonId }: { courseSlug: string; lessonId: string }) {
  const { courses } = useAppStore();
  const course = courses.find(c => c.slug === courseSlug);
  const lesson = course?.sections.flatMap(s => s.lessons).find(l => l.id === lessonId);
  const videoUrl = lesson?.videoUrl || '';
  const [info, setInfo] = useState<DubbingInfo | null>(null);
  const [language, setLanguage] = useState('hi');
  const [voice, setVoice] = useState<DubVoice>('male');
  const [error, setError] = useState('');
  const [isStarting, setIsStarting] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await agentGet<DubbingInfo>(`/api/dubbing?video=${encodeURIComponent(videoUrl)}`);
      setInfo(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load dubbing status.');
    }
  }, [videoUrl]);

  useEffect(() => {
    const timer = setTimeout(load, 0);
    return () => clearTimeout(timer);
  }, [load]);

  const inFlight = info?.tracks.some(t => t.status !== 'ready' && t.status !== 'failed');
  useEffect(() => {
    if (!inFlight) return;
    const timer = setInterval(load, 4000);
    return () => clearInterval(timer);
  }, [inFlight, load]);

  const send = async (body: Record<string, string>) => {
    setError('');
    try {
      await agentSend('/api/dubbing', { courseId: courseSlug, lessonId, ...body });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed.');
    }
  };

  const start = async () => {
    setIsStarting(true);
    await send({ language, voice });
    setIsStarting(false);
  };

  if (!videoUrl) return <p className="text-sm text-ink-muted">This lesson has no video to dub.</p>;
  const taken = new Set(info?.tracks.filter(t => t.status !== 'failed').map(t => t.language));

  return (
    <div className="border-t border-[#F0EEF6] pt-4 space-y-4">
      <div className="text-sm text-ink-body">
        <p className="font-semibold text-ink">Auto-dubbing</p>
        <p>Translates the transcript and records an AI voice-over that follows the original timing. Learners choose the language from <span className="font-semibold">Audio &amp; Subtitles</span> in the player. A 10-minute lesson takes about 2–5 minutes.</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <select value={language} onChange={e => setLanguage(e.target.value)} className="h-10 rounded-full border border-[#E2DEEF] bg-white px-4 text-sm text-ink" aria-label="Language">
          {DUB_LANGUAGES.map(l => (
            <option key={l.code} value={l.code} disabled={taken.has(l.code)}>{l.label} · {l.nativeLabel}</option>
          ))}
        </select>
        <select value={voice} onChange={e => setVoice(e.target.value as DubVoice)} className="h-10 rounded-full border border-[#E2DEEF] bg-white px-4 text-sm text-ink" aria-label="Voice">
          <option value="male">Male voice</option>
          <option value="female">Female voice</option>
        </select>
        <ActionButton primary onClick={start} disabled={isStarting || taken.has(language)} icon={isStarting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Languages className="w-4 h-4" />}>
          Generate dub
        </ActionButton>
      </div>

      {error && <p className="text-sm text-amber-900 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3">{error}</p>}

      {info && info.tracks.length > 0 && (
        <ul className="space-y-2">
          {info.tracks.map(track => {
            const label = findDubLanguage(track.language)?.label || track.language;
            const running = track.status !== 'ready' && track.status !== 'failed';
            return (
              <li key={track.language} className="flex flex-wrap items-center gap-3 bg-[#FBFAFF] border border-[#ECE9F5] rounded-2xl px-4 py-3 text-sm">
                <span className="font-semibold text-ink min-w-[90px]">{label}</span>
                <span className="text-ink-muted">{track.voice === 'female' ? 'Female' : 'Male'} voice</span>
                {track.status === 'ready' && <Badge tone="good">Ready</Badge>}
                {track.status === 'failed' && <span className="text-amber-900 text-xs">{track.error || 'Failed'}</span>}
                {running && (
                  <span className="flex items-center gap-2 text-ink-muted">
                    <Loader2 className="w-4 h-4 animate-spin" /> {DUB_STEP_LABELS[track.status]} · {track.progress}%
                    <span className="w-24 h-1.5 rounded-full bg-[#ECE9F5] overflow-hidden"><span className="block h-full bg-brand" style={{ width: `${track.progress}%` }} /></span>
                  </span>
                )}
                <span className="ml-auto flex gap-2">
                  {track.audioUrl && (
                    <a href={track.audioUrl} target="_blank" rel="noreferrer" className="h-9 px-3 rounded-full bg-white border border-[#E2DEEF] text-ink text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-[#FBFAFF]">
                      <Play className="w-3.5 h-3.5" /> Listen
                    </a>
                  )}
                  {track.status === 'failed' && (
                    <button onClick={() => send({ language: track.language, voice: track.voice })} className="h-9 px-3 rounded-full bg-white border border-[#E2DEEF] text-ink text-xs font-semibold hover:bg-[#FBFAFF]">Retry</button>
                  )}
                  {!running && (
                    <button onClick={() => send({ language: track.language, action: 'delete' })} className="h-9 w-9 rounded-full bg-white border border-[#E2DEEF] text-ink-muted hover:text-red-600 inline-flex items-center justify-center" aria-label={`Delete ${label} track`}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function Badge({ children, tone }: { children: React.ReactNode; tone: 'good' | 'warn' | 'muted' | 'neutral' }) {
  const tones = { good: 'bg-emerald-50 text-emerald-800', warn: 'bg-amber-50 text-amber-900', muted: 'bg-zinc-100 text-zinc-600', neutral: 'bg-lavender text-ink' };
  return <span className={`rounded-full px-2.5 py-1 font-semibold ${tones[tone]}`}>{children}</span>;
}

function Status({ s }: { s: string }) {
  return <span className={`ml-1 text-[11px] font-semibold rounded-full px-2 py-0.5 ${s === 'APPROVED' ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-900'}`}>{s.toLowerCase()}</span>;
}

function ActionButton({ children, onClick, disabled, icon, primary }: { children: React.ReactNode; onClick: () => void; disabled: boolean; icon: React.ReactNode; primary?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled}
      className={`h-10 px-4 rounded-full text-sm font-semibold inline-flex items-center gap-2 transition disabled:opacity-50 ${primary ? 'btn-soft' : 'bg-white border border-[#E2DEEF] text-ink hover:bg-[#FBFAFF]'}`}>
      {icon} {children}
    </button>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white border border-[#ECE9F5] rounded-2xl p-4">
      <div className="font-display font-semibold text-2xl text-ink">{value}</div>
      <div className="text-xs text-ink-muted mt-0.5">{label}</div>
    </div>
  );
}
