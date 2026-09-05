# ECDAT — working prototype

**SIH26164 · Enterprise Cryptographic Discovery & Analysis Tool · NTRO**

A local-first tool that finds cryptography in source code, works out what it protects,
decides how urgently it must be replaced, and measures what replacing it would cost.

---

## Run it

Nothing to install beyond what the scan needs, and nothing to configure.

**1 — Regenerate the dataset** (optional; `ui/data.js` is already committed):

```bash
python engine/run.py
```

Takes about 13 seconds. It scans every target in `targets/`, parses the certificates,
runs the real cryptographic benchmark, and writes `ui/data.js` plus `data/scan_results.json`
and one CycloneDX CBOM per target.

**2 — Open the dashboard:**

Double-click `ui/index.html`. That is the whole deployment.

It is plain HTML, CSS and JavaScript reading a generated `data.js`. There is no build step,
no server, no CDN, no fonts fetched, no telemetry. It runs with the network cable out — which
is the deployment posture the sponsor actually needs, demonstrated rather than asserted.

If you prefer serving it (identical result):

```bash
python -m http.server 8765 --directory ui
```

---

## What is in the box

```
engine/
  rules.py         37 primitives + 56 detection rules; how Shor and Grover affect each
  scanner.py       staged scanner: triage -> regex -> AST/symbol resolution -> evidence
  criticality.py   manifest matching, the criticality formula, Mosca's inequality
  artefacts.py     X.509 parsing (Key Usage, key size, expiry) and dependency manifests
  cbom.py          CycloneDX 1.6 CBOM export
  bench.py         real measured RSA/ECDSA/ECDH vs ML-DSA/ML-KEM benchmark
  run.py           orchestrator -> ui/data.js
ui/
  index.html       the dashboard (open this)
  app.js  styles.css  data.js
  ecdat-console.artifact.html   single-file build for sharing (engine/build_artifact.py)
targets/
  nivesh-core      demo estate + ecdat-manifest.yaml  (fictional org, real scannable files)
  paramiko  jjwt  django    real upstream repositories, cloned unmodified
data/
  scan_results.json, cbom-<target>.json
```

---

## Showing it to a jury

The console drives its own demonstration. Press **Guided walkthrough** in the top bar
(or open the tool and hit it before you start talking) and the seven beats below run off
the arrow keys — each step sets the target, the view and any filter it needs, so nothing
has to be hunted for in front of an evaluator.

| Key | Does |
|---|---|
| `→` `Space` | next step |
| `←` | previous step |
| `1`–`7` | jump straight to a step |
| `Esc` | close the evidence drawer, then leave the walkthrough |

Roughly nine minutes. The rail prints the line to say; what follows is why each beat is there.

### 1 · Command Centre — "we actually scanned real code"
3,111 source files across paramiko, JJWT and Django — cloned from upstream, not written by us —
plus the demo estate. 206 findings, 120 quantum-vulnerable.

Point at **Broken today**. Not everything here is a quantum problem: MD5 and SHA-1 are
exploitable *now*. A tool that files those under "future quantum risk" has mis-ranked them.

### 2 · Crypto Inventory — "every number traces to a line of code"
The step opens the top finding for you: `legacy_dedupe_key()` in the KYC service —
**SHA-1 over an Aadhaar number**.

The drawer shows the file, line, column, the matched source text, the enclosing function,
the rule id that fired, and the full arithmetic behind both the criticality score and the
risk score.

### 3 · Business Criticality — the gap no competitor fills
Every commercial PQC scanner stops at technical severity. None answer *what does this protect?*

The weights are on screen and live in `engine/criticality.py`. An auditor can recompute any
score by hand — there is no model in the scoring path.

### 4 · Business Criticality on paramiko — honest degradation
Same screen, upstream repository, no manifest: 0 manifest-confirmed, 17 path-heuristic,
38 unknown. ECDAT degrades honestly and labels every guess as a guess. That contrast is
the feature, which is why it gets its own beat.

