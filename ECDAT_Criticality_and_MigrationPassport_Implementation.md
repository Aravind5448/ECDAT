# ECDAT — Deep Implementation Guide
*Part A: Business-Criticality Classification (purpose/function + criticality) · Part B: Sandboxed Migration Simulation ("Migration Passport")*

---

# PART A — Business-Criticality Classification

This actually has two separate jobs hiding inside it, and it's worth treating them as two distinct stages, because they need different techniques. **Stage A** figures out *what a piece of crypto code is doing* (is this a signature? a key exchange? just hashing?). **Stage B** figures out *how much that matters to the business* (is this protecting a payment, or is it a test fixture nobody cares about?). Only once you have both do you get a real, defensible criticality label.

## Stage A — Detecting the purpose/function of an artefact

The core idea: build a **crypto API knowledge base** — a lookup table that maps known code patterns to what they're actually used for — and run every detected crypto call through it. This is mechanical, learnable, and doesn't need machine learning to get right for the common cases.

### A1. The knowledge base itself

Structure it as a simple table (a YAML or JSON file you maintain — this becomes one of the most valuable files in your whole project). Each entry says: *if you see this API pattern, it means this function, with this confidence.*

| Pattern you'd match in code | Language | Function | Example |
|---|---|---|---|
| `Signature.getInstance("SHA256withRSA")` | Java | Digital signature | Signing a payload |
| `Cipher.getInstance("RSA/ECB/OAEPWithSHA-256AndMGF1Padding")` | Java | Key encipherment (wrapping a symmetric key) | Hybrid encryption |
| `Cipher.getInstance("AES/GCM/NoPadding")` | Java | Symmetric encryption | Encrypting data at rest/in transit |
| `KeyAgreement.getInstance("ECDH")` | Java | Key exchange | TLS handshake, secure channel setup |
| `MessageDigest.getInstance("SHA-256")` | Java | Hashing | Integrity check, not secrecy |
| `rsa.sign(message, private_key, 'SHA-256')` | Python (rsa lib) | Digital signature | — |
| `Crypto.Cipher.AES.new(key, AES.MODE_GCM)` | Python (PyCryptodome) | Symmetric encryption | — |
| `hashlib.sha256(data)` | Python | Hashing | — |
| `ec.generate_private_key(...)` | Python (cryptography lib) | Key generation (asymmetric) | Often feeds into signing or key exchange |

You don't need to invent this list from scratch — this is exactly the kind of lookup table **Semgrep's crypto rule pack** and **CBOMkit's** detectors already encode, so use their public rule sets as your starting reference rather than guessing every pattern yourself.

### A2. Special case: TLS cipher suites tell you the function directly

A cipher suite string like `TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384` is actually four separate pieces of information glued together, and each piece maps to a function:
- `ECDHE` → key exchange
- `RSA` → authentication (this is where the certificate's signature comes in)
- `AES_256_GCM` → symmetric encryption
- `SHA384` → the hash used inside the handshake's integrity check (HMAC/PRF)

Parsing a cipher suite string by splitting on `_` and matching each segment against a small dictionary is a genuinely easy, high-confidence source of function data — prioritize implementing this early since it's a lot of value for very little code.

### A3. Special case: X.509 certificates already declare their own purpose

This is worth knowing because it's free, ground-truth information you don't have to infer: every X.509 certificate can carry a **Key Usage extension** (a real, standard field defined in RFC 5280) that explicitly states what the certificate's key is allowed to do — flags like `digitalSignature`, `keyEncipherment`, `keyAgreement`, `keyCertSign`, `nonRepudiation`. When you parse a certificate (Python's `cryptography` library does this easily), read this extension directly instead of guessing — it's the single highest-confidence function signal you'll get anywhere in the whole system.

### A4. What to do when the pattern isn't in your table

Three fallback tiers, in order, each with a different confidence label attached to the output:
1. **Context-keyword heuristic** — look at the enclosing function/class/file name. A `Cipher.getInstance(...)` call inside a method called `signPayload()` or a file called `SignatureUtil.java` is probably (not certainly) being used in a signing flow even if the raw API call alone is ambiguous. Label this `heuristic-guess`, and show the matched keyword as the evidence.
2. **LLM-assisted classification** — for genuinely ambiguous cases only, send the small redacted snippet plus already-extracted metadata to an LLM with a constrained prompt: "given this metadata, which of [signature / key-exchange / encryption / hashing / certificate-identity / unknown] best fits, and why?" Constrain the output to a fixed JSON schema, and label it `llm-suggested — needs human review`. This must never override a high-confidence static match — it only fills genuine gaps, exactly matching the LLM-guardrail philosophy your team brief already committed to.
3. **Unknown** — and this is a perfectly fine, honest answer. Don't force a guess where you don't have one; an "unknown, needs manual review" label is more credible to a jury than a wrong confident-sounding guess.

