import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { connectToDatabase } from '@/lib/mongodb';
import Course from '@/models/Course';
import User from '@/models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-key-learnhub-2026-production';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: quizId } = await params;
    const { answers, courseId, lessonId } = await request.json();

    const cookieHeader = request.headers.get('cookie') || '';
    const tokenMatch = cookieHeader.match(/token=([^;]+)/);
    const token = tokenMatch ? tokenMatch[1] : null;

    let userId = 'guest';
    if (token) {
      try {
        const decoded: any = jwt.verify(token, JWT_SECRET);
        userId = decoded.userId;
      } catch (e) {}
    }

    await connectToDatabase();
    const course = await Course.findById(courseId);

    if (!course) {
      return NextResponse.json({ success: false, error: 'Course not found' }, { status: 404 });
    }

    // Find quiz in curriculum tree
    let targetQuiz: any = null;
    for (const section of course.sections) {
      for (const lesson of section.lessons) {
        if (lesson.quiz && (lesson.quiz.id === quizId || lesson.id === lessonId)) {
          targetQuiz = lesson.quiz;
          break;
        }
      }
    }

    if (!targetQuiz) {
      targetQuiz = {
        passingScorePercent: 70,
        questions: [
          { id: 'q1', correctOptionIndex: 0, explanation: 'Mongoose provides strongly typed schema validation.' },
          { id: 'q2', correctOptionIndex: 1, explanation: 'State-changing operations must use POST/PUT/DELETE.' }
        ]
      };
    }

    let correctCount = 0;
    const questionResults: any[] = [];

    targetQuiz.questions.forEach((q: any) => {
      const userSelected = answers[q.id];
      const isCorrect = userSelected === q.correctOptionIndex;
      if (isCorrect) correctCount++;

      questionResults.push({
        questionId: q.id,
        userSelected,
        correctOptionIndex: q.correctOptionIndex,
        isCorrect,
        explanation: q.explanation
      });
    });

    const scorePercent = Math.round((correctCount / targetQuiz.questions.length) * 100);
    const passed = scorePercent >= targetQuiz.passingScorePercent;

    if (passed && userId !== 'guest') {
      const dbUser = await User.findById(userId);
      if (dbUser) {
        if (!dbUser.enrolledCourseIds.includes(courseId)) {
          dbUser.enrolledCourseIds.push(courseId);
        }
        await dbUser.save();
      }
    }

    return NextResponse.json({
      success: true,
      scorePercent,
      passed,
      correctCount,
      totalQuestions: targetQuiz.questions.length,
      questionResults
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
