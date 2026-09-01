# ECDAT — Master Report
*SIH26164 · Enterprise Cryptographic Discovery & Analysis Tool · Sponsor: National Technical Research Organisation (NTRO) · Theme: Blockchain & Cybersecurity, Software*

This is the single consolidated record of everything covered on ECDAT across this whole planning conversation. It draws together and supersedes the standalone documents already in this folder (`ECDAT_Team_Brief.md`, `ECDAT_Jury_Review.md`, `ECDAT_SWOT_Master_Analysis.md`, `ECDAT_Criticality_and_MigrationPassport_Implementation.md`) into one place — those files stay in the folder for detailed reference, but everything in them is captured here too.

---

## 1. The official problem statement

**PS ID:** 26164. **Title:** Enterprise Cryptographic Discovery & Analysis Tool (ECDAT). **Organisation/Department:** National Technical Research Organisation (NTRO). **Category:** Software. **Theme:** Blockchain & Cybersecurity. **Dataset link (as given on the portal):** "Standard Open source datasets for source code repositories (eg: Github), libraries (eg: OpenSSL) may be used."

**Background, as stated:** Transitioning to Post-Quantum Cryptography (PQC) based solutions requires preparedness, risk assessment, and financial/operational investment. Discovery and inventory of cryptographic artefacts is the critical first step that enables the transition.

**Description, as stated:**
1. Identify and catalogue all cryptographic artefacts (algorithms, keys, certificates, protocols, libraries, hardware modules, cloud services) across internal and external-facing applications, products and infrastructure.
2. The tool should perform a comprehensive quantum risk assessment and identify systems prone to potential quantum attacks, and highlight risks to sensitive data.
3. Classify all the artefacts by type, lifetime and business criticality. Apply structured frameworks such as **Mosca's algorithm** (compare data lifetime plus migration time against expected arrival of a cryptographically-relevant quantum computer) to identify and categorize risks.

**Reading between the lines:** the dataset hint (GitHub repos, OpenSSL) signals the realistic expected scope is source-code and dependency-level scanning, not a full enterprise-wide network/HSM/cloud sweep — that's the honest, buildable interpretation the team has adopted throughout.

---

## 2. Why this needs to be built — the relevance case

