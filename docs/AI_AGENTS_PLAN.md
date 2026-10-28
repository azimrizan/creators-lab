# Creators Lab — AI Agents Implementation Plan

Goal: turn Creators Lab from an LMS with one hard-coded AI demo into an LMS where AI agents guide the learner from sign-up to certificate, all running on Groq.

---

## 1. Where we are today

What exists:

| Piece | File | State |
|---|---|---|
| LLM client | `src/lib/gemini.ts` | Gemini, falls back through 6 model names, returns `''` on failure |
| Tutor chat | `src/app/api/agent/chat/route.ts` | Works for **one course only** (Visual Storytelling); keyword-match "RAG" over a hand-written chunk file |
| Quiz | `src/app/api/agent/mcq/route.ts` | Returns 10 **static** questions for that one course |
| Report | `src/app/api/agent/report/route.ts` | Scores the static quiz, asks the LLM for 3 bullets; nothing is saved |
| Agent UI | `UnifiedAgentPanel`, `AgentChatDrawer`, `AgentQuizModal`, `AgentReportModal` | Good starting UI, wired to the above |
| Raw transcript | `transcribe` (repo root) | Timestamped transcript of the Visual Storytelling video |

Gaps that block a real agent system (fixed in Phase 0):

1. **Answer keys leak to the browser.** `GET /api/agent/mcq` sends `correctOptionIndex` and `explanation` to the client, so anyone can read the answers in DevTools.
2. **No learning data is stored.** `POST /api/progress` ignores `lessonId` / `isCompleted` and only auto-enrolls. Quiz results aren't saved anywhere. A report agent has nothing to analyse.
3. **Hard-coded JWT secret fallback** (`'super-secret-jwt-key-learnhub-2026-production'`) in several routes. If `JWT_SECRET` is unset in production, anyone can forge logins.
4. **Quiz submit accepts guests** (`userId = 'guest'`).
5. **Everything AI is tied to one course.** Transcripts, MCQs and prompts are hard-coded for Philip Bloom's video.
6. **No AI cost controls.** No per-user rate limit, no token/usage logging.

---

## 2. Target architecture

```
                ┌──────────────────────────────────────────────┐
  Browser       │  AI Copilot (one floating panel, many modes) │
                │  Onboarding · Tutor · Checkpoint · Exam ...  │
                └───────────────┬──────────────────────────────┘
                                │ fetch / stream (SSE)
  Next.js API   ┌───────────────▼──────────────────────────────┐
                │ /api/agents/[agentId]   (one route, auth +   │
                │                          rate limit)         │
                │        │                                     │
                │  Agent Runtime  runAgent(agent, input, user) │
                │   • picks model tier (fast / reasoning)      │
                │   • tool-calling loop (max N steps)          │
                │   • JSON-schema structured output            │
                │   • logs tokens, latency, cost               │
                └───┬───────────────┬──────────────────┬───────┘
                    │               │                  │
              Groq API        Tools (server-only)   MongoDB
       gpt-oss-20b / 120b   searchCourses,          LearnerProfile, LessonProgress,
       whisper (ingest)     getProgress,            TranscriptChunk, Checkpoint,
                            retrieveTranscript,     Attempt, Report, StudyPlan,
                            saveProfile, ...        AgentConversation, AgentUsage
```

### 2.1 Groq client: `src/lib/ai/groq.ts` (replaces `gemini.ts`)

- Use the official `groq-sdk` package (OpenAI-compatible API).
- Two tiers, read from env:
  - `GROQ_FAST_MODEL=openai/gpt-oss-20b`: real-time chat, routing, quick feedback.
  - `GROQ_REASONING_MODEL=openai/gpt-oss-120b`: generating exams and checkpoints, grading written answers, reports, plans.
- Helpers:
  - `chat({ tier, messages, tools?, schema?, stream? })`
  - `structured<T>(tier, messages, zodSchema)`: JSON-schema output validated with `zod`, with one repair retry.
  - Retry with exponential backoff on 429/5xx, 30 s timeout, and a fast→reasoning fallback (or the reverse) when one model is overloaded.
