8/28/26, 3:10 PM

ECDAT Team Brief

S M A R T   I N D I A   H A C K AT H O N   2 0 2 6   •   S I H 2 6 1 6 4   •   N T R O

ECDAT

Enterprise Cryptographic Discovery & Analysis Tool

Our proposed direction: a lightweight, local-first PQC readiness and migration-rehearsal platform for
organisations that cannot operate heavyweight enterprise security infrastructure.

Purpose of this brief: give every teammate a shared understanding of the problem, requirements,
constraints, architecture, implementation plan, evidence standards, benchmarks, differentiation and risks.

Prepared for team planning • 28 August 2026 • This is a proposal and implementation guide, not an NTRO specification beyond the
official problem statement.

file:///C:/Users/ARAVIND/Documents/Codex/2026-08-25/wha/ECDAT_Team_Brief.html

1/16

8/28/26, 3:10 PM

ECDAT Team Brief

1. Executive summary

Organisations use cryptography everywhere: application code, certificates, TLS, libraries, containers,
devices and cloud services. They often do not know exactly which algorithms are used, where they are
used, what data they protect, or what would be affected by a migration to post-quantum cryptography
(PQC).

ECDAT discovers cryptographic assets, creates a structured Cryptographic Bill of Materials (CBOM),
prioritises quantum-migration risk and validates candidate migration paths in an isolated test environment.

Our central promise: ECDAT does not merely say “RSA/ECC is present.” It shows the evidence,
identifies the affected system, estimates migration priority and tests whether a proposed PQC or
hybrid replacement is compatible.

What we will demonstrate

Upload or connect an authorised sample repository.

Scan Python/Java source, dependencies, Docker/TLS configuration and certificates.

Show file/line/API evidence for each finding.

Generate a CBOM and transparent risk score.

Run a small migration benchmark and produce a migration passport.

Export a report that a developer, security lead and manager can understand.

What we are not claiming

Complete discovery across every language, binary format, HSM, cloud and network.

Automatic production migration.

Prediction of the exact date quantum computers will break cryptography.

Replacement of Keyfactor, SandboxAQ, QuSecure or other enterprise platforms.

file:///C:/Users/ARAVIND/Documents/Codex/2026-08-25/wha/ECDAT_Team_Brief.html

2/16

8/28/26, 3:10 PM

ECDAT Team Brief

2. Official problem statement requirements

Problem statement: Enterprise Cryptographic Discovery & Analysis Tool (ECDAT), issued by the
National Technical Research Organisation (NTRO), under Blockchain & Cybersecurity, Software.

The official need is to make organisations prepared for PQC migration. Discovery and inventory are the
critical first steps before risk assessment, investment and operational migration.

Required capabilities

Requirement

Meaning for our implementation

Catalogue cryptographic
artefacts

Find algorithms, keys, certificates, protocols, libraries, hardware/cloud references and
their locations.

Quantum risk assessment

Identify systems using quantum-vulnerable public-key cryptography and the sensitive
data that depends on it.

Classify assets

Record type, purpose, lifetime, business criticality, exposure, owner and confidence.

Use lifetime and migration
reasoning

Compare data lifetime plus realistic migration time with the future threat horizon; do not
treat every algorithm equally.

Recommend alternatives

Suggest PQC or hybrid candidates based on risk, compatibility, latency and cost;
recommendations require human review.

CBOM analytics and GUI

Scan source, binaries, libraries and containers where supported; present standardised,
interactive results.

Scope discipline: The official statement is enterprise-wide. Our SIH prototype must prove the
workflow on a controlled, honest subset rather than pretend to support every environment.

file:///C:/Users/ARAVIND/Documents/Codex/2026-08-25/wha/ECDAT_Team_Brief.html

3/16

8/28/26, 3:10 PM

ECDAT Team Brief

3. Why PQC and why now?

Shor’s algorithm threatens widely used public-key systems such as RSA, ECDSA, ECDH and Diffie–
Hellman if a sufficiently capable quantum computer becomes available. Symmetric encryption and
hashing are affected differently and should not be assigned the same priority automatically.