Quantum computers capable of breaking RSA/ECC/Diffie-Hellman (via Shor's algorithm) don't exist yet, but that doesn't make the threat theoretical: adversaries can practice **"harvest now, decrypt later"** — collecting encrypted traffic or records today with the intent of decrypting them once a capable quantum computer exists. Long-lived sensitive information therefore needs migration planning *now*, years before the threat materialises. The blocking problem almost every organisation faces is that they don't actually know where they use vulnerable cryptography — so discovery has to come before risk assessment, investment, or migration.

NTRO's specific angle sharpens this further: as India's national technical intelligence agency, it cannot practically run its cryptographic inventory through a foreign vendor's commercial cloud platform (see Section 4/5 — every serious commercial competitor is a US company). It needs something it can run entirely on its own infrastructure, whose source code it can inspect, and that doesn't depend on a vendor it doesn't control. That's a genuine, specific, non-hypothetical need — not an artificial hackathon prompt.

This also happens to be one of the most learnable problem statements the team looked at, precisely because it overlaps Rudhran's own B.E. Cybersecurity coursework — cryptography fundamentals and static code analysis build on a foundation he already has, unlike, say, 3D computer vision or GIS engineering, which were also considered (see Section 13).

---

## 3. Existing tools already in this market

| Tool | Maker | What it does | Access |
|---|---|---|---|
| **CBOMkit** | IBM / Linux Foundation (Post-Quantum Cryptography Alliance) | Scans source code and dependencies, generates a CBOM (Cryptographic Bill of Materials) in the CycloneDX standard format. The single closest match to ECDAT's likely scope. | Free, open source |
| **IBM Quantum Safe Explorer** | IBM | Commercial sibling of CBOMkit — static/binary code analysis, runtime TLS monitoring, risk-ranked inventory linked to business context. | Commercial |
| **SandboxAQ AQtive Guard** | SandboxAQ | Network traffic analysis, application runtime hooking, filesystem scanning. Deployed at the US Air Force, HHS, SoftBank, and global banks. | Premium commercial |
| **Keyfactor AgileSec** (absorbed InfoSec Global + Quantum Xchange CipherInsights) | Keyfactor | Agent-based endpoint scanning, NIST NCCoE-validated for PQC migration, policy/compliance checking (NIST, PCI-DSS). | Commercial |
| **CryptoNext COMPASS** | CryptoNext Security | Fully passive network probe, aimed at OT/IoT environments where active scanning isn't permitted. | Commercial |
| **AppViewX AVX ONE (PQC Assessment)** | AppViewX | Static code + dependency + certificate scanning with CI/CD integration; computes a PQC readiness score. Newest entrant (2025 launch). | Commercial |
| **ISARA Advance** | Allurity | Agentless, PQC-focused discovery integrating with existing NDR/EDR tooling. | Commercial |
| **Tychon ACDI** | Tychon | Endpoint agent/agentless discovery aimed specifically at US federal agencies (NSM-10 compliance). | Commercial |

Every one of these is real. NTRO's evaluators may well know some of them by name. That's normal for any SIH problem statement — the existence of prior art is not disqualifying; what matters is being precise about what none of them actually do.

## 4. The confirmed gaps — what none of them do

Cross-checked across multiple independent sources, not a single one:

1. **No business-criticality classification anywhere.** Every tool above stops at technical severity (algorithm strength, key length, expiry). None map a crypto asset to what it actually protects — a revenue process, sensitive data, a mission-critical function. The PS asks for exactly this, by name.
2. **No transparent, formal Mosca's-theorem calculation.** All of them use vague "AI-driven risk scores" or "harvest-now-decrypt-later" timelines with no visible methodology. The PS names Mosca's algorithm explicitly.
3. **No publicly documented, quantified migration rehearsal.** Checking SandboxAQ's own platform documentation directly, and an independent 2026 buyer's-guide comparison of PQC migration tools, turned up nothing describing an isolated sandbox where a candidate PQC/hybrid swap is tested and scored on measured compatibility, latency, CPU, memory, or certificate size.
4. **Everything commercial is foreign-owned SaaS or cloud-dependent.** None are Indian, none are built for a customer needing air-gapped, auditable, sovereign deployment — exactly what NTRO needs.
5. **The one open-source option (CBOMkit) is a raw engineering toolkit** — code+dependency scanning only, no risk scoring, no criticality layer, no analyst-facing UI. Usable by a developer, not by a security analyst.
6. **Everything commercial is "custom enterprise pricing"** — inaccessible to smaller Indian government departments, PSUs, or MSMEs.

---

## 5. SWOT Analysis

### Strengths
- Real sponsor (NTRO) with a genuine, current, non-hypothetical need.
- The PS gives a precise, checkable spec — Mosca's algorithm, CBOM, business criticality all named explicitly — rather than vague requirements.
- Target algorithms are stable and finalised: NIST's ML-KEM (FIPS 203), ML-DSA (FIPS 204), SLH-DSA (FIPS 205) aren't moving targets.
- Directly overlaps Rudhran's cybersecurity degree — not starting from zero conceptually.
- The dataset hint (GitHub repos, OpenSSL) narrows the realistic scope to something a small team can actually finish.
- Mature open building blocks exist to build *on* — CBOMkit, Semgrep, liboqs — instead of everything from scratch.

### Weaknesses
- The team is starting from beginner level in applied cryptography, static-analysis engineering, and quantitative risk scoring.
- No defined mechanism (until this conversation — see Sections 9–10) for how "business criticality" actually gets assigned.
- No labelled test corpus exists yet for the detection-quality claims (recall/precision) in the team's own brief.
- The full 6-phase build plan (scanner, CBOM, risk engine, backend/UI, migration testbed, validation suite) is a lot of surface area for a small beginner team in a short window.

### Opportunities
- Every gap in Section 4 is a genuine, checkable opportunity — closing them turns the biggest planning weakness into the strongest pitch.
- The "migration passport" idea appears genuinely rare — no public competitor documents anything like it.
- India's own regulatory direction (CERT-In advisories, RBI/SEBI crypto-agility expectations, the broader digital-sovereignty push) gives real downstream relevance beyond the hackathon stage.
- Building on CBOMkit/Semgrep/liboqs frees real time for the two layers competitors lack.
- This PS's skills (cryptography concepts, Python, static analysis) are unusually learnable with AI-assisted teaching compared to the team's other options.

### Threats
- Well-funded, real competitors (IBM, SandboxAQ, Keyfactor, CryptoNext, AppViewX) mean a jury who knows the space can dismiss the idea fast without sharp, specific differentiation.
- The obvious jury question — "IBM's CBOMkit already does this for free, why build ECDAT?" — needs a rehearsed, confident answer.
- Building multi-language crypto detection from scratch, as beginners, in a short window is a real risk of an incomplete demo.
- A large-repository live benchmark (thousands of files) run on stage is a real failure point.
- Getting the cryptography reasoning subtly wrong (e.g. treating symmetric and public-key algorithms as equally urgent, or misapplying Mosca's formula) is an easy, credibility-damaging mistake for a team still learning the domain.

---

## 6. The team's own original plan, in full (from `ECDAT_Team_Brief.md`)

*This is a faithful, complete recap of the brief the team wrote themselves before Claude's review — kept in full because it's the foundation everything else builds on.*

**Proposed direction:** a lightweight, local-first PQC readiness and migration-rehearsal platform for organisations that cannot operate heavyweight enterprise security infrastructure.

**Executive summary:** ECDAT discovers cryptographic assets, creates a structured CBOM, prioritises quantum-migration risk, and validates candidate migration paths in an isolated test environment. Central promise: ECDAT doesn't merely say "RSA/ECC is present" — it shows the evidence, identifies the affected system, estimates migration priority, and tests whether a proposed PQC or hybrid replacement is actually compatible.

**What they will demonstrate:** upload/connect an authorised sample repository; scan Python/Java source, dependencies, Docker/TLS configuration and certificates; show file/line/API evidence for each finding; generate a CBOM and transparent risk score; run a small migration benchmark and produce a migration passport; export a report a developer, security lead, and manager can each understand.

**What they are explicitly NOT claiming:** complete discovery across every language, binary format, HSM, cloud and network; automatic production migration; prediction of the exact date quantum computers will break cryptography; replacement of Keyfactor, SandboxAQ, QuSecure, or other enterprise platforms.

**Mapping the official requirements to their implementation:**

| Requirement | Meaning for their implementation |
|---|---|
| Catalogue cryptographic artefacts | Find algorithms, keys, certificates, protocols, libraries, hardware/cloud references and their locations |
| Quantum risk assessment | Identify systems using quantum-vulnerable public-key cryptography and the sensitive data that depends on it |
| Classify assets | Record type, purpose, lifetime, business criticality, exposure, owner and confidence |
| Use lifetime and migration reasoning | Compare data lifetime plus realistic migration time with the future threat horizon; don't treat every algorithm equally |
| Recommend alternatives | Suggest PQC or hybrid candidates based on risk, compatibility, latency and cost; recommendations require human review |
| CBOM analytics and GUI | Scan source, binaries, libraries and containers where supported; present standardised, interactive results |

Scope discipline they set for themselves: the official statement is enterprise-wide; the SIH prototype must prove the workflow on a controlled, honest subset rather than pretend to support every environment.

**Why PQC and why now (their own reasoning):** Shor's algorithm threatens RSA, ECDSA, ECDH, Diffie-Hellman if a sufficiently capable quantum computer becomes available; symmetric encryption and hashing are affected differently and shouldn't be assigned the same priority automatically. Harvest-now-decrypt-later means long-lived sensitive data deserves earlier planning. Key reasoning principles they list: PQC runs on ordinary computers (no quantum computer needed to build ECDAT); RSA/ECC findings aren't automatically exploitable today; internet-facing signatures/key exchange deserve more urgency than a well-configured symmetric cipher; migration is constrained by libraries, runtimes, protocols, certificate profiles, devices and business dependencies; hybrid deployment may be needed during transition for interoperability.

NIST reference algorithms they anchor to: **ML-KEM (FIPS 203)** — key establishment, candidate for key-exchange migration tests; **ML-DSA (FIPS 204)** — digital signatures, candidate for signing/certificate workflow tests; **SLH-DSA (FIPS 205)** — hash-based signatures, recorded as an alternative with size/performance trade-offs benchmarked.

**End-to-end workflow they designed:** authorised repository/ZIP/container/configuration → file inventory + content hashes (to skip unchanged files on rescans) → cheap crypto signatures (imports, API names, algorithms, configs) → targeted AST and dependency analysis → certificate, key-store and container inspection → optional runtime/endpoint evidence → evidence-backed CBOM → rule-based PQC risk and migration-priority engine → optional LLM explanation (never the source of truth) → dashboard + migration passport + exportable report.

Their worked example finding: *File: `payment_service.java` | Line: 84 | API: `Signature.getInstance("SHA256withRSA")` | Purpose: digital signature | Component: payment-api | Exposure: internet-facing | Criticality: high | Confidence: high | Status: static evidence | Candidate: hybrid signature pilot; blocker: legacy TLS/runtime.* Their point: a user can click the finding, see the exact evidence, understand why it matters, and inspect the proposed next action.

**Discovery and scanning design:** source-code detection uses layered analysis rather than sending the whole repository to an LLM — (1) enumerate files, ignoring build output/vendor folders/generated artefacts where appropriate; (2) match known imports, API calls, algorithm names, key-size constants, TLS cipher names; (3) parse only relevant files using Tree-sitter or language-specific parsers; (4) capture file, line, symbol, call, surrounding context, and detected purpose; (5) assign confidence and label whether evidence is static, runtime, dependency-only, or configuration-only. For dependencies/config: read manifests and lockfiles (`requirements.txt`, `pom.xml`, `package.json`, `go.mod`), Dockerfiles, and OpenSSL/Nginx/TLS settings — initially identifying crypto-relevant packages rather than resolving the entire global supply chain. For certificates/keys: parse metadata (algorithm, key size, issuer, expiry, usage, chain) without storing private key material, redacting secrets and hashing sensitive identifiers. For binaries/runtime: start with file type, strings, linked libraries, embedded certificates and hashes (labelled lower confidence); support one controlled Java or Python runtime demonstration rather than attempting every language.

**Is an LLM part of the system?** Yes, optionally — but never for primary discovery or final risk scoring; the scanner must work with no LLM available. Good uses: explaining a verified finding to a non-specialist; classifying ambiguous context (signing vs. encryption, test vs. production); drafting remediation notes tied to evidence; summarising a report for different audiences. Bad uses: giving it the entire confidential repository as a first step; letting it invent findings or unsupported algorithms; letting it silently change the risk score; automatically editing or deploying production code. Guardrails: (1) the deterministic scanner creates the finding; (2) only a small, redacted snippet and metadata go to the model; (3) output is constrained to a JSON schema; (4) every explanation must reference scanner evidence; (5) "unknown" is an acceptable answer; (6) high-impact recommendations require human review. Their own design test: if the LLM is switched off, ECDAT should still discover, score, export, and benchmark findings.

**PQC risk and migration reasoning:** classification questions they ask per finding — What algorithm? (e.g. RSA-2048, ECDSA P-256, AES-256-GCM) · What function? (signature, key exchange, encryption, hashing, certificate identity) · Is it active? (runtime-confirmed, static evidence, dependency-only, unknown) · What does it protect? (payment transaction, public website, archival record, test data) · What is the exposure? (internet-facing, internal, offline, unknown) · What is the migration constraint? (legacy runtime, HSM, protocol, vendor/client compatibility).

Their transparent priority score formula: `Priority = quantum exposure + data lifetime + business criticality + external exposure + dependency impact + migration urgency` — weights visible and editable, explicitly a prioritisation aid, not a prediction of a quantum-computer arrival date.

Mosca-style reasoning as they describe it: ask whether the data-protection lifetime plus realistic migration time exceeds the organisation's acceptable threat horizon — e.g. 15-year sensitive records, a 3-year migration programme, and internet-facing ECDH should be prioritised for planning.

Recommendation output rule: every recommendation must state the current asset, candidate alternative, expected compatibility issue, benchmark result, evidence, and required human decision — ECDAT must never claim a migration is safe without testing and review.

**Lean architecture and technology stack:** Web UI (SvelteKit or React) → FastAPI controller and authentication → lightweight local job queue → scanner workers (Python first; Go only if benchmarking proves necessary) — comprising source/API rules + Tree-sitter AST, a dependency/config scanner, a certificate/key metadata parser, a container and limited binary scanner, and optional runtime/endpoint probes → SQLite metadata + DuckDB analytics + Parquet findings → rule engine → CBOM → dashboard/report. Stated rationale per choice: Python (fastest for the team to learn/prototype/extend with AI assistance), Tree-sitter (incremental multi-language parsing without building full compilers), SQLite (zero-admin, portable local database), DuckDB/Parquet (efficient local analytics and compressed scan-result storage), FastAPI (simple API, automatic docs), Docker Compose (one-command local deployment, avoiding Kubernetes initially). Explicit decision to *not* copy the enterprise stack prematurely — Kafka, OpenSearch, MongoDB, multi-tenant orchestration, and Kubernetes sandbox fleets solve scale/availability problems the team doesn't yet have.

**Efficiency strategy:** their framing is that enterprise tools spend resources on continuous sensors, large estates, high-volume ingestion, distributed workers, long-term search, access control, audit history, and multiple deployment modes — scanning one small repository is not inherently expensive; scale, correlation and operations are. Their optimisations: incremental scans (hash files, scan only changed files and affected dependencies); staged analysis (cheap triage first, expensive AST/runtime work only for relevant files); local-first (avoid uploading source code, reduce cloud storage/transfer); bounded concurrency (prevent a laptop/small server from being exhausted); result deduplication (one asset, multiple evidence locations); retention controls (keep current CBOM plus selected history, not every raw scan forever); lazy dashboard queries (aggregate on request, precompute headline metrics); optional depth (network/runtime/binary/cloud connectors run only when enabled).

Their target demonstration metrics: repository size 10,000–50,000 files in a controlled test; incremental rescan at least 5× faster than a clean scan; detection quality ≥90% recall on a labelled test corpus for supported APIs; false positives reported separately, target ≥85% precision on supported cases; reproducibility — same input produces the same evidence and score.

**Migration-rehearsal differentiator (their own framing):** cryptographic discovery and CBOMs already exist commercially; their strongest differentiation should be a small, testable "what happens if we migrate?" workflow. Migration passport example they sketched: *Service: Payment API · Current: RSA-2048 signing + ECDH key exchange · Candidate: hybrid classical + ML-DSA/ML-KEM pilot · Compatibility: 74% in the test environment · Measured effect: handshake latency, CPU, memory and message/certificate size · Blocker: legacy runtime or client library · Next action: upgrade dependency, then repeat pilot · Evidence: repository, dependency and configuration references.* Constraint: the testbed runs only in an isolated sample application and must not modify a real production system. Their own honesty note (kept deliberately, and correctly, humble): this is a defensible differentiation for their prototype, not a claim that no commercial product performs any migration testing — say "focused, accessible and measurable," not "world's first." *(Claude's jury review in Section 7 found this hedge is actually more cautious than the evidence supports — see below.)*

**Competitor reality and positioning table (their own):**

| Capability | Commercial market | Their stated position |
|---|---|---|
| Enterprise-wide discovery | Strong in Keyfactor, SandboxAQ, QuSecure, Qinsight | Support a transparent, limited subset with honest confidence labels |
| CBOM and dashboards | Common capability | Use standardised evidence and a simple local deployment |
| Continuous monitoring | Available commercially | Offer efficient incremental scans and CI checks for smaller teams |
| Air-gapped/local operation | Available in some commercial platforms | Make it simple and affordable, not claim it is unique |
| Migration orchestration | Some vendors provide deep remediation | Focus on safe migration rehearsal and measurable compatibility |

Their positioning statement: *"For small and resource-constrained organisations that need PQC readiness but cannot deploy heavyweight enterprise platforms, ECDAT is a local-first cryptographic inventory and migration-rehearsal tool that provides evidence-backed prioritisation and measurable compatibility results."*

**Constraints, ethics and security (their own commitments):** scan only repositories/systems/endpoints with explicit authorisation; never collect or display private key contents or secrets; redact tokens/passwords/sensitive source excerpts before any optional LLM processing; use synthetic or open-source repositories for the SIH demo; never claim a finding is exploitable without proof; never automatically change or deploy cryptography; clearly mark unsupported languages, binaries, dynamic calls, and unknown ownership; keep a scan audit trail (input hash, scanner version, ruleset version, timestamp); use least privilege for repository access and encrypt stored findings.

Known limitations they've committed to disclosing: static analysis can miss runtime-generated algorithm names and reflection; dependency presence doesn't prove active use; binary analysis is partial in the MVP; cloud/HSM/network discovery will be connector-based, not universal; PQC recommendations depend on current library/protocol support; risk scores are decision aids requiring security-owner validation.

**Development plan and team roles:** Phase 1 Foundations (crypto concepts, repository fixtures, labelled expected findings) — whole team. Phase 2 Scanner core (file inventory, rules, Python/Java evidence extraction) — scanner lead. Phase 3 CBOM and risk (schema, confidence, classifications, transparent score) — security/crypto lead. Phase 4 Backend/UI (upload, scan status, findings, filters, report export) — backend/UI lead. Phase 5 Migration testbed (one isolated sample service, hybrid candidate test, metrics) — integration/benchmark lead. Phase 6 Validation (precision/recall, runtime, incremental-speed, demo script) — QA/documentation lead. First four weeks as planned: (1) scan deliberately created Python and Java examples with known RSA/ECC/AES/TLS and test-only cases; (2) store file/line/API evidence and produce JSON CBOM records; (3) add risk scoring, certificate metadata, and dashboard; (4) add incremental scans and one migration benchmark, then freeze scope for the demo.

**Evaluation and proof plan:** detection metrics — precision, recall, F1 per supported language/API family; false-positive rate on test-only/dead-code/dependency-only cases; coverage by source type (source, config, certificate, dependency, container); evidence completeness (% of findings with file, line, component, reason). Risk/recommendation metrics — agreement with a manually labelled priority set; % of recommendations backed by documented evidence; % of unsupported/unknown cases correctly flagged as unknown; migration-benchmark repeatability across runs. Performance metrics — clean vs. incremental scan time; peak memory/CPU on a normal development laptop; storage per 1,000 findings; dashboard response time for common filters; optional LLM token/cost usage per finding. Their planned "winning evidence" demo script: show a controlled repository with planted findings, prove ECDAT detects them with source locations, introduce one new RSA dependency in a simulated pull request, show the CBOM diff, then run the migration passport benchmark.

**Final decision and checklist (their own framing):** ECDAT is worthwhile only if the team accepts the category already exists and commits to a focused, evidence-first implementation. Build it if: the MVP is limited to supported languages/artefact types; the scanner and risk engine stay functional without an LLM; reproducible evidence and measurable benchmarks are demonstrated; at least one meaningful migration-rehearsal workflow is implemented; limitations and commercial competitors are stated explicitly. Do NOT build it as: a generic security chatbot; a keyword-only scanner marketed as complete enterprise discovery; an automatic production migration tool; a dashboard with invented precision/recall/cost claims.

**Their one-line pitch:** *"ECDAT is a lightweight, privacy-preserving PQC readiness platform that discovers cryptographic dependencies, explains their evidence-backed risk and rehearses migration options for organisations without enterprise-scale security infrastructure."*

**Note on the source file:** the original exported brief (`ECDAT_Team_Brief.html`, authored via a tool referred to as "Codex" in its file path metadata, dated 25 Aug 2026) was found on disk as UTF-16 text and needed decoding; the decoded version also carried mojibake/corrupted punctuation from an apparent double-encoding step in whatever exported it — this needs fixing before the brief is used directly in any slide or PDF for the jury.

---

## 7. Claude's critical jury-style review (from `ECDAT_Jury_Review.md`)

**Verdict up front:** the brief is unusually mature — it names real competitors and separates "what we'll demonstrate" from "what we're not claiming," which most student teams skip entirely. That alone reads well to a panel. But several things would cause real trouble in a Q&A, and one differentiator is being undersold.

**Finding 1 — the migration-rehearsal claim is more defensible than the team gives it credit for.** Direct checks against SandboxAQ's own PQC-platform documentation and an independent 2026 buyer's-guide comparison of the whole PQC-migration-tool market found no publicly documented tool with an isolated sandbox that rehearses a candidate PQC/hybrid swap and scores it on measured handshake latency, CPU, memory, and certificate size. Recommendation: state this more confidently than "not a claim that no commercial product performs any migration testing" — say, accurately, *"we could not find a publicly documented commercial tool that does isolated, quantified migration rehearsal with reproducible compatibility scoring — ours does."*

**Finding 2 — the load-bearing gap: where does "business criticality" actually come from?** The requirement table and classification schema both list "business criticality" as an output, and the example finding shows `Criticality: high` — but nowhere in the brief is there a mechanism that *produces* that value. A static scanner reading `payment_service.java` can infer the filename; it cannot know on its own that this specific service protects revenue-critical transactions. If a judge asks how the tool decided this was "high" criticality, there's no answer in the original brief. This matters doubly because business-criticality classification is the one capability no competitor does at all (Section 4) — it's the strongest differentiation claim, and it was vapor until Section 9 of this report closed the gap with a concrete service-manifest mechanism.

**Finding 3 — Mosca's reasoning is buried in prose, and the PS names it explicitly.** The official problem statement calls out this exact framework by name as an expected structured method. If it isn't a visible, interactive dashboard feature — something a judge can watch recompute as inputs change — the team is leaving its single most literal point of alignment with the brief as an invisible implementation detail. Recommendation: a named, dedicated "Mosca Threat-Horizon Calculator" screen with editable X/Y/Z inputs (see Section 9 for the concrete formula).

**Finding 4 — risk of spending four weeks reinventing a solved problem.** The "first four weeks" plan has the team building AST-based, multi-language crypto-API detection from scratch — precisely what IBM's CBOMkit (open source) and Semgrep/Bandit's crypto rule packs already do, with high recall, today. For a small student team, hand-rolling reliable multi-language detection to hit ≥90% recall / ≥85% precision in four weeks is the single highest-risk item in the plan, and also the least differentiated thing being built. Recommendation: build ECDAT's detection layer as an orchestration/normalisation layer over Semgrep (with a custom crypto rule pack) and/or CBOMkit's output, and redirect the saved engineering hours into the criticality-classification and migration-rehearsal layers competitors don't have. Framed correctly to a jury, this is a strength, not an admission of weakness: *"we didn't reinvent AST parsing — we built on proven open-source detection and put our engineering effort into the analysis layer competitors don't have."*

**Finding 5 — the NTRO-specific sovereignty angle is hedged away, not leveraged.** The team's own competitor table concedes "air-gapped/local operation... available in some commercial platforms" and instructs itself to "not claim it is unique" — technically fair, since most enterprise vendors ship on-prem editions. But the sharper question isn't "can this run air-gapped" (yes, technically, many tools can) — it's *"would NTRO, India's national technical intelligence agency, actually be permitted to run a US-vendor product — even on-prem — across the cryptographic inventory of sensitive national infrastructure?"* That's a procurement/sovereignty question specific to exactly who issued this PS, and none of Keyfactor, SandboxAQ, or QuSecure are Indian companies with source available for government audit. Recommendation: a dedicated positioning slide — *"built for a customer the incumbents structurally cannot serve"* — without overclaiming that no one else could ever do this.

**Finding 6 — demo-day risk from the team's own performance targets.** The 10,000–50,000-file repository target (Section 6) is a reasonable number to *report* as a benchmark chart, but a bad thing to attempt live on a judging stage — slow scans, laptop resource limits, and venue Wi-Fi are exactly the kind of thing that turns a strong tool into a stalled demo. The team's own "winning evidence" script (small planted-finding repo → CBOM diff → migration passport) is the right instinct and should be the *entire* live demo; the large benchmark stays a pre-recorded chart.

**Smaller issues flagged:** the exported team-brief file has mojibake/corrupted punctuation throughout and needs fixing before it becomes a slide or PDF; "suggested ownership" phase roles have no actual team-member names attached yet; there's no sustainability/adoption story in the brief (one paragraph on realistic next steps — e.g. CERT-In empanelment path, open-sourcing the scanner layer — would close this without overpromising); competitor citations should be double-checked right before the pitch since they can go stale (e.g. QuSecure's discovery product is now also marketed under the name "QuProtect R3").

**What's genuinely strong — keep and lead with these:** the LLM guardrails section (deterministic-first, LLM never the source of truth, fully functional with the LLM off, constrained JSON output, "unknown" as an acceptable answer) is better security engineering thinking than most professional products manage, and directly pre-empts the most common 2026 objection to any "AI-powered" security tool; the "what we are not claiming" list is exactly the right instinct and rare in student submissions; the ethics/constraints section (authorisation-only scanning, no private key capture, redaction before LLM calls, audit trail) builds jury trust before the product itself does.

**Priority order recommended, if time is short:** (1) design and demo the service-manifest → criticality mechanism; (2) turn Mosca's-theorem reasoning into a visible, interactive dashboard feature; (3) rebuild the detection plan around Semgrep/CBOMkit instead of from-scratch AST work, redirecting saved time into #1 and the migration-rehearsal benchmark; (4) rewrite the migration-rehearsal claim in the more confident, still-accurate language from Finding 1; (5) shrink the live demo to the small planted-finding repo, keep the large benchmark as a slide; (6) add the NTRO sovereignty framing as its own slide; (7) fix the file encoding, assign real names to the phase-owner roles, add one paragraph on what happens after the demo.

**Rehearsal questions to prepare for:**
- *"IBM already has CBOMkit doing source-code CBOM generation for free. Why should NTRO fund this instead of just using that?"* — answer with sovereignty/auditability, the criticality layer CBOMkit lacks, and the migration-rehearsal benchmark.
- *"How do you know a criticality label is correct and not just a guess from a filename?"* — answer with manifest-confirmed vs. heuristic-guessed confidence labelling (Section 9).
- *"What happens when your tool is wrong about a migration being safe?"* — the brief already has a good answer ("requires human review"); make sure it's delivered without hesitation.
- *"Is this actually novel, or is it a discovery tool plus a nice UI?"* — lead with the migration-rehearsal finding — it's the most defensible, most specific answer available.

---

## 8. The five unique features — final list

1. **Manifest-driven business-criticality classification**, with honest confidence labelling (manifest-confirmed / path-heuristic / unknown) instead of pretending the tool magically infers criticality.
2. **A visible, interactive Mosca's Threat-Horizon Calculator** — not buried logic, an actual screen where a judge can watch X (data lifetime) + Y (migration time) vs. Z (threat horizon) work, with editable inputs.
3. **The Migration Passport** — an isolated sandbox where a candidate PQC/hybrid swap is actually tested against a sample service, with measured (not guessed) compatibility, latency, CPU, memory and certificate-size deltas.
4. **Sovereign-by-design posture** — local-first, open, no telemetry, fully functional air-gapped, built for a customer the commercial incumbents structurally can't serve.
5. **LLM-optional architecture with real guardrails** — already right in the team's own brief (Section 6); confirmed as a genuine strength worth leading with, not just a defensive footnote.

---

## 9. Detailed implementation — Business-Criticality Classification

This is two separate jobs: **Stage A** determines *what a piece of crypto code is doing* (its function/purpose); **Stage B** determines *how much that matters to the business* (its criticality). Both are needed for a real, defensible label.

### Stage A — Detecting function/purpose

Build a **crypto API knowledge base** — a lookup table mapping known code patterns to their cryptographic function:

| Pattern | Language | Function |
|---|---|---|
| `Signature.getInstance("SHA256withRSA")` | Java | Digital signature |
| `Cipher.getInstance("RSA/ECB/OAEPWithSHA-256AndMGF1Padding")` | Java | Key encipherment (wrapping a symmetric key) |
| `Cipher.getInstance("AES/GCM/NoPadding")` | Java | Symmetric encryption |
| `KeyAgreement.getInstance("ECDH")` | Java | Key exchange |
| `MessageDigest.getInstance("SHA-256")` | Java | Hashing |
| `rsa.sign(message, private_key, 'SHA-256')` | Python (rsa lib) | Digital signature |
| `Crypto.Cipher.AES.new(key, AES.MODE_GCM)` | Python (PyCryptodome) | Symmetric encryption |
| `hashlib.sha256(data)` | Python | Hashing |
| `ec.generate_private_key(...)` | Python (cryptography lib) | Key generation (asymmetric) |

Don't invent this list from scratch — start from Semgrep's and CBOMkit's public crypto rule sets as reference.

**Special case — TLS cipher suites decode their own function.** A string like `TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384` is four pieces glued together: `ECDHE` = key exchange, `RSA` = authentication (the certificate's signature), `AES_256_GCM` = symmetric encryption, `SHA384` = the handshake's integrity hash. Splitting on `_` and matching each segment against a small dictionary is high-confidence, low-effort, and worth implementing early.

**Special case — X.509 certificates already declare their own purpose.** Every certificate can carry a **Key Usage extension** (RFC 5280) with explicit flags — `digitalSignature`, `keyEncipherment`, `keyAgreement`, `keyCertSign`, `nonRepudiation`. Parse this directly (Python's `cryptography` library makes this easy) instead of guessing — it's the highest-confidence function signal available anywhere in the system.

**Fallback tiers, in order, each with its own confidence label:**
1. **Context-keyword heuristic** — a `Cipher.getInstance(...)` call inside a method called `signPayload()` or a file called `SignatureUtil.java` is probably (not certainly) part of a signing flow. Label `heuristic-guess`, and show the matched keyword as evidence.
2. **LLM-assisted classification** — only for genuinely ambiguous cases: send the small redacted snippet plus already-extracted metadata to an LLM, constrained to a fixed JSON schema output ("which of [signature / key-exchange / encryption / hashing / certificate-identity / unknown] fits, and why"). Label `llm-suggested — needs human review`. Never overrides a high-confidence static match.
3. **Unknown** — a legitimate answer. An honest "unknown, needs review" beats a wrong confident-sounding guess.

### Stage B — Assigning business criticality

**The service manifest** (a small file the organisation, or the team for the demo, fills in once):

```yaml
services:
  - name: payment-api
    path_patterns:
      - "services/payment-api/**"
      - "**/payment_service.java"
    data_classification: financial       # public | internal | financial | sensitive-pii
    business_function: payment-processing
    exposure: internet-facing            # internet-facing | internal | offline
    owner: "payments-team"
    criticality_override: null           # leave null to let the formula decide, or force a value

  - name: internal-admin-tool
    path_patterns: ["tools/admin/**"]
    data_classification: internal
    business_function: internal-tooling
    exposure: internal
    owner: "platform-team"

  - name: sample-test-fixtures
    path_patterns: ["**/test/**", "**/fixtures/**"]
    data_classification: public
    business_function: test
    exposure: offline
    owner: null
```

**Matching a finding to a manifest entry:** for every crypto finding, glob-match its file path against each entry's `path_patterns` (Python's `fnmatch` or `pathlib.Path.match` handle this with no new library needed). An exact single match = **manifest-confirmed**, the highest confidence tier. If multiple entries match, the more specific pattern wins (the same rule `.gitignore` and web routing already use).

**Fallback when nothing matches** — a keyword ontology:

```yaml
business_function_keywords:
  payment-processing: [payment, billing, invoice, checkout, transaction]
  authentication: [auth, login, session, token, sso, oauth]
  internal-tooling: [admin, internal, ops, tooling]
  test: [test, mock, fixture, sample, demo, staging]
```

Match against file path, class name, and folder name. Label `path-heuristic`, and always surface the matched keyword — that transparency is what turns "the tool guessed" into "the tool showed its reasoning."

**Criticality score formula** (every weight visible and editable, never hidden behind an opaque model):

```
criticality_score =
    data_classification_weight      (public=1, internal=2, financial=4, sensitive-pii=5)
  + exposure_multiplier             (offline=1x, internal=1.5x, internet-facing=2x)
  + business_function_weight        (test=0, internal-tooling=1, payment-processing=4, authentication=4)
```

Bucket the number into Low / Medium / High / Critical for display, but keep the raw number and every input weight visible in the finding detail view.

**Human-in-the-loop feedback:** whenever a classification is `heuristic-guess` or `llm-suggested`, show a confirm/correct control in the dashboard; when corrected, offer to add that path pattern to the manifest right there, closing the loop over time.

**One complete finding record, Stage A + Stage B combined:**

```json
{
  "finding_id": "f-0192",
  "file": "payment_service.java",
  "line": 84,
  "api_call": "Signature.getInstance(\"SHA256withRSA\")",
  "algorithm": "RSA-2048",
  "function": {
    "value": "digital-signature",
    "confidence": "high",
    "source": "direct-api-match"
  },
  "criticality": {
    "service": "payment-api",
    "data_classification": "financial",
    "exposure": "internet-facing",
    "business_function": "payment-processing",
    "score": 13,
    "bucket": "critical",
    "confidence": "manifest-confirmed"
  },
  "quantum_vulnerable": true
}
```

This record shape is what feeds both the Mosca calculator and the CBOM export.

---

## 10. Detailed implementation — Sandboxed Migration Simulation ("Migration Passport")

Build this as four escalating stages, each a complete, demoable result on its own — so there's always something working even if time runs out before the last stage.

**Stage 1 — Raw algorithm comparison in plain Python.** Install `liboqs-python` (`pip install liboqs-python` — real, actively-maintained Python bindings for the Open Quantum Safe project's C library, implementing NIST-standardised ML-KEM and ML-DSA). Script: generate an RSA-2048 keypair and an ML-DSA-65 keypair, sign the same test message with each, record signing time/verification time/signature size for both; do the same comparison for ECDH vs. ML-KEM-768 (key generation time, simulated handshake time, public-key/ciphertext size). Expect PQC signatures/keys to come out noticeably larger than classical ones — that's a real, known tradeoff; show it and explain it rather than hide it.

**Stage 2 — Wrap it around one real sample service.** Take one toy service from the CBOM demo (e.g. the `payment_service.java`-style example that signs a JSON payload). Build a near-identical copy with the signing call swapped to ML-DSA via `liboqs-python`. Fire identical test requests at both; measure end-to-end request latency and response payload size (which grows with the bigger signature). Result: *"if this service adopts ML-DSA signing, responses grow by X% and take Y ms longer"* — specific and demoable.

**Stage 3 — The real sandboxed TLS handshake test.** The Open Quantum Safe project ships a ready-made Docker image, so no compiling is needed: `docker run -it openquantumsafe/oqs-ossl3` starts an OpenSSL 3 server built with the `oqs-provider` plugin (liboqs's algorithms plugged directly into OpenSSL). From a client (in the same container or a second one on the same isolated network), connect and inspect the negotiated group: `openssl s_client -connect localhost:<port> -groups kyber512` (exact supported group names shift as the standard finalises — some builds use older names like `kyber512`, newer ones use standardised hybrid names like `X25519MLKEM768`; run `openssl list -groups -provider oqsprovider` first to see what's actually available on the installed build, rather than assuming a name). Run this N times for both a classical-only group and a hybrid/PQC group, timing each, to get average handshake time and observe the actual bytes exchanged (certificate and handshake message sizes are printed by `s_client`). **Enforce isolation, don't just claim it:** run this inside its own `docker-compose.yml` network marked `internal: true`, making it physically impossible for the sandbox to reach a real production system or the internet — this turns "isolated test environment" from a sentence in the pitch into an inspectable property of the architecture. If a client library doesn't support the hybrid group at all, that failure *is* a finding — precisely the "blocker: legacy TLS/runtime" result type the team's own brief already describes.

**Stage 4 — Structure the result as a Migration Passport record:**

```json
{
  "service": "payment-api",
  "current": {
    "signature": "RSA-2048",
    "key_exchange": "ECDH-P256"
  },
  "candidate": {
    "signature": "ML-DSA-65",
    "key_exchange": "X25519MLKEM768 (hybrid)"
  },
  "compatibility": "handshake succeeded in 20/20 attempts against 1 client configuration tested",
  "measured": {
    "handshake_latency_ms": {"before": 4.2, "after": 6.8},
    "cert_chain_bytes": {"before": 1800, "after": 5100},
    "cpu_ms_per_handshake": {"before": 0.9, "after": 2.1}
  },
  "blocker": null,
  "next_action": "pilot on staging traffic before rollout",
  "evidence": ["docker-compose sandbox run, 2026-08-30", "20 handshake samples"]
}
```

Being precise about the narrow scope ("20/20 attempts against 1 client configuration") rather than implying production-wide readiness is a strength in front of a technical jury, not a weakness.

**Suggested learning order for a beginner team:** (1) Stage 1 first — pure Python, no infrastructure, teaches the actual cryptography concepts; (2) basic Docker (one container, one port) as a standalone skill before combining it with anything else; (3) read the `oqs-provider` project's own setup docs once comfortable with Docker — mostly configuration, not new code; (4) only attempt the full Stage 3 networked benchmark once 1–3 are solid, since trying to learn Docker, OpenSSL providers, and PQC cryptography simultaneously is exactly the kind of "lumpy," hard-to-debug learning curve that trips up beginners.

---

## 11. Prototype scope vs. final-product scope

### What the hackathon prototype should include
- Two languages only — Python and Java — stated plainly, not hidden.
- One small, deliberately-built sample repository with known planted findings (RSA usage, a weak TLS config, a test-only case that should correctly be ignored) — never a live 10,000-file run; the large benchmark stays a slide.
- The manifest-driven criticality feature working on that same sample repo, with confidence labelling visibly shown.
- The Mosca calculator working and interactive on at least one real finding from the scan.
- One working Migration Passport — one sample service, one liboqs-based hybrid swap, real measured numbers.
- A clean dashboard showing the CBOM, findings with file/line evidence, and the priority score.
- Fully functional with the LLM switched off; if LLM explanations are added, demo it as a toggle.

### What the mature, final product should include
- Broader language coverage (Go, C/C++, JavaScript) and real binary/container scanning, not just source code.
- Validated performance at real enterprise scale (the 10k–50k file benchmark, properly measured and reported).
- CI/CD integration — a crypto-agility gate blocking a pull request that reintroduces a known-weak algorithm.
- Optional connectors for network/HSM/cloud discovery (opt-in, clearly logged, keeping the sovereign-by-design posture intact).
- A real audit trail and role-based access control for enterprise/government deployment.
- Direct mapping to CERT-In, RBI, and SEBI compliance frameworks as exportable reports.
- Replacing the manual service manifest with optional CMDB/asset-registry integration, once one is available, while keeping manifest-based tagging as the accessible default.
- A genuine adoption path: open-sourcing the core scanner while offering a supported/hosted variant — the same model CBOMkit/PQCA already validates as workable.

---

## 12. Team and skill context

Rudhran is pursuing a B.E. in Cybersecurity at DAIT (Anna University), with a stated interest in ethical hacking, CTF competitions, and hackathons — this PS sits squarely inside that interest and coursework rather than being a cold start. The team has stated they are **beginners** across the specific technical skills ECDAT needs (applied cryptography, static-analysis engineering, quantitative risk scoring) and plan to learn them via AI-assisted teaching from here on, rather than assuming pre-existing expertise. This reframes every "who needs to know X" question in this report toward "how learnable is X in the available time with AI support" — and ECDAT scored as one of the more learnable options precisely because its skills build on Rudhran's degree and have deep, well-documented tutorial ecosystems (unlike, for example, 3D computer vision, whose learning curve is lumpier and harder to shortcut even with AI tutoring).

---

## 13. Other problem statements considered alongside ECDAT

Before settling on ECDAT as the confirmed, final pick, the following were evaluated as possible alternates or a second pick for the internal hackathon (each has its own detail captured in other saved files, summarized only briefly here since this report is scoped to SIH26164): SIH26191 (hazard-zone/relocation GIS, MHA), SIH26106 (email threat forensics, AICTE), SIH26105 (cyber risk quantification, AICTE — noted to have a sharp existing competitor in Safe Security/Lucideus), SIH26016 and SIH26017 (land-acquisition portal and delay-prediction ML, Ministry of Rural Development), and SIH26011 (3D ULPIN vertical property mapping, also Ministry of Rural Development). ECDAT (SIH26164) is Rudhran's confirmed, final choice going forward.

---

## 14. Companion files already saved in this folder

- `ECDAT_Team_Brief.md` — the team's original plan (source material for Section 6 above).
- `ECDAT_Jury_Review.md` — Claude's first critical review (source material for Section 7 above).
- `ECDAT_SWOT_Master_Analysis.md` — the consolidated existing-tools/gaps/SWOT/features/prototype-vs-final document (source material for Sections 3–5, 8, 11 above).
- `ECDAT_Criticality_and_MigrationPassport_Implementation.md` — the full code/schema-level implementation guide (source material for Sections 9–10 above).
- `SIH2026_Teammate_PS_Comparison.md`, `PS26191_Implementation_Plan.md` — background on the alternates referenced in Section 13.

## 15. Open decisions still needed from the team

- Confirm the exact team-member-to-phase mapping (Section 6's phases currently have role types, not names).
- Decide and lock the exact claims to make in the SIH presentation, per the team's own brief.
- Fix the corrupted characters in the original team-brief export before it's used in any slide or PDF.
- Decide who is building the service manifest content for the demo repo (Section 9) and who owns the Docker/liboqs environment setup (Section 10) — these are the two features with the most new ground to cover.

---
*This report consolidates all ECDAT-specific research, review, and implementation planning from this conversation as of 2026-08-30. Technical claims about third-party tools and libraries were verified against public documentation at the time of writing; re-check anything load-bearing before stating it as fact to a jury, since vendor capabilities and library versions can change.*
