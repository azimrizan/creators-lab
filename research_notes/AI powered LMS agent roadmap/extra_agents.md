# Additional AI Agents for Creators Lab (beyond the current 11-agent plan)

Scope: candidate agents beyond Concierge, RAG Tutor, Checkpoint Quiz, Examination, Performance Report, Study Coach, Revision/flashcards, Instructor Course Builder, Support, Admin Insights, Project Feedback (vision). Context: creative-skills video LMS (film, color, photo, 3D, motion, music, design), Indian learners, INR pricing, Next.js + MongoDB, Groq (gpt-oss-120b/20b, Whisper, Llama 4 Scout vision). Research date: Oct 2026. Effort uses a 1-5 scale (1 = prompt plus existing data, 5 = new infrastructure or vendor plus compliance). Impact is my judgment from the evidence below.

## Q1. Candidate-by-candidate evaluation (what it does, precedent, data/models, stack feasibility, impact/effort)

### Takeaway
The most feasible high-impact candidates are the ones where an LLM explains objective measurements (audio DSP metrics, shot-length stats, image histograms) or generates text (briefs, roleplay, proposals, subtitles). Pure VLM aesthetic judgement is improving but is still not reliable enough to grade alone. Groq now has an image-capable model (Llama 4 Scout) but its TTS covers only English and Arabic, so voice and dubbing for Indian languages need a vendor such as Sarvam or ElevenLabs.

### Cited Findings

