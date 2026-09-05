# ECDAT — The Pitch Plan

**Smart India Hackathon 2026 · SIH26164 · NTRO · Team Asterisks**
**A six-person presentation plan for the deck and the live prototype.**

*Companion document to `ECDAT_Project_Guide.md`. The guide tells you what the project is; this
document tells you how to present it. Read the guide first.*

---

## Contents

| Part | What it covers |
|---|---|
| 0 | The three things that win this round |
| 1 | The time budget and the running order |
| 2 | Speaker assignments — who says what, word for word |
| 3 | The prototype demo run-book |
| 4 | What to say, and what never to say |
| 5 | The Q&A bank — every question you will get, and who answers |
| 6 | Failure drills — what to do when something breaks |
| 7 | Stage mechanics — where to stand, how to hand over |
| 8 | The rehearsal plan |
| 9 | Pre-flight checklist for the day |

---

# Part 0 — The three things that win this round

Before any scripting, understand what you are actually being judged on. Everything in this plan
serves these three.

### 1. Proof beats promise

Almost every SIH team says "we will build X." We can say **"here it is, running, on real code we did
not write."** Every minute you spend on the prototype is worth three minutes of slides. The plan
below therefore gives the demo **more than half** the speaking time.

### 2. Honesty is our weapon, not our weakness

We have a working tool with real limits. Most teams hide their limits and get caught. We name ours
first, on a screen inside the product, and it makes everything else we say more believable.

> A jury that catches you exaggerating once will re-examine everything else you said. A jury that
> hears you volunteer a limitation stops looking for one.

**Every single one of us must be comfortable saying "we don't do that yet."** Practise it until it
sounds relaxed rather than defensive.

### 3. We must survive the CBOMkit question

Somebody on that panel may know that IBM Research already ships a free open-source tool (CBOMkit)
that scans source code and emits CycloneDX CBOMs. If our pitch positions *discovery* as our
innovation, we lose in one question.

**Our answer, memorised by all six of us:**

> *"CBOMkit does source-and-dependency CBOM generation well, and we would not rebuild it. What it
> does not do is map a finding to what it protects, apply Mosca's inequality, or measure what the
> migration costs. Those three layers are our prototype, and they are the layers the problem
> statement names."*

---

# Part 1 — The time budget and the running order

## 1.1 The standard plan — 9 minutes of speaking

SIH slots vary. This plan is built for **9 minutes of presentation** plus Q&A, and Part 1.3 gives you
a 5-minute emergency cut and a 12-minute extended version.

| # | Block | Slide / screen | Speaker | Time |
|---|---|---|---|---|
| 1 | Hook + who we are + the problem | Slide 1, Slide 2 (top) | **S1** | 85 s |
| 2 | Our solution + how it works | Slide 2 (bottom), Slide 3 | **S2** | 90 s |
| 3 | **DEMO — we scanned real code** | Walkthrough steps 1–2 | **S3** | 95 s |
| 4 | **DEMO — what does it protect, and who is late** | Walkthrough steps 3–5 | **S4** | 110 s |
| 5 | **DEMO — what does fixing it cost** + feasibility | Walkthrough steps 6–7, Slide 4 | **S5** | 110 s |
| 6 | Impact, competitors, standards, the ask | Slide 5, Slide 6 | **S6** | 100 s |
| | | | **Total** | **~9:30** |

**Note the shape: 5 minutes of live product, 4.5 minutes of slides.** That ratio is deliberate and
it is what separates us from the teams either side of us.

## 1.2 Why the slides are presented in this order

The official template order is preserved (1 → 2 → 3 → 4 → 5 → 6). The demo is inserted **after slide
3**, which is the technical workflow slide — so the handoff is completely natural:

> S2 finishes slide 3: *"...that is the pipeline on paper. Here it is running."*

## 1.3 If the time changes on the day

**5-minute emergency cut** — you will sometimes be told at the podium. Rehearse this too.

| Keep | Drop |
|---|---|
| S1: 40 s — problem only, no team intro beyond names | Slide 3 entirely |
| S2: 30 s — solution + UVP, then straight to demo | Walkthrough steps 3, 4, 7 |
| S3: 45 s — walkthrough steps 1–2 (the evidence drawer is non-negotiable) | Slide 4 detail |
| S4: 45 s — walkthrough step 5 (Mosca / treasury-archive) only | |
| S5: 45 s — walkthrough step 6 (passport / the size finding) only | |
| S6: 35 s — comparison matrix + the ask | |

**The three things that must survive any cut:** the **evidence drawer**, the **treasury-archive
Mosca moment**, and the **12.9× signature size finding**. If you only get 90 seconds, show those
three and nothing else.

