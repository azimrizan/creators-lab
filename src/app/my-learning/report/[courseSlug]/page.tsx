'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { ArrowLeft, Loader2, RefreshCw, TrendingUp, AlertTriangle, PlayCircle, Lightbulb, ChevronDown } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { formatTimestamp } from '@/lib/courseUtils';
import { agentGet, agentSend } from '@/components/agents/agentClient';

interface Report {
  createdAt: string;
  trigger: string;
  stats: {
    lessonsTotal: number;
    lessonsCompleted: number;
    completionPercent: number;
    watchMinutes: number;
    rewatchCount: number;
    questionsAnswered: number;
    accuracyPercent: number | null;
    examBestPercent: number | null;
    examPassed: boolean;
    topics: Array<{ topic: string; correct: number; total: number; accuracyPercent: number }>;
  };
  insights: {
    headline: string;
    masteryLevel: string;
    summary: string;
    strengths: Array<{ topic: string; evidence: string }>;
    weaknesses: Array<{ topic: string; evidence: string; likelyCause: string }>;
    studyPlan: Array<{ title: string; detail: string; lessonId: string; timestampSec: number; minutes: number }>;
    practiceQuestions: Array<{ question: string; hint: string }>;
    nextSteps: string[];
  };
}

export default function ReportPage() {
  const { courseSlug } = useParams<{ courseSlug: string }>();
  const searchParams = useSearchParams();
  const { courses, currentUser } = useAppStore();
  const course = courses.find(c => c.slug === courseSlug);
  const lessonTitle = (id: string) => course?.sections.flatMap(s => s.lessons).find(l => l.id === id)?.title || '';

  const [report, setReport] = useState<Report | null | undefined>(undefined);
  const [isGenerating, setIsGenerating] = useState(() => Boolean(searchParams.get('trigger')));
  const [error, setError] = useState('');
  const [openHints, setOpenHints] = useState<Record<number, boolean>>({});
  const startedFor = useRef('');

  const generate = useCallback(async (trigger?: string) => {
    setIsGenerating(true);
    setError('');
    try {
      const data = await agentSend<{ report: Report }>('/api/ai/report', { courseId: courseSlug, trigger });
      setReport(data.report);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create the report.');
      setReport(prev => prev ?? null);
    } finally {
      setIsGenerating(false);
    }
  }, [courseSlug]);

  useEffect(() => {
    if (currentUser.id === 'guest' || startedFor.current === currentUser.id) return;
    startedFor.current = currentUser.id;
    const trigger = searchParams.get('trigger');
    if (trigger) {
      agentSend<{ report: Report }>('/api/ai/report', { courseId: courseSlug, trigger })
        .then(data => setReport(data.report))
        .catch(err => { setError(err.message); setReport(null); })
        .finally(() => setIsGenerating(false));
      return;
    }
    agentGet<{ report: Report | null }>(`/api/ai/report?courseId=${encodeURIComponent(courseSlug)}&weekly=1`)
      .then(d => setReport(d.report))
      .catch(err => { setError(err.message); setReport(null); });
  }, [currentUser.id, courseSlug, searchParams]);

  return (
    <div className="min-h-screen bg-[#FBFAFF] pt-24 sm:pt-28 pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <Link href="/my-learning" className="inline-flex items-center gap-2 text-sm font-medium text-ink-muted hover:text-ink">
          <ArrowLeft className="w-4 h-4" /> My Learning
        </Link>

        <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-[0.12em] text-ink-muted">PERFORMANCE REPORT</p>
            <h1 className="font-display font-semibold text-2xl sm:text-3xl text-ink leading-tight">{course?.title || courseSlug}</h1>
            {report && <p className="text-sm text-ink-muted mt-1">Updated {new Date(report.createdAt).toLocaleString()}</p>}
          </div>
          {currentUser.id !== 'guest' && (
            <button onClick={() => generate()} disabled={isGenerating} className="h-11 px-5 rounded-full btn-soft text-sm font-semibold inline-flex items-center gap-2 disabled:opacity-60">
              {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />} {report ? 'Refresh report' : 'Generate report'}
            </button>
          )}
        </div>

        {currentUser.id === 'guest' && <p className="mt-8 text-ink-muted">Please sign in to see your report.</p>}
        {error && <p className="mt-6 text-sm text-amber-900 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3">{error}</p>}
        {(report === undefined || (isGenerating && !report)) && currentUser.id !== 'guest' && (
          <div className="mt-10 flex items-center gap-2 text-ink-muted"><Loader2 className="w-5 h-5 animate-spin" /> {isGenerating ? 'Analysing your progress…' : 'Loading…'}</div>
        )}
        {report === null && !isGenerating && !error && (
          <p className="mt-8 text-ink-muted">No report yet. Generate one to see your strengths, gaps and a study plan.</p>
        )}

        {report && (
          <div className="mt-8 space-y-6">
            <section className="bg-white border border-[#ECE9F5] rounded-3xl p-6">
              <span className="inline-flex text-xs font-semibold text-ink bg-lavender rounded-full px-3 py-1">{report.insights.masteryLevel}</span>
              <h2 className="mt-3 font-display font-semibold text-xl text-ink">{report.insights.headline}</h2>
              <p className="mt-2 text-ink-body leading-relaxed">{report.insights.summary}</p>
              <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Stat label="Lessons done" value={`${report.stats.lessonsCompleted}/${report.stats.lessonsTotal}`} />
                <Stat label="Quiz accuracy" value={report.stats.accuracyPercent === null ? '–' : `${report.stats.accuracyPercent}%`} />
                <Stat label="Watch time" value={`${report.stats.watchMinutes} min`} />
                <Stat label="Exam best" value={report.stats.examBestPercent === null ? '–' : `${report.stats.examBestPercent}%`} />
              </div>
            </section>

            {report.stats.topics.length > 0 && (
              <section className="bg-white border border-[#ECE9F5] rounded-3xl p-6">
                <h3 className="font-display font-semibold text-ink">Accuracy by topic</h3>
                <div className="mt-4 space-y-3">
                  {report.stats.topics.map(t => (
                    <div key={t.topic}>
                      <div className="flex justify-between text-sm"><span className="text-ink">{t.topic}</span><span className="text-ink-muted">{t.correct}/{t.total} · {t.accuracyPercent}%</span></div>
                      <div className="mt-1 h-2 rounded-full bg-lavender overflow-hidden">
                        <div className={`h-full rounded-full ${t.accuracyPercent >= 80 ? 'bg-emerald-500' : t.accuracyPercent >= 50 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${Math.max(4, t.accuracyPercent)}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <section className="bg-white border border-[#ECE9F5] rounded-3xl p-6">
                <h3 className="font-display font-semibold text-ink flex items-center gap-2"><TrendingUp className="w-5 h-5 text-emerald-600" /> Strengths</h3>
                <ul className="mt-3 space-y-3">
                  {report.insights.strengths.map((s, i) => (
                    <li key={i}><p className="text-sm font-semibold text-ink">{s.topic}</p><p className="text-sm text-ink-body">{s.evidence}</p></li>
                  ))}
                  {!report.insights.strengths.length && <li className="text-sm text-ink-muted">Not enough data yet.</li>}
                </ul>
              </section>
              <section className="bg-white border border-[#ECE9F5] rounded-3xl p-6">
                <h3 className="font-display font-semibold text-ink flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-amber-600" /> Where you&apos;re losing marks</h3>
                <ul className="mt-3 space-y-3">
                  {report.insights.weaknesses.map((w, i) => (
                    <li key={i}>
                      <p className="text-sm font-semibold text-ink">{w.topic}</p>
                      <p className="text-sm text-ink-body">{w.evidence}</p>
                      <p className="text-sm text-ink-muted mt-0.5">Likely cause: {w.likelyCause}</p>
                    </li>
                  ))}
                  {!report.insights.weaknesses.length && <li className="text-sm text-ink-muted">No clear gaps found.</li>}
                </ul>
              </section>
            </div>

            <section className="bg-white border border-[#ECE9F5] rounded-3xl p-6">
              <h3 className="font-display font-semibold text-ink">Your study plan</h3>
              <ol className="mt-4 space-y-3">
                {report.insights.studyPlan.map((step, i) => (
                  <li key={i} className="flex gap-3 rounded-2xl bg-[#FBFAFF] border border-[#ECE9F5] p-4">
                    <span className="w-7 h-7 rounded-full btn-soft text-xs font-semibold flex items-center justify-center shrink-0">{i + 1}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-ink">{step.title} <span className="font-normal text-ink-muted">· {step.minutes} min</span></p>
                      <p className="text-sm text-ink-body mt-0.5">{step.detail}</p>
                      {step.lessonId && (
                        <Link href={`/watch/${courseSlug}/${step.lessonId}${step.timestampSec > 0 ? `?t=${step.timestampSec}` : ''}`} className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-ink underline">
                          <PlayCircle className="w-4 h-4" /> {lessonTitle(step.lessonId) || 'Open lesson'}{step.timestampSec > 0 ? ` at ${formatTimestamp(step.timestampSec)}` : ''}
                        </Link>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            </section>

            {report.insights.practiceQuestions.length > 0 && (
              <section className="bg-white border border-[#ECE9F5] rounded-3xl p-6">
                <h3 className="font-display font-semibold text-ink flex items-center gap-2"><Lightbulb className="w-5 h-5 text-amber-500" /> Practice on your weak spots</h3>
                <ul className="mt-4 space-y-3">
                  {report.insights.practiceQuestions.map((q, i) => (
                    <li key={i} className="rounded-2xl border border-[#ECE9F5] p-4">
                      <p className="text-sm text-ink">{q.question}</p>
                      <button onClick={() => setOpenHints(h => ({ ...h, [i]: !h[i] }))} className="mt-2 text-sm font-semibold text-ink-muted inline-flex items-center gap-1">
                        {openHints[i] ? 'Hide hint' : 'Show hint'} <ChevronDown className={`w-4 h-4 transition ${openHints[i] ? 'rotate-180' : ''}`} />
                      </button>
                      {openHints[i] && <p className="mt-1 text-sm text-ink-body">{q.hint}</p>}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {report.insights.nextSteps.length > 0 && (
              <section className="panel-soft text-ink rounded-3xl p-6">
                <h3 className="font-display font-semibold">Next steps</h3>
                <ul className="mt-2 space-y-1.5 text-sm text-ink-body">
                  {report.insights.nextSteps.map((s, i) => <li key={i}>• {s}</li>)}
                </ul>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[#FBFAFF] rounded-2xl py-3 text-center">
      <div className="font-display font-semibold text-lg text-ink">{value}</div>
      <div className="text-xs text-ink-muted mt-0.5">{label}</div>
    </div>
  );
}
