# Technical Architecture for a Multi-Agent AI LMS on Groq (Creators Lab, Oct 2026)

Context: Next.js 16 App Router + MongoDB (Mongoose) on Vercel. Groq models: GROQ_REASONING_MODEL=openai/gpt-oss-120b and GROQ_FAST_MODEL=openai/gpt-oss-20b. Research date: 2026-10-26. Most facts come from the official Groq, MongoDB, Vercel and AI SDK docs, fetched on that date. Where a fact comes from a third party or the docs contradict each other, the note says so.

## 1. Groq capabilities as of 2026 (API, structured outputs, tools, reasoning, caching, batch, flex, model list, vision, STT, TTS, embeddings, safety models)

### Takeaway
Groq's 2026 lineup now centers on gpt-oss. Strict JSON-schema structured outputs, built-in browser search and code execution, prompt caching, Batch, and Flex all work on gpt-oss-120b/20b. There are three big gaps: **no embeddings**, **no production vision model** (Llama 4 Scout and Maverick are shut down, and only preview Qwen 3.8 27B and Muse Spark accept images), and **no video input**. Structured outputs **cannot be combined with streaming or tool use**, and gpt-oss **does not support parallel tool calls**.

### Cited Findings
**Model list (production vs preview)**
- Production models: `openai/gpt-oss-120b` (131,072-token context, 65,536 max completion, $0.15 in / $0.60 out per 1M, ~500 tok/s); `openai/gpt-oss-20b` (131,072 context, 65,536 max completion, $0.075 in / $0.30 out, ~1000 tok/s); `whisper-large-v3` ($0.111/hr); `whisper-large-v3-turbo` ($0.04/hr), both with a 100 MB max file size. `llama-3.1-8b-instant` and `llama-3.3-70b-versatile` still appear as production with "Contact Sales" pricing. — [Groq Models](https://console.groq.com/docs/models)
- Preview models (Groq: "intended for evaluation purposes only and should not be used in production"): `openai/gpt-oss-safeguard-20b` ($0.075/$0.30), `meta-llama/llama-prompt-guard-2-22m` ($0.03/$0.03, 512 context), `meta-llama/llama-prompt-guard-2-86m` ($0.04/$0.04), `qwen/qwen3.8-27b` (vision, $0.80 in / $4.00 out, 16,384 max completion, 20 MB file), `meta-models/muse-spark-open` (Contact Sales), `minimaxai/minimax-m2.7` (196,608 context), and TTS models `canopylabs/orpheus-v1-english` ($22 per 1M characters) and `canopylabs/orpheus-arabic-saudi` ($40 per 1M characters). — [Groq Models](https://console.groq.com/docs/models)
- Deprecations relevant to the plan: `meta-llama/llama-4-maverick-17b-128e-instruct` shut down 03/09/26; `meta-llama/llama-4-scout-17b-16e-instruct` shut down 07/17/26; `meta-llama/llama-guard-4-12b` shut down 03/05/26 (replacement `openai/gpt-oss-safeguard-20b`); `groq/compound` and `groq/compound-mini` shut down 09/21/26 with no replacement; `llama-3.1-8b-instant` and `llama-3.3-70b-versatile` shutdown 08/16/26 (replacements gpt-oss-20b and gpt-oss-120b); `playai-tts` shut down 12/31/25 (replacement Orpheus); `distil-whisper-large-v3-en` shut down 08/23/25; `qwen/qwen3.6-27b` shut down 09/14/26 (replacement qwen3.8-27b). — [Groq Deprecations](https://console.groq.com/docs/deprecations)
- **Doc conflict:** the Models page still lists llama-3.1-8b-instant and llama-3.3-70b-versatile as production, but the Deprecations page gives them a shutdown date of 08/16/26, which has already passed. The Deprecations page also says the Qwen 3.6/3.8 deprecations apply only to free and developer tiers, which conflicts with Qwen 3.8 being the listed replacement. — [Groq Models](https://console.groq.com/docs/models); [Groq Deprecations](https://console.groq.com/docs/deprecations)
- The answer to "Llama 4 Scout/Maverick?" is no. Both are deprecated and shut down. Answer to "Llama Guard 4?": also no, it is shut down and replaced by gpt-oss-safeguard-20b. "Compound systems?": shut down 09/21/26. — [Groq Deprecations](https://console.groq.com/docs/deprecations)

**Embeddings**
- The Groq models list has no embedding model in either production or preview. — [Groq Models](https://console.groq.com/docs/models)

**Structured outputs**
- Strict mode (`strict: true`, constrained decoding) works on `openai/gpt-oss-20b`, `openai/gpt-oss-120b`, `qwen/qwen3.8-27b`, and `meta-models/muse-spark-open`. Best-effort mode (`strict: false`, the default) also covers `openai/gpt-oss-safeguard-20b`. The docs' strict comparison table lists only the two GPT-OSS models, which is an internal inconsistency. — [Groq Structured Outputs](https://console.groq.com/docs/structured-outputs)
- Strict mode requires every property to be in `required` and `additionalProperties: false` on every object, with optional fields expressed as a `null` union. Supported types are string, number, integer, boolean, object, array, enum, `anyOf`, plus `$defs`/`$ref` and recursion. — [Groq Structured Outputs](https://console.groq.com/docs/structured-outputs)
- **Streaming and tool use are not supported with Structured Outputs.** Strict mode "never produces invalid JSON", though some 400 errors can still happen. Best-effort mode can return malformed JSON or a 400 "Generated JSON does not match the expected schema". `json_object` mode works on all models but enforces no schema. — [Groq Structured Outputs](https://console.groq.com/docs/structured-outputs)

**Tool use**
- Every Groq model supports local function calling. Remote MCP tools run server-side. **Parallel tool calls are NOT supported by gpt-oss-20b, gpt-oss-120b, or gpt-oss-safeguard-20b**, but are supported by qwen3.8-27b, minimax-m2.7, muse-spark-open and the Llama models. Built-in server-side tools (browser search, code execution) are supported only on gpt-oss-20b and gpt-oss-120b. — [Groq Tool Use](https://console.groq.com/docs/tool-use)
- Browser search is enabled with `{"type": "browser_search"}` and is powered by Exa. It is **not compatible with structured outputs**, not HIPAA-covered, and not available on regional or sovereign endpoints. Groq recommends `reasoning_effort: low`, because higher effort means longer browsing and many more tokens. The browser-search page lists gpt-oss-safeguard-20b as supported, which conflicts with the tool-use page. — [Groq Browser Search](https://console.groq.com/docs/browser-search)
- Built-in tool pricing is unverified. A third-party aggregator lists basic web search at $5 per 1,000 requests, advanced search at $8 per 1,000, visit website at $1 per 1,000, code execution at $0.18/hr, and browser automation at $0.08/hr. Groq's own launch blog said tool calls with OpenAI open models were free "for a limited time". The AI SDK docs call browser search "currently free during beta". — [CostBench (third-party)](https://costbench.com/software/llm-api-providers/groq/); [Groq blog](https://groq.com/blog/day-zero-support-for-openai-open-models); [AI SDK Groq provider](https://ai-sdk.dev/providers/ai-sdk-providers/groq)

**Reasoning**
- `reasoning_effort` on gpt-oss-20b/120b takes `low`, `medium`, or `high`. `reasoning_format` is **not supported on GPT-OSS**; use `include_reasoning` (default true, which returns `message.reasoning`), and it cannot be combined with `reasoning_format`. Recommended settings are temperature 0.5–0.7, top_p 0.95, and a default max_completion_tokens of 1024 (raise it for complex tasks). Groq advises putting instructions in the user message, zero-shot. — [Groq Reasoning](https://console.groq.com/docs/reasoning)

**Prompt caching**
- Automatic, and it cannot be turned off. Supported on gpt-oss-20b, gpt-oss-120b, and gpt-oss-safeguard-20b. Cached input is **50% off**, and the discount does not stack with Batch. The minimum prefix is 128–1024 tokens depending on the model. The cache expires after about 2 hours unused (the docs also say "a few hours"). It needs an exact prefix match, so static content (system prompt, tool definitions, schemas, few-shots) goes first and variable content last. Cached tokens do not count toward rate limits. — [Groq Prompt Caching](https://console.groq.com/docs/prompt-caching)

**Batch API**
- 50% discount. Does not count against standard rate limits. Completion window is 24h to 7d. Endpoints are `/v1/chat/completions`, `/v1/audio/transcriptions`, and `/v1/audio/translations`. Models are gpt-oss-20b/120b and whisper-large-v3/turbo (the page also lists models that are now shut down, so the list is stale). Input is JSONL with `custom_id`, at most 50,000 lines and 200 MB per file. Results come back unordered, so match them by `custom_id`. Data is kept for up to 30 days. — [Groq Batch](https://console.groq.com/docs/batch)

**Flex / service tiers**
- `service_tier: "flex"` is available for all models, paid customers only, at on-demand pricing with **10x higher rate limits**. When capacity is short it fails fast with HTTP **498 `capacity_exceeded`**, so retry with jittered backoff. — [Groq Flex Processing](https://console.groq.com/docs/flex-processing)
- The AI SDK Groq provider exposes `serviceTier` values `on_demand` (default), `performance`, `flex`, and `auto`. — [AI SDK Groq provider](https://ai-sdk.dev/providers/ai-sdk-providers/groq)

**Vision**
- Vision models are `qwen/qwen3.8-27b` (up to 3 images per request, 20 MB URL limit, each image counts as 2,048 input tokens, works with tool use and JSON mode) and `meta-models/muse-spark-open` (limited preview, contact Groq; up to 5 images, about 1,026 tokens per image). **The docs do not mention video support.** — [Groq Vision](https://console.groq.com/docs/vision)
- The AI SDK Groq provider page still names Llama 4 Scout, Llama 4 Maverick, and Llama Guard 4 as image-capable models. That is **stale**, since all three are shut down. — [AI SDK Groq provider](https://ai-sdk.dev/providers/ai-sdk-providers/groq); [Groq Deprecations](https://console.groq.com/docs/deprecations)

**Speech to text (Whisper)**
- `whisper-large-v3-turbo` is transcription only, about $0.04/hr, 12% WER. `whisper-large-v3` does transcription and translation to English, about $0.111/hr, 10.3% WER. Max file size is 25 MB on the free tier and 100 MB on dev, and direct attachments are capped at 25 MB, so larger files go through the `url` parameter. Every request is billed at least 10 seconds. Formats are flac, mp3, mp4, mpeg, mpga, m4a, ogg, wav, and webm (first audio track only). `response_format` is json, verbose_json, or text. `timestamp_granularities` takes `segment` and `word`, and word-level needs verbose_json. The `prompt` field is capped at 224 tokens and is for spelling and style, not instructions. Audio is downsampled to 16 kHz mono. For long files, split into overlapping chunks. verbose_json also gives per-segment `avg_logprob`, `compression_ratio`, and `no_speech_prob`. — [Groq Speech-to-Text](https://console.groq.com/docs/speech-to-text)
- AI SDK `groq.transcription('whisper-large-v3-turbo')` supports `timestampGranularities` (requires `responseFormat: 'verbose_json'`). — [AI SDK Groq provider](https://ai-sdk.dev/providers/ai-sdk-providers/groq)

**TTS**
- PlayAI TTS is gone (shut down 12/31/25). Its replacements are Canopy Labs Orpheus models, both in preview: English at $22 per 1M characters and Arabic (Saudi) at $40 per 1M characters. — [Groq Deprecations](https://console.groq.com/docs/deprecations); [Groq Models](https://console.groq.com/docs/models)

### Inferences
- In the AI SDK, a "tool loop then strict JSON" agent must run in two phases: a `generateText`/`ToolLoopAgent` tool phase, then a separate `generateObject`/structured call without tools. The alternative is a "final_answer" tool whose arguments carry the schema. For streamed chat UIs such as the Tutor and Concierge, stream plain text with citation tags and validate after the fact. Do not request `json_schema` there.
- Set `parallelToolCalls: false` (or accept sequential calls) when using gpt-oss. This matters for the Concierge, which calls search courses and then save profile.
- Project feedback on video must be built by hand. Use ffmpeg to extract keyframes, sending at most 3 images per Qwen request, and Whisper to transcribe the audio track, then hand the text to gpt-oss-120b. The only vision models are preview, which Groq says not to use in production. Consider a non-Groq vision fallback such as Gemini or OpenAI through AI Gateway, or accept the preview risk behind a feature flag.
- Because model churn is high (Llama 4, Llama Guard 4, Compound, and Qwen 3.6 were all retired within roughly 9 months), keep model IDs in env vars and config only, which the project already does, and subscribe to the deprecations page.

### Gaps
- Official Groq per-tool pricing for browser search and code execution could not be verified. The groq.com/pricing fetch returned no prices, and per a third-party source that URL now redirects to the homepage.
- Code execution tool details (sandbox limits, languages) were not fetched.
- The Responses API on Groq was seen in the docs sidebar but its contents were not checked.
- Whether `strict: true` is supported for function/tool *parameter* schemas, as distinct from `response_format`, was not confirmed.
- Base64 image size limits for vision are not documented.

## 2. Groq pricing and rate limits by tier; designing around them

### Takeaway
gpt-oss-120b costs $0.15/$0.60 per 1M tokens and gpt-oss-20b costs $0.075/$0.30, with 50% off cached input or Batch (the two do not stack). The published limits are tight: 30 RPM, 1K RPD, 8K TPM, and 200K TPD for each gpt-oss model. These look like free-tier values. Multi-agent fan-out will hit TPM long before RPM, so design around queues, caching, Batch, and Flex.

### Cited Findings
- gpt-oss-120b is $0.15 input / $0.60 output per 1M tokens. gpt-oss-20b is $0.075 / $0.30. — [Groq Models](https://console.groq.com/docs/models)
- At launch (Aug 2025) gpt-oss-120b was $0.15/$0.75. 2026 sources and the current docs show $0.60 output. — [Groq blog](https://groq.com/blog/day-zero-support-for-openai-open-models); [MorphLLM (third-party)](https://www.morphllm.com/groq-pricing)
- The rate-limit table (tier not labeled) shows gpt-oss-120b and gpt-oss-20b at **30 RPM, 1K RPD, 8K TPM, 200K TPD**, and whisper-large-v3 and turbo at **20 RPM, 2K RPD, 7.2K audio-seconds/hour, 28.8K audio-seconds/day**. Limits are per organization, and whichever limit is hit first applies. Some orgs get separate input/output TPM. The docs say developer limits can be higher, so check `/settings/limits`. — [Groq Rate Limits](https://console.groq.com/docs/rate-limits)
- Headers: `x-ratelimit-*-requests` refers to RPD and `x-ratelimit-*-tokens` refers to TPM. A 429 response carries `retry-after` in seconds. Cached tokens do not count toward limits. — [Groq Rate Limits](https://console.groq.com/docs/rate-limits)
- Batch jobs do not count against per-model rate limits and cost 50% less. — [Groq Batch](https://console.groq.com/docs/batch)
- Flex gives paid accounts 10x the rate limits at the same price, and returns a 498 under contention. — [Groq Flex Processing](https://console.groq.com/docs/flex-processing)
- Spend limits are paid tier only, org-wide, and monthly. Once the limit is reached, calls return 400 `blocked_api_access`. Spend tracking lags 10–15 minutes. — [Groq Spend Limits](https://console.groq.com/docs/spend-limits)

### Inferences
- 8K TPM is very low. A single RAG Tutor turn with about 5 chunks of 600 tokens, plus history and system prompt, can use 5K or more tokens. Even at 2–3 concurrent learners on the free tier you would get 429s. Move to the Developer (paid) tier before any pilot, and use Flex for interactive bursts with a fallback to on_demand when a 498 comes back.
- Cost example from the listed prices: a Tutor turn of 6K input and 600 output tokens on gpt-oss-120b costs about $0.0009 + $0.00036 ≈ $0.0013. On 20b it costs about half that. Transcribing 10 hours of course video costs $0.40 on turbo or about $1.11 on v3 (before the Batch discount).
- Design pattern: (a) put a server-side token-bucket limiter per agent class in front of Groq (for example Upstash Redis, or a Mongo counter), (b) queue all non-interactive work (Vercel Queues/Workflows) and drain at a controlled rate, (c) send offline generation (checkpoint quizzes, flashcards, course summaries, weekly reports) through the **Batch API** with a 24h window, (d) keep prompts prefix-stable to benefit from caching, (e) read the `x-ratelimit-remaining-tokens` header to apply adaptive backoff.

### Gaps
- Exact Developer-tier numbers for gpt-oss models were not shown on the public page. They are only visible in the console.
- The free vs developer Whisper limits are not broken out, beyond file size (25 MB vs 100 MB).

## 3. RAG without Groq embeddings on a MongoDB stack

### Takeaway
The cleanest 2026 option is **MongoDB Atlas Vector Search with Automated Embedding**. It went GA on Aug 12, 2026, uses Voyage AI models, and Atlas generates and syncs embeddings for both stored and query text. Combine it with Atlas Search BM25 through `$rankFusion` or `$scoreFusion` (hybrid, GA June 2026), and optionally a Voyage reranker. Chunk transcripts by timestamped segments and keep `start` and `end` seconds on each chunk so citations can deep-link into the video.

### Cited Findings
- Automated Embedding GA was announced on **August 12, 2026**. It "generates, stores, and updates vector embeddings directly within MongoDB Atlas". The GA release adds editable index definitions, nested-field support, token and request metrics, and automatic backpressure that pauses index builds under disk pressure. Setup is an `autoEmbed` vector search index. — [MongoDB product update](https://www.mongodb.com/products/updates/now-ga-automated-embedding-in-atlas-vector-search/)
- Timeline: Community preview in January 2026, Atlas public preview on May 7, 2026, GA in August 2026. Launch models were voyage-4-large, voyage-4, voyage-4-lite, and voyage-code-3. — [MongoDB public preview update](https://www.mongodb.com/products/updates/now-in-public-preview-automated-embedding-in-mongodb-vector-search-on-atlas/); [MongoDB investor release](https://investors.mongodb.com/news-releases/news-release-details/mongodb-sets-new-standard-retrieval-accuracy-voyage-4-models)
- Index syntax differs between doc versions. Self-managed docs use `"type": "autoEmbed"` with `modality: "text"`, `path`, `model` (e.g. voyage-4), `numDimensions`, and `similarity`. An Atlas page variant shows `"type": "text"` with `path` and `model`. Requirements: **M10 or higher** cluster, and the data is sent to **Google Cloud** for embedding no matter which cloud the cluster runs on. Embeddings for query text are generated at query time. — [MongoDB automated embedding docs (search results)](https://www.mongodb.com/docs/vector-search/about/automated-embedding/); [self-managed docs](https://www.mongodb.com/ja-jp/docs/search/self-managed/current/configuration/automated-embedding/)
- Voyage pricing (official MongoDB-hosted docs): voyage-4-large $0.12/1M, voyage-4 $0.06/1M, voyage-4-lite $0.02/1M, each with 200M free tokens, 32K context, and dims of 256/512/1024/2048. voyage-context-4 (contextualized chunk embeddings, 120K context) is $0.12. voyage-multimodal-3.5 is $0.12/1M tokens plus $0.60 per 1B pixels. Rerankers: rerank-3 $0.05/1M and rerank-3-lite $0.02/1M, each with 200M free. voyage-4-nano is open-weight. — [Voyage models (MongoDB docs)](https://mongodb.com/docs/voyageai/models/)
- Hybrid search: `$rankFusion` (Reciprocal Rank Fusion) and `$scoreFusion` (weighted, normalized scores) combine `$vectorSearch` and `$search` (BM25) sub-pipelines. They use the existing indexes with no reindexing. A product update dated June 30, 2026 marks them GA. — [MongoDB hybrid GA update](https://www.mongodb.com/products/updates/now-ga-hybrid-search-with-rankfusion-and-scorefusion/); [MongoDB hybrid search docs](https://mongodb.com/docs/atlas/atlas-vector-search/hybrid-search/)
- Mongoose has documented Atlas Vector Search support. — [Mongoose docs](https://mongoosejs.com/docs/atlas-vector-search.html)
- Vercel's reference RAG-with-citations architecture: chunks of 600–1,000 tokens with 10–15% overlap; fetch 20 candidates, rerank (`cohere/rerank-v4-fast` via AI Gateway), keep the top 5; the system prompt requires `[id]` citations and refusal outside the sources; the client links `[id]` only when a matching streamed source part exists; ingestion runs as a Vercel Workflow (`'use workflow'` / `'use step'`); chunk IDs follow `documentId:index`, with delete-then-upsert for idempotency; skip reranking unless the corpus is large or noisy, because it adds a serial hop to TTFT. — [Vercel KB: RAG chat with citations](https://vercel.com/kb/guide/building-ai-chat-app-with-rag-and-citations-on-vercel)
- Other embedding APIs: OpenAI text-embedding-3-small is commonly cited at about $0.02/1M and -3-large at about $0.13/1M. Gemini embedding prices conflict across sources. All of these figures come from an unreliable aggregator cluster and are **unverified**. — [tkmxai (low-reliability aggregator)](https://www.tkmxai.it.com/embedding-api-comparison-2026)

### Inferences
- Recommended transcript chunking: group Whisper `segment`s (verbose_json) into windows of about 45–90 seconds or 300–600 tokens, with 1 segment of overlap, aligned to sentence or segment boundaries. Store `{courseId, lessonId, chunkIdx, startSec, endSec, text, lessonTitle, sectionTitle}`. Prepend lesson and section titles to the embedded text (cheap contextualization), or use voyage-context-4. Keep word-level timestamps in a separate collection for precise seek and quiz anchoring.
- Citations: have the Tutor emit `[c3]` tags, map them server-side to `{lessonId, startSec}`, and render them as `?t=` deep links into the player. Validate that every cited ID was actually in the retrieved set, and strip any that were not.
- Always filter by `courseId` and enrollment (pre-filter in `$vectorSearch`) to prevent cross-course leakage and to cut cost.
- If the cluster is below M10, or data must not go to GCP, fall back to calling the Voyage API directly (voyage-4-lite is $0.02/1M with 200M free tokens, which is effectively free at LMS scale) and storing vectors in Mongo yourself. Local embeddings via transformers.js are possible, but they add cold-start time and bundle size on Vercel functions. That point is an inference and was not verified.
- Course transcripts are small. 100 hours of video is roughly 1M tokens, so embedding cost is negligible, and the free tier covers it.

### Gaps
- Automated Embedding billing (whether Voyage tokens bill through Atlas, and at what rate) was not found. The docs fetch returned a 404.
- An exact `$vectorSearch` query example with raw text against an autoEmbed index was not retrieved.
- Official Cohere, Jina, Google, and OpenAI embedding pricing pages were not verified.
- No benchmark was found for transformers.js embeddings on Vercel serverless.

## 4. Multi-agent orchestration patterns, frameworks, memory, background jobs

### Takeaway
For a Next.js and Vercel stack, the lowest-friction choice is the **Vercel AI SDK (`@ai-sdk/groq`, `ToolLoopAgent`)**, with a thin deterministic router and specialist agents that each have small tool sets. Add **Vercel Workflows / Queues** for durable background agents (transcription, quiz generation, reports). Consider Mastra for built-in memory and workflows, or LangGraph.js for complex stateful graphs with human-in-the-loop.

### Cited Findings
- `@ai-sdk/groq` provider options: `reasoningEffort`, `reasoningFormat`, `structuredOutputs` (default true, json_schema), `strictJsonSchema` (default true), `parallelToolCalls` (default true), `user`, `serviceTier`. It also supports `groq.tools.browserSearch({})` and `groq.transcription()`. The page recommends AI Gateway as an option. — [AI SDK Groq provider](https://ai-sdk.dev/providers/ai-sdk-providers/groq)
- AI SDK agents: `ToolLoopAgent` handles the loop, context management, and stopping (`stopWhen`, `prepareStep`). `runtimeContext` holds shared run state, and `toolsContext` gives each tool its own typed context (for example scoped permissions). Core `generateText`/`streamText` remain for explicit control and structured workflows. — [AI SDK Agents overview](https://ai-sdk.dev/docs/agents/overview)
- Framework comparisons, all from third-party sources: AI SDK is described as "the default for most web product use cases" in TypeScript/Next.js. Mastra is TS-native with agents, workflows, memory, and tracing. LangGraph.js is low-level, stateful, and supports checkpointing and human-in-the-loop, but has a steeper learning curve and is "secondary to the Python implementation". — [alexcloudstar comparison](https://www.alexcloudstar.com/blog/ai-agent-frameworks-comparison-2026); [pkgpulse](https://www.pkgpulse.com/guides/mastra-vs-langgraph-vs-vercel-ai-sdk-agents-2026); [Braintrust article](https://www.braintrust.dev/articles/best-ai-agent-frameworks-2026); [Mastra blog (vendor)](https://mastra.ai/blog/choosing-a-js-agent-framework)
- Vercel Queues is in **Beta on all plans**. It offers durable topics, at-least-once delivery, retries, fan-out consumer groups, delayed delivery, idempotency keys, and a 7-day TTL. It is "the lower-level primitive that powers Vercel Workflows", and consumers are configured in `vercel.json` via `experimentalTriggers`. — [Vercel Queues docs](https://vercel.com/docs/queues)
- Vercel Workflows (`'use workflow'`/`'use step'`) reached GA in April 2026 (reported), with more than 100M runs since the October 2025 beta. — [Dutch IT Channel](https://www.dutchitchannel.nl/news/730354/vercel-workflows-nu-officieel-beschikbaar)
- Vercel Fluid compute defaults to a 300s `maxDuration`. 800s is GA on Pro/Enterprise and 1,800s is in beta. Work with no time limit belongs in Workflows. Active-CPU billing pauses during I/O such as token streams. Steps retry up to 3 times by default. — [Vercel KB guide](https://vercel.com/kb/guide/building-ai-chat-app-with-rag-and-citations-on-vercel)
- Queues pricing reported at $0.60 per 1M operations (third-party skill listing). — [tessl registry](https://tessl.io/registry/skills/github/openai/plugins/vercel-queues)

### Inferences
- Recommended topology:
  - **Router:** deterministic routing by UI surface. The Tutor chat lives on the lesson page and the Concierge on onboarding. A single gpt-oss-20b classification call with a strict JSON schema handles the ambiguous "help" entry point. Avoid one mega-agent with about 30 tools, because gpt-oss has no parallel tool calls and big tool lists inflate tokens under an 8K TPM limit.
  - **Specialists:** each agent gets 2–5 tools and a stable, cacheable system prompt.
- Learner model: a `LearnerProfile` Mongo collection holding goals, level, mastery per concept (for example an exponential moving average or BKT-style probability), quiz history, misconceptions, and preferred pace. Agents read a compact summary of 300 tokens or less and write through narrow tools (`updateMastery`, `saveProfile`). Never let agents write free-form memory without a schema.
- Event triggers through Vercel Queues/Workflows:
  - `video.uploaded` → transcribe (Whisper turbo, URL param, chunked if over 100 MB) → chunk and index → generate checkpoint quizzes and flashcards (Batch, or 20b at low effort) → instructor review queue.
  - `quiz.submitted` → update mastery.
  - Nightly cron → study-coach nudges and performance reports via Batch.
  - `exam.submitted` → rubric grading (120b, high effort).
- Inngest and QStash are viable alternatives if Vercel Queues' beta status is a concern. They were not researched in this pass.

### Gaps
- An official Vercel Queues pricing and limits page was not fetched.
- Inngest, QStash, and OpenAI Agents SDK (JS) compatibility with Groq were not verified.
- AI SDK major version (6 vs 7) not confirmed. The docs reference `ToolLoopAgent` and `HarnessAgent`.

## 5. Evals and observability

### Takeaway
Use **promptfoo** (OSS, CLI, YAML in repo) as a CI gate for prompt and grading regressions, and **Langfuse** (MIT, self-hostable, OTel) or **Braintrust** (hosted, with polished LLM-as-judge scorers) for production tracing and datasets. The landscape sources are mostly vendor-written.

### Cited Findings
- Promptfoo is CLI-first and open source for evals and red-teaming in CI, with tests in YAML. Braintrust is proprietary and covers tracing, evals, CI gates, and 25+ built-in scorers. Langfuse is MIT-licensed and self-hostable, supports OTel, and added agent-tracing observation types in 2026. — [Braintrust vs promptfoo (vendor)](https://www.braintrust.dev/articles/braintrust-vs-promptfoo); [futureagi](https://futureagi.com/blog/best-promptfoo-alternatives-2026); [Langfuse resources](https://langfuse.com/resources/engineering)
- Vercel publishes an architecture guide for an AI evaluation dashboard (AI Gateway, Observability, and Postgres). — [Vercel KB eval dashboard](https://vercel.com/kb/guide/ai-evaluation-dashboard-architecture-on-vercel)
- Whisper `verbose_json` returns `avg_logprob`, `no_speech_prob`, and `compression_ratio` per segment, which are usable as transcription-quality signals. — [Groq Speech-to-Text](https://console.groq.com/docs/speech-to-text)

### Inferences
- Eval suites per agent:
  - **Tutor groundedness:** every claim must be supported by a cited chunk, judged by 120b against a strict schema. Check citation validity, meaning the IDs exist and the timestamps fall inside the lesson.
  - **Pedagogy rubric:** does the tutor give hints before answers, ask checking questions, and match the learner's level?
  - **Refusal outside course scope.**
- **Grading consistency:** grade each exam answer 3 times (or with 2 models) at temperature 0 or low, and flag the answer for human review if the scores differ by more than 1 rubric point. Keep a gold set of instructor-graded answers and track agreement metrics (exact or within-1 agreement, Cohen's kappa) in CI.
- **Quiz generation checks:** schema validity (strict), answer key verification by a second pass, distractor plausibility, and timestamp anchoring to the transcript.
- Log `x-ratelimit-*` headers, cached-token counts, model, reasoning_effort, and latency per call in traces, to guide 20b vs 120b routing.

### Gaps
- No source confirmed specific Langfuse or Braintrust integrations with the AI SDK's OTel telemetry in 2026.
- No published tutor-pedagogy eval benchmarks were found in this pass.

## 6. Guardrails (prompt injection, output validation, PII, safety models on Groq)

### Takeaway
Llama Guard 4 is gone from Groq. Use **gpt-oss-safeguard-20b** (preview, bring-your-own-policy) for content moderation and policy checks, and **Llama Prompt Guard 2 (22M/86M)** for cheap injection screening. Layer them with zod validation, strict schemas, tool permission scoping, and treating retrieved transcripts and uploads as untrusted data.

### Cited Findings
- `openai/gpt-oss-safeguard-20b` is a policy-following reasoning classifier. You write a policy (instructions, definitions, violating/safe examples, labeled examples) in the system message and pass the content as the user message. The example returns JSON with `violation` (0/1), `category`, and `rationale`. Reasoning is separated into channels via Harmony for auditing. — [Groq Content Moderation](https://console.groq.com/docs/content-moderation)
- Llama Prompt Guard 2 86M and 22M are prebaked injection detectors with fixed taxonomies and a 512-token context. They cost $0.04 and $0.03 per 1M tokens respectively and are in preview. — [Groq Content Moderation](https://console.groq.com/docs/content-moderation); [Groq Models](https://console.groq.com/docs/models)
- Llama Guard 4 was shut down 03/05/26, and the recommended replacement is gpt-oss-safeguard-20b. — [Groq Deprecations](https://console.groq.com/docs/deprecations)
- Strict structured outputs guarantee schema structure, but not semantic correctness. — [Groq Structured Outputs](https://console.groq.com/docs/structured-outputs)
- The AI SDK `toolsContext` gives each tool only its own typed context, such as scoped permissions. — [AI SDK Agents overview](https://ai-sdk.dev/docs/agents/overview)
- The AI SDK Groq `user` option passes an end-user ID for abuse monitoring. — [AI SDK Groq provider](https://ai-sdk.dev/providers/ai-sdk-providers/groq)

### Inferences
- Pipeline:
  - **Input:** Prompt Guard 2 22M on user messages and on uploaded-file text. It is cheap but limited to 512 tokens, so chunk long input.
  - **Policy check:** gpt-oss-safeguard-20b for academic-integrity rules (for example "do my graded exam for me") and harmful content, run only on flagged or high-risk surfaces to save TPM.
  - **Output:** zod parse of every structured response, and citation-ID whitelist checks.
- **Prompt injection:** wrap retrieved transcript chunks and student submissions in clearly delimited data blocks, and never put tools with write side effects on the agents that read untrusted content (the grader and project feedback agents should be read-only). Have the server enforce authorization: `saveProfile` takes the userId from the session, never from model args.
- **PII:** do not send emails or names to Groq when an opaque ID will do. Redact before logging traces. Set Groq data retention per org settings. That last point is unverified.
- Because the safety models are *preview*, keep a fallback: if the moderation call fails, fail closed on high-risk surfaces and fail open with logging on low-risk ones.

### Gaps
- Groq's data retention and zero-data-retention options were not researched.
- No accuracy benchmarks were found for gpt-oss-safeguard-20b or Prompt Guard 2 on Groq.

## 7. Latency and cost design: routing 20b vs 120b, reasoning_effort, caching, precomputation

### Takeaway
Default to **gpt-oss-20b at low/medium effort** for interactive, high-volume, well-scoped tasks. Reserve **gpt-oss-120b at medium/high effort** for grading, reports, and course building, where quality matters more than latency. Precompute everything per lesson at ingestion through Batch (50% off, no rate-limit impact), and keep prompts prefix-stable for the 50% cache discount.

### Cited Findings
- gpt-oss-20b runs at about 1000 tok/s and $0.075/$0.30. gpt-oss-120b runs at about 500 tok/s and $0.15/$0.60. — [Groq Models](https://console.groq.com/docs/models)
- reasoning_effort for gpt-oss is low, medium, or high. Use low effort with browser search to avoid token blowup. — [Groq Reasoning](https://console.groq.com/docs/reasoning); [Groq Browser Search](https://console.groq.com/docs/browser-search)
- Caching: 50% off cached input, with static content first. Batch: 50% off, a 24h–7d window, and no rate-limit consumption. The two discounts do not stack. — [Groq Prompt Caching](https://console.groq.com/docs/prompt-caching); [Groq Batch](https://console.groq.com/docs/batch)
- Whisper turbo costs about $0.04/hr versus $0.111/hr for v3, at 12% versus 10.3% WER. — [Groq Speech-to-Text](https://console.groq.com/docs/speech-to-text)

### Inferences
Suggested routing table:

| Agent / task | Model | reasoning_effort | Mode |
|---|---|---|---|
| Concierge onboarding (search courses, save profile) | 20b | low | streaming, sequential tools |
| RAG Tutor chat | 20b by default, escalate to 120b on "explain deeper" or low retrieval confidence | low/medium | streaming text with [cN] tags |
| Router / intent classifier | 20b | low | strict json_schema |
| Checkpoint quiz generation (ingestion) | 120b | medium | Batch, strict schema, then 20b verifier |
| Flashcards | 20b | low | Batch, strict schema |
| Exam rubric grading | 120b | high | strict schema, temperature low, multi-sample consistency |
| Performance reports / study coach (nightly) | 120b (report) / 20b (nudges) | medium / low | Batch |
| Instructor course builder (outline, objectives from transcript) | 120b | medium/high | Workflow, strict schema |
| Support bot | 20b | low | streaming plus RAG over help docs |
| Admin insights | 120b | medium | Precomputed aggregates from Mongo pipelines; LLM only narrates |
| Project feedback (images/video) | qwen3.8-27b preview for frames, then 120b for feedback | default/medium | async job |
| Transcription | whisper-large-v3-turbo (v3 for non-English or noisy audio) | n/a | Batch for backlog, sync for new uploads |

- Precompute at ingestion: lesson summary, key concepts with timestamps, a checkpoint quiz bank per segment, flashcards, and a glossary. At runtime the Tutor and quiz UI then mostly read from Mongo and need no LLM calls.
- Cache responses for identical FAQ-style questions per lesson (normalized query hash, served from Mongo), in addition to Groq prefix caching.
- Keep system prompt, tool definitions, and JSON schemas byte-identical across requests, and put learner and context data at the end, to maximize cache hits.

### Gaps
- No public latency benchmarks for TTFT at each reasoning_effort on Groq gpt-oss were found in this pass.
- Groq "performance" service tier details and pricing were not fetched.
