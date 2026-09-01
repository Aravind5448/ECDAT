const pptxgen = require('C:/Users/ARAVIND/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/pptxgenjs');

const pptx = new pptxgen();
pptx.layout = 'LAYOUT_WIDE';
pptx.author = 'Team ECDAT';
pptx.company = 'Smart India Hackathon 2026';
pptx.subject = 'Enterprise Cryptographic Discovery & Analysis Tool';
pptx.title = 'ECDAT — PQC readiness for critical enterprises';
pptx.lang = 'en-IN';
pptx.theme = {
  headFontFace: 'Calibri', bodyFontFace: 'Calibri', lang: 'en-IN'
};
pptx.defineLayout({ name: 'ECDAT_WIDE', width: 13.333, height: 7.5 });
pptx.layout = 'ECDAT_WIDE';

const C = {
  navy: '1F497D', blue: '4F81BD', ice: 'DCE6F1', pale: 'F6F9FC', ink: '182B3D', slate: '52677B',
  line: 'C9D6E3', red: 'C0504D', orange: 'E58B36', green: '5D9C59', purple: '8064A2', teal: '4BACC6', white: 'FFFFFF', grey: 'F0F3F6'
};
const W = 13.333, H = 7.5;
const SH = pptx.ShapeType;

function addText(slide, text, x, y, w, h, opt = {}) {
  slide.addText(text, { x, y, w, h, margin: 0, breakLine: false, fontFace: opt.fontFace || 'Calibri',
    fontSize: opt.fontSize || 14, color: opt.color || C.ink, bold: opt.bold || false,
    italic: opt.italic || false, align: opt.align || 'left', valign: opt.valign || 'mid',
    fit: 'shrink', paraSpaceAfterPt: opt.paraSpaceAfterPt || 0, bullet: opt.bullet,
    charSpacing: opt.charSpacing || 0, transparency: opt.transparency });
}
function rect(slide, x, y, w, h, fill, line = fill, radius = false) {
  slide.addShape(radius ? SH.roundRect : SH.rect, { x, y, w, h, rectRadius: radius ? 0.08 : undefined,
    fill: { color: fill }, line: { color: line, transparency: line === fill ? 100 : 0 } });
}
function line(slide, x1, y1, x2, y2, color = C.line, width = 1) {
  slide.addShape(SH.line, { x: x1, y: y1, w: x2 - x1, h: y2 - y1, line: { color, width, beginArrowType: 'none', endArrowType: 'none' } });
}
function circle(slide, x, y, d, fill, label, textColor = C.white) {
  slide.addShape(SH.ellipse, { x, y, w: d, h: d, fill: { color: fill }, line: { color: fill } });
  if (label) addText(slide, label, x, y + 0.01, d, d - 0.02, { fontSize: 13, bold: true, color: textColor, align: 'center' });
}
function title(slide, section, heading, sub) {
  addText(slide, section.toUpperCase(), 0.58, 0.36, 3.5, 0.22, { fontSize: 9.5, bold: true, color: C.blue, charSpacing: 1.1 });
  addText(slide, heading, 0.58, 0.68, 12.1, 0.52, { fontSize: 28, bold: true, color: C.navy });
  if (sub) addText(slide, sub, 0.6, 1.26, 11.9, 0.35, { fontSize: 12.5, color: C.slate });
  line(slide, 0.58, 1.72, 12.72, 1.72, C.line, 0.8);
}
function footer(slide, n) {
  line(slide, 0.58, 7.04, 12.72, 7.04, C.line, 0.7);
  addText(slide, 'SMART INDIA HACKATHON 2026  ·  SIH26164  ·  ECDAT', 0.58, 7.13, 6.7, 0.16, { fontSize: 8.5, bold: true, color: C.slate, charSpacing: 0.3 });
  addText(slide, String(n).padStart(2, '0'), 12.28, 7.1, 0.42, 0.18, { fontSize: 9, bold: true, color: C.navy, align: 'right' });
}
function card(slide, x, y, w, h, heading, body, accent = C.blue, icon) {
  rect(slide, x, y, w, h, C.white, C.line, true);
  circle(slide, x + 0.22, y + 0.22, 0.38, accent, icon || '•');
  addText(slide, heading, x + 0.72, y + 0.2, w - 0.92, 0.28, { fontSize: 14, bold: true, color: C.navy });
  addText(slide, body, x + 0.24, y + 0.7, w - 0.48, h - 0.86, { fontSize: 11.2, color: C.slate, valign: 'top' });
}
function bulletList(slide, items, x, y, w, h, fontSize = 13, color = C.ink) {
  const runs = [];
  items.forEach((t, i) => runs.push({ text: t, options: { bullet: { indent: 12 }, hanging: 3, breakLine: i < items.length - 1 } }));
  slide.addText(runs, { x, y, w, h, margin: 0, fontFace: 'Calibri', fontSize, color, breakLine: false, paraSpaceAfterPt: 8, valign: 'top', fit: 'shrink' });
}
function stat(slide, x, y, w, value, label, color = C.navy) {
  addText(slide, value, x, y, w, 0.48, { fontSize: 29, bold: true, color, align: 'center' });
  addText(slide, label, x, y + 0.55, w, 0.4, { fontSize: 10.5, color: C.slate, align: 'center' });
}