## Stage B — Assigning business criticality

Now that you know *what* a piece of code does cryptographically, you need to know *how much it matters*. This can't be inferred purely from code — it needs organizational context, so the honest design is to let a human supply that context once, then have the tool apply it automatically everywhere it's relevant.

### B1. The service manifest — your source of ground truth

A small file the organisation (or, for your demo, you) fills in once per service or repository:

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
    path_patterns:
      - "tools/admin/**"
    data_classification: internal
    business_function: internal-tooling
    exposure: internal
    owner: "platform-team"

  - name: sample-test-fixtures
    path_patterns:
      - "**/test/**"
      - "**/fixtures/**"
    data_classification: public
    business_function: test
    exposure: offline
    owner: null
```

### B2. Matching a finding to a manifest entry

For every crypto finding your scanner produces, take its file path and check it against each manifest entry's `path_patterns` using standard glob matching (Python's `fnmatch` or `pathlib.Path.match` handle this without needing any new library). If exactly one entry matches, that's a **manifest-confirmed** classification — your highest confidence tier. If multiple entries match (overlapping patterns), the more specific pattern wins — this is a normal, learnable rule (the same "most specific path wins" logic used in `.gitignore` and web server routing).

### B3. When nothing in the manifest matches

Fall back to a keyword ontology — a small dictionary you build once:

```yaml
business_function_keywords:
  payment-processing: [payment, billing, invoice, checkout, transaction]
  authentication: [auth, login, session, token, sso, oauth]
  internal-tooling: [admin, internal, ops, tooling]
  test: [test, mock, fixture, sample, demo, staging]
```

Match these keywords against the file path, class name, and folder name. Label the result `path-heuristic`, and always show which keyword triggered the match — that transparency is what turns "the tool guessed" into "the tool showed its reasoning," which is the difference between a jury trusting the feature and picking it apart.

### B4. Turning classification into a criticality score

Combine three inputs into one score, with every weight visible and editable (never hide this behind an opaque model — that principle is already right in your team brief, keep it here too):

```
criticality_score =
    data_classification_weight      (public=1, internal=2, financial=4, sensitive-pii=5)
  + exposure_multiplier             (offline=1x, internal=1.5x, internet-facing=2x)
  + business_function_weight        (test=0, internal-tooling=1, payment-processing=4, authentication=4)
