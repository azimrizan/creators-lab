'use client';

import React, { useMemo, useState } from 'react';
import { CheckCircle2, XCircle, RotateCcw, ArrowRight, Sparkles, Loader2 } from 'lucide-react';
import { formatTimestamp } from '@/lib/courseUtils';
import { agentSend } from './agentClient';

export interface LearnerCheckpoint {
  id: string;
  atSec: number;
  rewatchFromSec: number;
  topic: string;
  questions: Array<{ qid: string; question: string; options: string[]; answered: boolean }>;
  cleared: boolean;
}

interface Props {
  checkpoint: LearnerCheckpoint;
  checkpointNumber: number;
  totalCheckpoints: number;
  onRewatch: (seconds: number) => void;
  onComplete: () => void;
}

interface AnswerResult {
  correct: boolean;
  correctIndex: number;
  explanation: string;
}

/**
 * The in-video quiz: the video pauses at a checkpoint and the learner answers to continue.
 * Answers are graded on the server. A wrong answer offers a rewatch and a fresh follow-up question.
 */
export default function CheckpointOverlay({ checkpoint, checkpointNumber, totalCheckpoints, onRewatch, onComplete }: Props) {
  const pending = useMemo(() => checkpoint.questions.filter(q => !q.answered), [checkpoint]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [result, setResult] = useState<AnswerResult | null>(null);
  const [followUp, setFollowUp] = useState<{ followUpId: string; question: string; options: string[] } | null>(null);
  const [followUpSelected, setFollowUpSelected] = useState<number | null>(null);
  const [followUpResult, setFollowUpResult] = useState<AnswerResult | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState('');

  const question = pending[index];
  const isLast = index >= pending.length - 1;

  const next = () => {
    if (isLast) {
      onComplete();
      return;
    }
    setIndex(i => i + 1);
    setSelected(null);
    setResult(null);
    setFollowUp(null);
    setFollowUpSelected(null);
    setFollowUpResult(null);
  };

  const submit = async (choice: number) => {
    if (!question || isBusy) return;
    setSelected(choice);
    setIsBusy(true);
    setError('');
    try {
      const data = await agentSend<AnswerResult>('/api/ai/checkpoints', { action: 'answer', checkpointId: checkpoint.id, qid: question.qid, choice });
      setResult(data);
    } catch (err) {
      setSelected(null);
      setError(err instanceof Error ? err.message : 'Could not check your answer.');
    } finally {
      setIsBusy(false);
    }
  };

  const requestFollowUp = async () => {
    if (!question) return;
    setIsBusy(true);
    setError('');
    try {
      const data = await agentSend<{ followUpId: string; question: string; options: string[] }>('/api/ai/checkpoints', { action: 'follow_up', checkpointId: checkpoint.id, qid: question.qid });
      setFollowUp(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create a follow-up question.');
    } finally {
      setIsBusy(false);
    }
  };

  const submitFollowUp = async (choice: number) => {
    if (!followUp || isBusy) return;
    setFollowUpSelected(choice);
    setIsBusy(true);
    setError('');
    try {
      const data = await agentSend<AnswerResult>('/api/ai/checkpoints', { action: 'answer_follow_up', followUpId: followUp.followUpId, choice });
      setFollowUpResult(data);
    } catch (err) {
      setFollowUpSelected(null);
      setError(err instanceof Error ? err.message : 'Could not check your answer.');
    } finally {
      setIsBusy(false);
    }
  };

  if (!question) return null;

  const activeOptions = followUp ? followUp.options : question.options;
  const activeSelected = followUp ? followUpSelected : selected;
  const activeResult = followUp ? followUpResult : result;
  const onChoose = followUp ? submitFollowUp : submit;

  return (
    <div className="absolute inset-0 z-30 bg-[#17142B]/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6">
      <div role="dialog" aria-label="Checkpoint question" className="w-full max-w-xl max-h-full overflow-y-auto bg-white rounded-3xl p-5 sm:p-6 shadow-2xl">
        <div className="flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.1em] text-ink-muted uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            Checkpoint {checkpointNumber} of {totalCheckpoints}
          </span>
          <span className="text-xs font-medium text-ink-muted bg-lavender rounded-full px-2.5 py-1">{checkpoint.topic}</span>
        </div>

        <h3 className="mt-3 font-display font-semibold text-ink text-base sm:text-lg leading-snug">
          {followUp ? followUp.question : question.question}
        </h3>
        {followUp && <p className="mt-1 text-xs text-ink-muted">A fresh question on the same idea.</p>}

        <div className="mt-4 space-y-2">
          {activeOptions.map((option, i) => {
            const isChosen = activeSelected === i;
            const isCorrect = activeResult && i === activeResult.correctIndex;
            const isWrongChoice = activeResult && isChosen && !activeResult.correct;
            return (
              <button
                key={i}
                onClick={() => onChoose(i)}
                disabled={Boolean(activeResult) || isBusy}
                className={`w-full text-left min-h-12 px-4 py-3 rounded-2xl border text-sm flex items-start gap-3 transition ${
                  isCorrect
                    ? 'bg-emerald-50 border-emerald-400 text-emerald-950'
                    : isWrongChoice
                      ? 'bg-red-50 border-red-300 text-red-950'
                      : isChosen
                        ? 'bg-lavender border-ink-muted text-ink'
                        : 'bg-white border-[#E2DEEF] text-ink-body hover:border-[#CFC8E6] hover:bg-[#FBFAFF]'
                } disabled:cursor-default`}
              >
                <span className="w-6 h-6 rounded-full border border-current/30 text-xs font-semibold flex items-center justify-center shrink-0">{String.fromCharCode(65 + i)}</span>
                <span className="flex-1 leading-relaxed">{option}</span>
                {isCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />}
                {isWrongChoice && <XCircle className="w-5 h-5 text-red-500 shrink-0" />}
              </button>
            );
          })}
        </div>

        {isBusy && !activeResult && (
          <p className="mt-3 text-sm text-ink-muted inline-flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Checking…</p>
        )}
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        {activeResult && (
          <div className={`mt-4 rounded-2xl p-4 text-sm leading-relaxed ${activeResult.correct ? 'bg-emerald-50 text-emerald-950' : 'bg-amber-50 text-amber-950'}`}>
            <p className="font-semibold">{activeResult.correct ? 'Correct!' : 'Not quite.'}</p>
            {activeResult.explanation && <p className="mt-1">{activeResult.explanation}</p>}
          </div>
        )}

        {activeResult && (
          <div className="mt-4 flex flex-wrap gap-2">
            {!activeResult.correct && (
              <button onClick={() => onRewatch(checkpoint.rewatchFromSec)} className="h-11 px-4 rounded-full bg-lavender hover:bg-[#E2E5FF] text-ink text-sm font-semibold inline-flex items-center gap-2 transition">
                <RotateCcw className="w-4 h-4" /> Rewatch from {formatTimestamp(checkpoint.rewatchFromSec)}
              </button>
            )}
            {!activeResult.correct && !followUp && (
              <button onClick={requestFollowUp} disabled={isBusy} className="h-11 px-4 rounded-full border border-[#E2DEEF] hover:bg-[#FBFAFF] text-ink text-sm font-semibold inline-flex items-center gap-2 transition disabled:opacity-50">
                {isBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} Try another question
              </button>
            )}
            <button onClick={next} className="h-11 px-5 rounded-full btn-soft text-sm font-semibold inline-flex items-center gap-2 transition ml-auto">
              {isLast ? 'Continue watching' : 'Next question'} <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