// 1. Title
{
  const s = pptx.addSlide();
  rect(s, 0, 0, W, H, C.navy);
  // quiet signal-field motif
  for (let i = 0; i < 10; i++) line(s, 7.8 + i * 0.5, 0.5, 12.3, 5.0 + i * 0.12, '315C8A', 0.55);
  circle(s, 9.8, 1.05, 1.34, C.blue, '◈');
  s.addShape(SH.arc, { x: 9.4, y: 0.66, w: 2.15, h: 2.15, adjustPoint: 0.25, line: { color: '9EC3E6', width: 1.2, transparency: 20 }, fill: { color: C.navy, transparency: 100 } });
  addText(s, 'SMART INDIA HACKATHON 2026', 0.72, 0.72, 4.4, 0.24, { fontSize: 11, bold: true, color: 'B9D5ED', charSpacing: 1.2 });
  addText(s, 'ECDAT', 0.7, 1.58, 4.0, 0.75, { fontSize: 46, bold: true, color: C.white });
  addText(s, 'Enterprise Cryptographic\nDiscovery & Analysis Tool', 0.72, 2.38, 6.0, 0.98, { fontSize: 25, bold: true, color: 'DCEAF6', valign: 'top' });
  addText(s, 'A local-first platform that turns cryptographic evidence into a defensible post-quantum migration plan.', 0.72, 3.62, 6.15, 0.62, { fontSize: 16, color: C.white, valign: 'top' });
  rect(s, 0.72, 5.72, 5.95, 0.64, '2B5C8E', '2B5C8E', true);
  addText(s, 'SIH26164  ·  NTRO  ·  Blockchain & Cybersecurity', 0.98, 5.91, 5.45, 0.2, { fontSize: 11.5, bold: true, color: C.white, align: 'center' });
  addText(s, 'Team ECDAT  |  Software Category', 0.72, 6.72, 4.8, 0.22, { fontSize: 10.5, color: 'B9D5ED' });
  s.addNotes('Open with the promise: ECDAT does not stop at finding RSA or ECC. It shows what the crypto protects, when migration must start, and what the replacement will cost.');
}

