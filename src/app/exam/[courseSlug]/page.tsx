'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Award, Clock, CheckCircle2, XCircle, Loader2, ShieldCheck, ArrowRight } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { agentGet, agentSend } from '@/components/agents/agentClient';

interface ExamStatus {
  rules: { timeLimitMinutes: number; maxAttempts: number; passPercent: number };
  lessonsCompleted: number;
  lessonsTotal: number;
  attemptsUsed: number;
  questionCount: number;
  canStart: boolean;
  blockedReason: string;
  activeSessionId: string | null;
  passed: boolean;
  certificateNumber: string | null;
  lastResult: { sessionId: string; percent: number; passed: boolean } | null;
}

interface ExamQuestion {
  id: string;
  type: 'MCQ' | 'SHORT';
  topic: string;
  question: string;
  options: string[];
  maxPoints: number;
}

interface ExamResult {
  score: number;
  maxScore: number;
  percent: number;
  passed: boolean;
  late: boolean;
  passPercent: number;
  certificateNumber: string | null;
  results: Array<{ questionId: string; type: 'MCQ' | 'SHORT'; question: string; answer: string; points: number; maxPoints: number; feedback: string; correctAnswer: string }>;
}

type Phase = 'loading' | 'intro' | 'taking' | 'submitting' | 'result' | 'error';

