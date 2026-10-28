import { Course, Lesson } from './types';

// Pure helpers shared by server and browser code (no database imports here).

export function allLessons(course: Course): Lesson[] {
  return (course.sections || [])
    .slice()
    .sort((a, b) => a.order - b.order)
    .flatMap(s => s.lessons.slice().sort((a, b) => a.order - b.order));
}

/** Removes quiz answers so they never reach the browser. Grading happens server-side. */
export function stripQuizAnswers<T extends Course>(course: T): T {
  return {
    ...course,
    sections: (course.sections || []).map(section => ({
      ...section,
      lessons: section.lessons.map(lesson =>
        lesson.quiz
          ? {
              ...lesson,
              quiz: {
                ...lesson.quiz,
                questions: lesson.quiz.questions.map(q => ({ ...q, correctOptionIndex: -1, explanation: '' }))
              }
            }
          : lesson
      )
    }))
  };
}

export function formatTimestamp(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = String(m).padStart(h > 0 ? 2 : 1, '0');
  return h > 0 ? `${h}:${mm}:${String(sec).padStart(2, '0')}` : `${mm}:${String(sec).padStart(2, '0')}`;
}

/** Parses "m:ss" or "h:mm:ss" into seconds. */
export function parseTimestamp(text: string): number | null {
  const parts = text.split(':').map(Number);
  if (parts.some(n => !Number.isFinite(n))) return null;
  return parts.reduce((total, n) => total * 60 + n, 0);
}