// 2. Problem
{
  const s = pptx.addSlide(); title(s, 'The problem', 'Cryptography is everywhere. Migration visibility is not.', 'Critical enterprises need an evidence-led path to post-quantum readiness—not another opaque scanner.');
  card(s, 0.62, 2.08, 2.9, 2.0, 'Unknown estate', 'Source code, certificates, TLS, dependencies, containers and devices often carry cryptography that nobody has catalogued.', C.blue, '1');
  card(s, 3.83, 2.08, 2.9, 2.0, 'Wrong priority', 'Technical severity alone cannot tell a team whether the key protects test data, citizen identity, payment settlement or a 25-year archive.', C.orange, '2');
  card(s, 7.04, 2.08, 2.9, 2.0, 'Harvest now risk', 'Long-lived confidential records can be collected today and decrypted later when a cryptographically relevant quantum computer exists.', C.red, '3');
  card(s, 10.25, 2.08, 2.45, 2.0, 'Unmeasured change', 'A candidate PQC replacement may fit the algorithm—but fail on certificate size, client support, HSMs or protocol limits.', C.purple, '4');
  rect(s, 0.62, 4.63, 12.08, 1.44, C.ice, C.ice, true);
  addText(s, 'The gap ECDAT addresses', 0.93, 4.9, 2.6, 0.25, { fontSize: 13.5, bold: true, color: C.navy });
  addText(s, 'From “RSA/ECC is present” to “this service protects high-value data, is already past its migration horizon, and needs a measured hybrid-PQC pilot.”', 3.18, 4.84, 8.95, 0.58, { fontSize: 16, bold: true, color: C.ink, valign: 'mid' });
  addText(s, 'Design principle: deterministic evidence first; human review for every high-impact decision.', 3.18, 5.56, 7.6, 0.22, { fontSize: 11.5, color: C.slate }); footer(s, 2);
}

// 3. Solution
{
  const s = pptx.addSlide(); title(s, 'The solution', 'One local workflow—from discovery to a migration decision.', 'ECDAT is designed for organisations that cannot place sensitive source code into a heavyweight external platform.');
  const steps = [
    ['Discover', 'Scan authorised source, configuration, certificates and dependencies.', C.blue],
    ['Explain', 'Keep file, line, symbol, rule and snippet as evidence.', C.teal],
    ['Prioritise', 'Add business criticality and Mosca threat-horizon reasoning.', C.orange],
    ['Rehearse', 'Measure PQC / hybrid impacts before recommending a pilot.', C.purple]
  ];
  steps.forEach((st, i) => {
    const x = 0.72 + i * 3.12;
    circle(s, x + 0.88, 2.05, 0.7, st[2], String(i + 1));
    addText(s, st[0], x, 2.96, 2.46, 0.28, { fontSize: 17, bold: true, color: C.navy, align: 'center' });
    addText(s, st[1], x + 0.05, 3.39, 2.36, 0.8, { fontSize: 12, color: C.slate, align: 'center', valign: 'top' });
    if (i < 3) { s.addShape(SH.chevron, { x: x + 2.65, y: 2.25, w: 0.22, h: 0.3, fill: { color: C.line }, line: { color: C.line } }); }
  });
  rect(s, 0.72, 5.15, 12.0, 0.96, 'F1F6FA', 'D6E2ED', true);
  addText(s, 'Outputs for each audience', 0.98, 5.43, 2.3, 0.22, { fontSize: 12, bold: true, color: C.navy });
  addText(s, 'Developer: exact evidence + remediation  |  Security lead: transparent CBOM + risk posture  |  Leadership: migration sequence + measured trade-offs', 3.08, 5.38, 9.1, 0.28, { fontSize: 12.3, color: C.ink });
  footer(s, 3);
}