### 5 · Mosca Horizon — the problem statement names this framework explicitly
`X + Y > Z`. Drag Z.

The moment worth rehearsing: **treasury-archive scores only "high" on criticality — it is offline —
yet it is the one service already 14 years past the line**, because its records must stay sealed
for 25 years and re-sealing the archive takes 4. Meanwhile payment-api scores "critical" and has
5 years of slack.

Severity and urgency are different questions. Only the second one tells you what to start on Monday.

### 6 · Migration Passport — measured, not estimated
Every number here was measured on the machine during the run, using OpenSSL 4.0.1's native
ML-KEM and ML-DSA.

- ML-DSA-65 signs at **1.3×** the cost of RSA-2048 — negligible.
- Its signature is **3,309 bytes against 256** — 12.9× larger.
- A three-certificate TLS chain goes from **2,637 to 16,824 bytes**, overflowing TCP's
  ~14,600-byte initial congestion window and adding a round trip to every fresh connection.

**Speed is not the blocker. Size is.** That is the finding, and it only exists because the
tool measured instead of guessing.

One honest surprise worth keeping: ML-KEM-768 is **6.1× faster** than ECDH-P384 on this machine.
Post-quantum is not universally slower.

This screen is machine-scoped, not target-scoped — the benchmark describes the host, not the
repository — and the tool says so on the page when a target other than Nivesh is selected.

### 7 · Method & Limits — close on what it does not do
Say the limits before the jury asks for them. The screen is written to be read aloud.

**CBOM Export** is not in the walkthrough. It is the screen to open when someone asks about
interoperability — CycloneDX 1.6, downloadable, and the same document that lands in
`data/cbom-<target>.json`.

---

## Answers to the questions you will be asked

**"IBM's CBOMkit already does this for free."**
It does source-and-dependency CBOM generation, and we would not rebuild that. What it does not do
is map a finding to what it protects, apply Mosca's inequality, or measure the migration. Those
three layers are this prototype, and they are the layers the problem statement names.

**"How do you know a criticality label isn't just a guess from a filename?"**
Because it is labelled. `manifest-confirmed` means an owner declared that path. `path-heuristic`
means a keyword matched — and the drawer shows you which keyword. `unknown` means neither, and
ECDAT prints `unknown` rather than inventing a number. Open paramiko to see it happen.

**"When will quantum computers break RSA?"**
We don't know, and no tool that claims to should be trusted. Z is a slider, its current basis is
printed on screen, and every verdict recomputes when you move it.

**"Is this just a scanner with a nice UI?"**
The scanner is the commodity part. Ask instead which other tool will tell you that your archive
service is 14 years past its migration deadline, and that the fix adds 14 KB to your TLS handshake.

---

## What this prototype does not do

Stated plainly on the **Method & Limits** screen inside the tool, and worth repeating here.

- **Two languages.** Python and Java, plus TLS config and X.509. Not Go, C/C++, JavaScript or binaries.
- **Static analysis has a ceiling.** Runtime-constructed algorithm names and reflection are invisible.
- **Nivesh Financial Services is fictional.** Its files are real and really scanned; the organisation
  and its manifest were written for this demonstration. The other three targets are genuine upstream code.
- **The manifest is filled in by hand.** CMDB integration does not exist yet.
- **No live TLS handshake.** The benchmark measures algorithms directly. A sandboxed handshake against
  an `oqs-provider` endpoint is the next step, not a claim we make today.
- **One machine, one stack.** An HSM or a constrained device will produce different numbers, which is
  why the passport records its own environment.

---

## Standards this is built on

FIPS 203 (ML-KEM) · FIPS 204 (ML-DSA) · FIPS 205 (SLH-DSA) · NIST IR 8547 (PQC transition timeline) ·
NIST SP 800-57 (key-size minimums) · CycloneDX 1.6 (CBOM format) · RFC 5280 (X.509 Key Usage) ·
RFC 8996 (TLS 1.0/1.1 deprecation) · RFC 7465 (RC4 prohibition) · Mosca (2018, IEEE Security & Privacy).