There is also a “harvest now, decrypt later” concern: an adversary can collect encrypted traffic or records
today and attempt decryption later. Long-lived sensitive information therefore deserves earlier planning.

Important reasoning principles

PQC is designed to run on ordinary computers; ECDAT does not need a quantum computer.

RSA/ECC findings are not automatically exploitable today.

Internet-facing signatures and key exchange generally deserve more urgency than a well-
configured symmetric cipher.

Migration is constrained by libraries, runtimes, protocols, certificate profiles, devices and business
dependencies.

Hybrid deployment may be needed during transition for interoperability.

NIST reference algorithms

Standard

Role

ECDAT treatment

ML-KEM (FIPS 203)

Key establishment

Candidate for key-exchange migration tests.

ML-DSA (FIPS 204)

Digital signatures

Candidate for signing/certificate workflow tests.

SLH-DSA (FIPS 205)

Hash-based signatures

Record as an alternative; benchmark size/performance trade-offs.

Reference: NIST Post-Quantum Cryptography project, https://csrc.nist.gov/Projects/post-quantum-cryptography

file:///C:/Users/ARAVIND/Documents/Codex/2026-08-25/wha/ECDAT_Team_Brief.html

4/16

8/28/26, 3:10 PM

ECDAT Team Brief

4. End-to-end workflow

Authorised repository / ZIP / container / configuration
↓
File inventory + content hashes (skip unchanged files later)
↓
Cheap crypto signatures: imports, API names, algorithms, configs
↓
Targeted AST and dependency analysis
↓
Certificate, key-store and container inspection
↓
Optional runtime or endpoint evidence
↓
Evidence-backed CBOM
↓
Rule-based PQC risk and migration-priority engine
↓
Optional LLM explanation (never the source of truth)
↓
Dashboard + migration passport + exportable report

Example finding

File: payment_service.java | Line: 84 API: Signature.getInstance("SHA256withRSA") Purpose:
digital signature | Component: payment-api Exposure: internet-facing | Criticality: high
Confidence: high | Status: static evidence Candidate: hybrid signature pilot; blocker: legacy
TLS/runtime

The user can click the finding, see the exact evidence, understand why it matters and inspect the
proposed next action.

file:///C:/Users/ARAVIND/Documents/Codex/2026-08-25/wha/ECDAT_Team_Brief.html

5/16

8/28/26, 3:10 PM

ECDAT Team Brief

5. Discovery and scanning design

Source-code detection

Use layered analysis rather than sending the repository to an LLM.

1. Enumerate files and ignore build output, vendor folders and generated artefacts where appropriate.

2. Match known imports, API calls, algorithm names, key-size constants and TLS cipher names.

3. Parse only relevant files using Tree-sitter or language-specific parsers.

4. Capture file, line, symbol, call, surrounding context and detected purpose.

5. Assign confidence and label whether evidence is static, runtime, dependency-only or configuration-

only.

Dependencies and configuration

Read manifests and lockfiles such as  requirements.txt ,  pom.xml ,  package.json ,  go.mod ,
Dockerfiles and OpenSSL/Nginx/TLS settings. We initially identify crypto-relevant packages rather than
resolving the entire global supply chain.

Certificates and keys

Parse metadata—algorithm, key size, issuer, expiry, usage and chain—without storing private key
material. Redact secrets and hash sensitive identifiers.

Binary and runtime workaround

For binaries, begin with file type, strings, linked libraries, embedded certificates and hashes; label these
findings as lower confidence. For runtime proof, support one controlled Java or Python demonstration
instead of every language.

file:///C:/Users/ARAVIND/Documents/Codex/2026-08-25/wha/ECDAT_Team_Brief.html

6/16

8/28/26, 3:10 PM

ECDAT Team Brief

6. Is an LLM part of the system?

Yes, optionally—but not for primary discovery or final risk scoring. The scanner must work when no
LLM is available.

Good LLM uses

Explain a verified finding to a non-specialist.

Classify ambiguous context: signing vs encryption, test vs production.

Draft remediation notes tied to the evidence.

Summarise a report for different audiences.