// 4. Architecture
{
  const s = pptx.addSlide(); title(s, 'Full product architecture', 'A privacy-preserving platform that scales by adding connectors—not complexity.', 'The prototype proves the core; the product roadmap expands coverage and enterprise integration.');
  const layers = [
    ['1  Authorised inputs', 'Repository / ZIP · TLS config · X.509 · dependency manifests · container metadata', C.blue],
    ['2  Evidence engine', 'File inventory → cheap triage → language-aware parsing → artefact inspection → deduplication', C.teal],
    ['3  Decision engine', 'Rules + purpose classification + service manifest + Mosca horizon + explainable priority score', C.orange],
    ['4  Action layer', 'Dashboard · CycloneDX 1.6 CBOM · migration passport · report / CI / ticket integration', C.purple]
  ];
  layers.forEach((l, i) => {
    const y = 1.98 + i * 1.13;
    rect(s, 0.78, y, 2.28, 0.78, l[2], l[2], true);
    addText(s, l[0], 0.98, y + 0.25, 1.9, 0.22, { fontSize: 12.5, bold: true, color: C.white, align: 'center' });
    rect(s, 3.25, y, 9.2, 0.78, C.white, C.line, true);
    addText(s, l[1], 3.53, y + 0.17, 8.64, 0.42, { fontSize: 13, color: C.ink, valign: 'mid' });
  });
  addText(s, 'Deployment posture', 0.8, 6.54, 1.7, 0.2, { fontSize: 10.5, bold: true, color: C.slate, charSpacing: 0.5 });
  addText(s, 'Local-first · air-gapped capable · no source upload · secrets redacted · deterministic scanner works without an LLM', 2.32, 6.52, 9.6, 0.24, { fontSize: 11.5, color: C.navy, bold: true }); footer(s, 4);
}

// 5. Discovery / CBOM
{
  const s = pptx.addSlide(); title(s, 'Evidence-backed discovery', 'A CBOM is useful only when every number can be traced back to its evidence.', 'ECDAT combines source, configuration, certificate and dependency evidence into a portable CycloneDX 1.6 cryptographic inventory.');
  const cols = [
    ['Source & config', 'Python and Java APIs\nTLS cipher suites\nKey-size constants\nAlgorithm names', C.blue],
    ['Artefacts', 'X.509 issuer and expiry\nKey usage and public-key size\nPrivate material never stored', C.teal],
    ['Dependencies', 'requirements.txt\npom.xml\nKnown crypto package role\nEvidence location retained', C.green],
    ['CBOM export', 'Algorithms and functions\nQuantum status\nOccurrences and rationale\nCycloneDX 1.6 JSON', C.purple]
  ];
  cols.forEach((c, i) => { card(s, 0.63 + i * 3.07, 2.05, 2.74, 2.48, c[0], c[1], c[2], String(i + 1)); });
  rect(s, 0.63, 5.1, 12.08, 1.0, C.pale, C.line, true);
  addText(s, 'Evidence record example', 0.92, 5.39, 1.72, 0.2, { fontSize: 11.5, bold: true, color: C.navy });
  addText(s, 'payment-api / PaymentSigner.java:84  →  Signature.getInstance("SHA256withRSA")  →  digital signature  →  rule: java-signature', 2.82, 5.36, 9.3, 0.23, { fontFace: 'Courier New', fontSize: 10.5, color: C.ink });
  addText(s, 'This is not an LLM-generated assertion: the finding retains its deterministic source evidence.', 2.82, 5.72, 8.5, 0.18, { fontSize: 10.5, color: C.slate }); footer(s, 5);
}

