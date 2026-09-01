# ECDAT — Full SWOT & Strategy Analysis
*SIH26164 · Enterprise Cryptographic Discovery & Analysis Tool · Ministry sponsor: NTRO*

## 1. What the problem statement actually asks for

NTRO wants a tool that: (1) catalogues cryptographic artefacts — algorithms, keys, certificates, protocols, libraries, hardware/cloud references — across an organisation's applications; (2) does quantum risk assessment, flagging systems that use quantum-vulnerable public-key crypto and the sensitive data behind them; (3) classifies each artefact by type, lifetime, business criticality, exposure, owner and confidence; (4) reasons about migration using data lifetime + realistic migration time against the future quantum threat horizon — explicitly naming Mosca's algorithm as the kind of structured framework expected; (5) recommends PQC or hybrid alternatives, with human review required; (6) presents all of this through CBOM analytics and a GUI. The dataset hint (GitHub repos, libraries like OpenSSL) signals the expected scope is source-code and dependency level scanning, not full enterprise network/HSM sweeps.

## 2. Existing tools already in this market

| Tool | Who makes it | What it actually does | Access |
|---|---|---|---|
| **CBOMkit** | IBM / Linux Foundation (Post-Quantum Cryptography Alliance) | Scans source code and dependencies, generates a CBOM (Cryptographic Bill of Materials) in the CycloneDX standard format. Closest match to ECDAT's likely scope. | Free, open source |
| **IBM Quantum Safe Explorer** | IBM | Commercial sibling of CBOMkit — static/binary code analysis, runtime TLS monitoring, risk-ranked inventory linked to business context. | Commercial |
| **SandboxAQ AQtive Guard** | SandboxAQ | Network traffic analysis, application runtime hooking, filesystem scanning. Deployed at the US Air Force, HHS, SoftBank, global banks. | Premium commercial |
| **Keyfactor AgileSec** (absorbed InfoSec Global + Quantum Xchange CipherInsights) | Keyfactor | Agent-based endpoint scanning, NIST NCCoE-validated for PQC migration, policy/compliance checking (NIST, PCI-DSS). | Commercial |
| **CryptoNext COMPASS** | CryptoNext Security | Fully passive network probe for OT/IoT environments where active scanning isn't allowed. | Commercial |
| **AppViewX AVX ONE (PQC Assessment)** | AppViewX | Static code + dependency + certificate scanning with CI/CD integration, computes a PQC readiness score. Newest entrant (2025). | Commercial |
| **ISARA Advance / Tychon ACDI** | Allurity / Tychon | Agentless PQC-focused discovery; Tychon is aimed specifically at US federal agencies (NSM-10 compliance). | Commercial |

Every one of these is real, and NTRO's evaluators may well know some of them. That's fine — SIH problem statements exist because a real need exists, and prior art existing is normal. What matters is being precise about what's actually missing.

## 3. What none of them do (the real gaps)

Cross-checked across multiple independent comparisons, not just one source:

1. **No business-criticality classification anywhere.** Every tool above stops at technical severity (algorithm strength, key length, expiry). Not one maps a crypto asset to what it actually protects — a revenue process, sensitive data, a mission-critical function. The PS asks for this explicitly.
2. **No transparent, formal Mosca's-theorem calculation.** They use vague "AI-driven risk scores" or "harvest-now-decrypt-later" timelines with no visible methodology. The PS names Mosca's algorithm directly.
3. **No publicly documented, quantified migration rehearsal.** Nothing found describes an isolated sandbox where a candidate PQC/hybrid swap is tested and scored on measured compatibility, latency, CPU, memory, certificate size.
4. **Everything commercial is foreign-owned SaaS or cloud-dependent.** None are Indian, none are built for a customer that needs air-gapped, auditable, sovereign deployment — which is exactly what NTRO, as a national intelligence agency, actually needs.
5. **The one open-source option (CBOMkit) is a raw engineering toolkit** — code+dependency scanning only, no risk scoring, no criticality layer, no analyst-facing UI. Usable by a developer, not by a security analyst.
6. **Everything commercial is "custom enterprise pricing"** — inaccessible to smaller Indian government departments, PSUs, or MSMEs.

## 4. SWOT analysis

