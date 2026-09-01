# ECDAT — Critical Jury Review & Gap Analysis
*Reviewing: ECDAT Team Brief (28 Aug 2026) against SIH26164, as a panel of skeptical technical judges would.*

## Verdict up front

This brief is unusually mature for a pre-build stage — it already does the two things most teams skip: it names its real competitors out loud, and it separates "what we'll demonstrate" from "what we're not claiming." That alone will read well to a panel, because it signals a team that won't collapse the first time a judge asks "doesn't X already do this?"

But three things would still get you into real trouble in a Q&A, and one of your own claimed differentiators is more defensible than you're currently willing to say. Below is the full breakdown.

---

## 1. The differentiator you're underselling

Section 10 hedges hard: *"This is a defensible differentiation for our prototype, not a claim that no commercial product performs any migration testing."*

I went and checked. SandboxAQ's own PQC-platform page describes discovery, prioritization, execution and monitoring — but nothing that documents an isolated sandbox where a candidate PQC/hybrid swap is actually rehearsed and scored on measured handshake latency, CPU, memory and certificate size. A 2026 buyer's-guide comparison of the whole PQC-migration-tool market turned up "migration planning" language everywhere and *zero* tools with a documented, quantified rehearsal-and-benchmark step like the one you're proposing.

**So: your hedge is probably too cautious.** You don't need to claim "world's first" (correctly avoided — that's an unverifiable and unnecessary claim), but you can say, accurately, *"we could not find a publicly documented commercial tool that does isolated, quantified migration rehearsal with reproducible compatibility scoring — ours does."* That's a stronger, more specific, and still fully honest sentence than what's in the brief now. Say it in those words on the positioning slide.

## 2. The load-bearing gap: where does "business criticality" actually come from?

This is the biggest structural hole in the plan, and it's exactly where a technical judge will press hardest.

The requirement table (Section 2) and the classification schema (Section 7) both list "business criticality" as an output field. The example finding shows `Criticality: high`. But nowhere in Sections 5, 7, or 8 is there a mechanism that *produces* that value. A static scanner reading `payment_service.java` can infer "this file is called payment_service" — it cannot know, on its own, that this specific service protects revenue-critical transactions versus a decommissioned test harness with a similar name.

If a judge asks *"how did your tool decide this was 'high' criticality — did a person type that in, or did the scanner infer it?"* — right now there's no answer in the brief. This matters because business-criticality classification is the one capability your own competitor research says **nobody else in the market does at all** — it's your best differentiation claim, and it's currently vapor.

**Fix, concretely:** design (and demo) a lightweight *service manifest* — a small YAML/JSON file an org owner fills in once (`service: payment-api`, `data_class: financial`, `criticality: high`, `owner: ...`), which the scanner cross-references against repo/path names, with a confidence label ("manifest-confirmed" vs. "path-heuristic-guessed" vs. "unknown"). This is honest, buildable in the timeframe you have, and turns your strongest unique claim into something you can actually show working on stage rather than something a judge can poke a hole in with one question.

## 3. Mosca's reasoning is buried in prose — and the PS names it explicitly

Section 7 covers Mosca-style reasoning in four sentences of narrative text. That's a problem, not because the reasoning is wrong (it isn't — X = data lifetime, Y = migration time, Z = threat horizon, prioritize when X+Y>Z, is exactly right), but because the *official problem statement itself* calls this out by name as an expected structured framework. If it's not a visible, interactive feature in the dashboard — something a judge can watch you slide a lifetime value and watch the priority recompute — you're leaving your single most literal point of alignment with the brief as an invisible implementation detail.