// 6. criticality
{
  const s = pptx.addSlide(); title(s, 'Business criticality + Mosca horizon', 'ECDAT separates “how serious” from “how soon”.', 'The same RSA finding can have radically different urgency depending on the data it protects and the time needed to migrate.');
  rect(s, 0.7, 2.0, 5.6, 3.85, C.white, C.line, true);
  addText(s, 'Criticality: declared context, not filename magic', 0.98, 2.3, 4.9, 0.26, { fontSize: 16, bold: true, color: C.navy });
  bulletList(s, [
    'Asset owner supplies a small service manifest once: path, owner, data class, exposure, retention and migration constraints.',
    'Manifest-confirmed paths are clearly distinguished from path heuristics and unknown values.',
    'Score = (data classification + business function) × exposure multiplier. The full working is shown in the UI.'
  ], 0.98, 2.85, 4.9, 2.25, 12, C.ink);
  rect(s, 6.65, 2.0, 5.98, 3.85, 'F7FAFD', C.line, true);
  addText(s, 'Mosca: X + Y > Z', 6.96, 2.3, 3.7, 0.3, { fontSize: 20, bold: true, color: C.navy });
  addText(s, 'X = data protection lifetime\nY = realistic migration time\nZ = organisation’s threat horizon', 6.96, 2.82, 3.6, 0.87, { fontSize: 14, color: C.slate, valign: 'top' });
  line(s, 7.0, 4.25, 12.15, 4.25, C.line, 1.2);
  line(s, 7.0, 4.12, 10.65, 4.12, C.red, 7);
  line(s, 10.65, 3.75, 10.65, 4.65, C.green, 2.4);
  addText(s, 'Treasury archive: 25 years + 4 years', 6.96, 4.52, 3.45, 0.23, { fontSize: 11.5, bold: true, color: C.red });
  addText(s, 'Z = 15 years', 10.78, 4.52, 1.45, 0.23, { fontSize: 11.5, bold: true, color: C.green });
  addText(s, 'Verdict: 14 years past the line. Start migration now—despite offline exposure.', 6.96, 5.13, 5.15, 0.28, { fontSize: 12.3, bold: true, color: C.ink }); footer(s, 6);
}

// 7. Passport / measured benchmark
{
  const s = pptx.addSlide(); title(s, 'Migration Passport', 'Measure the consequences of PQC before asking a service owner to change.', 'The current prototype executes real native cryptographic operations using OpenSSL 4.0.1 with ML-KEM and ML-DSA available.');
  rect(s, 0.68, 2.02, 3.08, 3.85, C.white, C.line, true);
  addText(s, 'Candidate comparison', 0.96, 2.3, 2.3, 0.24, { fontSize: 16, bold: true, color: C.navy });
  addText(s, 'RSA-2048 → ML-DSA-65\nECDH-P384 → ML-KEM-768', 0.96, 2.84, 2.3, 0.62, { fontSize: 15, bold: true, color: C.ink, valign: 'top' });
  addText(s, 'Outputs: median / p95 latency, throughput, public-key size, signature or ciphertext size, and certificate-chain impact.', 0.96, 3.72, 2.42, 0.92, { fontSize: 12, color: C.slate, valign: 'top' });
  addText(s, 'Recommendation is always a pilot; not automatic production migration.', 0.96, 5.12, 2.36, 0.38, { fontSize: 11.3, bold: true, color: C.red, valign: 'top' });
  const chartData = [
    { name: 'RSA-2048', labels: ['Signature'], values: [256] },
    { name: 'ML-DSA-65', labels: ['Signature'], values: [3309] }
  ];
  s.addChart(pptx.ChartType.bar, chartData, { x: 4.14, y: 2.08, w: 4.1, h: 3.45, catAxisLabelFontFace: 'Calibri', catAxisLabelFontSize: 11, valAxisLabelFontFace: 'Calibri', valAxisLabelFontSize: 9, valAxisMinVal: 0, valAxisMaxVal: 3600, valAxisMajorUnit: 900, valGridLine: { color: 'D9E2EB', width: 0.6 }, showLegend: true, legendPos: 'b', legendFontSize: 10, showTitle: true, title: 'Digital signature size (bytes)', titleFontFace: 'Calibri', titleFontSize: 14, titleColor: C.navy, chartColors: [C.blue, C.purple], showValue: true, dataLabelPosition: 'outEnd', showCatName: false, showValAxisTitle: false, showCatAxisTitle: false, showBorder: false });
  rect(s, 8.63, 2.08, 3.98, 3.45, 'F7FAFD', C.line, true);
  addText(s, 'Measured finding', 8.93, 2.38, 2.6, 0.24, { fontSize: 16, bold: true, color: C.navy });
  stat(s, 8.95, 2.94, 1.13, '12.9×', 'larger ML-DSA-65 signature', C.purple);
  stat(s, 10.56, 2.94, 1.13, '1.4×', 'RSA-2048 signing cost', C.orange);
  stat(s, 11.7, 2.94, 0.72, '5.9×', 'ML-KEM-768 faster than ECDH-P384', C.green);
  addText(s, 'Key message: speed is not the blocker. Certificate and handshake size can be.', 8.93, 4.55, 3.1, 0.44, { fontSize: 12.2, bold: true, color: C.ink, valign: 'top' });
  addText(s, 'A three-certificate chain rises from 2,637 B to 16,824 B—past the ~14.6 KB TCP initial congestion window.', 8.93, 5.03, 3.1, 0.3, { fontSize: 10.5, color: C.slate, valign: 'top' }); footer(s, 7);
}