- `reasoning_effort`: `low` for chat, `medium`/`high` for generation and grading.
- Never return `''` silently like `gemini.ts` does. Throw a typed `AIUnavailableError` so the UI can show a proper "assistant is busy" state.

### 2.2 Agent runtime: `src/lib/ai/runtime.ts`

Each agent is a plain config object, so adding agents is cheap:

```ts
export interface AgentDefinition<I, O> {
  id: 'onboarding' | 'tutor' | 'checkpoint' | 'exam' | 'report' | 'coach' | 'notes' | 'builder' | 'support';
  tier: 'fast' | 'reasoning';
  systemPrompt: (ctx: AgentContext) => string;
  tools?: ToolDefinition[];          // server-side functions the model may call
  outputSchema?: z.ZodType<O>;       // when the UI needs structured data
  roles?: UserRole[];                // who may call it (e.g. builder = INSTRUCTOR)
}
```

- One route `POST /api/agents/[agentId]` handles auth (JWT from cookie), role check, a per-user rate limit (e.g. 30 req/min and a daily token budget), loading the conversation, `runAgent`, and saving.
- Tool loop: the model calls tools → we run them server-side → feed the results back, capped at ~5 steps.
- Streaming (SSE) for chat agents so answers appear token by token.
- Every call writes an `AgentUsage` row (user, agent, model, tokens in/out, latency, success), which feeds the admin cost dashboard.

### 2.3 Course knowledge (RAG)

Groq has no embedding models, so retrieval needs a separate decision:

| Option | How | Pros | Cons |
|---|---|---|---|
| **A. Atlas Search (BM25), recommended to start** | Full-text index on `TranscriptChunk.text` | No new vendor, works today on MongoDB Atlas, good for keyword-heavy questions | Weaker on paraphrased questions |
| B. Atlas Vector Search + embeddings | Embed chunks (Voyage AI via Atlas, or local `@huggingface/transformers` MiniLM) | Best semantic recall; hybrid with A | Extra setup, embedding cost or CPU |

Plan: ship A in Phase 1, then add B as hybrid search in Phase 3 once real tutor questions show where keyword search misses.

**Ingestion pipeline** (`src/lib/ai/ingest.ts`):
1. Source: an existing transcript file **or** the lesson video → audio → Groq Whisper (`whisper-large-v3-turbo`) → timestamped segments. Large videos need audio extraction (ffmpeg) and chunking to fit Groq's file-size limits; check the current limits for your tier.
2. Chunk into ~45–90 s windows with overlap, keeping `startSec`/`endSec`.
3. Ask the reasoning model, once per chunk, for `topic`, `keyPoints[]` and `conceptTags[]`.
4. Store as `TranscriptChunk { courseId, lessonId, startSec, endSec, text, topic, conceptTags, embedding? }`.

`conceptTags` link everything together: quiz questions, exam questions and report weaknesses all point at the same tags, so a report can say "you're weak on *lens compression*: rewatch 00:05:10–00:06:30".

### 2.4 New data models (`src/models/`)