Bad LLM uses

Giving it the entire confidential repository as the first step.

Allowing it to invent findings or unsupported algorithms.

Allowing it to silently change the risk score.

Automatically editing or deploying production code.

Guardrails

1. Deterministic scanner creates the finding.

2. Only a small, redacted snippet and metadata are sent to the model.

3. Output is constrained to a JSON schema.

4. Every explanation must reference scanner evidence.

5. Unknown is an acceptable answer.

6. High-impact recommendations require human review.

Design test: If the LLM is switched off, ECDAT should still discover, score, export and benchmark
findings.

file:///C:/Users/ARAVIND/Documents/Codex/2026-08-25/wha/ECDAT_Team_Brief.html

7/16

8/28/26, 3:10 PM

ECDAT Team Brief

7. PQC risk and migration reasoning

Classification

Question

Example answer

What algorithm?

RSA-2048, ECDSA P-256, AES-256-GCM

What function?

Signature, key exchange, encryption, hashing, certificate identity

Is it active?

Runtime-confirmed, static evidence, dependency-only, unknown

What does it protect?

Payment transaction, public website, archival record, test data

What is the exposure?

Internet-facing, internal, offline, unknown

What is the migration constraint?

Legacy runtime, HSM, protocol, vendor or client compatibility

Transparent priority score

Use a configurable score rather than an opaque model. For example:

Priority = quantum exposure + data lifetime + business criticality external exposure + dependency
impact + migration urgency

Weights should be visible and editable. The score is a prioritisation aid, not a prediction of a quantum-
computer arrival date.

Mosca-style reasoning

Ask whether the data protection lifetime plus realistic migration time exceeds the organisation’s
acceptable threat horizon. For example, 15-year sensitive records, a 3-year migration programme and
internet-facing ECDH should be prioritised for planning.

Recommendation output

Every recommendation should state the current asset, candidate alternative, expected compatibility issue,
benchmark result, evidence and required human decision. ECDAT must not claim that a migration is safe
without testing and review.

file:///C:/Users/ARAVIND/Documents/Codex/2026-08-25/wha/ECDAT_Team_Brief.html

8/16

8/28/26, 3:10 PM

ECDAT Team Brief

8. Lean architecture and technology stack

Web UI (SvelteKit or React)
↓
FastAPI controller and authentication
↓
Lightweight local job queue
↓
Scanner workers (Python first; Go only if benchmarking proves necessary)
├─ Source/API rules + Tree-sitter AST
├─ Dependency/config scanner
├─ Certificate/key metadata parser
├─ Container and limited binary scanner
└─ Optional runtime/endpoint probes
↓
SQLite metadata + DuckDB analytics + Parquet findings
↓
Rule engine → CBOM → dashboard/report

Choice

Python

Why it fits a small organisation

Fastest for the team to learn, prototype and extend with AI assistance.

Tree-sitter

Incremental, multi-language parsing without building full compilers.

SQLite

Zero-admin local database; portable and adequate for small deployments.

DuckDB/Parquet

Efficient local analytics and compressed scan-result storage.

FastAPI

Simple API and automatic documentation.

Docker Compose

One-command local deployment; avoid Kubernetes initially.

Do not copy the enterprise stack prematurely: Kafka, OpenSearch, MongoDB, multi-tenant
orchestration and Kubernetes sandbox fleets solve scale and availability problems we do not yet have.

file:///C:/Users/ARAVIND/Documents/Codex/2026-08-25/wha/ECDAT_Team_Brief.html

9/16

8/28/26, 3:10 PM

ECDAT Team Brief

9. Efficiency strategy

Where commercial systems spend resources

Enterprise tools must support continuous sensors, large estates, high-volume ingestion, distributed
workers, long-term search, access control, audit history and multiple deployment modes. The scan of one
small repository is not inherently expensive; scale, correlation and operations are.

Our optimisations

Incremental scans: hash files and scan only changed files and affected dependencies.

Staged analysis: cheap triage first; expensive AST/runtime work only for relevant files.

Local-first: avoid uploading source code and reduce cloud storage/transfer.