// 8. prototype proof
{
  const s = pptx.addSlide(); title(s, 'Prototype proof', 'The prototype turns the full method into an inspectable, offline demonstration.', 'Every headline shown here is generated from the committed scan results—not invented for slides.');
  const stats = [ ['4', 'targets scanned'], ['3,111', 'source files'], ['206', 'crypto findings'], ['120', 'quantum-vulnerable'], ['17', 'certificates parsed'], ['16', 'dependencies recognised'] ];
  stats.forEach((st, i) => { const x = 0.72 + (i % 3) * 4.07, y = 2.0 + Math.floor(i / 3) * 1.32; rect(s, x, y, 3.7, 1.03, C.white, C.line, true); stat(s, x + 0.16, y + 0.14, 1.23, st[0], st[1], i === 3 ? C.red : C.navy); });
  rect(s, 0.72, 4.9, 12.0, 1.05, C.ice, C.ice, true);
  addText(s, 'What jurors can see live', 1.0, 5.19, 2.15, 0.23, { fontSize: 13.5, bold: true, color: C.navy });
  addText(s, 'Command Centre → clickable source evidence → manifest-criticality working → adjustable Mosca horizon → measurable migration passport → CycloneDX CBOM', 3.25, 5.16, 8.78, 0.34, { fontSize: 13, color: C.ink, valign: 'mid' });
  addText(s, 'Current benchmark environment: Windows 11 · Python 3.12.13 · cryptography 50.0.0 · OpenSSL 4.0.1 · PQC enabled.', 1.0, 6.31, 10.6, 0.2, { fontSize: 10.5, color: C.slate }); footer(s, 8);
}

// 9. trust
{
  const s = pptx.addSlide(); title(s, 'Trust, safety and sovereignty', 'Built for sensitive environments where the repository itself is valuable.', 'ECDAT is a decision-support system, not an autonomous migration engine.');
  const rows = [
    ['Local-first by default', 'No cloud upload, CDN, telemetry or external runtime dependency in the prototype.', C.blue],
    ['Authorised scanning only', 'Users scan only repositories, artefacts and endpoints for which they have explicit permission.', C.green],
    ['Secrets stay out', 'Certificates are parsed as metadata; private keys are never stored or displayed. Optional AI receives only redacted snippets.', C.red],
    ['Deterministic source of truth', 'Rules and evidence create findings. An LLM may explain verified evidence but never invent or silently score it.', C.purple]
  ];
  rows.forEach((r, i) => { const y = 2.02 + i * 1.03; circle(s, 0.86, y + 0.12, 0.45, r[2], '✓'); addText(s, r[0], 1.56, y + 0.06, 3.1, 0.25, { fontSize: 14, bold: true, color: C.navy }); addText(s, r[1], 4.52, y + 0.06, 7.55, 0.4, { fontSize: 12.3, color: C.slate, valign: 'top' }); line(s, 1.56, y + 0.78, 12.2, y + 0.78, 'E3EAF1', 0.7); });
  rect(s, 0.82, 6.24, 11.75, 0.44, C.pale, C.line, true); addText(s, 'Audit posture: retain input hash, scanner/ruleset version and timestamp; label unsupported or unknown cases instead of pretending certainty.', 1.08, 6.37, 11.2, 0.17, { fontSize: 10.8, color: C.ink, align: 'center' }); footer(s, 9);
}

