'use client';

import React, { useState } from 'react';
import { RotateCw, CheckCircle2 } from 'lucide-react';
import { agentSend } from './agentClient';

export interface DeckCard {
  courseSlug: string;
  lessonId: string;
  cardId: string;
  front: string;
  back: string;
}

const GRADES = [
  { id: 'again', label: 'Again', hint: '10 min', className: 'border-red-200 text-red-700 hover:bg-red-50' },
  { id: 'hard', label: 'Hard', hint: 'soon', className: 'border-amber-200 text-amber-800 hover:bg-amber-50' },
  { id: 'good', label: 'Good', hint: 'later', className: 'border-[#E2DEEF] text-ink hover:bg-lavender' },
  { id: 'easy', label: 'Easy', hint: 'much later', className: 'border-emerald-200 text-emerald-800 hover:bg-emerald-50' }
] as const;

/** Spaced-repetition review: flip a card, rate how well you knew it, and the server schedules it. */
export default function FlashcardDeck({ cards, canGrade, emptyText = 'No cards due right now.' }: { cards: DeckCard[]; canGrade: boolean; emptyText?: string }) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const card = cards[index];
  if (!cards.length) return <p className="text-sm text-ink-muted">{emptyText}</p>;
  if (!card) {
    return (
      <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-5 text-center">
        <CheckCircle2 className="w-7 h-7 text-emerald-600 mx-auto" />
        <p className="mt-2 font-display font-semibold text-emerald-950">All done for now</p>
        <p className="text-sm text-emerald-900 mt-1">These cards will come back when they&apos;re due.</p>
      </div>
    );
  }

  const advance = () => {
    setFlipped(false);
    setIndex(i => i + 1);
  };

  const grade = async (g: (typeof GRADES)[number]['id']) => {
    if (!canGrade) return advance();
    setIsSaving(true);
    setError('');
    try {
      await agentSend('/api/ai/revision', { courseSlug: card.courseSlug, lessonId: card.lessonId, cardId: card.cardId, grade: g });
      advance();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs text-ink-muted">
        <span>Card {index + 1} of {cards.length}</span>
        {!canGrade && <span>Sign in to save your progress</span>}
      </div>
      <button
        onClick={() => setFlipped(f => !f)}
        className="w-full min-h-40 rounded-2xl border border-[#E2DEEF] bg-white p-5 text-left flex flex-col justify-between gap-4 hover:border-[#CFC8E6] transition"
        aria-label={flipped ? 'Show question' : 'Show answer'}
      >
        <span className="text-[11px] font-semibold tracking-[0.1em] uppercase text-ink-muted">{flipped ? 'Answer' : 'Question'}</span>
        <span className={`text-[15px] leading-relaxed ${flipped ? 'text-ink-body' : 'font-display font-semibold text-ink'}`}>{flipped ? card.back : card.front}</span>
        <span className="text-xs text-ink-muted inline-flex items-center gap-1"><RotateCw className="w-3.5 h-3.5" /> Tap to {flipped ? 'see the question' : 'reveal the answer'}</span>
      </button>
      {flipped && (
        <div className="grid grid-cols-4 gap-2">
          {GRADES.map(g => (
            <button key={g.id} onClick={() => grade(g.id)} disabled={isSaving} className={`min-h-12 rounded-xl border bg-white text-xs font-semibold flex flex-col items-center justify-center transition disabled:opacity-50 ${g.className}`}>
              {g.label}
              <span className="font-normal opacity-70">{g.hint}</span>
            </button>
          ))}
        </div>
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