**Fix:** make it a named, dedicated screen — "Mosca Threat-Horizon Calculator" — where each finding shows its X, Y, Z inputs, the inequality, and the resulting recommendation, with the inputs editable. This is cheap to build (it's arithmetic and a slider) and disproportionately effective in a demo, because it's the one moment a judge can point at and say "that's the framework the PS asked for, and I can see exactly how it works."

## 4. You may be about to spend four weeks reinventing a solved problem

Section 13's "first four weeks" has the team building AST-based, multi-language crypto-API detection (imports, algorithm names, key-size constants, Tree-sitter parsing) from scratch. This is precisely what already-mature open tooling does: IBM's CBOMkit (open source, Linux Foundation) generates CBOMs from source/dependency analysis today; Semgrep and Bandit already ship crypto-misuse rule packs with high recall on exactly the "known imports, API calls, algorithm names" pattern you're describing.

For a small student team, hand-rolling reliable multi-language detection to hit ≥90% recall / ≥85% precision in four weeks is the highest-risk item in the whole plan — and it's also the least differentiated thing you're building, since it's the one layer where real prior art is strongest.

**Fix:** don't compete on the detection layer. Build ECDAT's scanner as an orchestration/normalization layer over Semgrep (with a custom crypto rule pack) and/or CBOMkit's output, feeding your own CBOM schema. Redirect the engineering hours you save into the two things nobody else has: the criticality-classification layer (§2 above) and the migration-rehearsal benchmark (§1 above). This is also a stronger jury answer than silence: *"we didn't reinvent AST parsing — we built on proven open-source detection and put our engineering effort into the analysis layer competitors don't have."* That sentence makes you look senior, not derivative.

## 5. The NTRO-specific angle is hedged away, not leveraged

Row 4 of the competitor table concedes "air-gapped/local operation... available in some commercial platforms" and instructs the team to "not claim it is unique." Technically fair — most enterprise security vendors do ship on-prem editions. But that's answering the wrong question. The sharper point isn't *"can this run air-gapped"* (yes, technically, many tools can) — it's *"would NTRO, India's national technical intelligence agency, actually be permitted to run a US-vendor product — even on-prem — across the cryptographic inventory of sensitive national infrastructure?"* That's a procurement/sovereignty question, not a technical one, and it's specific to who issued this exact PS. None of Keyfactor, SandboxAQ, or QuSecure are Indian companies with source available for government audit.

**Fix:** add one slide: "Built for a customer the incumbents structurally cannot serve" — open-source/auditable codebase, no telemetry, no foreign vendor dependency, aligned with India's own crypto-agility push. Don't overclaim ("nobody else could ever do this") — frame it as "this is the deployment model this specific requester needs, and it's not how the commercial market is built."

## 6. Demo-day risk: your own performance targets could work against you

Section 9's target of a 10,000–50,000-file repository is a reasonable *benchmark* to report as a number/graph, but it is a bad thing to attempt live on a judging stage — slow scans, laptop resource limits, and venue Wi-Fi are exactly the kind of thing that turns a strong tool into a stalled demo in front of the people you need to impress. Section 14's "winning evidence" script (small planted-finding repo → CBOM diff → migration passport) is the right instinct — that should be the *entire* live demo. Keep the 10k–50k benchmark as a pre-recorded chart in the slides, not something you run in real time.

## 7. Smaller issues worth fixing before this goes in front of anyone

- **The exported file is corrupted.** The version I read has mangled punctuation throughout ("ShorÆs algorithm," "ôRSA/ECC is presentö," "DiffieûHellman," stray "?" where "≥" should be). This looks like a UTF-8→Windows-1252→UTF-16 double-encoding mishap somewhere in the export chain. Fix the source before this becomes a slide or a PDF — garbled smart-quotes in front of a jury reads as sloppiness, which is an unforced error given how careful the actual content is.
- **"Suggested ownership" has no names attached.** Five phase-owner roles are defined generically (Scanner lead, Security/crypto lead, etc.) but the brief doesn't say who on the actual team is who, or confirm the team has six people with the skill spread this plan assumes (source-code security work, a working risk-scoring/classification person, backend+frontend, and a benchmarking/QA person is a wide spread for a small team). Lock this down before Phase 1 starts, not during it.
- **No sustainability/adoption story.** The brief is entirely technical. SIH panels — especially for a ministry-sponsored PS — usually also weigh "then what happens to this after the demo." One paragraph on realistic next steps (e.g., pilot with the college's own IT systems, CERT-In empanelment path, open-sourcing the scanner layer) would close that gap without overpromising a business model you don't need at this stage.
- **Keep an eye on competitor citations going stale.** QuSecure's discovery product is now shipping under the "QuProtect R3" name in their newer material — the brief's "QuSecure Recon" reference isn't wrong, just worth double-checking right before the pitch in case a judge has read the latest press release and you haven't.

---

## What's genuinely strong — keep and lead with these

- **The LLM guardrails section (§6)** is better security engineering thinking than most professional products manage: deterministic-first, LLM never the source of truth, works fully with the LLM switched off, constrained JSON output, "unknown" as an acceptable answer. Open your technical Q&A with this if a judge is skeptical about AI-washing — it pre-empts the single most common objection to any 2026 "AI-powered" security tool.
- **The "what we are not claiming" list (§1)** is exactly the right instinct and rare in student submissions. Keep it, and add the migration-rehearsal claim from §1 above to it in the sharper, more confident form.
- **The ethics/constraints section (§12)** — authorization-only scanning, no private key capture, redaction before LLM calls, audit trail — is the kind of thing that makes a jury trust the team even before they trust the product.

---

## Priority order if time is short

1. Design and demo the service-manifest → criticality mechanism (closes your biggest logical gap and your best differentiator).
2. Turn Mosca's-theorem reasoning into a visible, interactive dashboard feature, not prose.
3. Rebuild the "first four weeks" plan around Semgrep/CBOMkit as the detection layer instead of from-scratch AST work; redirect saved time into #1 and the migration-rehearsal benchmark.
4. Rewrite the migration-rehearsal claim in the more confident (but still accurate) language from §1.
5. Shrink the live demo to the small planted-finding repo; keep the 10k–50k-file number as a slide, not a live run.
6. Add the NTRO-specific sovereignty framing as its own slide.
7. Fix the file encoding, assign real names to the five phase-owner roles, add one paragraph on what happens after the demo.

## Questions to rehearse before the actual jury round

- "IBM already has CBOMkit doing source-code CBOM generation for free. Why should NTRO fund this instead of just using that?" *(Answer should reference: sovereignty/auditability, the criticality layer CBOMkit doesn't have, and the migration-rehearsal benchmark.)*
- "How do you know a criticality label is correct and not just a guess from a filename?" *(Answer: manifest-confirmed vs. heuristic-guessed confidence labeling — see §2.)*
- "What happens when your tool is wrong about a migration being safe?" *(You already have a good answer in §7 — "requires human review" — make sure whoever answers this says it without hesitation.)*
- "Is this actually novel, or is it discovery-tool-plus-a-nice-UI?" *(Lead with the migration-rehearsal finding from §1 — it's your most defensible, most specific answer.)*

---
*Prepared as a critical pre-pitch review, cross-checked against current public documentation for IBM CBOMkit, SandboxAQ AQtive Guard, Keyfactor AgileSec, QuSecure, and independent 2026 PQC/CBOM tooling comparisons. Treat vendor capability claims as best-available public information, not certainty — re-verify anything load-bearing before stating it as fact to the jury.*
