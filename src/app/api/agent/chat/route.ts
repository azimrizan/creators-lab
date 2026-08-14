import { NextResponse } from 'next/server';
import { generateContentWithFallback } from '@/lib/gemini';
import { getRelevantTranscriptChunks } from '@/lib/transcripts/visual-storytelling';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message, conversationHistory = [] } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message text is required' }, { status: 400 });
    }

    // 1. Perform high-precision RAG chunk retrieval to keep token cost minimal
    const chunks = getRelevantTranscriptChunks(message, 3);
    const contextText = chunks.map(c => `[Timestamp ${c.timestampStart} - ${c.timestampEnd}] Topic: ${c.topic}\nContent: ${c.content}`).join('\n\n');

    // 2. System Instruction for AI Agent
    const systemInstruction = `You are the official AI Teaching Assistant for "Introduction to Visual Storytelling", mentored by Philip Bloom.
Your goal is to clarify student doubts in an engaging, encouraging, and expert manner.
ALWAYS base your answer on the provided video transcript context below.
Be concise, clear, and direct. Reference video timestamps (e.g. 00:03:22) when relevant.
Do NOT sound like a generic chatbot; speak as a passionate filmmaking & visual storytelling co-pilot.

TRANSCRIPT KNOWLEDGE CONTEXT:
${contextText}`;

    // 3. Construct prompt including minimal chat history
    let prompt = '';
    if (conversationHistory.length > 0) {
      const recentHistory = conversationHistory.slice(-4);
      prompt += `Previous Conversation:\n` + recentHistory.map((h: any) => `${h.role === 'user' ? 'Student' : 'AI Agent'}: ${h.content}`).join('\n') + '\n\n';
    }
    prompt += `Student Question: ${message}`;

    // 4. Query Gemini engine with fallback
    const result = await generateContentWithFallback(prompt, systemInstruction);

    // If Gemini models fail, return local intelligent synthesis
    let finalAnswer = result.text;
    if (!finalAnswer) {
      finalAnswer = `Based on Philip Bloom's lesson at timestamp ${chunks[0].timestampStart}, ${chunks[0].content.slice(0, 200)}...`;
    }

    return NextResponse.json({
      success: true,
      answer: finalAnswer,
      modelUsed: result.modelUsed,
      relevantTimestamps: chunks.map(c => ({ timestamp: c.timestampStart, topic: c.topic }))
    });
  } catch (error: any) {
    console.error('Agent chat error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