| Model | Key fields | Used by |
|---|---|---|
| `LearnerProfile` | userId, goals[], disciplines[], skillLevel, weeklyHours, preferredStyle, onboardingCompletedAt | Onboarding, Coach, Report |
| `LessonProgress` | userId, courseId, lessonId, watchedRanges[], lastPositionSec, completedAt | Report, Coach, Checkpoint |
| `TranscriptChunk` | courseId, lessonId, startSec, endSec, text, topic, conceptTags[] | Tutor, Checkpoint, Exam |
| `Checkpoint` | courseId, lessonId, atSec, questions[] (with answer key), status `draft/approved` | Checkpoint |
| `QuestionBank` | courseId, sectionId?, question, type `mcq/multi/short`, options, answer, rubric, conceptTags, difficulty, status | Exam |
| `Attempt` | userId, kind `checkpoint/exam`, refId, answers[], perQuestion[{correct, conceptTags, score, feedback}], score, startedAt, submittedAt | Report, certificates |
| `PerformanceReport` | userId, courseId?, period, strengths[], weaknesses[{tag, evidence, rewatch[]}], actionPlan[], generatedAt | Report |
| `StudyPlan` / `ReviewItem` | userId, weekly sessions[]; spaced-repetition items with `dueAt`, `interval`, `ease` | Coach, Notes |
| `AgentConversation` | userId, agentId, courseId?, messages[], rollingSummary | All chat agents |
| `AgentUsage` | userId, agentId, model, tokensIn, tokensOut, ms, ok | Cost control, admin |

**Security rule:** answer keys and rubrics stay on the server. API responses to students never include `answer`, `correctOptionIndex` or `rubric` until after submission.

---

## 3. The agents

Model tier: **F** = fast (gpt-oss-20b), **R** = reasoning (gpt-oss-120b).

### Requested agents

#### 3.1 Onboarding & Concierge agent (F)
- **When:** right after sign-up (and on login while `onboardingCompletedAt` is empty). The panel opens automatically. Returning users get a short concierge greeting instead ("Welcome back, continue *DaVinci Resolve*, lesson 4?").
- **Conversation:** 4–6 short turns with quick-reply chips: what they want to make or achieve, their discipline(s), current level, hours per week, and their goal (hobby / career / client work).
- **Tools:** `searchCourses(filters)`, `saveLearnerProfile(profile)`, `getEnrolledCourses()`, `navigate(url)` (returns a client action the UI performs).
- **Output:** saved `LearnerProfile`, a recommended learning path (2–4 courses in order with reasons), and a one-click "Start course" or "Add to cart".
- **Done when:** a new user goes from sign-up to a relevant course page in under 2 minutes without typing a search.

#### 3.2 Tutor agent (F, escalates to R for hard questions)
- **Knowledge:** the course's `TranscriptChunk`s, plus the course outline and the lesson the student is watching.
- **Context sent with each question:** courseId, lessonId and **current playback second**, so "what did he just say about lenses?" pulls the chunk around the current timestamp first.
- **Behaviour:**
  - Grounded answers with **clickable timestamp citations** that seek the video player.
  - If retrieval finds nothing relevant, say so and offer general guidance clearly labelled as outside the course. No made-up claims about the course.
  - Socratic mode toggle: guide the student with hints instead of giving the answer.
  - A rolling conversation summary keeps context across sessions cheaply.
- **Tools:** `retrieveTranscript(query, courseId, aroundSec?)`, `getLessonOutline(courseId)`.
- **Done when:** on a golden set of ~30 questions per course, ≥90% of answers cite the correct segment, and off-topic or unknown questions get "not covered" instead of hallucinations.