export default function ExamPage() {
  const { courseSlug } = useParams<{ courseSlug: string }>();
  const router = useRouter();
  const { courses, currentUser, fetchCertificatesFromApi } = useAppStore();
  const course = courses.find(c => c.slug === courseSlug);

  const [phase, setPhase] = useState<Phase>('loading');
  const [status, setStatus] = useState<ExamStatus | null>(null);
  const [error, setError] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [expiresAt, setExpiresAt] = useState(0);
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, number | string>>({});
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [result, setResult] = useState<ExamResult | null>(null);
  const submittedRef = useRef(false);

  const loadStatus = useCallback(() => {
    return agentGet<{ status: ExamStatus }>(`/api/ai/exam?courseId=${encodeURIComponent(courseSlug)}`)
      .then(data => {
        setStatus(data.status);
        setPhase('intro');
      })
      .catch(err => {
        setError(err instanceof Error ? err.message : 'Could not load the exam.');
        setPhase('error');
      });
  }, [courseSlug]);

  const isGuest = currentUser.id === 'guest';
  useEffect(() => {
    if (!isGuest) loadStatus();
  }, [isGuest, loadStatus]);

  const start = async () => {
    setPhase('loading');
    try {
      const data = await agentSend<{ exam: { sessionId: string; expiresAt: string; questions: ExamQuestion[] } }>('/api/ai/exam', { courseId: courseSlug });
      setSessionId(data.exam.sessionId);
      setExpiresAt(new Date(data.exam.expiresAt).getTime());
      setQuestions(data.exam.questions);
      submittedRef.current = false;
      try {
        const saved = localStorage.getItem(`cl-exam-${data.exam.sessionId}`);
        if (saved) setAnswers(JSON.parse(saved));
      } catch {}
      setPhase('taking');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start the exam.');
      setPhase('error');
    }
  };

  const submit = useCallback(async () => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setPhase('submitting');
    try {
      const data = await agentSend<{ result: ExamResult }>('/api/ai/exam/submit', { courseId: courseSlug, sessionId, answers });
      setResult(data.result);
      setPhase('result');
      try { localStorage.removeItem(`cl-exam-${sessionId}`); } catch {}
      if (data.result.passed) fetchCertificatesFromApi();
    } catch (err) {
      submittedRef.current = false;
      setError(err instanceof Error ? err.message : 'Could not submit the exam.');
      setPhase('taking');
    }
  }, [courseSlug, sessionId, answers, fetchCertificatesFromApi]);

  // Countdown; submits automatically when time runs out.
  useEffect(() => {
    if (phase !== 'taking') return;
    const tick = () => {
      const left = Math.max(0, Math.round((expiresAt - Date.now()) / 1000));
      setSecondsLeft(left);
      if (left === 0) submit();
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [phase, expiresAt, submit]);

  // Keep answers if the page is refreshed mid-exam.
  useEffect(() => {
    if (phase !== 'taking' || !sessionId) return;
    try { localStorage.setItem(`cl-exam-${sessionId}`, JSON.stringify(answers)); } catch {}
  }, [answers, phase, sessionId]);

  const answeredCount = questions.filter(q => answers[q.id] !== undefined && answers[q.id] !== '').length;
  const title = course?.title || 'Final exam';

  return (
    <div className="min-h-screen bg-[#FBFAFF] pt-24 sm:pt-28 pb-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <Link href={course ? `/course/${course.slug}` : '/my-learning'} className="inline-flex items-center gap-2 text-sm font-medium text-ink-muted hover:text-ink">
          <ArrowLeft className="w-4 h-4" /> Back to course
        </Link>

        <div className="mt-4 flex items-start gap-3">
          <span className="w-12 h-12 rounded-2xl bg-[#FFF1E8] text-[#C2410C] flex items-center justify-center shrink-0"><Award className="w-6 h-6" /></span>
          <div>
            <p className="text-xs font-semibold tracking-[0.12em] text-ink-muted">FINAL EXAM</p>
            <h1 className="font-display font-semibold text-2xl sm:text-3xl text-ink leading-tight">{title}</h1>
          </div>
        </div>

        {isGuest && <p className="mt-8 text-ink">Please sign in to take the exam.</p>}

        {!isGuest && phase === 'loading' && <div className="mt-10 flex items-center gap-2 text-ink-muted"><Loader2 className="w-5 h-5 animate-spin" /> Loading…</div>}

        {phase === 'error' && (
          <div className="mt-8 bg-white border border-amber-200 rounded-3xl p-6">
            <p className="text-ink">{error}</p>
            <button onClick={() => { setError(''); setPhase('loading'); loadStatus(); }} className="mt-4 h-11 px-5 rounded-full btn-soft text-sm font-semibold">Try again</button>
          </div>
        )}

        {phase === 'intro' && status && (
          <div className="mt-8 bg-white border border-[#ECE9F5] rounded-3xl p-6 sm:p-8 space-y-6">
            {status.passed ? (
              <div className="text-center space-y-3">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <p className="font-display font-semibold text-xl text-ink">You passed this exam</p>
                <p className="text-ink-muted">Certificate {status.certificateNumber}</p>
                <Link href="/certificates" className="inline-flex h-11 px-5 rounded-full btn-soft text-sm font-semibold items-center gap-2">View certificate <ArrowRight className="w-4 h-4" /></Link>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <Rule label="Questions" value={String(status.questionCount)} />
                  <Rule label="Time limit" value={`${status.rules.timeLimitMinutes} min`} />
                  <Rule label="Pass mark" value={`${status.rules.passPercent}%`} />
                  <Rule label="Attempts left" value={String(Math.max(0, status.rules.maxAttempts - status.attemptsUsed))} />
                </div>
                <ul className="text-sm text-ink-body space-y-2">
                  <li className="flex gap-2"><ShieldCheck className="w-4 h-4 mt-0.5 shrink-0" /> Each attempt draws a different set of questions from the course question bank.</li>
                  <li className="flex gap-2"><ShieldCheck className="w-4 h-4 mt-0.5 shrink-0" /> Written answers are marked by AI against the instructor&apos;s rubric, with feedback on each.</li>
                  <li className="flex gap-2"><ShieldCheck className="w-4 h-4 mt-0.5 shrink-0" /> The exam submits automatically when time runs out. Passing earns your verifiable certificate.</li>
                </ul>
                {status.lastResult && (
                  <p className="text-sm text-ink-muted">Last attempt: {status.lastResult.percent}% ({status.lastResult.passed ? 'passed' : 'not passed'}).</p>
                )}
                {status.blockedReason && <p className="text-sm text-amber-900 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3">{status.blockedReason}</p>}
                <button onClick={start} disabled={!status.canStart} className="w-full sm:w-auto h-12 px-7 rounded-full btn-soft font-semibold disabled:opacity-40 transition">
                  {status.activeSessionId ? 'Resume exam' : 'Start exam'}
                </button>
              </>
            )}
          </div>
        )}

        {(phase === 'taking' || phase === 'submitting') && (
          <div className="mt-6 space-y-4">
            <div className="sticky top-[72px] sm:top-[88px] z-10 bg-white/95 backdrop-blur border border-[#ECE9F5] rounded-2xl px-4 py-3 flex items-center justify-between gap-3">
              <span className="text-sm text-ink-body">{answeredCount} of {questions.length} answered</span>
              <span className={`inline-flex items-center gap-1.5 font-mono font-semibold text-sm ${secondsLeft < 120 ? 'text-red-600' : 'text-ink'}`}>
                <Clock className="w-4 h-4" /> {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, '0')}
              </span>
            </div>

            {questions.map((q, i) => (
              <div key={q.id} className="bg-white border border-[#ECE9F5] rounded-3xl p-5 sm:p-6">
                <div className="flex items-center justify-between gap-2 text-xs text-ink-muted">
                  <span>Question {i + 1} · {q.topic}</span>
                  <span>{q.maxPoints} pt{q.maxPoints > 1 ? 's' : ''}</span>
                </div>
                <p className="mt-2 font-display font-semibold text-ink leading-snug">{q.question}</p>
                {q.type === 'MCQ' ? (
                  <div className="mt-4 space-y-2">
                    {q.options.map((opt, oi) => (
                      <label key={oi} className={`flex items-start gap-3 min-h-12 px-4 py-3 rounded-2xl border text-sm cursor-pointer transition ${answers[q.id] === oi ? 'bg-lavender border-ink-muted text-ink' : 'border-[#E2DEEF] text-ink-body hover:bg-[#FBFAFF]'}`}>
                        <input type="radio" name={q.id} checked={answers[q.id] === oi} onChange={() => setAnswers(a => ({ ...a, [q.id]: oi }))} className="mt-0.5 accent-brand w-4 h-4" />
                        <span className="leading-relaxed">{opt}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="mt-4">
                    <label htmlFor={`a-${q.id}`} className="sr-only">Your answer</label>
                    <textarea
                      id={`a-${q.id}`}
                      rows={5}
                      maxLength={3000}
                      value={(answers[q.id] as string) || ''}
                      onChange={e => setAnswers(a => ({ ...a, [q.id]: e.target.value }))}
                      placeholder="Write your answer in a few sentences…"
                      className="w-full rounded-2xl border border-[#E2DEEF] p-4 text-sm text-ink focus:outline-none focus:border-ink-muted"
                    />
                  </div>
                )}
              </div>
            ))}

            {error && <p className="text-sm text-red-600">{error}</p>}
            <button onClick={submit} disabled={phase === 'submitting'} className="w-full h-12 rounded-full btn-soft font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-60">
              {phase === 'submitting' ? <><Loader2 className="w-4 h-4 animate-spin" /> Marking your answers…</> : 'Submit exam'}
            </button>
          </div>
        )}

        {phase === 'result' && result && (
          <div className="mt-8 space-y-4">
            <div className={`rounded-3xl p-6 sm:p-8 text-center border ${result.passed ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-[#ECE9F5]'}`}>
              <p className="font-display font-semibold text-5xl text-ink">{result.percent}%</p>
              <p className="mt-2 text-ink-body">{result.score} of {result.maxScore} points · pass mark {result.passPercent}%</p>
              <p className={`mt-3 font-semibold ${result.passed ? 'text-emerald-800' : 'text-amber-800'}`}>
                {result.passed ? `Passed! Certificate ${result.certificateNumber} has been issued.` : 'Not passed this time. Your report will show exactly what to review.'}
              </p>
              {result.late && <p className="mt-2 text-sm text-amber-800">Submitted after the time limit, so answers were not counted.</p>}
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                {result.passed && <Link href="/certificates" className="h-11 px-5 rounded-full btn-soft text-sm font-semibold inline-flex items-center gap-2">View certificate</Link>}
                <button onClick={() => router.push(`/my-learning/report/${courseSlug}?trigger=AFTER_EXAM`)} className="h-11 px-5 rounded-full bg-white border border-[#E2DEEF] text-ink text-sm font-semibold">See my performance report</button>
              </div>
            </div>

            {result.results.map((r, i) => {
              const full = r.points >= r.maxPoints;
              return (
                <div key={r.questionId} className="bg-white border border-[#ECE9F5] rounded-3xl p-5">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-semibold text-ink text-sm leading-snug">{i + 1}. {r.question}</p>
                    <span className={`shrink-0 inline-flex items-center gap-1 text-xs font-semibold rounded-full px-2.5 py-1 ${full ? 'bg-emerald-50 text-emerald-800' : r.points > 0 ? 'bg-amber-50 text-amber-800' : 'bg-red-50 text-red-700'}`}>
                      {full ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />} {r.points}/{r.maxPoints}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-ink-body"><span className="text-ink-muted">Your answer:</span> {r.answer || '—'}</p>
                  {!full && r.correctAnswer && <p className="mt-1 text-sm text-ink-body"><span className="text-ink-muted">{r.type === 'MCQ' ? 'Correct answer:' : 'Model answer:'}</span> {r.correctAnswer}</p>}
                  {r.feedback && <p className="mt-2 text-sm text-ink-body bg-[#FBFAFF] rounded-xl px-3 py-2">{r.feedback}</p>}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function Rule({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[#FBFAFF] rounded-2xl py-3">
      <div className="font-display font-semibold text-xl text-ink">{value}</div>
      <div className="text-xs text-ink-muted mt-0.5">{label}</div>
    </div>
  );
}