Bounded concurrency: prevent a laptop or small server from being exhausted.

Result deduplication: store one asset with multiple evidence locations.

Retention controls: keep current CBOM plus selected history instead of every raw scan forever.

Lazy dashboard queries: aggregate only when requested; precompute headline metrics.

Optional depth: network, runtime, binary and cloud connectors run only when enabled.

Target demonstration

Target

Initial goal

Repository size

10,000–50,000 files in a controlled test

Incremental rescan

At least 5× faster than a clean scan

Detection quality

≥90% recall on a labelled test corpus for supported APIs

False positives

Report precision separately; target ≥85% on supported cases

Reproducibility

Same input produces same evidence and score

file:///C:/Users/ARAVIND/Documents/Codex/2026-08-25/wha/ECDAT_Team_Brief.html

10/16

8/28/26, 3:10 PM

ECDAT Team Brief

10. Migration-rehearsal differentiator

Cryptographic discovery and CBOMs already exist commercially. Our strongest differentiation should be a
small, testable “what happens if we migrate?” workflow.

Migration passport

Service: Payment API
Current: RSA-2048 signing + ECDH key exchange
Candidate: hybrid classical + ML-DSA/ML-KEM pilot
Compatibility: 74% in the test environment
Measured effect: handshake latency, CPU, memory and message/certificate size
Blocker: legacy runtime or client library
Next action: upgrade dependency, then repeat pilot
Evidence: repository, dependency and configuration references

The testbed should run only in an isolated sample application. It must not modify a real production
system.

Why this matters

Inventory answers “where is crypto?” Migration rehearsal answers “which change can we safely attempt
first?” That makes the output more actionable for a small organisation with limited security staff and
budget.

Honesty: This is a defensible differentiation for our prototype, not a claim that no commercial product
performs any migration testing. We should say “focused, accessible and measurable,” not “world’s
first.”

file:///C:/Users/ARAVIND/Documents/Codex/2026-08-25/wha/ECDAT_Team_Brief.html

11/16

8/28/26, 3:10 PM

ECDAT Team Brief

11. Competitor reality and our positioning

Capability

Commercial market

Our position

Enterprise-wide
discovery

Strong in Keyfactor, SandboxAQ,
QuSecure, Qinsight

Support a transparent, limited subset with honest
confidence labels.

CBOM and
dashboards

Continuous
monitoring

Air-gapped/local
operation

Migration
orchestration

Common capability

Available commercially

Use standardised evidence and a simple local
deployment.

Offer efficient incremental scans and CI checks for
smaller teams.

Available in some commercial platforms

Make it simple and affordable, not claim it is
unique.

Some vendors provide deep remediation

Focus on safe migration rehearsal and measurable
compatibility.

Examples: Keyfactor AgileSec architecture, https://docs.keyfactor.com/agilesec/latest/agilesec-architecture-and-components ;
SandboxAQ AQtive Guard, https://docs.aqtiveguard.com/getting-started/ ; QuSecure Recon, https://www.qusecure.com/recon/ ;
Qinsight Atlas, https://www.qinsight.com/

Our positioning statement

For small and resource-constrained organisations that need PQC readiness but cannot deploy
heavyweight enterprise platforms, ECDAT is a local-first cryptographic inventory and migration-
rehearsal tool that provides evidence-backed prioritisation and measurable compatibility results.

file:///C:/Users/ARAVIND/Documents/Codex/2026-08-25/wha/ECDAT_Team_Brief.html

12/16

8/28/26, 3:10 PM

ECDAT Team Brief

12. Constraints, ethics and security

Scan only repositories, systems and endpoints for which the user has explicit authorisation.

Never collect or display private key contents or secrets.

Redact tokens, passwords and sensitive source excerpts before optional LLM processing.

Use synthetic or open-source repositories for the SIH demo.

Do not claim that a finding is exploitable without proof.

Do not automatically change or deploy cryptography.

Mark unsupported languages, binaries, dynamic calls and unknown ownership clearly.

Keep a scan audit trail: input hash, scanner version, ruleset version and timestamp.

