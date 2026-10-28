# Learning-Science Evidence Base for Creators Lab AI Agents (RAG Tutor, Checkpoint Quizzes, Examination, Performance Report, Study Coach, Revision/Flashcards, Project Feedback)

Evidence grades used below: **[A]** = multiple meta-analyses / large RCT bodies; **[B]** = single meta-analysis or single well-run RCT; **[C]** = single small/short study, vendor-run eval, or preprint; **[D]** = expert opinion / secondary claim not verified against primary source.

## 1. Retrieval practice / testing effect and in-video embedded questions (Checkpoint Quizzes, Examination, Revision)

### Takeaway
Retrieval practice is one of the two best-supported learning techniques (g ~0.43-0.61 across meta-analyses, ~0.50 in real classrooms) [A]; interpolating short tests inside video lectures halved mind wandering and improved retention in a lab setting [B/C]. Checkpoint quizzes should be recall-style, frequent (~every 5-7 min of video), give corrective feedback, and recur later (spaced).

### Cited Findings
- Adesope, Trevisan & Sundararajan (2017), Review of Educational Research 87(3): practice tests beat restudying and all other comparison conditions; 272 independent effect sizes (~15,000 participants). Effects were larger with a single practice test, and feedback vs. no feedback was not statistically significant in that dataset. Article count is reported inconsistently (118 vs 188) across secondary sources; the g ≈ 0.61 overall figure could not be confirmed from the abstract in this search — [SAGE](https://journals.sagepub.com/doi/10.3102/0034654316689306); [Learning Scientists summary](https://www.learningscientists.org/blog/2017/2/9-1); [WSU PDF](https://education.wsu.edu/documents/2018/01/rethinking-use-tests.pdf/)
- Rowland (2014), Psychological Bulletin: testing > restudy; recall-format initial tests produced larger benefits than recognition tests; larger effects with feedback and with retention intervals ≥1 day. Secondary sources report g ≈ 0.50 (159 effect sizes, 61 studies) and g ≈ 0.73 with feedback vs 0.39 without — UNVERIFIED against full text [D for the numbers, A for direction] — [Rowland 2014 PDF](https://courseware.epfl.ch/assets/courseware/v1/fdde2f0aa590bf3b1324077a6bf1540c/asset-v1%3AEPFL%2BDEMO%2B2020%2Btype%40asset%2Bblock/Rowland2014-meta-analysis.pdf); [Frontiers review](https://www.frontiersin.org/articles/10.3389/fpsyg.2019.00463/pdf)
- Yang, Luo, Vadillo, Yu & Shanks (2021), Psychological Bulletin 147(4): classroom quizzing meta-analysis, 222 studies, 48,478 students, g = 0.499 (bias-corrected ~0.43 reported in one source); moderators include format consistency between quiz and exam, material matching, corrective feedback, and number of repetitions — [HKBU record](https://scholars.hkbu.edu.hk/en/publications/testing-quizzing-boosts-classroom-learning-a-systematic-and-meta-/); [PDF](https://gwern.net/docs/spacedrepetition/2021-yang.pdf)
- Donoghue & Hattie (2021) meta-analysis of Dunlosky's ten techniques (242 studies, mean effect 0.56): distributed practice and practice testing were the most effective; caution that most outcomes were surface/factual — [Frontiers in Education](https://www.doi.org/10.3389/feduc.2021.581216)
- Szpunar, Khan & Schacter (2013), PNAS: interpolating memory tests in a 21-minute online statistics lecture halved mind wandering (untested group mind-wandered ~40% of the time), tripled note-taking, improved final-test learning, and reduced anxiety about the final cumulative test. Limits: one lecture, one topic, lab setting — [PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC3631699/); [author interview](https://medicalresearch.com/interpolated-memory-tests-reduce-mind-wandering-and-improve-learning-of-online-lectures/)
- Jing, Szpunar & Schacter (2016): interpolated tests in video lectures also boosted integration of related information across the lecture — [PDF](https://sites.harvard.edu/schacter-memory/files/2022/08/jing2016-1-1.pdf)

### Inferences
- Design rule (Checkpoint agent): insert a pause-quiz at each natural segment boundary, target ~every 5-7 minutes of video (consistent with Szpunar's segment design and Guo's engagement data, §9); 1-3 questions per checkpoint; never more than ~90 s of interruption.
- Prefer free-recall / short-answer and "predict what happens next / which setting would you change" items over multiple-choice (recall > recognition per Rowland); use MCQ only as a fallback for low-friction mobile viewing.
- Always give immediate corrective feedback with the correct answer + a timestamp link back to the explanation (feedback moderator in Rowland and Yang).
- Match quiz format to Examination format (Yang's "format consistency" moderator): if the final exam uses rubric-graded short answers, checkpoints should include short answers too.
- Every checkpoint item should be auto-enrolled into the Revision agent's spaced queue — a single test is good, but repeated spaced retrieval is better (number of repetitions moderator).
- Checkpoint results should be low-stakes (not counted toward certification) to preserve the anxiety-reducing benefit.

### Gaps
- No RCT found establishing an optimal in-video quiz frequency; "every 5-7 min" is an inference, not a tested parameter.
- Could not verify Adesope's overall g = 0.61 or Rowland's g = 0.50 from primary text.
- No evidence found specifically on testing effects for procedural/creative software skills (e.g., color grading node trees); most evidence is verbal/factual and STEM.

## 2. Spaced repetition algorithms: SM-2 vs FSRS (Revision agent)

### Takeaway
Spacing is [A]-grade evidence; for the scheduler, FSRS is the clear empirical winner on the largest open benchmark (~10k Anki users, ~727M reviews), and unlike SM-2 it outputs a recall probability that other agents can consume. Implement FSRS (open-source, multiple language ports) with default parameters, optimizing per-user only once enough reviews exist.

### Cited Findings
- Cepeda et al. (2008): optimal spacing gap increases with the retention interval; as a proportion of test delay, the optimal gap falls from ~20-40% for a 1-week test to ~5-10% for a 1-year test; 2006 review covered 839 assessments in 317 experiments — [Cepeda et al. 2008 / Temporal ridgeline](https://digitalcommons.usf.edu/psy_facpub/1766/); [Cepeda 2009 PDF](https://home.cs.colorado.edu/~mozer/Research/Selected%20Publications/reprints/Cepedaetal2009.pdf); [Cepeda 2006 PB](https://www.evullab.org/pdf/CepedaPashlerVulWixtedRohrer-PB-2006.pdf)
- open-spaced-repetition srs-benchmark: 10,000 Anki collections, ~727M reviews. Results (no same-day reviews; lower is better for log loss/RMSE): FSRS-6 log loss 0.3460, RMSE(bins) 0.0653, AUC 0.7034; FSRS-5 0.3561/0.0742/0.7010; FSRS-4.5 0.3625/0.0764/0.6891; DASH 0.3682/0.0838/0.6311; HLR (Duolingo's half-life regression) 0.4694/0.1275/0.6369; Ebisu v2 0.4989/0.1627/0.6051. A neural RWKV model is best overall (log loss 0.2773) but is heavyweight — [srs-benchmark GitHub](https://github.com/open-spaced-repetition/srs-benchmark)
- Original SM-2 does not predict recall probability; the benchmark had to add formulas to make a "trainable SM-2" comparable. A forum report says FSRS-5 beats trainable SM-2 for 97.4% of users (secondhand, [D]) — [Anki forums](https://forums.ankiweb.net/t/fsrs-vs-sm2-in-2-seperate-profiles/52171); [srsbench R package notes](https://ftp.fau.de/cran/web/packages/srsbench/readme/README.html)
- SuperMemo disputes FSRS benchmark methodology (interested party) — [SuperMemo blog](https://supermemo.com/en/blog/supermemo-is-better-than-fsrs-by-far)
- Claims like "FSRS cuts reviews 25% at equal retention" appear in marketing blogs without verifiable sourcing [D] — [mindomax](https://www.mindomax.com/fsrs-vs-sm2-spaced-repetition-algorithm)

### Inferences
- Design rule: use FSRS (latest stable, e.g., FSRS-6) with global default parameters at launch; schedule cards to a target retention of ~0.85-0.90 (user-adjustable); run per-user parameter optimization only after a learner has accumulated a substantial review history (benchmark falls back to population parameters when data is thin; exact threshold not stated).
- Expose FSRS's predicted retrievability R(t) per card/skill to the Performance Report and Study Coach ("you are likely to recall 62% of Color Theory cards today").
- Use 4-button grading (Again/Hard/Good/Easy) but auto-grade where possible (the agent grades a typed answer) to reduce self-grading bias.
- Cards for creative skills should be generative (e.g., "Which curve adjustment fixes this crushed shadow? [image]") not just term-definition.
- Course-level spacing: Study Coach should schedule a cumulative review ~1-3 days after each module and again ~1-2 weeks later, scaled to when the learner's Examination or project deadline is (Cepeda ratio).

### Gaps
- Benchmark is on Anki user self-graded data (largely language/medical facts); no evidence on FSRS for image-based or procedural creative-skill cards.
- SM-2 numbers were not displayed in text on the benchmark page; the superiority % figure is unverified.
- No evidence found on minimum reviews needed for reliable per-user FSRS optimization.

## 3. Interleaving, elaboration/self-explanation, worked examples, generation effect, desirable difficulties

### Takeaway
Interleaving (g = 0.42) is strongest for visual category discrimination like paintings (g = 0.67) — directly relevant to color grading, cinematography styles and design [A/B]. Self-explanation (g = 0.55) and generation (d = 0.40) are robust [A/B]. These map to: mixed-topic quiz decks, "explain why" prompts, and asking the learner to produce before being shown.

### Cited Findings
- Brunmair & Richter (2019) meta-analysis "Similarity matters": overall interleaving g = 0.42 (59 studies, 238 effect sizes); paintings g = 0.67, other visual material benefited; math g = 0.34; words showed a blocking advantage (g = -0.39). Interleaving helps more when categories are similar to each other and items within a category are dissimilar, and for complex material — [PDF](https://www.psychologie.uni-wuerzburg.de/fileadmin/06020400/2019/Brunmair_Richter_in_press__2019_META-ANALYSIS_OF_INTERLEAVED_LEARNING.pdf)
- Bisra et al. (2018) self-explanation meta-analysis: g = 0.55 (95% CI 0.45-0.65), 69 effect sizes from 64 reports; robust across contexts and after controlling for time on task — [SFU Summit](https://summit.sfu.ca/item/34322); [PDF](https://www.Gwern.net/doc/psychology/spaced-repetition/2018-bisra.pdf)
- Dunlosky et al. (2013) rated practice testing and distributed practice "high utility", self-explanation/elaborative interrogation/interleaving "moderate", and highlighting/rereading/summarization "low" (reported via secondary sources) — [Donoghue & Hattie 2021](https://www.frontiersin.org/articles/10.3389/feduc.2021.581216/pdf); [ID Tips summary](https://idtips.substack.com/p/self-explanation-the-evidence-behind)
- Bertsch et al. (2007) generation effect meta-analysis: 445 effect sizes, 86 studies, mean d ≈ 0.40 for generating vs reading — [PubMed](https://pubmed.ncbi.nlm.nih.gov/17645161/)

### Inferences
- Revision agent: build interleaved decks that mix confusable categories (e.g., "teal-orange vs bleach bypass vs day-for-night look", "Dutch angle vs canted vs whip-pan", "compressor vs limiter artifacts") — this is where interleaving's visual-category effect is largest. Block only when a learner is brand-new to a concept (first exposure), then switch to interleaved.
- Tutor and Checkpoint agents: after a correct answer, ask for a 1-2 sentence "why" (self-explanation); after a wrong answer, ask them to compare their reasoning to the correct one.
- Generation-first rule: before revealing a technique or answer, ask the learner to attempt/predict (e.g., "what would you do to separate the subject from the background?"). Wrong guesses followed by feedback are productive (see hypercorrection, §7).
- Worked examples: for novices on procedural tasks (software workflows), the tutor should show a complete worked example then fade steps (complete → partially complete → learner does all). Grade [D] here because worked-example meta-analytic numbers were not verified in this search.
- Desirable difficulties must be calibrated: interleaving words showed a blocking advantage, so do not blindly interleave vocabulary/terminology drills.

### Gaps
- Worked-example and expertise-reversal effect sizes were not retrieved/verified.
- No direct studies of interleaving for creative software skills were found.

## 4. Socratic/guided tutoring vs answer-giving: 2024-2026 LLM tutor studies and guardrails (RAG Tutor)

### Takeaway
The single most consistent finding: unguarded "ChatGPT-style" access boosts practice performance but can harm independent learning (−17% exam scores in Bastani et al.), while tutors engineered with pedagogy — withholding final answers, grounding in instructor-written solutions, scaffolding, human/teacher oversight — show neutral-to-large positive effects (Harvard physics 0.73-1.3 SD [B/C], Nigeria ~0.3 SD [B], Tutor CoPilot +4 pp mastery [B], Eedi/LearnLM +5.5 pp [C]).

### Cited Findings
- Bastani et al., "Generative AI without guardrails can harm learning", PNAS 122(26) 2025 (SSRN 2024): ~1,000 Turkish high-school math students. GPT Base (ChatGPT-like) raised practice performance by 48%; GPT Tutor (with learning safeguards) by 127%. When access was removed, GPT Base students scored 17% lower than controls; GPT Tutor students were roughly equal to controls (harm largely mitigated, but no gain) — [SSRN](https://papers.ssrn.com/abstract=4895486); [IDEAS/PNAS record](https://ideas.repec.org/a/nas/journl/v122y2025pe2422633122.html)
- Guardrails in GPT Tutor: teacher input and prompts designed to give hints rather than direct answers; students who used AI were overly optimistic about how much they learned (including high achievers) — [Wharton Knowledge](https://knowledge.wharton.upenn.edu/article/without-guardrails-generative-ai-can-harm-education). Secondary report that GPT Base users copied answers at much higher rates [D] — [Live in the Future](https://liveinthefuture.org/stories/ai-makes-students-worse.html). (Exact prompt text and the reported GPT Base error rate were not verified here.)
- Kestin et al., Scientific Reports, 3 June 2025: randomized crossover RCT, 194 Harvard intro-physics students (Fall 2023); custom AI tutor engineered on research-based pedagogy vs in-class active learning; median post-test 4.5 vs 3.5, more than double the learning gains, effect 0.73-1.3 SD (quantile regression), in less time (median 49 vs 60 min) — [Stanford SCALE repository](https://scale.stanford.edu/ai/repository/ai-tutoring-outperforms-class-active-learning-rct-introducing-novel-research-based); [ETC Journal review](https://etcjournal.com/2025/11/10/review-of-kestin-et-al-s-june-2025-harvard-study-on-ai-tutoring/). Caveats: one topic, two weeks, elite sample, no retention/transfer measure. A non-peer-reviewed re-analysis finds only 63% took both conditions and estimates a ~16% improvement (ratio CI ~1.09-1.25) for completers [D] — [Clay Ford re-analysis](https://clayford.net/posts/ai_tutoring_nature/index.html)
- World Bank, Edo State Nigeria ("From Chalkboards to Chatbots", WPS11125, May 2025): RCT, 6-week after-school program, twice weekly, ~13 hours total; GPT-4 tutoring improved outcomes by ~0.3 SD overall (0.24 SD in English), described as ~1.5-2 years of typical learning and above 80% of rigorously evaluated interventions; dose-response (more sessions → larger gains). Design: teacher introduces each topic, keeps students on task, helps them interpret AI feedback and catch hallucinations; prompts push reasoning not shortcuts; structured lesson guide. Cannot isolate the chatbot from the package — [World Bank blog](https://blogs.worldbank.org/en/developmenttalk/addressing-the-learning-crisis-with-generative-ai--lessons-from-); [project document](https://projects.worldbank.org/en/projects-operations/document-detail/P169921)
- Tutor CoPilot (Wang, Ribeiro, Robinson, Loeb, Demszky; arXiv 2410.03017): RCT with ~900 tutors / 1,800 K-12 students (other summaries say 700/1,000); LLM gives real-time pedagogical suggestions to human tutors; students 4 pp more likely to master topics (p<0.01), 9 pp for students of lower-rated tutors; ~$20/tutor/yr; exit-ticket pass 66% vs 62% — [arXiv](https://arxiv.org/html/2410.03017v1); [NSSA](https://nssa.stanford.edu/studies/tutor-copilot-human-ai-approach-scaling-real-time-expertise); [J-PAL](https://www.povertyactionlab.org/print/pdf/node/8137812?lang=id)
- Google LearnLM tech report (arXiv 2412.16429): pedagogy experts preferred LearnLM over GPT-4o by +31%, Claude 3.5 Sonnet +11%, and base Gemini 1.5 Pro +13% on simulated tutoring conversations (vendor eval, [C]) — [arXiv](https://arxiv.org/pdf/2412.16429v3). Gemini 2.5 report: 189 educators preferred Gemini 2.5 Pro in 71-82% of match-ups vs other frontier models [C] — [arXiv 2505.24477](https://arxiv.org/pdf/2505.24477v1)
- Eedi + LearnLM exploratory RCT (arXiv 2512.23633): N = 165 students, 5 UK secondary schools; 17 expert tutors supervised every AI message; supervised-AI students solved novel problems on later topics 66.2% vs 60.7% with human tutors alone (+5.5 pp; significance not confirmed here); ~76% of AI drafts approved with zero/minimal edits; factual errors ~0.1% — [arXiv](https://arxiv.org/html/2512.23633v1); [The 74](https://www.the74million.org/article/ai-tutors-with-a-little-human-help-offer-reliable-instruction-study-finds/)

### Inferences
Guardrails that were common to the positive studies, and the design rules they imply for the RAG Tutor:
- **Ask before telling.** On any question that maps to a checkpoint/exam item or project task, the tutor first asks what the learner has tried or thinks, and never delivers the final answer/settings on the first turn (Bastani's GPT Tutor, Kestin's design).
- **Hint ladder.** Level 0: clarifying question → L1: point to the relevant concept + timestamp in the course video → L2: partial worked step → L3: full worked example on an analogous (not identical) problem → L4: full answer only after ≥2 genuine attempts, followed by a "now you try a variant" item.
- **Ground in instructor-authored content.** RAG retrieval restricted to course transcripts, instructor notes, and pre-written solutions/rubrics; cite timestamps. Grounding in teacher-provided solutions is the standard mitigation for the hallucination problem that harmed GPT Base learners [inference; Bastani prompt details unverified].
- **Detect "answer-seeking"** (e.g., "just tell me", pasted exam questions) and switch to the hint ladder; in Examination mode the tutor is disabled entirely.
- **Close each exchange with retrieval.** End explanations with a quick check question; log it as a learning event.
- **Counter illusion of competence.** Because AI users overestimate learning (Bastani), the Study Coach should periodically run unassisted checks and show the gap between assisted and unassisted performance.
- **Human-in-the-loop where stakes are higher.** Tutor CoPilot and Eedi show AI-assisting-humans works well; for Project Feedback and exam disputes, route to instructors/TAs with AI-drafted comments.
- **Instrument dose.** Nigeria's dose-response suggests tracking session count/time and nudging regular short sessions.

### Gaps
- Exact GPT Tutor system prompt and GPT Base error rates not verified (PDF text not extractable in this session).
- No LLM-tutor RCTs found in creative-skills domains (all are math, physics, English).
- Kestin's precise prompt structure (pre-written step-by-step solutions in the system prompt) not verified from the primary article (paywall redirect).

## 5. Mastery learning, Bloom's 2-sigma and modern re-estimates (Study Coach, Examination gating)

### Takeaway
Bloom's 2-sigma is an overestimate; VanLehn (2011) found human tutoring ≈ 0.79 SD and step-based ITS ≈ 0.76 SD, with answer-only systems far lower (~0.31) [A/B]. The design lesson: interactivity at the level of each step (not just right/wrong on final answers) is what produces gains.

### Cited Findings
- VanLehn (2011), Educational Psychologist: human tutoring d = 0.79 vs no tutoring (far below Bloom's 2.0); step-based ITS d = 0.76 (28 effects); substep-based ~0.40; answer-based ~0.31 (one source reports substep as 0.32 — conflict noted) — [MIT symposium slides](https://quality.mit.edu/files/2012/01/Quality-Symposium-Kurt-VanLehn.pdf); [Marginal Revolution summary](https://marginalrevolution.com/marginalrevolution/2013/10/how-good-are-computers-as-tutors.html); [ASEE paper (0.32 figure)](https://peer.asee.org/25090.pdf)
- Tutor CoPilot uses "mastery" of topics (exit tickets) as the outcome, showing mastery checks as a practical measurement unit — [arXiv](https://arxiv.org/html/2410.03017v1)

### Inferences
- Design rule: each course module has a mastery threshold (e.g., ≥80% on checkpoint + a delayed recall check); Study Coach recommends remediation (targeted rewatch segments + extra items) before unlocking the Examination, but does not hard-block paying learners — show a "readiness" estimate.
- Tutor must interact at step granularity: for multi-step workflows (e.g., "build a parallel node for skin tones"), evaluate and give feedback on each step, not only the final output (VanLehn step-based > answer-based).

### Gaps
- Kulik et al. (1990) mastery learning meta-analysis effect size not retrieved/verified.
- No modern meta-analysis of LLM tutors vs Bloom's benchmark found in this search.

## 6. Knowledge tracing practical for a small LMS (Performance Report, Study Coach)

### Takeaway
For sparse data, start with an Elo-style rating (learner skill + item difficulty updated per answer) per skill tag, plus FSRS memory states for flashcards; BKT is a simple fallback; deep KT (DKT) needs large data and is not justified at launch [B/C].

### Cited Findings
- Pelánek (2016, Computers & Education): Elo treats each answer as a "match" between learner and item, estimating both learner skill and item difficulty online; basic Elo gave good prediction accuracy on prior-knowledge estimation in geography data — [Pelánek CAE PDF](https://www.fi.muni.cz/~xpelanek/publications/CAE-elo.pdf); [adaptive practice UMUAI](https://www.fi.muni.cz/~xpelanek/publications/umuai-adaptive-practice.pdf)
- BKT/IRT require pre-calibration on large samples; rating systems are computationally cheaper — [arXiv 2403.07908](https://arxiv.org/html/2403.07908v1)
- Standard Elo assumes one concept per item; multivariate Elo extends to multi-concept items — [Abdi et al. arXiv 1910.12581](https://arxiv.org/pdf/1910.12581)
- BKT remains popular because it fits in a page of code but suffers degenerate parameter fits — [ICCE paper](https://library.apsce.net/index.php/ICCE/article/download/4122/3997/5085)

### Inferences
- Design rule: build a skill/topic map by having an LLM extract 5-15 skills per course from transcripts + chapter titles, then have the instructor approve/edit; tag every checkpoint, exam, and flashcard item with 1-3 skills (use multivariate Elo for multi-tag items).
- Maintain per-learner, per-skill Elo estimates (with an uncertainty/count) and per-item difficulty; seed item difficulty from instructor estimate or LLM estimate, then let data update it.
- Performance Report shows skill estimates with confidence bands and "low data" flags rather than false precision.
- Upgrade path: once a course has thousands of learners, consider IRT calibration or BKT per skill; DKT only at much larger scale.

### Gaps
- No direct head-to-head Elo vs BKT benchmark on sparse data was found.
- No published evaluation found of LLM-generated skill maps from video transcripts (this is an engineering inference).

## 7. Feedback timing/type, formative feedback for creative work, deliberate practice (Project Feedback, Examination grading)

### Takeaway
Feedback averages d = 0.48 but is highly heterogeneous; information-rich feedback (task/process level, what to do next) works far better than praise/grades, and effects are higher for cognitive and motor-skill outcomes [A]. Confidence-weighted feedback exploits the hypercorrection effect [B].

### Cited Findings
- Wisniewski, Zierer & Hattie (2020), Frontiers in Psychology: 435 studies, k = 994, N > 61,000; feedback d = 0.48 (medium), significant heterogeneity; impact strongly depends on information content; larger effects on cognitive and motor-skill outcomes than motivational/behavioral — [Frontiers](https://www.frontiersin.org/articles/10.3389/fpsyg.2019.03087/full); [PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC6987456)
- Hypercorrection: high-confidence errors are more likely to be corrected after feedback (surprise draws attention); the effect persists a week, but high-confidence errors can return if the correct answer is forgotten — [Butler, Fazio & Marsh 2011](https://pubmed.ncbi.nlm.nih.gov/21989771/); [Metcalfe & Finn 2011](https://pubmed.ncbi.nlm.nih.gov/21355668); [Duke](https://dukespace.lib.duke.edu/items/d6ab09ca-f55c-4efb-9d32-2788bc5838b2/full)
- Feedback on practice tests increases testing benefits (Rowland moderator; Yang moderator) — [Yang 2021](https://gwern.net/docs/spacedrepetition/2021-yang.pdf)

### Inferences
- Project Feedback agent: structure each critique as (1) where you are vs the rubric criterion (feed-back), (2) one-to-three specific, actionable next steps (feed-forward), (3) an exemplar or reference frame/timecode showing the target; avoid generic praise and avoid grade-only output.
- Limit to the 2-3 highest-leverage issues per submission (avoid overload); require a revised resubmission to close the loop (deliberate-practice cycle: targeted goal → attempt → feedback → refine).
- Use instructor rubrics with anchored levels and exemplar work at each level; the LLM grader must quote the rubric criterion it is scoring and evidence from the submission.
- Examination short answers: rubric-graded by LLM with calibration against instructor-graded samples, and flag low-confidence grades for human review.
- High-confidence wrong answers (from confidence ratings, §8) get extra explanation and are re-queued sooner in spaced review (because they can return).
- Timing: immediate feedback for checkpoint/flashcard items; for creative projects, feedback within a short window so learners revise while context is fresh (timing evidence not verified here).

### Gaps
- Shute (2008) and Hattie & Timperley (2007) specifics (immediate vs delayed feedback findings) were not retrieved.
- Deliberate-practice effect sizes (e.g., Macnamara et al. 2014 meta-analysis showing deliberate practice explains a modest share of variance in music/games/sports) were not verified in this search.
- No rigorous studies found on LLM-generated critique of visual/audio creative work; validity of AI critique of films/renders/music is unestablished — needs internal validation against instructor ratings.

## 8. Metacognition (confidence, self-explanation, calibration) and motivation/gamification (Study Coach, Performance Report)

### Takeaway
Self-explanation (g = 0.55) is robust; confidence ratings enable hypercorrection and calibration feedback; AI users overestimate their learning, making calibration feedback especially important. Gamification has small-to-medium positive effects (cognitive g = 0.49, motivational g = 0.36, behavioral g = 0.25), with only the cognitive effect stable in rigorous studies [A/B].

### Cited Findings
- Self-explanation g = 0.55 — [Bisra et al. 2018](https://summit.sfu.ca/item/34322)
- Students using AI were overly optimistic about their learning — [Wharton Knowledge on Bastani](https://knowledge.wharton.upenn.edu/article/without-guardrails-generative-ai-can-harm-education)
- Sailer & Homner (2020), Educational Psychology Review 32(1): gamification cognitive g = 0.49 [0.30, 0.69] (k = 19), motivational g = 0.36 [0.18, 0.54] (k = 16), behavioral g = 0.25 [0.04, 0.46] (k = 9); cognitive effect stable under high rigor, motivational/behavioral less so — [Springer](https://link.springer.com/article/10.1007/s10648-019-09498-w); [OPUS PDF](https://opus.bibliothek.uni-augsburg.de/opus4/files/109056/109056.pdf)
- A 2026 higher-ed gamification meta-analysis reports d = 1.12 from 22 studies but with I² = 98.84% (extreme heterogeneity; treat cautiously) — [SAGE Open](https://journals.sagepub.com/doi/10.1177/21582440261421375)

### Inferences
- Checkpoint and flashcard items collect a quick confidence rating (e.g., 3-level: guessing / fairly sure / certain) before revealing the answer; Performance Report shows a calibration chart (confidence vs accuracy) per skill.
- Study Coach messaging grounded in autonomy and competence (self-determination framing — evidence not retrieved here): let learners choose goals and session length; show progress in skills mastered rather than XP alone.
- Gamification: use streaks/goals lightly (daily review streak with "streak freeze", weekly goals) tied to retrieval actions, not watch time; avoid leaderboards that reward volume over learning; never let streak pressure push learners to skip quiz feedback.

### Gaps
- No primary evidence retrieved on streak mechanics specifically (e.g., Duolingo-style streak harms/benefits) or on self-determination theory interventions in MOOCs.
- Calibration-training effect sizes not retrieved.

## 9. Video learning: segmenting, signaling, optimal length, active viewing (Checkpoint placement, course design advice)

### Takeaway
Segmenting has small-to-medium effects on retention and transfer and reduces cognitive load [A/B]; signaling d ≈ 0.38 [B]; engagement drops for long videos, with ~6 minutes often cited (engagement, not learning, evidence) [B for engagement].

### Cited Findings
- Guo, Kim & Rubin (2014): 6.9M video sessions across 4 edX courses; shorter videos more engaging; informal talking-head and Khan-style tablet drawing outperform polished lecture recordings; measures were watch time and attempting follow-up problems, not learning. The "≤6 minutes" rule comes from this paper per secondary summaries — [paper PDF](https://up.csail.mit.edu/other-pubs/las2014-pguo-engagement.pdf); [UBC summary](https://blogs.ubc.ca/videolearninghub/?p=569); critique: [NYU "six-minute myth"](https://nexus.sps.nyu.edu/post/the-six-minute-myth)
- Rey et al. (2019) segmenting meta-analysis: 56 investigations, 88 comparisons, small-to-medium effects on retention and transfer; reduces cognitive load and increases learning time; high-prior-knowledge learners benefited more on retention — [MPI](https://is.tuebingen.mpg.de/publications/rey2018segmenting); [DOI](https://www.doi.org/10.1007/S10648-018-9456-4)
- Signaling meta-analyses: Alpizar et al. d = 0.38; Richter et al. r = 0.17; Schneider et al. retention g = 0.53, transfer g = 0.33 (Schneider figures via secondary source, unverified) — [MDPI review](https://www.mdpi.com/2227-7102/13/6/602/html); [WSU record](https://rex.libraries.wsu.edu/esploro/outputs/journalArticle/A-meta-analysis-of-signaling-principle-in/99900601052901842)

### Inferences
- Checkpoint agent uses scene/topic boundaries from the transcript to create segments of ~4-8 min; a checkpoint at each boundary doubles as segmenting (learner-paced continuation).
- Agents can generate "signals": chapter markers, on-screen key-term overlays, and a 1-line "watch for this" prompt before a segment (pre-question), to direct attention.
- For long instructor videos (>15 min), recommend the instructor split them; LLM can propose split points from transcript.

### Gaps
- Exact Guo et al. median-engagement curve not verified from the PDF (text extraction failed).
- No evidence retrieved on pre-questions (prequestioning) effect sizes in video.

---

### Consolidated agent design rules (inference, derived from sections above)
1. **RAG Tutor:** ask-before-tell; 5-level hint ladder; answers only after ≥2 attempts; grounded in instructor content with timestamps; end turns with a check question; disabled in exam mode; log assisted vs unassisted performance.
2. **Checkpoint Quizzes:** every ~5-7 min at segment boundaries; 1-3 recall-style items; confidence rating; immediate corrective feedback with timestamp; low-stakes; auto-feed into spaced queue.
3. **Revision agent:** FSRS scheduler, target retention ~0.9, interleaved decks of confusable visual categories, generative/image-based cards, high-confidence errors re-queued sooner.
4. **Examination:** format-matched to checkpoints; rubric-anchored LLM grading with evidence quotes; human review for low-confidence grades; readiness estimate (mastery) shown beforehand.
5. **Performance Report:** per-skill Elo estimate with uncertainty, FSRS retrievability, calibration chart, assisted-vs-unassisted gap.
6. **Study Coach:** schedules spaced cumulative reviews (1-3 days, 1-2 weeks), nudges regular short sessions (dose), autonomy-supportive goals, light streaks tied to retrieval.
7. **Project Feedback:** rubric + exemplars; 2-3 actionable feed-forward items; require revision cycle; human instructor oversight for summative judgments.
