import { NextResponse } from 'next/server';
import Attempt from '@/models/Attempt';
import LessonProgress from '@/models/LessonProgress';
import { getSessionUser } from '@/lib/auth';
import { findCourse, allLessons } from '@/lib/courses';
import { ApiError, errorResponse } from '@/lib/ai/guard';
import { connectToDatabase } from '@/lib/mongodb';

/** Grades a lesson quiz on the server (answers are never sent to the browser) and records the attempt. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: quizId } = await params;
    const { answers = {}, courseId, lessonId } = await request.json();

    const course = await findCourse(String(courseId || ''));
    if (!course) throw new ApiError(404, 'Course not found');

    const lesson = allLessons(course).find(l => l.quiz && (l.quiz.id === quizId || l.id === lessonId));
    const quiz = lesson?.quiz;
    if (!lesson || !quiz) throw new ApiError(404, 'Quiz not found');

    const questionResults = quiz.questions.map(q => {
      const selected = typeof answers[q.id] === 'number' ? answers[q.id] : -1;
      return {
        questionId: q.id,
        userSelected: selected,
        correctOptionIndex: q.correctOptionIndex,
        isCorrect: selected === q.correctOptionIndex,
        explanation: q.explanation
      };
    });

    const correctCount = questionResults.filter(r => r.isCorrect).length;
    const scorePercent = quiz.questions.length ? Math.round((correctCount / quiz.questions.length) * 100) : 0;
    const passed = scorePercent >= quiz.passingScorePercent;

    const user = getSessionUser(request);
    if (user) {
      try {
        await connectToDatabase();
        await Attempt.insertMany(
          quiz.questions.map((q, i) => ({
            userId: user.userId,
            courseSlug: course.slug,
            lessonId: lesson.id,
            kind: 'LESSON_QUIZ',
            refId: `${quiz.id}:${q.id}:${Date.now()}`,
            topic: quiz.title,
            question: q.question,
            correct: questionResults[i].isCorrect,
            points: questionResults[i].isCorrect ? 1 : 0,
            maxPoints: 1
          }))
        );
        if (passed) {
          await LessonProgress.updateOne(
            { userId: user.userId, courseSlug: course.slug, lessonId: lesson.id },
            { $set: { completed: true, completedAt: new Date() } },
            { upsert: true }
          );
        }
      } catch {
        // Grading still works without the database; the attempt just isn't saved.
      }
    }

    return NextResponse.json({
      success: true,
      scorePercent,
      passed,
      passingScorePercent: quiz.passingScorePercent,
      correctCount,
      totalQuestions: quiz.questions.length,
      questionResults
    });
  } catch (error) {
    return errorResponse(error);
  }
}