**Stack capabilities (Groq)**
- Groq serves `meta-llama/llama-4-scout-17b-16e-instruct` with text and image input, up to 5 images per request and a 128K context. The model card is marked "Preview" — [Groq model card](https://console.groq.com/docs/model/llama-4-scout-17b-16e-instruct); [release note](https://releases.sh/release/rel_9pZUmudpM5N-Hno7_IlTc-llama-4-scout-and-maverick-models-now-available)
- Groq's PlayAI TTS was deprecated (shutdown about Dec 31, 2025). The replacement, Orpheus TTS, covers only English (`canopylabs/orpheus-v1-english`) and Saudi Arabic. A tracker reports the English price at about $22 per 1M characters — [releases.sh](https://releases.sh/release/rel_slohPX8XO2tKT7GyKNH-b-playai-tts-deprecated-orpheus-now-platform-wide); [SignalWire Groq TTS docs](https://signalwire.com/docs/platform/voice/tts/groq-tts); [Groq blog](https://groq.com/blog/canopy-labs-orpheus-tts-is-live-on-groqcloud); [pricingsaas](https://pricingsaas.com/companies/groq/diffs/2026W01)

**A. Portfolio / critique agent (photos, frames, grades, renders, storyboards)**
- What it does: rubric-based critique (composition, exposure, color harmony, subject separation, storytelling) with a comparison against a reference look the learner uploads.
- Research precedent: "The Photographer's Eye" (CVPR 2025, Adobe) built PhotoCritique from discussions among professional and enthusiast photographers, plus the PhotoEye model and the PhotoBench benchmark. The authors report gains over open-source and commercial MLLMs. Implication: general MLLMs are not yet expert-level at aesthetic critique, and dedicated training data helps — [CVF open access](https://openaccess.thecvf.com/content/CVPR2025/html/Qi_The_Photographers_Eye_Teaching_Multimodal_Large_Language_Models_to_See_CVPR_2025_paper.html); [Adobe Research](https://research.adobe.com/publication/the-photographers-eye-teaching-multimodal-large-language-models-to-see-and-critique-like-photographers)
- AesTest (Nov 2025) is a 10-task multiple-choice benchmark covering perception, appreciation, creation and photography. Its premise is that existing aesthetic benchmarks are narrow, so aesthetic intelligence is an open measurement problem — [arXiv 2511.06360](https://arxiv.org/html/2511.06360v1)
- AesCanvas reports 519K critique pairs and finds that aesthetic-specialist models lag strong general MLLMs on contextual suitability, while staying competitive on some critique metrics. The search tool flagged the arXiv ID as unusual (2608.26713), so verify it before citing — [takara.ai summary](https://tldr.takara.ai/p/2608.26713)
- Low-level perception (exposure, blur, color, noise): Q-Bench (ICLR 2024) tests MLLMs on low-level perception, description and quality assessment. Q-Bench+ found several MLLMs have "decent" single-image low-level skills, but only GPT-4V did better on pairwise comparison than on single images. Implication: "compare my grade to this reference" is harder for open models — [Q-Bench ICLR](https://iclr.cc/virtual/2024/poster/19616); [Q-Bench+ arXiv](https://arxiv.org/pdf/2402.07116)
- Older precedent: a photo-critique dataset that pairs critiques with aesthetic scores (built from Reddit photo-critique threads) — [arXiv 2206.08614](https://arxiv.org/pdf/2206.08614)
- Feasibility: Llama 4 Scout on Groq accepts images (above). Measurable signals can be computed deterministically (luminance histogram and clipping %, waveform and vectorscope stats, color palette extraction, rule-of-thirds saliency) and passed to the LLM as facts. Effort 2-3 if folded into the planned Project Feedback agent. Impact high for photo, color and design tracks.

**B. Audio / music mix feedback and video-edit pacing feedback**
- Market precedent: iZotope Ozone's Master Assistant analyzes a track and targets a reference track's loudness and EQ curve. Genre targets in Ozone 9 were -14 / -12 / -11 LUFS. Reviewers call it "assisted, not automated", and its chains needed moderate editing — [iZotope reference guide](https://www.izotope.com/en/learn/mix-and-master-with-reference-tracks-in-ozone.html); [iZotope support](https://support.izotope.com/hc/en-us/articles/6658201912977-Differences-Between-Ozone-8-and-Ozone-9-Master-Assistant); [Violet Recording review](https://violetrecording.com/izotope-ozone-review/)
- Implementation pattern: compute integrated LUFS, true peak, loudness range, spectral balance by band, stereo correlation and crest factor in a Python worker (for example pyloudnorm or librosa), compare with a reference track, and have gpt-oss explain the results against the lesson's rubric. Measurements are deterministic, so hallucination risk is low. Effort 3 (needs a Python media worker, since Next.js serverless is a poor fit). Impact high for the music-production and film-scoring track. (I did not separately verify the pyloudnorm and librosa docs; they are well-known open-source libraries.)
- Edit pacing: PySceneDetect lists "finding mean shot length" for film analysis as a use case. Its adaptive and content detectors catch hard cuts and its threshold detector catches fades. It can export per-frame stats to CSV — [scenedetect.com features](https://www.scenedetect.com/features); [CLI docs](https://scenedetect.com/docs/0.6.3/cli.html)
- MovieCLIP used PySceneDetect with default settings on movie clips: about 3.54 s average shot duration across 1.12M shots. That gives a usable baseline for "your edit vs. typical film pacing" — [MovieCLIP arXiv](https://arxiv.org/pdf/2210.11065)
- Feasibility: shot lengths, cut-rhythm histogram, and Whisper transcript timing (dialogue density) plus keyframes sent to the VLM give a credible pacing critique. Effort 3. Impact medium-high for filmmaking and editing students.

**C. Software / gear coach**
- What it does: DaVinci, Blender, Premiere and Figma shortcuts, troubleshooting (for example "my render is black", "Resolve GPU error"), version-specific UI paths, and gear lists within an INR budget.
- Precedent: I found no dedicated creative-LMS product; general LLM assistants cover this. The risk is outdated version info (Resolve and Blender ship UI changes often).
- Feasibility: this is a RAG Tutor with an extra corpus (official manuals and release notes) plus a version field on each lesson. Gear recommendations need a curated INR price table that someone updates manually or by scraping. Effort 1-2. Best merged into the RAG Tutor as a "tools mode". (No source; this is my judgment.)

**D. Practice / assignment generator and AI roleplay (client brief, director on set, client feedback)**
- Udemy launched AI Role Play in May 2025: instructor-designed two-person conversation simulations with an AI persona and a performance summary afterwards. In May 2026 it added customizable scenarios and AI video avatars, and Udemy Business has an AI Role Play Studio for authoring — [Udemy announcement](https://about.udemy.com/?p=225297); [BusinessWire May 2026](https://secure.businesswire.com/news/home/20260507908926/en/Udemy-Expands-AI-Role-Play-Capabilities-to-Advance-Immersive-Skills-Based-Learning); [Udemy Business support](https://business-support.udemy.com/hc/articles/39274391346455-)
- A third-party source (possibly dated) says Udemy Role Play was English-only at launch — [Gale blog](https://blog.gale.com/smarter-learning-starts-here-with-ai-tools-in-gale-presents-udemy/)
- Duolingo Max (Video Call / Roleplay) was about 5% of subscribers per a secondary summary of the Q4 2024 call. I found no feature-level engagement data — [iTiger summary](https://www.itiger.com/hans/news/2516372616); [Duolingo Max blog](https://blog.duolingo.com/duolingo-max)
- Feasibility: text-only LLM work (gpt-oss-20b for persona turns, 120b for the debrief rubric). Briefs come from templates per discipline (for example "30-sec product spot for a Jaipur jewellery brand, ₹40k budget, client wants teal-orange"). The roleplay "client" gives revision notes on the learner's uploaded work, which chains into Project Feedback. Effort 1-2. Impact medium-high: it differentiates from Domestika and Skillshare, which have no such agents (see Q2).

**E. Career & freelance agent (portfolio review, India rate card, proposals, job matching)**
- Market context: BCG (May 2025) counts 2-2.5M monetized creators in India influencing $350-400B of spend. Only about 8-10% monetize effectively, and brands expect to grow creator-marketing budgets 1.5-3x in 2-3 years. That is demand for editors, colorists and motion designers — [BCG](https://www.bcg.com/publications/2025/india-from-content-to-commerce-mapping-indias-creator-economy); [Storyboard18](https://www.storyboard18.com/amp/how-it-works/indias-creator-economy-influences-400-bn-in-consumer-spend-set-to-drive-1-tn-by-2030-bcg-64390.htm)
- Seekho (Indian vernacular skilling app) reports that "part-time income" is one of its two most popular categories, which suggests strong earning intent among Indian learners — [Digital Terminal](https://digitalterminal.in/trending/seekho-app-crosses-100-million-downloads-adds-2175-million-users-in-2025)
- Feasibility: proposal, pitch and showreel-description writing is pure LLM work (Effort 1). Portfolio review reuses the critique agent. An India rate card needs curated data; I found no authoritative public source of Indian freelance rates for editors or colorists (see Gaps). Job matching needs a jobs feed or partnerships (Effort 4). Impact high for retention and upsell, because career outcomes are why adults buy creative courses.

**F. Community agents (peer-review matching, Q&A deflection, moderation)**
- Coursera's AI grading of peer reviews (beta) showed a 72% first-attempt pass rate, a notable decrease vs. human-graded peer review. Coursera framed it as stricter, faster, higher-quality feedback. Lesson: AI can make peer review faster and more consistent, but it changes grade distributions — [Coursera blog](https://blog.coursera.org/ai-grading-in-peer-reviews-enhancing-courseras-learning-experience-with-faster-high-quality-feedback)
- Q&A deflection precedent: Georgia Tech's Jill Watson (ChatGPT-based, 2023) reached 75-97% accuracy on synthetic test sets vs. about 30% for OpenAI Assistants. It declines when course context is insufficient and checks answers by textual entailment. In an A/B study, students with Jill got more A grades (66% vs 62%) and fewer C grades (3% vs 7%) and reported stronger teaching presence — [Newswise / Georgia Tech](https://www.newswise.com/articles/georgia-tech-s-jill-watson-outperforms-chatgpt-in-real-classrooms); [AI-ALOE](https://aialoe.org/the-return-of-jill-watson/)
- Feasibility: peer-review matching (pair by skill level and discipline, round-robin) is mostly an algorithm plus an LLM-written review rubric. Effort 2. Moderation is OpenAI-moderation-style classification with gpt-oss-20b on posts and images. Effort 2. Impact depends on having an active community; low early on.

**G. Accessibility & localization (subtitles, Indic translation, dubbing, voice cloning, TTS, Hinglish tutor)**
- Coursera translated 4,000 courses into Hindi with AI (Jan 2024) — [Business Today](https://www.businesstoday.in/latest/story/coursera-translates-4000-courses-in-hindi-using-ai-412869-2024-01-11)
- A HeyGen case study reports Coursera completion rising 25% when video was delivered in the learner's native language, and watch time rising 40% in LatAm. This is vendor-published and the methodology is not visible — [HeyGen customer story](https://www.heygen.com/en-gb/customer-stories/coursera)
- Duke's AI-dubbing pilot on Coursera reports that learners complete translated courses at higher rates and that over 90% respond positively (no exact numbers) — [Duke Online](https://online.duke.edu/duke-pilots-ai-dubbing-in-coursera-specializations-to-expand-global-access-to-learning/); [Coursera blog](https://blog.coursera.org/coursera-launches-ai-dubbed-courses-in-spanish-french-brazilian-portuguese-and-german)
- Sarvam Dub (launched Feb 2026) keeps the speaker's voice and timing across 11-12 Indian languages. Transcript and translation can be edited before synthesis, which matters for jargon such as "LUT", "node tree" or "keyframe". It was piloted with IIT Madras lectures and targets NPTEL and NCERT content — [Sarvam Dub blog](https://www.sarvam.ai/blogs/sarvam-dub); [Sarvam e-learning](https://www.sarvam.ai/ai-dubbing/e-learning); [Business Today](https://www.businesstoday.in/technology/news/story/sarvam-unveils-ai-dubbing-model-for-indian-languages-taking-on-elevenlabs-514203-2026-02-02)
- PhysicsWallah: an ElevenLabs case write-up says many PW students study in Hinglish. It reports that voice-feature users make 3x more queries per session and show 2.4x higher 15-day retention. These are vendor-hosted, unverified figures — [ElevenLabs blog](https://elevenlabs.io/hi/blog/physicswallah); [createwith summary](https://www.createwith.com/tool/elevenlabs/updates/physicswallah-triples-student-engagement-with-elevenlabs-voice-ai-tutor)
- PW's Alakh AI suite (Dec 2023) includes "AI Guru", a 24/7 tutor that takes text, image or speech doubts — [Digital Terminal](https://digitalterminal.in/edutech/physics-wallah-launches-alakh-ai-indias-first-homegrown-ai-education-suite)
- Feasibility: subtitles come from Groq Whisper (already in the stack) plus a gpt-oss glossary-aware cleanup pass, then LLM translation to Hindi, Tamil, Telugu and others as SRT/VTT. Effort 2. Dubbing and voice cloning need a vendor (Sarvam or ElevenLabs), instructor consent contracts and QA. Effort 4. A Hinglish tutor is just a language/style setting on the RAG Tutor. Effort 1.
- Compliance: India's DPDP Rules were notified on Nov 13, 2025 with phased commencement. They cover edtech, LMS and proctoring platforms and specify notice, consent and withdrawal requirements. Voice cloning of instructors and voice features for learners should run on explicit, withdrawable consent — [Tsaaro DPDP summary](https://tsaaro.com/blogs/dpdp-rules-2025-explained-full-overview-and-practical-summary); [KS&K edtech note](https://ksandk.com/data-protection-and-data-privacy/dpdp-act-compliance-for-edtech-schools/)

**H. Content QA, auto chapters/highlights/clips, SEO/marketing copy**
- No specific edtech precedent found in this search. These are internal LLM jobs over Whisper transcripts: flag mentions of old versions (for example "Resolve 17") against a current-version table, flag low-confidence transcript spans, check that the outline matches the lesson list, produce chapters with timestamps, and generate 30-60 s vertical clip candidates and SEO descriptions. Effort 1-2 per job. Best merged into the Instructor Course Builder as a "publish checklist" (judgment).

**I. Integrity / proctoring (AI-generated or plagiarized submission detection)**
- AI-text detectors have a high false-positive rate. The University of Pittsburgh disabled Turnitin's AI detector as "not yet reliable enough". A widely cited Stanford study (via a secondary source) found high false-flag rates for non-native English writers, which is especially relevant for Indian learners. A small 2025 test found ZeroGPT flagged 28% of human essays — [Pitt University Times](https://www.utimes.pitt.edu/node/6340); [Brandeis](https://www.brandeis.edu/ai-steering-council/ai-literacy/ai-teaching-learning/detection-tools.html); [Brophy Roundup (secondary)](https://roundup.brophyprep.org/19725/news/ai-detectors-face-accuracy-concerns-as-schools-adapt/); [practitioner test](https://marcushere.substack.com/p/i-ran-50-student-submissions-through)
- For creative work (images, renders, audio), AI-generation detection is even less established. I found no reliable classifier evidence for that use (see Gaps).
- Feasible alternative: process-based integrity. Require project files and screenshots (.drp, .blend, layered PSD/Figma links, DAW session screenshots), check EXIF/metadata, use perceptual hashing for duplicate submissions across learners, and hold a short Whisper-recorded "explain your choices" viva. Certificate verification is a plain signed-URL/QR feature, not an agent. Effort 1.

**J. Engagement / churn prediction, re-engagement (WhatsApp), sales/upsell**
- Prediction alone does not equal retention. In an MITx MicroMasters study, a model predicted 80% of dropouts, but tailored encouragement emails to at-risk learners had "no effect in dropout reduction" — [Borrella et al. 2019](https://mitili.mit.edu/sites/default/files/project-documents/a24-Borrella_Caballero_Ponce_2019.pdf)
- Rodríguez et al. (IRRODL) combined AI early-risk detection with personalized nudges for 252 online learners. Bañeres et al. (2023) note that interventions are "scarce" relative to prediction research — [IRRODL](https://www.irrodl.org/index.php/irrodl/article/view/5407/5647); [IJETHE](https://link.springer.com/article/10.1186/s41239-022-00371-5)
- WhatsApp in Indian edtech: vendor-only evidence. Choice TechLab used a WhatsApp bot for onboarding, reminders and automated certificates (Infobip). A claim of "2x re-enrolment conversion vs email" is unsourced. Read rates of "90%+" are vendor claims — [Infobip](https://www.infobip.com/customer/choice-techlab); [CampaignHQ](https://blog.campaignhq.co/whatsapp-for-edtech-platforms/); [Wati](https://www.wati.io/blog/which-whatsapp-platform-is-best-for-sending-automated-course-completion-and-upsell-messages-to-online-learners)
- Seekho credits UPI autopay and rising willingness to pay with its subscription growth (4M paid subscribers claimed). Renewal and dunning nudges are a revenue lever in India — [Entrepreneur India](https://india.entrepreneur.com/news-and-trends/seekho-raises-usd-28-mn-in-series-b-led-by-bessemer/496640); [Mediainfoline](https://www.mediainfoline.com/education/seekho-marks-six-years-crosses-100-million-downloads-as-indias-learning-habits-evolve)
- Feasibility: the risk score can be rules or logistic regression on MongoDB events (days inactive, checkpoint failures, video drop-off). The LLM writes personalized nudges that reference the learner's exact next lesson or project. Delivery uses the WhatsApp Business API through a BSP (Gupshup, Wati, Interakt, Infobip) with opt-in and approved templates. Effort 3. Must be A/B tested, given the null email result.

**K. Manager / B2B or parent dashboard agent; instructor co-pilot for student Q&A**
- Khanmigo teacher tools: evidence for time savings is mostly vendor or anecdotal. One aggregator cites about 37 min/week saved and a 0.15 SD math gain from a WestEd study, but I could not find the primary report — [aggregator, unverified](https://plainai.aguidetocloud.com/changes/khanmigo-classroom-results/); [Khan Academy blog](https://blog.khanacademy.org/empowering-teachers-with-ai-tools-now-free-forever/)
- Parent dashboards matter less for an adult creative audience. A B2B dashboard (studios, agencies, colleges) is an extension of the Performance Report and Admin Insights agents. The instructor co-pilot (drafts answers to student questions from course RAG for the instructor to approve) follows the Jill Watson pattern above. Effort 2. Merge it into Support/RAG Tutor with a human-in-the-loop queue.

**L. Voice tutor / live "office hours"; AI TA in the instructor's persona**
- Voice evidence is PW's vendor-reported 3x queries and 2.4x 15-day retention (above). Groq offers Whisper STT but only English/Arabic TTS, so Hindi voice output needs Sarvam, ElevenLabs or another Indic TTS. Effort 3-4.
- An instructor-persona TA raises consent and brand risk (DPDP plus contractual), and a hallucinated answer gets attributed to the instructor. Jill Watson's approach (decline when context is insufficient, entailment checks) is the safeguard pattern — [AI-ALOE](https://aialoe.org/the-return-of-jill-watson/)

### Inferences
- The "measure deterministically, explain with an LLM" pattern (LUFS, shot lengths, histograms) fits Groq well: cheap, fast text models plus a Python media worker. It avoids the known weakness of VLMs at precise low-level judgement.
- Most candidates are modes of existing agents rather than new agents. Truly new are Localization, Practice/Roleplay, Career/Freelance, Re-engagement, and the Audio/Edit media-analysis tools.

### Gaps
- No per-attribute accuracy numbers (exposure vs. color vs. composition) for Llama 4 Scout or other Groq-hosted VLMs on aesthetic tasks. Running an in-house eval on about 100 instructor-graded submissions is recommended.
- No authoritative public dataset of Indian freelance rates for editors, colorists or 3D artists; the rate card would need to be curated by instructors or surveyed.
- Unable to verify the original Stanford AI-detector paper numbers directly (cited via a secondary source).
- No reliable evidence on detecting AI-generated images or audio in student submissions.
- Domestika, Skillshare, MasterClass and School of Motion: I found no confirmed AI tutor or critique launches. Skillshare published AI principles (AI features optional, opt-out from training) and a third-party guide says it has no built-in AI agent — [Skillshare help](https://help.skillshare.com/hc/en-us/articles/34215508464141); [Guru](https://www.getguru.com/reference/skillshare-ai-agent). Not confirmed for MasterClass or School of Motion.

## Q2. Which have proven ROI in edtech (completion, retention, revenue)?

### Takeaway
ROI evidence is thin and mostly self-reported by vendors or platforms. The strongest signals are for native-language delivery (Coursera +25% completion, vendor case), AI tutors/coaches (Coursera Coach +9.5% first-attempt quiz pass; Jill Watson modest grade gains in an A/B test), and voice in Hinglish (PW 2.4x 15-day retention, vendor claim). Prediction-plus-email nudges have a documented null result. No creative-skills platform has published AI-critique ROI.

### Cited Findings
- Coursera Coach: 1M+ learners supported, 9.5% higher first-attempt quiz pass rate and 11.6% more lessons completed per hour (no methodology published). 94% of users in a 52K-learner survey said it improved their experience — [Coursera blog](https://blog.coursera.org/announcing-ai-powered-capabilities-enabling-educators-to-use-coursera-coach-to-deliver-interactive-personalized-instruction); [Coursera Learner Outcomes 2025](https://www.coursera.org/enterprise/resources/ebook/learner-outcomes); [Q2 2025 call (AI summary)](https://www.marketbeat.com/earnings/reports/2025-7-24-coursera-inc-stock)
- Native-language video: +25% completion and +40% LatAm watch time (HeyGen case on Coursera) — [HeyGen](https://www.heygen.com/en-gb/customer-stories/coursera); Duke reports qualitatively higher completion for dubbed courses — [Duke](https://online.duke.edu/duke-pilots-ai-dubbing-in-coursera-specializations-to-expand-global-access-to-learning/)
- Jill Watson A/B: 66% vs 62% A grades — [Newswise](https://www.newswise.com/articles/georgia-tech-s-jill-watson-outperforms-chatgpt-in-real-classrooms)
- PW voice tutor: 3x queries per session and 2.4x 15-day retention (vendor-hosted) — [ElevenLabs](https://elevenlabs.io/hi/blog/physicswallah)
- Duolingo Max (AI conversation features) is about 5% of subscribers, which is revenue evidence for a premium AI tier (secondary source) — [iTiger](https://www.itiger.com/hans/news/2516372616)
- Null result: ML-predicted at-risk learners plus encouragement emails gave no dropout reduction (MITx) — [Borrella 2019](https://mitili.mit.edu/sites/default/files/project-documents/a24-Borrella_Caballero_Ponce_2019.pdf)
- Seekho: retained users spend 28-29 min/day (up from about 23). Vernacular short-form plus UPI autopay drove 4M paid subscribers (company claims) — [Digital Terminal](https://digitalterminal.in/trending/seekho-app-crosses-100-million-downloads-adds-2175-million-users-in-2025)

### Inferences
- For Creators Lab, localization (Hindi/Hinglish subtitles first) has the best evidence-to-effort ratio, because Whisper is already in the stack.
- Nudges should be content-specific and multi-channel (WhatsApp, which is native to India), with a holdout group. Generic "come back" messages have a null precedent.
- AI roleplay and critique are differentiators: no creative-skills competitor found ships them. That favors a premium tier (Duolingo Max-like) over free inclusion.

### Gaps
- No independent, peer-reviewed ROI study for any of these in creative-skills learning.
- No Indian WhatsApp-nudge completion lift figures, only vendor claims.

## Q3. Recommendation: top 5 to add, what to merge, what to skip

### Takeaway
Add: (1) Localization & Hinglish agent, (2) Creative Brief & Client Roleplay agent, (3) Media Analysis toolkit for audio mix and edit pacing (feeding Project Feedback), (4) Career & Freelance agent, (5) Re-engagement agent on WhatsApp (A/B tested). Merge the critique, software/gear coach, content QA, instructor co-pilot and B2B dashboard into existing agents. Skip or defer AI-detection proctoring, instructor voice cloning, a live voice tutor, and parent dashboards.

### Cited Findings (supporting the ranking)
| Rank | Agent | Impact | Effort (1-5) | Why | Key evidence |
|---|---|---|---|---|---|
| 1 | Localization & Hinglish (Whisper subtitles, cleanup, Hindi/Tamil/Telugu SRT, Hinglish tutor mode; phase 2: Sarvam dubbing for top courses) | High | 2 (subs) / 4 (dub) | Largest reach lift in India; Whisper already in stack | [HeyGen/Coursera +25%](https://www.heygen.com/en-gb/customer-stories/coursera); [Sarvam Dub](https://www.sarvam.ai/blogs/sarvam-dub); [PW Hinglish](https://elevenlabs.io/hi/blog/physicswallah) |
| 2 | Creative Brief generator + Client/Director Roleplay (daily challenges, simulated client revisions, debrief rubric) | Med-High | 1-2 | Pure text LLM; precedent at Udemy; trains real freelance skills | [Udemy Role Play](https://about.udemy.com/?p=225297); [Udemy 2026 expansion](https://secure.businesswire.com/news/home/20260507908926/en/Udemy-Expands-AI-Role-Play-Capabilities-to-Advance-Immersive-Skills-Based-Learning) |
| 3 | Media Analysis tools (audio LUFS/spectrum vs reference; edit pacing via PySceneDetect; image histograms) feeding Project Feedback | High for music/film | 3 | Deterministic metrics avoid VLM weakness | [iZotope](https://www.izotope.com/en/learn/mix-and-master-with-reference-tracks-in-ozone.html); [PySceneDetect](https://www.scenedetect.com/features); [Q-Bench+](https://arxiv.org/pdf/2402.07116) |
| 4 | Career & Freelance (portfolio and showreel review, proposal and pitch writer, India rate-card guidance, later job board) | High (retention, upsell) | 2 (4 with jobs) | Earning intent dominates Indian skilling demand | [BCG creator economy](https://www.bcg.com/publications/2025/india-from-content-to-commerce-mapping-indias-creator-economy); [Seekho categories](https://digitalterminal.in/trending/seekho-app-crosses-100-million-downloads-adds-2175-million-users-in-2025) |
| 5 | Re-engagement agent (risk score, personalized WhatsApp/email nudge pointing at the exact next lesson, renewal/UPI autopay reminders) | Med-High (revenue) | 3 | India channel fit, but must be A/B tested | [Borrella null](https://mitili.mit.edu/sites/default/files/project-documents/a24-Borrella_Caballero_Ponce_2019.pdf); [Infobip](https://www.infobip.com/customer/choice-techlab) |

**Merge into existing agents**
- Portfolio/critique → Project Feedback (vision): add discipline rubrics, a reference-look comparison, and deterministic metrics from the Media Analysis tools. Present output as "coaching notes", not grades, until in-house eval accuracy is known. [The Photographer's Eye](https://openaccess.thecvf.com/content/CVPR2025/html/Qi_The_Photographers_Eye_Teaching_Multimodal_Large_Language_Models_to_See_CVPR_2025_paper.html)
- Software/gear coach → RAG Tutor "tools mode" (manuals and release notes corpus, version tags, a curated INR gear table).
- Hinglish tutor → RAG Tutor language setting (included in rank 1).
- Content QA, auto chapters, clips, SEO → Instructor Course Builder "publish checklist".
- Instructor Q&A co-pilot → Support / RAG Tutor with an instructor approval queue and Jill Watson-style decline-if-unsure. [AI-ALOE](https://aialoe.org/the-return-of-jill-watson/)
- B2B/manager dashboard → Admin Insights + Performance Report.
- Upsell recommendation → Re-engagement agent / Concierge.
- Peer-review matching and moderation → later "Community" module once forum volume justifies it. [Coursera AI peer grading](https://blog.coursera.org/ai-grading-in-peer-reviews-enhancing-courseras-learning-experience-with-faster-high-quality-feedback)

**Skip or defer**
- AI-generated-submission detection: unreliable, with false-positive bias against non-native writers. Use process evidence (project files, metadata, perceptual hashing, short recorded viva) instead. [Pitt](https://www.utimes.pitt.edu/node/6340)
- Instructor voice cloning and an instructor-persona TA: defer until consent contracts and DPDP-compliant consent flows exist. [DPDP summary](https://tsaaro.com/blogs/dpdp-rules-2025-explained-full-overview-and-practical-summary)
- Live voice tutor / office hours: defer. Groq TTS has no Indic voices, so it needs a vendor; revisit after text Hinglish usage is proven. [Groq Orpheus](https://signalwire.com/docs/platform/voice/tts/groq-tts)
- Parent dashboard: low relevance for an adult creative audience.
- Certificate verification: build it as a plain feature (signed QR/URL), not an agent.

### Inferences
- A sensible order: rank 2 and rank 1 (subtitles) first (weeks, text-only), then the Career agent, then the Media Analysis worker (needs a Python service), then WhatsApp re-engagement (needs a BSP account, templates and an A/B setup).
- Before launching critique features, build a small gold set of instructor-graded submissions per discipline to measure VLM agreement.

### Gaps
- No cost benchmarks gathered for Sarvam or ElevenLabs dubbing per minute in INR; get vendor quotes.
- WhatsApp Business API per-message pricing in India was not researched here.
