import AgentThread from '@/models/AgentThread';
import { ChatMessage } from '@/lib/ai/groq';
import { fence, UNTRUSTED_DATA_RULE } from '@/lib/ai/guard';
import { chunkAt, RetrievedChunk, searchTranscript } from '@/lib/ai/retrieval';
import { allLessons, formatTimestamp } from '@/lib/courses';
import { Course, Lesson } from '@/lib/types';

export interface TutorSource {
  lessonId: string;
  lessonTitle: string;
  startSec: number;
  topic: string;
}

const HISTORY_TURNS = 6;
const MAX_STORED_MESSAGES = 40;

/** Builds the grounded prompt for one tutor question and the sources to show the learner. */
export async function prepareTutorTurn(params: {
  course: Course;
  lesson: Lesson | null;
  atSec: number;
  message: string;
  history: Array<{ role: 'user' | 'assistant'; content: string }>;
}): Promise<{ messages: ChatMessage[]; sources: TutorSource[]; hasCourseContext: boolean }> {
  const { course, lesson, atSec, message, history } = params;
  const lessonTitles = new Map(allLessons(course).map(l => [l.id, l.title]));

  const [retrieved, playing] = await Promise.all([
    searchTranscript(course.slug, message, { lessonId: lesson?.id, limit: 5 }),
    lesson ? chunkAt(course.slug, lesson.id, atSec) : Promise.resolve(null)
  ]);

  const passages: RetrievedChunk[] = [];
  if (playing) passages.push(playing);
  retrieved.forEach(c => {
    if (!passages.some(p => p.id === c.id)) passages.push(c);
  });

  const describe = (c: RetrievedChunk) => {
    const where = c.lessonId === lesson?.id ? 'CURRENT LESSON' : `Lesson "${lessonTitles.get(c.lessonId) || c.lessonId}"`;
    return `[${where} @ ${formatTimestamp(c.startSec)} | ${c.topic}]\n${c.text}`;
  };

  const system = [
    `You are the AI tutor for the Creators Lab course "${course.title}" taught by ${course.instructorName}.`,
    'Help the student understand the material like a patient, expert teaching assistant.',
    '',
    'Grounding rules:',
    '- Base your answer on the course passages provided. Do not invent what the instructor said.',
    '- When you use a passage from the CURRENT LESSON, cite its time inline in square brackets exactly like [8:11] (never bold, never without brackets) so the student can click it to jump there.',
    '- When you use a passage from another lesson, name it: (Lesson "Title", m:ss).',
    '- If the passages do not cover the question, say plainly that this course does not cover it. You may then add a one or two sentence tip labeled "General tip (not from this course):".',
    '',
    'Teaching rules:',
    '- Be concise: usually under 170 words, using short paragraphs or bullets.',
    '- If the student asks for the answer to a quiz, checkpoint or exam question, do not give it. Give a hint and point to the part of the lesson to rewatch.',
    '- When a concept is tricky, end with one quick check-your-understanding question, without giving its answer.',
    '- Reply in the language the student writes in (Hinglish is fine).',
    UNTRUSTED_DATA_RULE
  ].join('\n');

  const contextBlock = passages.length
    ? fence('transcript', passages.map(describe).join('\n\n'))
    : '<transcript>\n(No transcript passages are available for this question.)\n</transcript>';

  const situation = lesson
    ? `The student is watching "${lesson.title}" at ${formatTimestamp(atSec)}.`
    : 'The student is browsing the course.';

  const messages: ChatMessage[] = [
    { role: 'system', content: system },
    ...history.slice(-HISTORY_TURNS).map(h => ({ role: h.role, content: h.content.slice(0, 1500) } as ChatMessage)),
    { role: 'user', content: `${situation}\n\nCourse passages:\n${contextBlock}\n\n${fence('student_message', message)}` }
  ];

  const sources: TutorSource[] = passages
    .slice(0, 4)
    .map(p => ({ lessonId: p.lessonId, lessonTitle: lessonTitles.get(p.lessonId) || '', startSec: p.startSec, topic: p.topic }));

  return { messages, sources, hasCourseContext: passages.length > 0 };
}

export async function loadTutorHistory(userId: string, courseSlug: string) {
  const thread = await AgentThread.findOne({ userId, agent: 'tutor', scope: courseSlug }).lean<{ messages: Array<{ role: 'user' | 'assistant'; content: string; meta?: Record<string, unknown> }> }>();
  return thread?.messages || [];
}

export async function saveTutorTurn(userId: string, courseSlug: string, question: string, answer: string, sources: TutorSource[]) {
  const now = new Date();
  await AgentThread.updateOne(
    { userId, agent: 'tutor', scope: courseSlug },
    {
      $push: {
        messages: {
          $each: [
            { role: 'user', content: question, at: now, meta: { topics: sources.map(s => s.topic) } },
            { role: 'assistant', content: answer, at: now, meta: { sources } }
          ],
          $slice: -MAX_STORED_MESSAGES
        }
      }
    },
    { upsert: true }
  );
}