**12-minute extended version:** add the CBOM Export screen (S6, 40 s — "a catalogue nobody else can
read is not a catalogue"), let S4 drag the Z slider live for a full 20 seconds, and let S3 open a
second finding from a *different* target to prove it is not one rehearsed row.

---

# Part 2 — Speaker assignments, word for word

**How to use these scripts:** they are written to be spoken, not read aloud verbatim like a
statement. Learn the *structure* and the *exact numbers*; put the connecting words in your own voice.
The **bold** phrases are the ones that must come out exactly as written — they are the load-bearing
claims.

---

## S1 — The Opener (85 seconds)
### Slide 1 (title) + Slide 2, top half (THE EXISTING PROBLEM)

**Your job:** make the panel care in the first twenty seconds, and establish that this team is
organised.

> "Good morning. We are Team Asterisks, presenting problem statement **SIH26164** from NTRO — the
> Enterprise Cryptographic Discovery and Analysis Tool.
>
> Let me start with a question nobody in a large organisation can currently answer: *which
> cryptographic algorithms are running inside your systems right now, and what does each one
> protect?*
>
> They can't answer it. Not because they're careless — because the information is scattered across
> millions of lines of source code, configuration files and certificates, and nobody ever wrote it
> down.
>
> That is already a problem. Here is what makes it urgent.
>
> When a large enough quantum computer exists, Shor's algorithm breaks RSA and elliptic curve
> cryptography completely. Not weakens — breaks. And the attacker doesn't have to wait for it. They
> can record your encrypted traffic **today** and decrypt it in fifteen years. The industry calls it
> **Harvest Now, Decrypt Later**, and it means that if you're protecting something that has to stay
> secret for twenty years — identity records, sealed financial archives, defence documents — **you
> are already exposed, right now.**
>
> The world's answer is post-quantum cryptography. NIST finalised the standards in 2024. But **you
> cannot migrate what you cannot find** — and that is exactly what NTRO asked for.
>
> My teammate will show you what we built."

**Do not:** spend more than eight seconds on team introductions. **Do not** read the slide aloud.

---

## S2 — The Solution and the Architecture (90 seconds)
### Slide 2, bottom half (PROPOSED SOLUTION + UVP) + Slide 3 (TECHNICAL WORKFLOW & TECH STACK)

**Your job:** explain what the tool does in four beats, then hand cleanly to the live demo.

> "ECDAT does four things, in order.
>
> **One — it discovers.** It parses Python and Java source with a real AST, plus TLS configuration
> and X.509 certificates, and produces a finding carrying the file, the line, the column and the
> exact source text.
>
> **Two — it classifies.** This is the part nobody else does. Every commercial scanner stops at
> technical severity. None of them answer *what does this cryptography actually protect?* ECDAT
> reads a service manifest written by the asset owner, so the same weak algorithm scores differently
> in a payments service than in a test fixture.
>
> **Three — it prioritises**, using Mosca's inequality — the framework the problem statement names
> explicitly.
>
> **Four — it measures.** It doesn't quote a vendor datasheet for what migration costs. It runs the
> benchmark on the machine and tells you.
>
> The stack is deliberately minimal: Python, two external libraries, and a dashboard that is plain
> HTML, CSS and JavaScript. **No build step, no CDN, no cloud API, no telemetry.** It runs with the
> network cable out — which for an intelligence organisation is not a nice-to-have, it is the entry
> requirement. And we demonstrate that rather than assert it.
>
> That is the pipeline on paper. Here it is running."

**Hand over on that exact line.** S3 should already be at the laptop with the walkthrough armed.

---

## S3 — Demo A: "We scanned real code" (95 seconds)
### Walkthrough steps 1 and 2

**Your job:** establish that this is real, then land the single most persuasive moment in the whole
presentation — the evidence drawer.

**Before you speak, press `→` to make sure you are on step 1.**

> "This is the working prototype, running locally on this laptop, with no network connection.
>
> [**Step 1 — Command Centre**]
>
> These are **3,111 real source files**, scanned in under four seconds. And an important point: these
> are not our files. **paramiko, JJWT and Django** — three genuine open-source projects, cloned from
> upstream and scanned unmodified. **206 findings, 120 of them quantum-vulnerable.**
>
> Now look at this column — **Broken today**. Not everything here is a quantum problem. **MD5 and
> SHA-1 are exploitable right now, without any quantum computer.** Our scoring ranks those *above*
> the quantum threat, because a tool that files MD5 under 'future quantum risk' has mis-ranked it.
>
> [**Press `→` — step 2 opens the evidence drawer automatically**]
>
> Every one of those 206 numbers traces to a line of code. Here is the highest-risk finding in the
> demo estate: **SHA-1 computed over an Aadhaar number**, inside a function called
> `legacy_dedupe_key`, in the KYC service.
>
> And this panel is the whole argument. The file. The line — 72. The column. The **exact source text
> that matched**, highlighted. The **enclosing function**. The **rule ID** that fired. Then the
> criticality arithmetic — sensitive PII is five, authentication is four, internet-facing is a two
> times multiplier — **five plus four, times two, is eighteen**. And then the risk arithmetic below
> it.
>
> **There is no model here and no black box. An auditor can recompute every number on this screen by
> hand.**"

**This is your kill shot. Do not rush it.** Point at the file path, the line number, and the
arithmetic with your finger or the cursor. Let three seconds of silence sit after "by hand."

---

## S4 — Demo B: "What does it protect, and who is already late" (110 seconds)
### Walkthrough steps 3, 4 and 5

**Your job:** deliver our two strongest differentiators — honest degradation, and the Mosca reversal.

> "[**Step 3 — Business Criticality, Nivesh**]
>
> This is the layer that separates us from every scanner on the market. Not *how bad is this
> algorithm* — **what does it protect?**
>
> Seven services. Every weight on this screen is visible and lives in a 200-line Python file. There
> is no machine learning model deciding this and there never will be, because a security lead has to
> be able to defend the number to an auditor.
>
> One thing I have to be straight about: **this demo estate is fictional.** We wrote the
> organisation and its manifest. The code, the certificates and the configuration are real files
> that were really scanned — but Nivesh Financial Services does not exist. We say that every time,
> because a prototype that blurs that line can't be trusted on anything else.
>
> [**Press `→` — step 4, same screen, paramiko**]
>
> So here is the honest version. Same screen, real upstream repository, and **nobody has declared
> what paramiko's code protects** — because we've never met its owners.
>
> Look at what the tool does: **zero manifest-confirmed. Seventeen path-heuristic — and it shows you
> which keyword matched. Thirty-eight unknown.** It prints `unknown` rather than inventing a
> business criticality it can't evidence.
>
> **That degradation is the feature.** A tool that produced confident criticality scores for a
> repository whose owner it has never met would simply be lying to you.
>
> [**Press `→` — step 5, Mosca Horizon**]
>
> And this is Mosca's inequality — named explicitly in the problem statement. **X plus Y greater
> than Z.** X is how long the data must stay secret. Y is how long migration realistically takes. Z
> is when a quantum computer might exist. If X plus Y is greater than Z, **you should already have
> started.**
>
> Z is a slider, deliberately. Nobody knows when a quantum computer arrives, and we refuse to hide
> that behind a confident-looking number. The assumption is on screen, its basis is printed, and
> every verdict recomputes when I move it. [**Drag the slider a little.**]
>
> Now the finding that only this tool can produce. **treasury-archive scores only 'high' on
> criticality — it's an offline system** — yet it is the one service **already fourteen years past
> the line**, because its records have to stay sealed for twenty-five years and re-sealing takes
> four. Meanwhile payment-api scores 'critical' and still has five years of slack.
>
> **Severity and urgency are different questions. Only the second one tells you what to start on
> Monday.**"

**Land that last sentence and stop.** It is the best sentence in the presentation.

---

## S5 — Demo C: "What does fixing it cost" + Feasibility (110 seconds)
### Walkthrough steps 6 and 7, then Slide 4

**Your job:** deliver the measured finding, then convert it into "this is buildable and viable."

> "[**Step 6 — Migration Passport**]
>
> Finally: what does fixing it actually cost? **Every number on this screen was measured on this
> machine during the run** — against OpenSSL's native ML-KEM and ML-DSA, the NIST standards from
> 2024. Not quoted from a datasheet.
>
> And the result surprised us. Moving from RSA-2048 to **ML-DSA-65**, the post-quantum signature
> standard: signing gets **1.3 times slower**. That's a rounding error — nobody will notice it.
>
> But the signature goes from **256 bytes to 3,309 bytes. Twelve point nine times larger.** A
> three-certificate TLS chain goes from 2,637 bytes to **16,824 bytes** — which **overflows TCP's
> initial congestion window** and adds a full round trip to every fresh connection. On a 60
> millisecond link, that's 60 milliseconds added to every new user session.
>
> **Speed is not the blocker. Size is.** And that finding only exists because the tool measured
> instead of guessing.
>
> One more, because it cuts the other way: **ML-KEM-768 is 6.1 times *faster* than ECDH-P384** on
> this machine. Post-quantum is not universally slower. It costs bytes, not cycles.
>
> [**Press `→` — step 7, Method & Limits**]
>
> And this screen is inside the product on purpose. **Two languages, not all of them. Static
> analysis has a ceiling — reflection and runtime-built algorithm names are invisible to us. Nivesh
> is fictional. The manifest is written by hand. No live TLS handshake yet.**
>
> We put our limits on a screen rather than waiting to be asked.
>
> [**Switch to Slide 4**]
>
> On feasibility: the technical approach is proven — AST parsing and ASN.1 certificate decoding are
> deterministic, with no hallucination in the discovery path. It's a standalone tool that drops into
> a developer workstation or a CI pipeline. And economically, an open-core architecture removes
> per-scan licence fees entirely.
>
> On viability: BFSI, defence, healthcare and digital governance all face growing PQC-migration
> pressure through 2030 to 2035. To be precise about it — **the one genuinely firm deadline that
> exists is NSA CNSA 2.0's 2033 target, and that binds US national-security systems.** Everywhere
> else it is pressure, not a mandate. We would rather state that accurately than overclaim it."

**That last correction is a deliberate credibility move.** Do not drop it — it signals you have read
the actual documents.

---

## S6 — The Close: Impact, Competitors, Standards, the Ask (100 seconds)
### Slide 5 + Slide 6

**Your job:** neutralise the competitor question before it is asked, prove the research is solid, and
finish strongly.

> "[**Slide 5**]
>
> On impact: this protects non-repudiation in long-term financial records, it mitigates Harvest Now,
> Decrypt Later against citizen identity data, and it automates the cryptographic audit trail for
> ISO 27001, RBI and DPDP Act obligations.
>
> Now, the question you should be asking us. **Tools in this space already exist, and I want to
> address that directly rather than wait for it.**
>
> **IBM Research's CBOMkit** is real, it's open source, and it already does source-code discovery in
> Java and Python and already generates CycloneDX 1.6 CBOMs. We would not rebuild that, and we do
> not claim it as our innovation. **SandboxAQ's AQtive Guard** ingests pre-built CBOMs but does not
> generate them and does not do source discovery at all.
>
> Every capability in this table was checked against those vendors' own public documentation. Where
> we couldn't confirm something, the cell says **'not publicly documented'** — which means not
> claimed anywhere public, not that we're asserting it's absent.
>
> **Our differentiation is the bottom two rows: manifest-backed business criticality, and measured
> migration cost.** No public tool combines all four. That is a defensible claim, and it is the one
> we're making.
>
> [**Slide 6**]
>
> The foundations: **NIST FIPS 203, 204 and 205** — the finalised post-quantum standards. **Mosca's
> theorem, 2018**, from IEEE Security and Privacy. **CycloneDX 1.6**, the OWASP specification that
> added the cryptographic-asset type in 2024 for exactly this job. And **NSA CNSA 2.0** for the
> timeline.
>
> To close. Discovery tools exist. **What doesn't exist is a tool that tells a security lead that
> their archive service is fourteen years past its migration deadline, and that the fix adds
> fourteen kilobytes to their TLS handshake.** That is ECDAT, it is running on this laptop today,
> and every number in it traces back to a line of real code.
>
> Thank you. We'd like to take your questions."

---

# Part 3 — The prototype demo run-book

## 3.1 The golden rule

**Use the guided walkthrough. Always. Never free-navigate in front of a jury.**

The console has a built-in presenter mode that sets the target, the view and any filter each step
needs. Press **▶ Guided walkthrough** in the top bar before you start talking, and then the entire
demo is three keys.

| Key | Action |
|---|---|
| `→` or `Space` | next step |
| `←` | previous step |
| `1`–`7` | jump straight to a step (**your emergency recovery**) |
| `Esc` | close the drawer, then leave the walkthrough |

The rail at the bottom of the screen prints the line to say. **It is a safety net, not a script** —
if you read it aloud word for word it will sound wooden. Know your own version; glance at the rail
only if you lose your place.

## 3.2 The seven steps and who owns them

| Step | Screen | Owner | The one sentence that must land |
|---|---|---|---|
| 1 | Command Centre (all targets) | S3 | *"3,111 real source files — and they aren't our files."* |
| 2 | Crypto Inventory + evidence drawer | S3 | *"An auditor can recompute every number on this screen by hand."* |
| 3 | Business Criticality (Nivesh) | S4 | *"Not how bad is this algorithm — what does it protect?"* |
| 4 | Business Criticality (paramiko) | S4 | *"It prints `unknown` rather than inventing a number."* |
| 5 | Mosca Horizon | S4 | *"Severity and urgency are different questions."* |
| 6 | Migration Passport | S5 | *"Speed is not the blocker. Size is."* |
| 7 | Method & Limits | S5 | *"We put our limits on a screen rather than waiting to be asked."* |

## 3.3 Techniques that make a demo look strong

**Point at the specific thing.** Do not say "as you can see here" and wave. Say *"file, line 72,
column — and the matched text, highlighted."* Move the cursor to each item as you name it.

**Use silence after your best line.** After "recompute every number by hand" and after "severity and
urgency are different questions," stop for three full seconds. It feels like an eternity to you and
it feels like confidence to them.

**Say the number before the screen shows it.** *"3,111 source files"* — then let their eye find it.
This reads as mastery. Reading numbers off the screen reads as unfamiliarity.

**Do one thing live.** On step 5, drag the Z slider with your hand and let them watch the verdicts
recompute. One genuinely live interaction proves nothing is a screenshot. That is worth more than
three static screens.

**Volunteer one limitation per demo section**, in passing, without being asked. It costs you five
seconds and it buys you the whole panel's trust.

**Never apologise for the tool.** Not "this is just a prototype," not "we didn't have time to." State
what it does and what it does not. Those two sentences cover everything without ever sounding sorry.

## 3.4 What to have open before you walk on

1. `proto/ui/index.html` open in the browser, **full screen** (`F11`), zoom at 100%.
2. Guided walkthrough **not yet started** — S3 presses it as the first demo action, so the panel sees
   the mode engage.
3. **A second browser tab** with `ecdat-console.artifact.html` open, as the hot spare.
4. Everything else closed. No notifications. No other tabs. **Do-not-disturb on.**
5. Laptop on mains power, screensaver and sleep disabled.

---

# Part 4 — What to say, and what never to say

## 4.1 The forbidden list

These are not style preferences. Each one is a specific claim that a knowledgeable judge can
disprove, and it will cost more than the sentence gained.

| ❌ Never say | ✅ Say instead |
|---|---|
| "It automatically generates the fix" / "codemod" / "patch code" | "It produces a developer-reviewed migration blueprint, and it measures what that change would cost" |
| "We support C++" (or Go, JavaScript, or binaries) | "Python and Java, plus TLS configuration and X.509. Everything else is roadmap — and the tool says so on its own Limits screen" |
| "Sandboxed migration rehearsal" | "Measured migration cost, benchmarked on the host. A sandboxed handshake against an oqs-provider endpoint is the next step, not a claim we make today" |
| "Parallelised worker threads" | "Content-hash incremental rescanning, measured at 8× on our own corpus. Real parallelism is planned, not built" |
| "PQC migration is legally mandated in India by 2030" | "CNSA 2.0's 2033 deadline is the firmest published one, and it binds US national-security systems. Elsewhere it's growing pressure, not a mandate" |
| "This finding is exploitable" | "This algorithm is present at this line. Exploitability needs proof we haven't gathered" |
| "Nivesh is a real financial estate" | "Nivesh is fictional. Its files are real and really scanned; we wrote the organisation and its manifest for this demonstration" |
| "We know when quantum computers will break RSA" | "Nobody does. That's why Z is a slider with its basis printed on screen" |
| "The world's first migration testing tool" | "A focused, accessible and measurable version of it" |
| "It scans multi-gigabyte monorepos in seconds" | "3,111 files in 3.8 seconds, measured. Enterprise-scale validation is roadmap, and we'd rather not quote a number we haven't measured" |
| "99% accuracy" / any precision or recall figure | "We haven't measured precision and recall yet — that needs a labelled corpus, and it's the first thing on our post-hackathon list" |

## 4.2 The phrases to use often

- **"Measured on this machine during the run"** — the single most valuable phrase we have.
- **"Every number traces to a line of code"** — our design principle in seven words.
- **"It says `unknown` rather than inventing a number"** — honesty as a feature.
- **"That degradation is the feature"** — reframes the paramiko screen from weakness to strength.
- **"An auditor can recompute this by hand"** — what "no black box" means concretely.
- **"We'd rather state that accurately than overclaim it"** — deploy once; it buys enormous goodwill.
- **"Severity and urgency are different questions"** — our best sentence.

## 4.3 The three-part answer format for hard questions

Every one of us uses the same shape. It stops rambling and it prevents overclaiming.

1. **Answer the question directly in one sentence.** Yes, no, or the number.
2. **Give the evidence.** Where it comes from, or how we measured it.
3. **State the boundary.** What this does *not* cover.

> *"Yes — we parse Python with the standard `ast` module, so we recover the actual argument values
> rather than pattern-matching text. That's why the drawer can show `key_size=2048` as a resolved
> parameter. What it doesn't cover is anything built at runtime — if an algorithm name is assembled
> from a variable, static analysis cannot see it, and we mark that as a known limit."*

Practise this shape on twenty random questions until it is automatic.

## 4.4 When you do not know

Say this, exactly:

> **"I don't know — that's outside what we measured. What I can tell you is what we did measure,
> which is..."**

Then hand to the teammate who owns that area if there is one. **This answer never loses points.
Guessing does.** A judge who catches a guess will treat every earlier answer as a possible guess too.

---

# Part 5 — The Q&A bank

## 5.1 The routing rule

**Whoever owns the area answers.** If the question is ambiguous, **S1 routes it** in one sentence:
*"That's [name]'s area."* Never let two people answer the same question, and never let one person
answer everything.

| Domain | Owner |
|---|---|
| Problem framing, market, why this matters | S1 |
| Architecture, tech stack, scanner internals, languages | S2 |
| Findings, evidence, false positives, AST vs regex | S3 |
| Criticality, manifest, Mosca, scoring maths | S4 |
| Benchmark, measurement method, PQC performance, sizes | S5 |
| Competitors, standards, compliance, roadmap | S6 |

## 5.2 The questions you will actually get

---

**Q: "IBM already has CBOMkit and it's free. Why does this exist?"** → **S6**

> "CBOMkit is real and it does source-and-dependency CBOM generation well — we wouldn't rebuild it,
> and we don't claim discovery as our innovation. What it doesn't do is map a finding to what it
> protects, apply Mosca's inequality, or measure what the migration costs. Those three layers are
> our prototype, and they are the layers the problem statement names."

---

**Q: "How do I know a criticality label isn't just a guess from a filename?"** → **S4**

> "Because it's labelled. `manifest-confirmed` means an asset owner declared that path.
> `path-heuristic` means a keyword matched — and the drawer shows you *which* keyword.
> `unknown` means neither, and we print `unknown` rather than inventing a number. Let me show you —
> [press `4`] — paramiko has zero manifest-confirmed, seventeen path-heuristic and thirty-eight
> unknown."

**If time allows, actually show it.** It is a devastating answer with the screen behind it.

---

**Q: "When will quantum computers break RSA?"** → **S4**

> "We don't know, and I'd be suspicious of any tool that claims to. That's exactly why Z is a slider
> rather than a number we baked in. Our demo estate's default is fifteen years and the basis is
> printed on screen — board risk appetite anchored to NIST IR 8547. Move the slider and every verdict
> recomputes."

---

**Q: "Is this just a scanner with a nice UI?"** → **S3**

> "The scanner is the commodity part — we'd say so ourselves. The question I'd ask instead is which
> other tool will tell you that your archive service is fourteen years past its migration deadline,
> and that the fix adds fourteen kilobytes to your TLS handshake. That's the part we built."

---

**Q: "Is there an LLM in this? Is it a ChatGPT wrapper?"** → **S2**

> "No. There is no model in the detection path at all. Every finding comes from a compiled rule and
> an AST parse, and the rule ID is printed next to the finding in the drawer. The architecture allows
> an optional LLM layer purely for explaining a verified finding to a non-specialist, with the
> scanner still creating the finding — but it isn't in the prototype, and the design test is that if
> you switch it off, everything still works."

---

**Q: "What's your false-positive rate? What's your recall?"** → **S3**

> "We haven't measured it, and I'm not going to give you a number we haven't earned. Measuring
> precision and recall properly needs a labelled corpus, and that is the first item on our
> post-hackathon list. What I can tell you is that every finding carries the rule that produced it,
> so a reviewer can audit any individual result in seconds — which is the property that makes
> measuring it tractable."

**This answer wins more respect than a fabricated 95% would.**

---

**Q: "Only Python and Java? That's not enterprise coverage."** → **S2**

> "Correct, and we say so on the tool's own Limits screen rather than waiting to be asked. Two
> languages plus TLS configuration and X.509 is what we can do honestly in a prototype. The route to
> Go, C++ and JavaScript is Tree-sitter, which gives a real parse tree for about forty languages
> without writing a compiler per language. We'd rather ship two languages that genuinely work than
> claim six that half-work."

---

**Q: "Can it scale to a real enterprise? Millions of files?"** → **S2**

> "Not proven, and we won't claim it. What we measured is 3,111 files in 3.8 seconds, and an eight
> times speedup on incremental rescan because unchanged files are matched by content hash. The
> scanner is single-threaded today — bounded worker parallelism is the honest next step, and a
> properly measured 10,000-to-50,000 file run is on the roadmap, not on this slide."

---

**Q: "Why should NTRO use this instead of buying a commercial platform?"** → **S6**

> "Two reasons. First, deployment posture — this runs fully air-gapped, with no cloud API, no
> telemetry and no data leaving the machine. For classified source that isn't a preference, it's the
> entry requirement, and commercial SaaS platforms structurally can't offer it. Second, the
> criticality layer needs organisational context that only the asset owner has. Our manifest approach
> puts that control with them rather than with a vendor's model."

---

**Q: "What happens if the manifest is wrong or out of date?"** → **S4**

> "Then the criticality is wrong, and we'd rather that be visible than hidden. That's why the
> confidence label and the matched manifest entry are both shown on every finding — a reviewer can
> see exactly which declaration produced the score and challenge it. The long-term answer is CMDB
> integration so the manifest isn't maintained by hand, but the manifest stays as the accessible
> default for organisations that don't have a CMDB."

---

**Q: "Is 'Nivesh Financial Services' a real client?"** → **S4**

> "No, and thank you for asking — it's fictional and we say so on stage every time. The code, the
> certificates and the TLS configuration are real files that were really scanned, but we wrote the
> organisation and its manifest for this demonstration. The other three targets — paramiko, JJWT and
> Django — are genuine upstream repositories we cloned and did not modify."

---

**Q: "How do I know those benchmark numbers are real?"** → **S5**

> "The measurement environment is printed on the passport screen — the OpenSSL version, the platform,
> the library version. The method is stated too: warm up five times, then sample until both thirty
> iterations and 0.35 seconds have elapsed, report the median, and retain mean, p95 and standard
> deviation so the spread is visible. And if you want, I can re-run it right now — it takes about
> nine seconds and the medians will land in the same place."

**Only offer the re-run if you have rehearsed it and there is time.**

---

**Q: "You said ML-DSA is only 1.3× slower. So what's the problem?"** → **S5**

> "That's exactly the point, and it's the finding we didn't expect. Speed isn't the problem — size
> is. The signature goes from 256 bytes to 3,309, which is 12.9 times larger, and a three-certificate
> TLS chain goes from 2,637 bytes to 16,824. That overflows TCP's initial congestion window and adds
> a round trip to every fresh connection. A migration plan that budgets for CPU and ignores bytes
> will fail, and this tool is how you find that out before you commit."

---

**Q: "What's next if you win?"** → **S6**

> "Three things, in order. First, a labelled test corpus so we can state precision and recall as
> measured numbers rather than as an aspiration. Second, Tree-sitter for Go, C++ and JavaScript.
> Third — and this is the one we're most interested in — a genuinely sandboxed migration rehearsal:
> a live TLS handshake against an oqs-provider endpoint inside an isolated Docker network, where
> 'isolated' is an inspectable property of the architecture rather than a sentence in a pitch."

---

**Q: "Who on your team actually built this?"** → **S1**

> Name the six roles honestly and briefly. Scanner and rules; cryptography and risk scoring;
> certificates and CBOM; benchmark and passport; dashboard and UX; demo, docs and QA. **Do not
> inflate anyone's contribution.** A panel that senses one person did everything will probe until
> they find it.

---

## 5.3 The two questions we should be ready to be beaten on

Know these before they happen. Losing gracefully on a fair point costs almost nothing; bluffing costs
everything.

**"Your criticality weights are arbitrary. Why is sensitive-PII a 5 and financial a 4?"**

> "They are a starting position, not a discovered truth — and that is exactly why they're on screen
> and editable in a 200-line file rather than buried in a model. In a real deployment the security
> team would tune them to their own risk appetite. What matters is that the number is defensible and
> reproducible, not that our particular weighting is universal."

**"You've built a dashboard, not a product."**

> "Fair — the dashboard is the presentation layer. The product is the engine underneath it: 56
> detection rules, 37 algorithm profiles, an AST resolution stage, certificate parsing, a criticality
> engine and a real benchmark, all of which run headless and emit standard CycloneDX and JSON. The
> dashboard exists because a security lead has to be able to defend a number to an auditor, and a
> JSON file doesn't help them do that."

---

# Part 6 — Failure drills

Rehearse each of these once. Ten minutes now saves the whole presentation later.

| What breaks | Who fixes it | The fix | What the speaker says |
|---|---|---|---|
| Demo laptop won't wake / dies | S2 (holds the spare) | Switch to the backup laptop, already open at the same screen | *"One moment — switching machines."* Then continue. **Do not explain.** |
| Browser shows a blank page | Whoever is driving | `Ctrl+Shift+R` (hard reload) | Keep talking through it. Reload takes two seconds. |
| The walkthrough rail vanishes | Driver | Press the **Guided walkthrough** button again, then `1`–`7` to jump back | *"Let me jump straight to that."* |
| You lose your place in the demo | Driver | Press the step number key (`1`–`7`) | Say the step's headline sentence and carry on. |
| Projector shows the wrong resolution / text too small | S5 | `Ctrl` + `+` in the browser to zoom to 125% | *"Let me make that readable."* |
| No projector at all | S6 | Hand the printed one-pager to the panel; present from the laptop screen | *"We'll come to you — this is worth seeing up close."* |
| Someone freezes mid-sentence | The **next** speaker | Step in with *"— and to add to that,"* and take over | Never let dead air run more than three seconds. |
| A judge interrupts mid-demo | Whoever owns that domain | Answer in one sentence, then: *"and that's actually the next screen"* | Do **not** abandon the run order. Answer and return. |
| You realise you stated something wrong | You | Correct it immediately and move on | *"Let me correct that — it's 12.9 times, not 12."* One sentence. **No apology spiral.** |
| Time is called early | S6 | Skip to the close | *"I'll go straight to the point that matters most."* Then the treasury-archive line and the ask. |

**The universal rule:** whatever breaks, **keep talking**. A panel forgives a technical failure
instantly. It does not forget thirty seconds of silent panic.

---

# Part 7 — Stage mechanics

## 7.1 Positions

```
                    ┌─────────── SCREEN ───────────┐

     S6      S1                                        S2      (standing, back row)
                        S3    S4    S5
                   (front, one steps forward to speak)

              [ laptop + clicker ]         [ backup laptop, open, S2 ]

    ─────────────────────── JURY ───────────────────────
```

- **Only the person speaking is in front.** Everyone else stands still, faces the panel, and does
  not fidget, whisper or look at their phone. Six people shuffling is more distracting than anything
  on the slide.
- **One driver at the laptop at a time.** S3 drives steps 1–2, then physically steps aside for S4,
  who steps aside for S5. Practise the physical handover — it takes two seconds and it looks
  organised.
- **S2 stands nearest the backup laptop** for the whole presentation. That is their standing job.

## 7.2 Handovers

Every handover is **one sentence that sets up the next speaker**, not "over to you."

| From → To | The handover line |
|---|---|
| S1 → S2 | *"My teammate will show you what we built."* |
| S2 → S3 | *"That's the pipeline on paper. Here it is running."* |
| S3 → S4 | *"So we can prove where a finding came from. The harder question is what it protects."* |
| S4 → S5 | *"Now — what would fixing it actually cost?"* |
| S5 → S6 | *"So it's buildable. Is it worth building?"* |
| S6 → panel | *"Thank you. We'd like to take your questions."* |

Learn your outgoing line and your incoming line. **Those twelve sentences are the difference between
six presentations and one presentation.**

## 7.3 Delivery basics

- **Look at the panel, not the screen.** You already know what is on the screen.
- **Slow down.** Under pressure everyone speeds up. Deliberately take your first sentence 20% slower
  than feels natural.
- **Numbers get emphasis and a pause.** *"Three thousand, one hundred and eleven*  …  *real source
  files."*
- **No filler.** Cut "basically," "actually," "kind of," "so yeah," and "as you can see."
- **Hands out of pockets.** Point at the screen when you name something on it.
- **If you finish early, stop.** Do not fill time. Finishing tight reads as prepared.

---

# Part 8 — The rehearsal plan

## Rehearsal 1 — Individual (everyone, alone, 30 minutes)

Deliver **only your own block**, out loud, standing, to a wall. Time it. Repeat until you are within
±10 seconds of your target without reading. Do this before Rehearsal 2 — do not waste team time
learning your own lines.

## Rehearsal 2 — Full run, no interruptions (60 minutes)

Run the whole 9 minutes end to end, three times.

- **Run 1:** get through it. Expect it to be rough.
- **Run 2:** time each block and write the actual seconds next to each speaker.
- **Run 3:** fix the two slowest blocks and the two weakest handovers.

**Rule: nobody stops the run.** Mistakes are noted afterwards, not fixed mid-run — because on the day
you will not get to stop either.

## Rehearsal 3 — Hostile Q&A (45 minutes)

One person plays the panel using Part 5, **out of order and interrupting**. Everyone else must route
the question to the right owner within three seconds.

Score yourselves on:
- Did the right person answer? (routing)
- Did anyone overclaim? (**instant fail — restart that question**)
- Did anyone say "I don't know" when they should have? (**this is a pass, not a failure**)

## Rehearsal 4 — Failure drills (20 minutes)

Physically run each row of Part 6. Actually close the laptop lid. Actually unplug the projector.
Actually have someone interrupt S4 mid-sentence. Muscle memory only forms if you rehearse it for
real.

## Rehearsal 5 — Dress run (30 minutes, the day before)

Full run, in the clothes you will wear, on the actual laptop, with the actual clicker, standing in
the actual positions. **No corrections afterwards** except genuine factual errors. The night before
a pitch is for confidence, not for rewriting.

---

# Part 9 — Pre-flight checklist for the day

**Owner: S6 runs this list. Nobody else needs to remember it.**

### The night before

- [ ] `git status` is clean; nothing half-finished is committed
- [ ] Open `proto/ui/index.html` and walk **all seven** walkthrough steps end to end
- [ ] Confirm the browser console shows **zero errors** (`F12` → Console)
- [ ] **Do not run `engine/run.py`.** The committed `data.js` holds the numbers our script quotes
- [ ] Both laptops charged to 100%, both chargers packed
- [ ] The deck is on **both** laptops **and** on a USB stick **and** emailed to two people
- [ ] `ecdat-console.artifact.html` open in a second tab on both machines
- [ ] Print six copies of the Quick Reference Card (Guide, Part 12) — one per person
- [ ] Print one one-page project summary to hand the panel if the projector fails

### One hour before

- [ ] Both laptops on mains power
- [ ] Sleep, screensaver and auto-update **disabled**
- [ ] Notifications off, do-not-disturb on, Bluetooth off
- [ ] Every other application and browser tab closed
- [ ] Browser at 100% zoom, full screen (`F11`)
- [ ] Test the clicker; confirm `→` and `←` reach the browser
- [ ] Walk all seven steps one final time on the actual demo machine
- [ ] Each speaker says their **first sentence** and their **handover line** out loud, once

### Two minutes before

- [ ] Dashboard open at the **Command Centre**, walkthrough **not yet started**
- [ ] Everyone in position (Part 7.1)
- [ ] Phones away — not on silent, **away**
- [ ] S1 takes one breath and starts slowly

---

## The last word

We have something most teams in this room do not: **a working tool, running on real code, where
every number can be traced back to a line of source.** That is our entire advantage.

Two things will lose it. **Overclaiming** — one exaggeration and the panel re-examines everything
else you said. And **hiding behind the slides** — the deck is a frame; the prototype is the argument.

So: show the tool, name the limits first, and say the numbers with confidence, because they are real.

**If you remember one sentence from this whole document, remember this one:**

> *"Severity and urgency are different questions. Only the second one tells you what to start on
> Monday."*