```

Bucket the resulting number into Low / Medium / High / Critical for display, but keep the raw number and every weight that produced it visible in the finding detail view — this is exactly the kind of thing a technical judge will click into, and having a clear, inspectable answer ready is worth more than a slightly cleverer black-box formula.

### B5. The human-in-the-loop feedback step

Whenever a classification is `heuristic-guess` or `llm-suggested` rather than `manifest-confirmed`, show a simple confirm/correct control in the dashboard. When a human corrects one, offer to add that path pattern to the manifest right there — this closes the loop, turns manual corrections into permanent improvements, and is a genuinely nice "final product" feature even if the prototype version is just a text field.

### B6. What one finished finding record looks like

This is the artefact everything above is building toward — one JSON record combining Stage A and Stage B output:

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

That single record is what feeds the Mosca calculator and the CBOM export — everything downstream depends on getting this shape right early.

---

# PART B — Sandboxed Migration Simulation ("Migration Passport")

The goal: take a real crypto usage you found, actually swap it for a PQC/hybrid candidate inside an isolated sandbox, and produce *measured* numbers — not estimates — for compatibility, latency, size and resource cost. Build this in four escalating stages, each one a complete, demoable result on its own, so you always have something working even if you run out of time before reaching the last stage.

## Stage 1 — Raw algorithm comparison in plain Python (start here)

This has zero networking, zero Docker, and teaches the core concepts with the fewest moving parts.

1. Install the real, actively-maintained Python bindings for post-quantum algorithms: `pip install liboqs-python` (this wraps the C library from the Open Quantum Safe project, which implements the actual NIST-standardised ML-KEM and ML-DSA).
2. Write a script that does, side by side:
   - Generate an RSA-2048 keypair and an ML-DSA-65 keypair.
   - Sign the same test message with each; record signing time, verification time, and signature byte size for both.
   - Generate an ECDH keypair and an ML-KEM-768 keypair; simulate a key exchange with each; record the time and the size of the public key / ciphertext exchanged.
3. You'll get real, honest, and genuinely interesting numbers out of this — PQC signatures and keys are typically noticeably larger than their classical equivalents, which is a real, well-known engineering tradeoff. Don't hide this in your demo; showing it and explaining why is more credible than pretending PQC is a free upgrade.

This stage alone gives you a legitimate "Migration Passport, algorithm level" you can demo even if nothing else gets built.

## Stage 2 — Wrap it around one real sample service

1. Take one toy service from your own CBOM demo (e.g. a small Flask/FastAPI app that signs a JSON payload before returning it, matching the `payment_service.java` style example already in your brief).
2. Build a second, near-identical copy of that service with the signing call swapped to ML-DSA via `liboqs-python`.
3. Fire the same test requests at both, and measure end-to-end request latency and response payload size (which will grow, since the signature is bigger).
4. Now your numbers mean something in context: *"if this service adopts ML-DSA signing, responses grow by X% and take Y ms longer"* — a specific, demoable, service-level finding rather than an abstract algorithm benchmark.

## Stage 3 — The real sandboxed TLS handshake test

This is the "actually isolated test environment" version, and it's more achievable than it sounds because the Open Quantum Safe project ships a ready-made Docker image with everything pre-built — you don't need to compile OpenSSL yourself.

1. Pull and run the official test image: `docker run -it openquantumsafe/oqs-ossl3` — this starts an OpenSSL 3 server built with the `oqs-provider` plugin (liboqs's algorithms plugged directly into OpenSSL), ready to negotiate PQC/hybrid key exchange groups.
2. From a client (can be inside the same container, or a second container on the same isolated Docker network), connect and inspect what's negotiated:
   `openssl s_client -connect localhost:<port> -groups kyber512`
   (Note: exact supported group names shift as the standard finalises — some builds use the older `kyber512`-style names, newer ones use standardised names like `X25519MLKEM768` for the classical+PQC hybrid. Run `openssl list -groups -provider oqsprovider` on your specific build first to see exactly what's available, rather than assuming a name — this is a five-second check that saves a confusing debugging session.)
3. Run this N times (a simple shell loop is fine) for both a classical-only group and a hybrid/PQC group, timing each run, to get an average handshake time and observe the actual bytes exchanged (`openssl s_client` prints certificate and handshake message sizes).
4. **Isolation, made real rather than just claimed:** run this in its own `docker-compose.yml` network with no external port mapping and no internet egress — Docker Compose supports marking a network `internal: true`, which makes it physically impossible for this sandbox to reach a real production system or the outside internet. This turns "isolated test environment" from a sentence in your pitch into an enforced, inspectable property of your architecture — exactly what a critical judge would want to see rather than just hear.
5. If a client library doesn't support the hybrid group at all, that failure *is* a finding — it's precisely the "blocker: legacy TLS/runtime" result type your own team brief already describes. Record it as data, not as a bug in your demo.

## Stage 4 — Structure the result as a Migration Passport record

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

Be precise about what "20/20 attempts against 1 client configuration" means — it's an honest, narrow, real result, not a claim about production readiness at scale. That precision is a strength in front of a technical jury, not a weakness.

## Suggested learning order for a beginner team

1. Stage 1 first — pure Python, no infrastructure, teaches the actual cryptography concepts.
2. Basic Docker (running one container, mapping one port) — an extremely well-documented, beginner-friendly skill on its own, worth learning in isolation before combining it with anything else.
3. Read the `oqs-provider` project's own setup documentation once you're comfortable with Docker — most of this stage is configuration and reading, not writing new code.
4. Only attempt Stage 3's full networked handshake benchmark once 1–3 are solid. Trying to learn Docker, OpenSSL providers, and PQC cryptography all at the same time in one sitting is exactly the kind of "lumpy," hard-to-debug learning curve that trips up beginners — sequencing it like this keeps every step's confusion contained to one new concept at a time.

---
*Technical references verified 2026-08-30: Open Quantum Safe's `liboqs-python` (PyPI/GitHub), the `oqs-provider` OpenSSL 3 plugin and its official `openquantumsafe/oqs-ossl3` Docker image, and RFC 5280's X.509 Key Usage extension. Exact command flags and supported group names can shift between library versions — always check what your installed build actually supports before building a demo around a specific name.*