### Strengths
- The sponsor (NTRO) is a real national security organisation with a genuine, current need — this isn't an artificial hackathon prompt.
- The PS gives you a precise, checkable spec (Mosca's algorithm, CBOM, business criticality named explicitly) rather than vague requirements — you know exactly what a jury will check for.
- The target algorithms are stable and finalised: NIST's ML-KEM (FIPS 203), ML-DSA (FIPS 204), SLH-DSA (FIPS 205) aren't moving targets — you're not building against a spec that could change.
- This is Rudhran's actual field of study — cryptography, security concepts, and code analysis build on his degree rather than starting from zero.
- The dataset hint (GitHub repos, OpenSSL) narrows the realistic scope to something a small team can actually finish, rather than the PS's full enterprise-wide ambition.
- Mature open building blocks exist to build *on* (CBOMkit, Semgrep, liboqs) instead of everything from scratch.

### Weaknesses
- The team is starting from beginner level in the specific technical domains this needs: applied cryptography, static-analysis engineering, and quantitative risk scoring.
- No defined mechanism yet for how "business criticality" actually gets assigned to a scanned asset — the single biggest planning gap right now.
- No labelled test corpus exists yet for the detection-quality claims (recall/precision numbers) in the team's own brief — those numbers can't be honestly reported until one is built.
- The full 6-phase build plan (scanner, CBOM, risk engine, backend/UI, migration testbed, validation suite) is a lot of surface area for a small beginner team in a short window — real risk of ending up with several half-finished pieces instead of a few finished ones.

### Opportunities
- Every gap listed in Section 3 above is a genuine, checkable opportunity — nobody else does business-criticality classification or a transparent Mosca's calculator; leaning into those two turns your weakest planning gap into your strongest pitch if you close it properly.
- The "migration passport" idea (rehearse a PQC swap and measure real compatibility/performance) doesn't appear to exist publicly anywhere — a genuinely rare, demoable differentiator.
- India's own regulatory direction (CERT-In advisories, RBI/SEBI crypto-agility expectations, the broader digital-sovereignty push) creates real downstream relevance beyond the hackathon stage.
- Building on CBOMkit/Semgrep/liboqs instead of reinventing detection frees up real time to spend on the two layers competitors don't have.
- This PS's skills (cryptography concepts, Python, static analysis) are some of the most learnable of all the options your team looked at with AI-assisted teaching — the learning curve works in your favour here compared to, say, 3D computer vision.

### Threats
- Well-funded, real competitors exist (IBM, SandboxAQ, Keyfactor, CryptoNext, AppViewX) — a jury who knows the space can dismiss the idea fast if the differentiation isn't sharp and specific.
- The obvious jury question — "IBM's CBOMkit already does this for free, why build ECDAT?" — needs a rehearsed, confident answer or it becomes the moment the pitch falls apart.
- Building multi-language crypto detection from scratch, as beginners, in a short window is a real risk of an incomplete or buggy demo.
- A large-repository live benchmark (thousands of files) run on stage is a real failure point — slow scans and venue Wi-Fi don't mix well with judging panels.
- Getting the cryptography reasoning subtly wrong (e.g. treating symmetric and public-key algorithms as equally urgent, or misapplying Mosca's formula) is an easy, credibility-damaging mistake for a team still learning the domain — this needs careful review, not just working code.

## 5. Why this needs to be built

Put simply: quantum computers that can break RSA/ECC don't exist yet, but the data being protected by that encryption today is often being *harvested now* by adversaries who plan to decrypt it later, once a capable quantum computer exists. Organisations — including government ones — mostly don't have an accurate picture of where they even use vulnerable cryptography, so migration planning can't start. Discovery has to come before everything else. NTRO, as an agency that literally cannot outsource this to a foreign vendor's cloud platform, has a genuine, specific need for a tool it can run entirely on its own infrastructure, inspect the source code of, and trust. That's the need ECDAT is answering — not a hypothetical one.

## 6. Unique features — what actually makes ECDAT different

1. **Manifest-driven business-criticality classification.** A small, org-filled service manifest (what this service is, what data it touches, how critical it is, who owns it) that the scanner cross-references against file paths — with honest confidence labelling (manifest-confirmed vs. path-heuristic-guessed vs. unknown) rather than pretending the tool magically infers criticality on its own.
2. **A visible Mosca's Threat-Horizon Calculator.** Not buried logic — an actual interactive screen where a judge can watch the X (data lifetime) + Y (migration time) vs. Z (threat horizon) inequality work, with editable inputs.
3. **The Migration Passport.** An isolated sandbox where a candidate PQC/hybrid swap is actually tested against a sample service, with measured — not guessed — compatibility, latency, CPU, memory and certificate-size deltas.
4. **Sovereign-by-design posture.** Local-first, open, no telemetry, fully functional air-gapped — built from day one for a customer the commercial incumbents structurally can't serve, not retrofitted later.
5. **LLM-optional architecture with real guardrails.** The scanner and risk engine work completely with the LLM switched off; the LLM (when used) only explains verified findings and never sets the risk score itself. This directly pre-empts the most common 2026 objection to "AI security tools."

## 7. How to actually build each unique feature

**Feature 1 — Manifest-driven criticality:**
- Design a simple YAML schema: `service_name`, `data_classification` (e.g. public / internal / sensitive / mission-critical), `criticality` (low/medium/high), `owner`, `notes`.
- Org fills this in once per service/repo — this is the honest, buildable version of "the tool knows what's important."
- Scanner cross-references file/repo paths against manifest entries. Confidence label: `manifest-confirmed` (an exact match), `path-heuristic` (a filename/folder-name guess, e.g. "payment" in the path — clearly marked as a guess), or `unknown`.
- This is pure Python — a beginner-reasonable first module to build and a great first thing to learn CBOM data modelling on.

**Feature 2 — Mosca's Threat-Horizon Calculator:**
- Implement the actual inequality: flag for priority migration when *X (how long the data must stay protected) + Y (how long migration realistically takes) > Z (years until a cryptographically-relevant quantum computer is expected)*.
- Make X, Y editable per finding (defaults suggested, but overridable), Z configurable at the org level (a conservative default, cited from a credible public estimate).
- Render it as a simple timeline/bar visual per finding — this is UI work plus arithmetic, very learnable with AI walking you through both the math and the charting library.

**Feature 3 — Migration Passport:**
- Use **liboqs** (Open Quantum Safe project — real, actively maintained, implements ML-KEM/ML-DSA) to actually perform a hybrid classical+PQC handshake in an isolated Docker container running one sample service.
- Measure real before/after numbers: handshake latency, CPU, memory, certificate/message size.
- Output a structured "passport" record per service: current algorithm, candidate, measured compatibility %, blockers found, next action.
- This is the most technically demanding feature — start with one single sample service (e.g. a toy TLS server) before attempting more, and treat "it works for one real case" as success, not failure to generalise.

**Feature 4 — Sovereign-by-design:**
- Docker Compose, one-command local deployment (already in the team's plan) — keep this.
- No external calls by default; anything network-facing (an optional LLM call) is opt-in and clearly logged.
- Document this explicitly as an architecture decision in the pitch, not just an implementation detail.

**Feature 5 — Detection layer (build on existing tools, don't reinvent):**
- Use **Semgrep** with a custom crypto rule pack (Semgrep supports writing your own YAML detection rules, and the community already has crypto-focused rule work to learn from) to catch known imports, API calls, algorithm names, and key-size constants — this is far faster than hand-rolling AST parsing from scratch, and is a legitimate, honest engineering choice ("we built on proven open tooling," not "we couldn't build our own parser").
- Output findings in the **CycloneDX CBOM** format (the real, standard schema IBM and the industry are converging on) so your output is compatible with the emerging standard, not a one-off format nobody recognises.

## 8. What the prototype (hackathon demo) should look like

Keep this small, real, and reliable — not a shrunk-down attempt at the full product:

- **Two languages supported:** Python and Java, nothing more, and say so plainly.
- **One small, deliberately-built sample repository** with known, planted findings (RSA usage, a weak TLS config, a test-only case that should be correctly ignored) — not a 10,000-file benchmark. Keep the giant benchmark as a slide/chart, never a live run.
- **The manifest-driven criticality feature working** on that same sample repo, showing the confidence labelling clearly.
- **The Mosca calculator working and interactive** on at least one real finding from the scan.
- **One working Migration Passport** — one sample service, one liboqs-based hybrid swap, real measured numbers.
- **A clean dashboard** showing the CBOM, the findings with file/line evidence, and the priority score — this is what the judges actually look at, so it's worth polishing even while the backend stays simple.
- **Runs fully without an LLM** — if you do add LLM explanations, demo it as a toggle, showing the tool still works with it off.

## 9. What the final, mature product should look like

This is the roadmap beyond the hackathon — useful to have in the pitch as "here's where this goes next," which shows judges you're thinking past the demo:

- Broader language coverage (Go, C/C++, JavaScript) and real binary/container scanning, not just source code.
- Validated performance at real enterprise scale (the 10k–50k file benchmark, properly measured and reported, not attempted live).
- CI/CD integration — a crypto-agility gate that can block a pull request reintroducing a known-weak algorithm.
- Optional connectors for network/HSM/cloud discovery (opt-in, clearly logged, keeping the sovereign-by-design posture intact).
- A real audit trail and role-based access control for enterprise/government deployment.
- Direct mapping to CERT-In, RBI, and SEBI compliance frameworks as exportable reports.
- Replacing the manual service manifest with optional integration into an organisation's existing CMDB/asset registry, once one is available, while keeping manifest-based tagging as the accessible default for orgs that don't have one.
- A genuine adoption path: open-sourcing the core scanner while offering a supported/hosted variant for organisations that want it managed — the same model CBOMkit/PQCA already validates as workable.

---
*Sources checked 2026-08-28/30: public documentation and independent comparisons for IBM CBOMkit/Quantum Safe Explorer, SandboxAQ AQtive Guard, Keyfactor AgileSec, CryptoNext COMPASS, AppViewX AVX ONE, ISARA, Tychon; the CycloneDX CBOM specification; the Open Quantum Safe (liboqs) project; and Semgrep's custom-rule capability. Vendor capabilities can change — re-verify anything load-bearing before stating it as fact to a jury.*