// 10. differentiation
{
  const s = pptx.addSlide(); title(s, 'Why ECDAT is distinct', 'Discovery is necessary. Context and rehearsal make it actionable.', 'ECDAT is positioned for smaller, resource-constrained and security-sensitive organisations—not as a replacement for every enterprise platform.');
  const heads = ['Commodity discovery', 'ECDAT’s decision layer', 'Outcome'];
  heads.forEach((h, i) => { rect(s, 0.73 + i * 4.05, 1.98, 3.65, 0.56, i === 1 ? C.navy : 'E8EFF6', i === 1 ? C.navy : 'E8EFF6', true); addText(s, h, 0.9 + i * 4.05, 2.16, 3.3, 0.18, { fontSize: 12.5, bold: true, color: i === 1 ? C.white : C.navy, align: 'center' }); });
  const matrix = [
    ['Find RSA / ECC / dependencies', 'Map evidence to owner-declared business criticality', 'Defensible priority—not a generic CVSS-like list'],
    ['Classify technical PQC exposure', 'Apply visible Mosca X + Y > Z reasoning', 'Know which migration must start first'],
    ['Recommend an algorithm', 'Measure latency, size and chain impact in a sandbox', 'Choose a feasible hybrid/PQC pilot'],
    ['Cloud / heavy enterprise installation', 'Static local-first console with portable CBOM', 'Deployable in constrained or air-gapped settings']
  ];
  matrix.forEach((row, r) => { const y = 2.7 + r * 0.82; row.forEach((cell, c) => { rect(s, 0.73 + c * 4.05, y, 3.65, 0.63, c === 1 ? 'F4F8FC' : C.white, C.line, false); addText(s, cell, 0.95 + c * 4.05, y + 0.13, 3.2, 0.36, { fontSize: 10.9, color: c === 1 ? C.ink : C.slate, bold: c === 2, valign: 'mid' }); }); });
  addText(s, 'Positioning statement: privacy-preserving cryptographic inventory + evidence-backed prioritisation + measurable migration rehearsal.', 0.78, 6.3, 11.95, 0.29, { fontSize: 13.5, bold: true, color: C.navy, align: 'center' }); footer(s, 10);
}

// 11 roadmap
{
  const s = pptx.addSlide(); title(s, 'Path from prototype to product', 'Grow coverage and integration without compromising the evidence model.', 'Each phase produces an independently useful capability; no “big-bang” rewrite is required.');
  const phases = [
    ['Now · Hackathon prototype', 'Python + Java\nTLS / X.509 / dependencies\nStatic local dashboard\nCBOM + Mosca + benchmark', C.blue],
    ['Next · Pilot deployment', 'Git / CI connector\nIncremental scans + history\nService-manifest onboarding\nPDF / ticket export', C.teal],
    ['Then · Enterprise coverage', 'Go, C/C++, JavaScript\nContainers, binaries, keystores\nCMDB and HSM connectors\nAccess control + audit trail', C.orange],
    ['Future · Migration assurance', 'Controlled hybrid TLS testbed\nPolicy as code\nRisk trend analytics\nValidated change workflows', C.purple]
  ];
  phases.forEach((p, i) => { const x = 0.72 + i * 3.08; circle(s, x + 0.98, 2.0, 0.7, p[2], String(i + 1)); addText(s, p[0], x, 2.92, 2.66, 0.44, { fontSize: 13.4, bold: true, color: C.navy, align: 'center', valign: 'top' }); rect(s, x, 3.62, 2.66, 1.75, C.white, C.line, true); addText(s, p[1], x + 0.25, 3.9, 2.16, 1.17, { fontSize: 11.2, color: C.slate, align: 'center', valign: 'mid' }); if (i < 3) { s.addShape(SH.chevron, { x: x + 2.78, y: 2.25, w: 0.16, h: 0.28, fill: { color: C.line }, line: { color: C.line } }); } });
  addText(s, 'Non-negotiables through every phase: explicit authorisation · evidence preservation · transparent confidence labels · human review for high-impact decisions.', 0.92, 6.24, 11.45, 0.25, { fontSize: 11.5, color: C.slate, align: 'center' }); footer(s, 11);
}

