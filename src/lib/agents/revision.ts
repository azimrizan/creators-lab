import StudyKit, { IStudyKitDocument } from '@/models/StudyKit';
import CardReview, { ICardReviewDocument } from '@/models/CardReview';
import LessonProgress from '@/models/LessonProgress';
import { ApiError } from '@/lib/ai/guard';

export type ReviewGrade = 'again' | 'hard' | 'good' | 'easy';

const GRADE_QUALITY: Record<ReviewGrade, number> = { again: 1, hard: 3, good: 4, easy: 5 };

/** Approved revision kit for a lesson, with this learner's card schedule. */
export async function studyKitForLearner(userId: string | null, courseSlug: string, lessonId: string) {
  const kit = await StudyKit.findOne({ courseSlug, lessonId, status: 'APPROVED' }).lean<IStudyKitDocument>();
  if (!kit) return null;

  const reviews = userId
    ? await CardReview.find({ userId, cardId: { $in: kit.cards.map(c => c.cardId) } }).lean<ICardReviewDocument[]>()
    : [];
  const now = Date.now();

  return {
    summary: kit.summary,
    keyPoints: kit.keyPoints,
    cards: kit.cards.map(card => {
      const review = reviews.find(r => r.cardId === card.cardId);
      return {
        ...card,
        reviewed: Boolean(review),
        due: !review || new Date(review.dueAt).getTime() <= now,
        intervalDays: review?.intervalDays || 0
      };
    })
  };
}

/**
 * Cards due today across all courses: scheduled reviews that are due, plus new cards from
 * lessons the learner has completed.
 */
export async function dueCards(userId: string, limit = 30) {
  const now = new Date();
  const [due, completed] = await Promise.all([
    CardReview.find({ userId, dueAt: { $lte: now } }).sort({ dueAt: 1 }).limit(limit).lean<ICardReviewDocument[]>(),
    LessonProgress.find({ userId, completed: true }).select('courseSlug lessonId').lean<Array<{ courseSlug: string; lessonId: string }>>()
  ]);

  const kitKeys = new Map<string, { courseSlug: string; lessonId: string }>();
  [...due, ...completed].forEach(x => kitKeys.set(`${x.courseSlug}:${x.lessonId}`, { courseSlug: x.courseSlug, lessonId: x.lessonId }));
  if (!kitKeys.size) return { cards: [], dueCount: 0 };

  const kits = await StudyKit.find({ status: 'APPROVED', $or: Array.from(kitKeys.values()) }).lean<IStudyKitDocument[]>();
  const allReviewed = await CardReview.find({ userId, cardId: { $in: kits.flatMap(k => k.cards.map(c => c.cardId)) } }).select('cardId').lean<Array<{ cardId: string }>>();
  const reviewedIds = new Set(allReviewed.map(r => r.cardId));

  const cards: Array<{ courseSlug: string; lessonId: string; cardId: string; front: string; back: string; timestampSec: number; isNew: boolean }> = [];
  for (const review of due) {
    const kit = kits.find(k => k.courseSlug === review.courseSlug && k.lessonId === review.lessonId);
    const card = kit?.cards.find(c => c.cardId === review.cardId);
    if (kit && card) cards.push({ courseSlug: kit.courseSlug, lessonId: kit.lessonId, ...card, isNew: false });
  }
  for (const kit of kits) {
    if (!completed.some(c => c.courseSlug === kit.courseSlug && c.lessonId === kit.lessonId)) continue;
    for (const card of kit.cards) {
      if (cards.length >= limit) break;
      if (!reviewedIds.has(card.cardId)) cards.push({ courseSlug: kit.courseSlug, lessonId: kit.lessonId, ...card, isNew: true });
    }
  }

  return { cards: cards.slice(0, limit), dueCount: cards.length };
}

/** Records a flashcard review and schedules the next one (SM-2 spaced repetition). */
export async function reviewCard(userId: string, courseSlug: string, lessonId: string, cardId: string, grade: ReviewGrade) {
  const quality = GRADE_QUALITY[grade];
  if (!quality) throw new ApiError(400, 'Invalid grade.');

  const kit = await StudyKit.findOne({ courseSlug, lessonId, status: 'APPROVED', 'cards.cardId': cardId }).select('_id').lean();
  if (!kit) throw new ApiError(404, 'Card not found.');

  const review = (await CardReview.findOne({ userId, cardId })) || new CardReview({ userId, courseSlug, lessonId, cardId });

  if (quality < 3) {
    review.reps = 0;
    review.lapses += 1;
    review.intervalDays = 0;
    review.dueAt = new Date(Date.now() + 10 * 60_000);
  } else {
    review.reps += 1;
    if (review.reps === 1) review.intervalDays = quality === 5 ? 3 : 1;
    else if (review.reps === 2) review.intervalDays = quality === 5 ? 7 : 4;
    else review.intervalDays = Math.round(review.intervalDays * review.ease * (quality === 5 ? 1.3 : quality === 3 ? 0.8 : 1));
    review.intervalDays = Math.min(review.intervalDays, 365);
    review.dueAt = new Date(Date.now() + review.intervalDays * 86400_000);
  }
  review.ease = Math.max(1.3, review.ease + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));
  review.lastReviewedAt = new Date();
  await review.save();

  return { intervalDays: review.intervalDays, dueAt: review.dueAt };
}
