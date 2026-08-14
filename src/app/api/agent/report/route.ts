import { NextResponse } from 'next/server';
import { VISUAL_STORYTELLING_10_MCQS } from '@/lib/transcripts/visual-storytelling';
import { generateContentWithFallback } from '@/lib/gemini';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userAnswers = {} } = body; // Record<questionId, chosenOptionIndex>

    let score = 0;
    const total = VISUAL_STORYTELLING_10_MCQS.length;
    const itemAnalysis: Array<{
      questionId: string;
      question: string;
      chosenOptionIndex: number;
      chosenOptionText: string;
      correctOptionIndex: number;
      correctOptionText: string;
      isCorrect: boolean;
      explanation: string;
      timestamp: string;
    }> = [];

    const missedTopics: string[] = [];

    VISUAL_STORYTELLING_10_MCQS.forEach((q) => {
      const chosen = userAnswers[q.id];
      const isCorrect = chosen === q.correctOptionIndex;

      if (isCorrect) {
        score++;
      } else {
        missedTopics.push(q.question);
      }

      itemAnalysis.push({
        questionId: q.id,
        question: q.question,
        chosenOptionIndex: chosen ?? -1,
        chosenOptionText: chosen !== undefined && chosen >= 0 ? q.options[chosen] : 'No answer selected',
        correctOptionIndex: q.correctOptionIndex,
        correctOptionText: q.options[q.correctOptionIndex],
        isCorrect,
        explanation: q.explanation,
        timestamp: q.timestamp
      });
    });

    const scorePercentage = Math.round((score / total) * 100);

    // Call Gemini to generate a personalized AI diagnostic analysis
    const prompt = `A student just completed the 10-question MCQ quiz on "Introduction to Visual Storytelling".
Score: ${score}/${total} (${scorePercentage}%).
Missed Questions/Topics:
${missedTopics.length > 0 ? missedTopics.map(t => `- ${t}`).join('\n') : 'None! Perfect score!'}

Generate a short, empowering 3-bullet student performance summary:
1. "Where to Improve" (Identify specific visual storytelling areas like lens choice, framing, composition, or compression)
2. "What to Improve" (Specific actionable study recommendations based on timestamps in the video)
3. "Mastery Status" (A catchy title like "Apprentice Cinematographer" or "Master Storyteller")

Keep the response concise, formatted nicely with bullet points.`;

    const systemInstruction = `You are the lead AI Assessment Analyst for Philip Bloom's Visual Storytelling Masterclass. Provide crisp, professional feedback.`;

    const geminiResult = await generateContentWithFallback(prompt, systemInstruction);

    let aiFeedback = geminiResult.text;
    if (!aiFeedback) {
      aiFeedback = `• Where to Improve: Focus on ${scorePercentage >= 70 ? 'advanced lens compression and focal lengths' : 'core Rule of Thirds and composition principles'}.\n• What to Improve: Re-watch timestamp segments around 00:03:00 to 00:09:00 for framing and camera language.\n• Mastery Status: ${scorePercentage >= 80 ? 'Master Storyteller' : scorePercentage >= 50 ? 'Intermediate Filmmaker' : 'Apprentice Storyteller'}`;
    }

    return NextResponse.json({
      success: true,
      score,
      total,
      scorePercentage,
      aiFeedback,
      itemAnalysis,
      modelUsed: geminiResult.modelUsed
    });
  } catch (error: any) {
    console.error('Report endpoint error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