// 12 impact
{
  const s = pptx.addSlide(); title(s, 'Impact and benefits', 'ECDAT turns a vague cryptographic inventory into a practical national-readiness capability.', 'The value is not simply identifying weak crypto—it is helping limited teams make the next defensible move.');
  const benefits = [
    ['For engineers', 'Exact file-level evidence and relevant remediation reduce time spent finding the owner and reproducing the issue.', C.blue],
    ['For security teams', 'A standard CBOM plus confidence labels shows what is known, what is inferred and what still needs confirmation.', C.teal],
    ['For leadership', 'Mosca horizons and measured migration costs convert PQC preparation into a prioritised investment sequence.', C.orange],
    ['For public-sector deployment', 'Local-first, auditable operation supports sensitive estates where foreign SaaS and source upload are unsuitable.', C.purple]
  ];
  benefits.forEach((b, i) => card(s, 0.72 + (i % 2) * 6.12, 2.05 + Math.floor(i / 2) * 2.03, 5.64, 1.58, b[0], b[1], b[2], String(i + 1)));
  rect(s, 0.74, 6.25, 11.98, 0.44, C.navy, C.navy, true); addText(s, 'ECDAT is not a promise that PQC migration is easy. It is a disciplined way to know what to do first—and why.', 1.0, 6.38, 11.45, 0.18, { fontSize: 12.2, bold: true, color: C.white, align: 'center' }); footer(s, 12);
}

// 13 references
{
  const s = pptx.addSlide(); title(s, 'Research, standards and limits', 'Grounded in published standards; explicit about the prototype boundary.', 'References are included so each technical claim can be challenged and verified.');
  rect(s, 0.72, 1.98, 7.42, 4.62, C.white, C.line, true);
  addText(s, 'Standards and primary references', 1.0, 2.26, 3.9, 0.24, { fontSize: 16, bold: true, color: C.navy });
  bulletList(s, [
    'NIST FIPS 203 — ML-KEM; FIPS 204 — ML-DSA; FIPS 205 — SLH-DSA.',
    'NIST IR 8547 — Transition to Post-Quantum Cryptography Standards.',
    'NIST SP 800-57 — Key-management and security-strength guidance.',
    'CycloneDX 1.6 — Cryptographic Bill of Materials (CBOM) format.',
    'RFC 5280 — X.509 certificates; RFC 8996 — TLS 1.0/1.1 deprecation; RFC 7465 — RC4 prohibition.',
    'Michele Mosca (2015) — X + Y > Z threat-horizon reasoning.'
  ], 1.0, 2.78, 6.6, 3.1, 12, C.ink);
  rect(s, 8.48, 1.98, 4.22, 4.62, 'F7FAFD', C.line, true);
  addText(s, 'Prototype limits—stated plainly', 8.78, 2.26, 3.4, 0.24, { fontSize: 16, bold: true, color: C.navy });
  bulletList(s, [
    'Python and Java source; TLS and X.509 artefacts—no universal binary or cloud discovery.',
    'Static analysis cannot see reflection or runtime-constructed algorithm names.',
    'Business manifest is manual in the prototype; CMDB integration is a roadmap item.',
    'Benchmark is raw crypto operations on one machine; not a production TLS deployment claim.'
  ], 8.78, 2.8, 3.35, 2.7, 11.2, C.slate);
  addText(s, 'Thank you · Questions', 8.8, 5.9, 3.18, 0.28, { fontSize: 16, bold: true, color: C.blue, align: 'center' }); footer(s, 13);
}

pptx.writeFile({ fileName: 'ECDAT_SIH26164_Full_Project_Presentation.pptx' });