Use least privilege for repository access and encrypt stored findings.

Known limitations to disclose

Static analysis can miss runtime-generated algorithm names and reflection.

Dependency presence does not prove active use.

Binary analysis is partial in the MVP.

Cloud/HSM/network discovery will be connector-based, not universal.

PQC recommendation depends on current library and protocol support.

Risk scores are decision aids and require security-owner validation.

file:///C:/Users/ARAVIND/Documents/Codex/2026-08-25/wha/ECDAT_Team_Brief.html

13/16

8/28/26, 3:10 PM

ECDAT Team Brief

13. Development plan and team roles

Phase

Deliverable

Suggested ownership

1. Foundations

Crypto concepts, repository fixtures, labelled expected findings

Whole team

2. Scanner core

File inventory, rules, Python/Java evidence extraction

Scanner lead

3. CBOM and risk

Schema, confidence, classifications and transparent score

Security/crypto lead

4. Backend/UI

Upload, scan status, findings, filters and report export

Backend/UI lead

5. Migration testbed

One isolated sample service, hybrid candidate test and metrics

Integration/benchmark lead

6. Validation

Precision/recall, runtime, incremental-speed and demo script

QA/documentation lead

First four weeks

1. Scan deliberately created Python and Java examples with known RSA, ECC, AES, TLS and test-

only cases.

2. Store file/line/API evidence and produce JSON CBOM records.

3. Add risk scoring, certificate metadata and dashboard.

4. Add incremental scans and one migration benchmark; freeze scope for the demo.

file:///C:/Users/ARAVIND/Documents/Codex/2026-08-25/wha/ECDAT_Team_Brief.html

14/16

8/28/26, 3:10 PM

ECDAT Team Brief

14. Evaluation and proof

Detection metrics

Precision, recall and F1 for each supported language/API family.

False-positive rate on test-only, dead-code and dependency-only cases.

Coverage by source type: source, config, certificate, dependency, container.

Evidence completeness: percentage of findings with file, line, component and reason.

Risk and recommendation metrics

Agreement with a manually labelled priority set.

Percentage of recommendations supported by documented evidence.

Percentage of unsupported/unknown cases correctly flagged as unknown.

Migration benchmark repeatability across runs.

Performance metrics

Clean scan time versus incremental scan time.

Peak memory and CPU on a normal development laptop.

Storage per 1,000 findings.

Dashboard response time for common filters.

Optional LLM token/cost usage per finding, if enabled.

Winning evidence: Show a controlled repository containing planted findings, prove that ECDAT
detects them with source locations, introduce one new RSA dependency in a simulated pull request,
show the CBOM diff, then run the migration passport benchmark.

file:///C:/Users/ARAVIND/Documents/Codex/2026-08-25/wha/ECDAT_Team_Brief.html

15/16

8/28/26, 3:10 PM

ECDAT Team Brief

15. Final decision and team checklist

ECDAT is worthwhile for our team only if we accept that the category already exists and commit to a
focused, evidence-first implementation.

Build it if we can

Limit the MVP to supported languages and artefact types.

Keep the scanner and risk engine functional without an LLM.

Demonstrate reproducible evidence and measurable benchmarks.

Implement at least one meaningful migration-rehearsal workflow.

Be explicit about limitations and commercial competitors.

Do not build it as

A generic chatbot for security.

A keyword-only scanner marketed as complete enterprise discovery.

An automatic production migration tool.

A dashboard with invented precision, recall or cost claims.

One-line project pitch

ECDAT is a lightweight, privacy-preserving PQC readiness platform that discovers
cryptographic dependencies, explains their evidence-backed risk and rehearses migration
options for organisations without enterprise-scale security infrastructure.

Team decision: Before implementation, agree on supported languages, artefacts, benchmark corpus, risk
weights, migration test application and the exact claims we will make in the SIH presentation.

This brief consolidates team discussions and publicly documented references available on 28 August 2026. It should be updated if the
official SIH specification or referenced product capabilities change.

file:///C:/Users/ARAVIND/Documents/Codex/2026-08-25/wha/ECDAT_Team_Brief.html

16/16