#### 3.3 Checkpoint quiz agent: in-video pause quizzes (generated by R, delivered by F)
- **Generated ahead of time, not live** (so there's no waiting mid-video). When a lesson is published or ingested, the reasoning model proposes checkpoints at natural topic boundaries (typically every 3–6 min, at most ~3 per lesson). Each has 1–3 questions about the segment just watched, linked to `conceptTags`. The instructor approves or edits them in the Instructor Studio (`status: draft → approved`).
- **Playback:** the watch page listens to `timeupdate`. When playback crosses `atSec`, it pauses and opens the checkpoint card. Seeking past an unanswered checkpoint snaps back to it.
- **After answering:** instant feedback. A wrong answer gets a short explanation and a **"Rewatch this part"** button (seeks to the chunk start). The agent can ask one follow-up question on the same concept.
- **Gate policy (your decision):** *attempt to continue* (recommended for engagement) or *must pass to continue* (stricter).
- Results are saved as `Attempt(kind: 'checkpoint')` and feed the report.

#### 3.4 Examination agent (R)
- **Section quizzes and final course exam.** The question bank is generated from all of the course's chunks, with a difficulty mix (e.g. 40% recall / 40% application / 20% analysis), reviewed by the instructor.
- **Per-student exam:** randomly drawn from the bank by concept coverage, with shuffled options and a time limit.
- **Question types:** MCQ, multi-select, and **short written answers graded by the reasoning model against a rubric** (score, feedback, and the concept tags missed). Low-confidence grades are flagged for instructor review.
- **Light integrity measures:** server-side timer, one active attempt, tab-switch count recorded (shown to the instructor, not auto-failed), answer keys never sent to the client.
- **Pass mark** (e.g. 70%) unlocks the certificate (connects to the existing certificate flow).

#### 3.5 Performance report agent (R)
- **Inputs:** `Attempt`s (checkpoints + exams, per concept tag), `LessonProgress` (completion, rewatch hotspots, drop-off points), the topics of tutor questions, and the `LearnerProfile` goals.
- **Deterministic analysis first, LLM second:** compute per-concept mastery (e.g. weighted by recency and difficulty) in code, then let the model turn those numbers into an explanation and an action plan. The numbers stay accurate and the model writes the coaching.
- **Output (structured):** an overall status, strengths, weaknesses (each with evidence and **exact timestamps to rewatch**), a 7-day action plan, practice questions, and a suggested next course.
- **When:** after each exam, on demand from My Learning, and weekly (cron or on next login).
- Saved as `PerformanceReport` so progress over time can be charted.

### Additional agents (recommended)

| # | Agent | Tier | What it does | Why it matters |
|---|---|---|---|---|
| 3.6 | **Study Coach** | F/R | Builds a weekly plan from `weeklyHours` and goals; daily nudges; streaks; schedules **spaced-repetition reviews** of weak concepts (re-quiz after 1, 3 and 7 days) | Retention and completion rates, the main measures for an LMS |
| 3.7 | **Notes & Flashcards** | F | Per lesson: summary, key takeaways and flashcards generated from the transcript; "explain like I'm new" rewrite; downloadable notes | Cheap to build once ingestion exists, high perceived value |
| 3.8 | **Course Builder** (instructors) | R | Upload video → Whisper transcript → chunks → **drafts** of the lesson outline, description, "what you'll learn", checkpoints and the exam bank, all for instructor review | Makes every new course AI-ready automatically; without it each course needs manual setup |
| 3.9 | **Support agent** | F | Answers billing, refund, certificate and access questions using tools (`getOrders`, `getCertificate`, `resendReceipt`); hands off to a `SUPPORT_STAFF` user when unsure | Reduces support load; the role already exists in RBAC |
| 3.10 | **Admin Insights** | R | Natural-language analytics for admins ("which lessons have the highest drop-off?", "AI cost this week?") over aggregated, read-only queries | Uses the `AgentUsage` and `LessonProgress` data the other agents produce |
| 3.11 | **Creative Feedback** (later) | R + vision | Students upload a frame, shot list or script; feedback against course concepts (rule of thirds, lead space...) | A strong differentiator for a creative LMS. Needs a vision-capable model; confirm what Groq offers at build time |

### One copilot, many agents
Students shouldn't have to pick an agent. The existing `UnifiedAgentPanel` becomes a single **Copilot** button:
- On the **watch page** it defaults to Tutor, and Checkpoint and Notes appear in context.
- On **home / catalog** it defaults to the Concierge.
- On **My Learning** it defaults to Report / Coach.
- A small fast-model **router** classifies free-text intent ("I want a refund" → Support) and hands off, keeping conversation context.

---

## 4. Phased delivery

Estimates assume one full-time developer and are indicative.

### Phase 0: Foundations (≈1 week)
- [ ] `groq-sdk` + `zod`; `src/lib/ai/groq.ts`, `runtime.ts`, tool-loop, structured output, streaming helper.
- [ ] Remove `@google/genai` and `src/lib/gemini.ts` once routes are migrated.
- [ ] New models: `LearnerProfile`, `LessonProgress`, `TranscriptChunk`, `Attempt`, `AgentConversation`, `AgentUsage`.
- [ ] Fix `POST /api/progress` to actually record lesson progress and watched ranges.
- [ ] **Security fixes:** fail fast if `JWT_SECRET` is missing (remove hard-coded fallback); require auth on quiz submit; stop sending answer keys to the client.
- [ ] Shared `getAuthUser(request)` helper (replaces copy-pasted cookie/JWT parsing).
- [ ] Per-user rate limit + daily token budget on `/api/agents/*`.
- [ ] Ingestion script: parse the existing `transcribe` file into `TranscriptChunk`s for the Visual Storytelling lesson; Atlas Search index.
- **Exit:** the current tutor and report features work through Groq on the new runtime, with usage logged.

### Phase 1: Tutor + Onboarding (≈1.5–2 weeks)
- [ ] Tutor: multi-course retrieval, playback-time context, timestamp citations that seek the player, streaming, rolling memory, "not covered" behaviour.
- [ ] Golden-question eval script (`npm run eval:tutor`) for grounding accuracy.
- [ ] Onboarding agent: auto-open on first login, chips UI, profile saving, learning-path recommendation, concierge greeting for returning users.
- [ ] Copilot shell: one panel, context-based default mode, router.

### Phase 2: Checkpoints + Exams (≈2 weeks)
- [ ] Checkpoint generation (R) + Instructor Studio review screen.
- [ ] Watch page: pause at checkpoint, quiz card, rewatch button, seek-guard, gate policy.
- [ ] Question bank generation + review; exam builder; timer; MCQ, multi-select and short-answer grading with rubric; certificate unlock.

### Phase 3: Reports, Coach, Notes (≈2 weeks)
- [ ] Concept-mastery computation; Report agent; report history page with charts.
- [ ] Study Coach: weekly plan, spaced-repetition review queue, nudges (in-app first, email later).
- [ ] Notes & Flashcards per lesson.
- [ ] Optional: hybrid vector search (Option B) if tutor evals show recall gaps.

### Phase 4: Instructor & operations (≈2–3 weeks)
- [ ] Course Builder: video upload → Whisper → ingest → AI drafts → review → publish.
- [ ] Support agent with order/certificate tools + human handoff.
- [ ] Admin Insights + AI usage/cost dashboard.
- [ ] Later: Creative Feedback (vision).

---

## 5. Quality, safety, cost

- **Grounding:** the tutor and quiz generators only use retrieved course content; citations are required; "not covered" when retrieval confidence is low.
- **Humans in the loop:** generated checkpoints, exam questions and low-confidence grades need instructor approval before students see or rely on them.
- **Prompt injection:** treat transcripts and user uploads as data, not instructions (delimited in prompts); tools are server-side, scoped to the calling user, and read-only except explicit save tools.
- **Privacy:** send the minimum learner data to the model (no emails or payment data); a profile and AI-history reset option for users.
- **Cost:** the fast model for all real-time traffic; the reasoning model mostly for offline generation (once per lesson, not once per student); caching of generated artefacts; per-user budgets; usage dashboard.
- **Reliability:** retries and backoff, model fallback between tiers, graceful UI states when AI is unavailable (video and course still fully usable).

---

## 6. Decisions needed

1. **Retrieval:** start with Atlas Search keyword search (recommended), or go straight to vector embeddings? Needs `MONGODB_URI` to be MongoDB Atlas.
2. **Checkpoint gate:** *attempt to continue* (recommended) or *must pass to continue*?
3. **Exam strictness:** light integrity as described, or stricter proctoring?
4. **Instructor review:** required for all AI-generated questions (recommended), or auto-publish with spot checks?
5. **Notifications for Coach:** in-app only first, or email/WhatsApp from the start?
