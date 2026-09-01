/* ============================================================
   ECDAT analyst console
   Reads window.ECDAT (produced by engine/run.py). No network, no
   dependencies, no build step -- it runs straight off the filesystem.
   ============================================================ */

(function () {
"use strict";

var D = window.ECDAT;
if (!D) { document.getElementById("page").innerHTML = '<div class="empty">data.js not found. Run <code>python engine/run.py</code> first.</div>'; return; }

/* ---------------- helpers ---------------- */

function esc(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function n(x, d) { if (x == null || isNaN(x)) return "—"; return Number(x).toLocaleString("en-IN", { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 }); }
function bytes(b) {
  if (b == null) return "—";
  if (b < 1024) return b + " B";
  if (b < 1048576) return (b / 1024).toFixed(1) + " KB";
  return (b / 1048576).toFixed(1) + " MB";
}
function pct(a, b) { return b ? Math.round(a / b * 100) : 0; }
function q(id) { return document.getElementById(id); }
function titleCase(s) { return String(s || "").replace(/[-_]/g, " ").replace(/\b\w/g, function (c) { return c.toUpperCase(); }); }

var RISK_ORDER = ["critical", "high", "medium", "low", "informational"];
var RISK_COLOR = { critical: "#ff4d6d", high: "#ff9142", medium: "#ffd056", low: "#56a8f5", informational: "#64748b" };
var Q_COLOR = { "classically-broken": "#ff2d55", "shor-broken": "#ff4d6d", "grover-reduced": "#ffd056", "quantum-safe": "#2fd9a4", "unknown": "#64748b" };
var Q_LABEL = {
  "classically-broken": "Broken today",
  "shor-broken": "Broken by Shor",
  "grover-reduced": "Weakened by Grover",
  "quantum-safe": "Quantum-safe",
  "unknown": "Unclassified"
};

var ICONS = {
  grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  list: '<line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.4"/>',
  clock: '<circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15.5 14"/>',
  zap: '<polygon points="13 2 4 14 11 14 10 22 20 10 13 10 13 2"/>',
  file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>',
  book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>'
};
function icon(name) {
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">' + (ICONS[name] || "") + "</svg>";
}

/* ---------------- state ---------------- */

var REPO_IDS = Object.keys(D.repos);
/* The hosted copy cannot hand the viewer a file, so it hides download controls
   rather than showing a button that does nothing. The local prototype can. */
var CAN_DOWNLOAD = !window.ECDAT_NO_DOWNLOAD;
var S = {
  view: "overview",
  repo: "nivesh-core",
  filters: { search: "", risk: "", algorithm: "", fn: "", conf: "", quantum: "" },
  sort: { key: "risk", dir: -1 },
  mosca: { z: null, over: {} },
  selected: null
};

function repos() { return S.repo === "all" ? REPO_IDS.map(function (r) { return D.repos[r]; }) : [D.repos[S.repo]]; }
function R() { return D.repos[S.repo]; }
function allFindings() {
  var out = [];
  repos().forEach(function (r) { out = out.concat(r.findings); });
  return out;
}

/* ---------------- chart primitives ---------------- */

function stackBar(counts, order, colors, labels) {
  var total = order.reduce(function (a, k) { return a + (counts[k] || 0); }, 0);
  if (!total) return '<div class="empty">No data</div>';
  var segs = order.filter(function (k) { return counts[k]; }).map(function (k) {
    var v = counts[k], p = v / total * 100;
    return '<div style="flex:' + v + ';background:' + colors[k] + '" title="' + esc((labels[k] || k) + ": " + v) + '">' + (p > 7 ? v : "") + "</div>";
  }).join("");
  var leg = order.filter(function (k) { return counts[k]; }).map(function (k) {
    return '<span><i style="background:' + colors[k] + '"></i>' + esc(labels[k] || titleCase(k)) + ' <b style="color:var(--ink-2);font-family:var(--mono)">' + counts[k] + "</b></span>";
  }).join("");
  return '<div class="stackbar">' + segs + '</div><div class="legend">' + leg + "</div>";
}

function hBars(rows, opts) {
  opts = opts || {};
  var max = Math.max.apply(null, rows.map(function (r) { return r.v; }).concat([1]));
  return '<div class="bars' + (opts.wide ? " wide" : "") + '">' + rows.map(function (r) {
    return '<div class="bar-row">' +
      '<div class="nm" title="' + esc(r.k) + '">' + esc(r.k) + "</div>" +
      '<div class="bar-track"><div class="bar-fill" style="width:' + (r.v / max * 100) + "%;background:" + (r.c || "var(--accent)") + '"></div></div>' +
      '<div class="vv">' + (opts.fmt ? opts.fmt(r.v) : n(r.v)) + "</div></div>";
  }).join("") + "</div>";
}

function donut(counts, order, colors, centerLabel, centerValue) {
  var total = order.reduce(function (a, k) { return a + (counts[k] || 0); }, 0) || 1;
  var r = 54, c = 2 * Math.PI * r, off = 0;
  var arcs = order.filter(function (k) { return counts[k]; }).map(function (k) {
    var frac = counts[k] / total, len = frac * c;
    var s = '<circle cx="70" cy="70" r="' + r + '" fill="none" stroke="' + colors[k] + '" stroke-width="17" ' +
      'stroke-dasharray="' + len + " " + (c - len) + '" stroke-dashoffset="' + (-off) + '" transform="rotate(-90 70 70)"><title>' + esc(titleCase(k) + ": " + counts[k]) + "</title></circle>";
    off += len;
    return s;
  }).join("");
  return '<svg viewBox="0 0 140 140" style="width:140px;height:140px;flex:0 0 140px">' +
    '<circle cx="70" cy="70" r="' + r + '" fill="none" stroke="#1a2331" stroke-width="17"/>' + arcs +
    '<text x="70" y="65" text-anchor="middle" fill="#e8edf5" font-family="ui-monospace,monospace" font-size="25" font-weight="600">' + esc(centerValue) + "</text>" +
    '<text x="70" y="83" text-anchor="middle" fill="#6b7c94" font-size="9.5" font-weight="600" letter-spacing="1">' + esc(centerLabel) + "</text></svg>";
}

function legendList(counts, order, colors, labels) {
  return '<div style="display:flex;flex-direction:column;gap:7px;flex:1">' + order.filter(function (k) { return counts[k]; }).map(function (k) {
    return '<div style="display:flex;align-items:center;gap:8px;font-size:12.2px">' +
      '<i style="width:9px;height:9px;border-radius:2.5px;background:' + colors[k] + '"></i>' +
      '<span style="color:var(--ink-2)">' + esc(labels && labels[k] || titleCase(k)) + "</span>" +
      '<b style="margin-left:auto;font-family:var(--mono);color:var(--ink)">' + counts[k] + "</b></div>";
  }).join("") + "</div>";
}

/* ---------------- shared fragments ---------------- */

function riskBadge(b) { return '<span class="badge b-' + b + '">' + esc(b) + "</span>"; }
function qDot(status) { return '<span class="dot-q q-' + status + '" title="' + esc(Q_LABEL[status] || status) + '"></span>'; }
function pathCell(f) {
  var i = f.file.lastIndexOf("/");
  var dirs = i < 0 ? "" : f.file.slice(0, i + 1), base = i < 0 ? f.file : f.file.slice(i + 1);
  return '<span class="path"><span class="dirs">' + esc(dirs) + "</span>" + esc(base) + '<span class="ln">:' + f.line + "</span></span>";
}
/* Compact form for the narrow overview table: filename and line only. The full
   path is always one click away in the evidence drawer. */
function pathCellShort(f) {
  var i = f.file.lastIndexOf("/");
  var base = i < 0 ? f.file : f.file.slice(i + 1);
  return '<span class="path" title="' + esc(f.file + ":" + f.line) + '">' + esc(base) +
    '<span class="ln">:' + f.line + "</span></span>";
}
function confBadge(c) {
  var m = { "manifest-confirmed": "b-safe", "path-heuristic": "b-medium", "unknown": "b-informational", "declared-by-certificate": "b-safe" };
  return '<span class="badge ' + (m[c] || "b-muted") + '">' + esc(c.replace(/-/g, " ")) + "</span>";
}

/* ============================================================
   VIEW: Command Centre
   ============================================================ */

function viewOverview() {
  var rs = repos(), F = allFindings();
  var t = { findings: 0, files: 0, bytes: 0, clean: 0, incr: 0, certs: 0, deps: 0, seen: 0, triaged: 0 };
  rs.forEach(function (r) {
    t.findings += r.summary.total_findings; t.files += r.telemetry.source_files_scanned;
    t.bytes += r.telemetry.bytes_scanned; t.clean += r.telemetry.scan_seconds;
    t.incr += (r.telemetry.incremental_seconds || 0); t.certs += r.summary.certificates;
    t.deps += r.summary.dependencies; t.seen += r.telemetry.files_seen;
    t.triaged += (r.telemetry.triaged_out || 0);
  });
  var qc = {}, rc = {}, ac = {}, fc = {};
  F.forEach(function (f) {
    qc[f.quantum] = (qc[f.quantum] || 0) + 1;
    rc[f.risk.bucket] = (rc[f.risk.bucket] || 0) + 1;
    if (f.algorithm) ac[f.label] = (ac[f.label] || 0) + 1;
    fc[f.function] = (fc[f.function] || 0) + 1;
  });
  var vuln = (qc["shor-broken"] || 0) + (qc["classically-broken"] || 0);
  var actionable = (rc.critical || 0) + (rc.high || 0);

  var topAlgs = Object.keys(ac).map(function (k) { return { k: k, v: ac[k] }; })
    .sort(function (a, b) { return b.v - a.v; }).slice(0, 11)
    .map(function (r) {
      var base = r.k.split("-")[0];
      var meta = D.algorithms[r.k] || D.algorithms[base] || {};
      return { k: r.k, v: r.v, c: Q_COLOR[meta.quantum] || "#64748b" };
    });

  var topFindings = F.slice().sort(function (a, b) { return b.risk.score - a.risk.score; }).slice(0, 9);

  var html = "";

  /* -- briefing summary: deliberately lighter than a tile dashboard -- */
  html += '<section class="briefing-hero"><div class="briefing-intro">' +
    '<p class="eyebrow">Cryptographic posture</p><h2>Evidence first. Migration decisions second.</h2>' +
    '<p>Results from ' + n(t.files) + ' source files across ' + rs.length + ' target' + (rs.length === 1 ? '' : 's') + '. Every priority remains traceable to code, service context, and a visible scoring model.</p>' +
    '</div><div class="briefing-stats">' +
    briefingStat("Findings", n(t.findings), "detected") +
    briefingStat("Quantum-vulnerable", n(vuln), pct(vuln, t.findings) + "% of inventory", "critical") +
    briefingStat("Migration priority", n(actionable), "critical or high", "high") +
    briefingStat("Broken today", n(qc["classically-broken"] || 0), "not a quantum risk", "critical") +
    '</div></section>';

  /* -- exposure + risk -- */
  html += '<div class="section-title">Exposure profile</div>';
  html += '<div class="grid g-2-1">';
  html += '<div class="card"><div class="card-h"><h3>Quantum status of every finding</h3>' +
    '<span class="sub">how a cryptographically-relevant quantum computer affects each primitive</span></div>' +
    '<div class="card-b">' + stackBar(qc, ["classically-broken", "shor-broken", "grover-reduced", "quantum-safe", "unknown"], Q_COLOR, Q_LABEL) +
    '<div class="note" style="margin-top:14px">' +
    '<b>Reading this correctly matters.</b> Not every finding is a migration task. Quantum-safe primitives ' +
    '(AES-256, SHA-256, HMAC) are inventoried but need no action. The urgent column is <b>broken today</b> — ' +
    'MD5 and SHA-1 are exploitable now, which outranks a threat that needs a quantum computer.</div></div></div>';

  html += '<div class="card"><div class="card-h"><h3>Risk distribution</h3></div><div class="card-b">' +
    '<div style="display:flex;gap:16px;align-items:center">' +
    donut(rc, RISK_ORDER, RISK_COLOR, "ACTIONABLE", String(actionable)) +
    legendList(rc, RISK_ORDER, RISK_COLOR) + "</div></div></div>";
  html += "</div>";

  /* -- algorithms + top findings -- */
  html += '<div class="section-title">Inventory</div>';
  html += '<div class="grid g-1-2">';
  html += '<div class="card"><div class="card-h"><h3>Algorithms in use</h3><span class="right">' + Object.keys(ac).length + " distinct</span></div>" +
    '<div class="card-b">' + hBars(topAlgs) +
    '<div class="legend" style="margin-top:14px">' +
    ["classically-broken", "shor-broken", "grover-reduced", "quantum-safe"].map(function (k) {
      return '<span><i style="background:' + Q_COLOR[k] + '"></i>' + Q_LABEL[k] + "</span>";
    }).join("") + "</div></div></div>";

  html += '<div class="card"><div class="card-h"><h3>Highest-priority findings</h3>' +
    '<span class="sub">ranked by quantum urgency × business criticality</span>' +
    '<span class="right"><a href="#/inventory" style="color:var(--accent);text-decoration:none">view all →</a></span></div>' +
    '<div class="card-b flush"><table class="tbl"><thead><tr>' +
    "<th>Risk</th><th>Algorithm</th><th>Purpose</th><th>Service</th><th>Evidence</th></tr></thead><tbody>" +
    topFindings.map(function (f) {
      return '<tr data-fid="' + esc(f.id) + '" data-repo="' + esc(f.repo) + '">' +
        "<td>" + riskBadge(f.risk.bucket) + ' <span class="mono dim">' + f.risk.score.toFixed(1) + "</span></td>" +
        '<td>' + qDot(f.quantum) + ' <span class="mono">' + esc(f.label) + "</span></td>" +
        '<td class="dim">' + esc(titleCase(f.function)) + "</td>" +
        "<td>" + (f.criticality.service ? '<span class="mono" style="font-size:11.5px">' + esc(f.criticality.service) + "</span>" : '<span class="dim">—</span>') + "</td>" +
        "<td>" + pathCellShort(f) + "</td></tr>";
    }).join("") + "</tbody></table></div></div>";
  html += "</div>";

  /* -- scan telemetry -- */
  html += '<div class="section-title">Scan telemetry — measured on this machine</div>';
  html += '<div class="grid g4">' +
    tile("Clean scan", t.clean.toFixed(2) + "<small>s</small>", n(Math.round(t.files / Math.max(t.clean, .001))) + " source files per second", "") +
    tile("Incremental rescan", t.incr.toFixed(2) + "<small>s</small>", "<b style='color:var(--safe)'>" + (t.clean / Math.max(t.incr, .0001)).toFixed(1) + "× faster</b> — unchanged files matched by content hash", "safe") +
    tile("Triaged out", n(t.triaged), "files that cannot contain crypto, skipped before parsing", "") +
    tile("Source volume", bytes(t.bytes), n(t.seen) + " files walked · " + D.rule_count + " detection rules", "") +
    "</div>";

  /* -- repo comparison -- */
  if (S.repo === "all" || REPO_IDS.length > 1) {
    html += '<div class="section-title">Targets scanned</div><div class="grid g4">';
    REPO_IDS.forEach(function (id) {
      var r = D.repos[id], s = r.summary;
      var isDemo = r.meta.kind === "demo-estate";
      html += '<div class="card"><div class="card-b">' +
        '<div style="display:flex;align-items:center;gap:8px;margin-bottom:7px">' +
        '<span class="mono" style="font-weight:640;font-size:13.5px">' + esc(r.meta.name) + "</span>" +
        '<span class="badge ' + (isDemo ? "b-pqc" : "b-safe") + '" style="margin-left:auto">' + (isDemo ? "demo estate" : "real OSS") + "</span></div>" +
        '<div style="font-size:11.6px;color:var(--ink-3);line-height:1.5;min-height:52px">' + esc(r.meta.description) + "</div>" +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px;padding-top:11px;border-top:1px solid var(--line)">' +
        miniStat("findings", n(s.total_findings)) + miniStat("vulnerable", n(s.quantum_vulnerable)) +
        miniStat("files", n(r.telemetry.source_files_scanned)) + miniStat("scan", r.telemetry.scan_seconds.toFixed(2) + "s") +
        "</div>" +
        (r.meta.upstream ? '<div style="margin-top:10px;font-family:var(--mono);font-size:10.5px;color:var(--ink-4);overflow:hidden;text-overflow:ellipsis">' + esc(r.meta.upstream.replace("https://github.com/", "github.com/")) + "</div>" : "") +
        "</div></div>";
    });
    html += "</div>";
  }

  return html;
}

function tile(k, v, d, tone) {
  return '<div class="card metric ' + (tone ? "tone-" + tone : "") + '">' +
    '<div class="k">' + esc(k) + '</div><div class="v">' + v + '</div><div class="d">' + d + "</div></div>";
}
function briefingStat(k, v, d, tone) {
  return '<div class="briefing-stat ' + (tone ? 'tone-' + tone : '') + '">' +
    '<div class="k">' + esc(k) + '</div><div class="v">' + v + '</div><div class="d">' + d + '</div></div>';
}
function miniStat(k, v) {
  return '<div><div style="font-size:9.5px;text-transform:uppercase;letter-spacing:.6px;color:var(--ink-4);font-weight:700">' + esc(k) + "</div>" +
    '<div class="mono" style="font-size:15px;font-weight:620;margin-top:2px">' + v + "</div></div>";
}

/* ============================================================
   VIEW: Inventory
   ============================================================ */

function filtered() {
  var f = S.filters;
  var list = allFindings().filter(function (x) {
    if (f.risk && x.risk.bucket !== f.risk) return false;
    if (f.algorithm && x.label !== f.algorithm) return false;
    if (f.fn && x.function !== f.fn) return false;
    if (f.conf && x.criticality.confidence !== f.conf) return false;
    if (f.quantum && x.quantum !== f.quantum) return false;
    if (f.search) {
      var s = f.search.toLowerCase();
      if ((x.file + " " + x.label + " " + x.function + " " + (x.symbol || "") + " " + (x.snippet || "") + " " + (x.criticality.service || "")).toLowerCase().indexOf(s) < 0) return false;
    }
    return true;
  });
  var k = S.sort.key, dir = S.sort.dir;
  list.sort(function (a, b) {
    var va, vb;
    if (k === "risk") { va = a.risk.score; vb = b.risk.score; }
    else if (k === "crit") { va = a.criticality.score; vb = b.criticality.score; }
    else if (k === "file") { va = a.file + a.line; vb = b.file + b.line; }
    else { va = a[k]; vb = b[k]; }
    if (va == null) va = ""; if (vb == null) vb = "";
    return va < vb ? -dir : va > vb ? dir : 0;
  });
  return list;
}

function viewInventory() {
  var F = allFindings();
  var algs = {}, fns = {};
  F.forEach(function (x) { if (x.algorithm) algs[x.label] = 1; fns[x.function] = 1; });

  function opts(o, cur, blank) {
    return '<option value="">' + blank + "</option>" + Object.keys(o).sort().map(function (k) {
      return '<option value="' + esc(k) + '"' + (cur === k ? " selected" : "") + ">" + esc(titleCase(k)) + "</option>";
    }).join("");
  }

  var html = '<div class="card"><div class="filters">' +
    '<input type="search" id="f-search" placeholder="search file, symbol, algorithm…" value="' + esc(S.filters.search) + '">' +
    '<select id="f-alg">' + opts(algs, S.filters.algorithm, "All algorithms") + "</select>" +
    '<select id="f-fn">' + opts(fns, S.filters.fn, "All purposes") + "</select>" +
    '<select id="f-conf">' + opts({ "manifest-confirmed": 1, "path-heuristic": 1, "unknown": 1 }, S.filters.conf, "All confidence tiers") + "</select>" +
    '<div class="spacer"></div>' +
    '<div class="pill-row">' + ["", "critical", "high", "medium", "low"].map(function (r) {
      return '<button class="pill' + (S.filters.risk === r ? " on" : "") + '" data-risk="' + r + '">' + (r ? titleCase(r) : "All") + "</button>";
    }).join("") + "</div></div>";

  var list = filtered();
  html += '<div class="filters" style="border-bottom:1px solid var(--line);padding-top:9px;padding-bottom:9px">' +
    '<span class="count">' + n(list.length) + " of " + n(F.length) + ' findings</span>' +
    '<div class="spacer"></div><span class="count">click any row for full evidence</span></div>';

  html += '<div class="tbl-wrap"><table class="tbl"><thead><tr>' +
    th("risk", "Risk") + th("label", "Algorithm") + "<th>Q</th>" + th("function", "Purpose") +
    th("crit", "Criticality") + "<th>Confidence</th>" + th("file", "Evidence") + "<th>Symbol</th>" +
    "</tr></thead><tbody>";

  if (!list.length) html += '<tr><td colspan="8"><div class="empty">No findings match these filters.</div></td></tr>';

  html += list.slice(0, 600).map(function (f) {
    return '<tr data-fid="' + esc(f.id) + '" data-repo="' + esc(f.repo) + '"' + (S.selected === f.id ? ' class="sel"' : "") + ">" +
      "<td>" + riskBadge(f.risk.bucket) + ' <span class="mono dim">' + f.risk.score.toFixed(1) + "</span></td>" +
      '<td class="mono">' + esc(f.label) + "</td>" +
      "<td>" + qDot(f.quantum) + "</td>" +
      '<td class="dim">' + esc(titleCase(f.function)) + "</td>" +
      '<td><span class="badge b-' + critTone(f.criticality.bucket) + '">' + esc(f.criticality.bucket) + '</span> <span class="mono dim">' + f.criticality.score + "</span></td>" +
      "<td>" + confBadge(f.criticality.confidence) + "</td>" +
      "<td>" + pathCell(f) + "</td>" +
      '<td class="mono dim" style="font-size:11px">' + esc(f.symbol || "—") + "</td></tr>";
  }).join("");

  html += "</tbody></table></div>";
  if (list.length > 600) html += '<div class="empty">Showing the first 600 of ' + n(list.length) + " — narrow the filters to see the rest.</div>";
  html += "</div>";
  return html;
}

function th(key, label) {
  var on = S.sort.key === key;
  return '<th class="sortable" data-sort="' + key + '">' + esc(label) +
    '<span class="arrow">' + (on ? (S.sort.dir > 0 ? "▲" : "▼") : "⇅") + "</span></th>";
}
function critTone(b) { return b === "critical" ? "critical" : b === "high" ? "high" : b === "medium" ? "medium" : "low"; }

/* ============================================================
   VIEW: Criticality
   ============================================================ */

function viewCriticality() {
  var r = R();
  var html = "";

  if (S.repo === "all") return '<div class="empty">Select a single target to inspect its criticality model.</div>';

  var confCounts = r.summary.by_confidence || {};
  html += '<div class="grid g4">' +
    tile("Manifest-confirmed", n(confCounts["manifest-confirmed"] || 0), "criticality declared by the asset owner", "safe") +
    tile("Path-heuristic", n(confCounts["path-heuristic"] || 0), "inferred from a keyword, and labelled as such", "high") +
    tile("Unknown", n(confCounts["unknown"] || 0), "ECDAT says so rather than guessing", "") +
    tile("Services declared", n(Object.keys(r.services).length), r.manifest_present ? "from ecdat-manifest.yaml" : "no manifest supplied for this target", r.manifest_present ? "accent" : "") +
    "</div>";

  if (!r.manifest_present) {
    html += '<div class="section-title">No service manifest</div>' +
      '<div class="card"><div class="card-b"><div class="note warn">' +
      "<b>" + esc(r.meta.name) + " is an upstream open-source repository, so no owner has declared what its code protects.</b> " +
      "This is the honest default state, and it is exactly why the manifest exists. Without one, ECDAT falls back to path keywords " +
      "and marks every label <b>path-heuristic</b> — or <b>unknown</b> where even that fails. It never invents a business " +
      "criticality it cannot evidence.<br><br>Switch to <b>Nivesh Financial Services</b> to see the manifest-driven path end to end.</div>";

    var byConf = {};
    r.findings.forEach(function (f) {
      var k = f.criticality.confidence + "|" + (f.criticality.evidence || "");
      byConf[k] = (byConf[k] || 0) + 1;
    });
    var rows = Object.keys(byConf).map(function (k) {
      return { k: k.split("|")[1] || "no signal", v: byConf[k], c: k.indexOf("path-heuristic") === 0 ? "#ff9142" : "#64748b" };
    }).sort(function (a, b) { return b.v - a.v; }).slice(0, 12);
    html += '<div class="sub-h">What the fallback actually matched</div>' + hBars(rows, { wide: true }) + "</div></div>";
    return html;
  }

  /* -- weights -- */
  html += '<div class="section-title">The scoring model — every weight visible and editable</div>';
  html += '<div class="card"><div class="card-b"><div class="grid g4" style="gap:20px">' +
    weightCol("Data classification", D.weights.data_classification, "") +
    weightCol("Business function", D.weights.business_function, "") +
    weightCol("Exposure multiplier", D.weights.exposure, "×") +
    '<div><div class="sub-h">Formula</div><div class="formula">' +
    'criticality =<br>&nbsp;&nbsp;(<b>data</b> <span class="op">+</span> <b>function</b>)<br>&nbsp;&nbsp;<span class="op">×</span> <b>exposure</b></div>' +
    '<div style="font-size:11.5px;color:var(--ink-3);margin-top:11px;line-height:1.55">These live in <code style="font-family:var(--mono)">engine/criticality.py</code>. ' +
    "No model, no opaque score — an auditor can recompute every number by hand.</div></div>" +
    "</div></div></div>";

  /* -- services -- */
  html += '<div class="section-title">Services — what each piece of cryptography actually protects</div>';
  var svcs = Object.keys(r.services).map(function (k) { return r.services[k]; })
    .sort(function (a, b) { return (b.criticality_score || 0) - (a.criticality_score || 0); });

  html += '<div class="grid g3">' + svcs.map(function (s) {
    var w = s.criticality_working || {};
    return '<div class="svc k-' + critTone(s.criticality_bucket) + '">' +
      '<div class="svc-top"><div><div class="svc-nm">' + esc(s.name) + "</div></div>" +
      '<span class="badge b-' + critTone(s.criticality_bucket) + '" style="margin-left:auto">' + esc(s.criticality_bucket || "?") + "</span></div>" +
      '<div class="svc-desc">' + esc(s.description) + "</div>" +
      '<div class="svc-facts">' +
      '<span class="chip">' + esc(s.data_classification) + "</span>" +
      '<span class="chip">' + esc(s.business_function) + "</span>" +
      '<span class="chip">' + esc(s.exposure) + "</span>" +
      "</div>" +
      '<div class="formula" style="font-size:11.5px">(' + w.data_classification_weight + ' <span class="op">+</span> ' + w.business_function_weight +
      ') <span class="op">×</span> ' + w.exposure_multiplier + ' <span class="op">=</span> <span class="res">' + s.criticality_score + "</span></div>" +
      '<div style="display:flex;gap:14px;font-size:11.5px;color:var(--ink-3)">' +
      "<span>findings <b class='mono' style='color:var(--ink)'>" + s.findings + "</b></span>" +
      "<span>vulnerable <b class='mono' style='color:var(--critical)'>" + s.vulnerable_findings + "</b></span>" +
      "<span>peak risk <b class='mono' style='color:var(--ink)'>" + s.max_risk.toFixed(1) + "</b></span></div>" +
      (s.owner ? '<div style="font-family:var(--mono);font-size:10.5px;color:var(--ink-4)">' + esc(s.owner) + "</div>" : "") +
      "</div>";
  }).join("") + "</div>";

  /* -- heatmap -- */
  html += '<div class="section-title">Where the vulnerable cryptography actually lives</div>';
  var algSet = {};
  r.findings.forEach(function (f) {
    if (f.quantum === "shor-broken" || f.quantum === "classically-broken") algSet[f.algorithm] = 1;
  });
  var algList = Object.keys(algSet).sort();
  var grid = {};
  r.findings.forEach(function (f) {
    if (!algSet[f.algorithm]) return;
    var s = f.criticality.service || "(unassigned)";
    grid[s] = grid[s] || {};
    grid[s][f.algorithm] = (grid[s][f.algorithm] || 0) + 1;
  });
  var svcNames = svcs.map(function (s) { return s.name; }).filter(function (nm) { return grid[nm]; });
  var maxCell = 1;
  Object.keys(grid).forEach(function (s) { Object.keys(grid[s]).forEach(function (a) { maxCell = Math.max(maxCell, grid[s][a]); }); });

  html += '<div class="card"><div class="card-b" style="overflow-x:auto"><table class="tbl" style="min-width:640px">' +
    "<thead><tr><th>Service</th>" + algList.map(function (a) {
      var meta = D.algorithms[a] || {};
      return '<th style="text-align:center">' + qDot(meta.quantum || "unknown") + " " + esc(a) + "</th>";
    }).join("") + '<th class="num">Total</th></tr></thead><tbody>';
  html += svcNames.map(function (s) {
    var row = grid[s], tot = 0;
    var cells = algList.map(function (a) {
      var v = row[a] || 0; tot += v;
      if (!v) return '<td style="text-align:center;color:var(--ink-4)">·</td>';
      var alpha = 0.16 + (v / maxCell) * 0.6;
      return '<td style="text-align:center;background:rgba(255,77,109,' + alpha.toFixed(2) + ');font-family:var(--mono);font-weight:700">' + v + "</td>";
    }).join("");
    return '<tr style="cursor:default"><td class="mono">' + esc(s) + "</td>" + cells + '<td class="num">' + tot + "</td></tr>";
  }).join("");
  html += "</tbody></table></div></div>";

  return html;
}

function weightCol(title, obj, suffix) {
  return '<div><div class="sub-h">' + esc(title) + "</div>" +
    Object.keys(obj).map(function (k) {
      return '<div style="display:flex;justify-content:space-between;font-size:12.2px;padding:3.5px 0;border-bottom:1px solid rgba(30,40,54,.55)">' +
        '<span style="color:var(--ink-2)">' + esc(k) + "</span>" +
        '<b class="mono" style="color:var(--accent)">' + (suffix || "") + obj[k] + "</b></div>";
    }).join("") + "</div>";
}

/* ============================================================
   VIEW: Mosca
   ============================================================ */

function moscaZ() { return S.mosca.z != null ? S.mosca.z : (R().threat_horizon_years || 15); }

function viewMosca() {
  var r = R();
  if (S.repo === "all") return '<div class="empty">Select a single target.</div>';
  var Z = moscaZ();

  var html = '<div class="grid g-2-1">';

  /* -- explainer -- */
  html += '<div class="card"><div class="card-h"><h3>Mosca’s inequality</h3>' +
    '<span class="sub">named explicitly in the problem statement</span></div><div class="card-b">' +
    '<div class="formula" style="font-size:14px;text-align:center;padding:16px">' +
    'if &nbsp;<b>X</b> <span class="op">+</span> <b>Y</b> &nbsp;<span class="op">&gt;</span>&nbsp; <b>Z</b>&nbsp; then you are <span class="res">already too late</span></div>' +
    '<div class="grid g3" style="margin-top:14px">' +
    moscaLeg("X", "Data lifetime", "How long this data must stay confidential — or this signature must stay unforgeable.", "#ff9142") +
    moscaLeg("Y", "Migration time", "How long replacing the cryptography realistically takes, including counterparties.", "#56a8f5") +
    moscaLeg("Z", "Threat horizon", "How long until a cryptographically-relevant quantum computer exists. An assumption you set.", "#2fd9a4") +
    "</div>" +
    '<div class="note" style="margin-top:14px"><b>Why this is a slider and not a prediction.</b> Nobody knows when a CRQC arrives. ' +
    "ECDAT refuses to hide that behind a confident-looking number. Z is an assumption the operator owns, it is visible on screen, " +
    "and every verdict below recomputes the moment you move it." +
    (r.horizon_basis ? "<br><br><b>This estate’s basis:</b> " + esc(r.horizon_basis) : "") + "</div>";
  html += "</div></div>";

  /* -- controls -- */
  html += '<div class="card"><div class="card-h"><h3>Threat horizon (Z)</h3></div><div class="card-b">' +
    '<div class="slider-row"><label>Z — years to CRQC</label>' +
    '<input type="range" id="z-slider" min="3" max="35" step="1" value="' + Z + '">' +
    '<span class="rv" id="z-val">' + Z + "y</span></div>" +
    '<div class="pill-row" style="margin-top:6px;flex-wrap:wrap">' +
    [["2030", 4, "NIST deprecates classical PKC"], ["2035", 9, "NIST disallows classical PKC"], ["15y", 15, "estate default"], ["20y", 20, "optimistic"]]
      .map(function (p) { return '<button class="pill' + (Z === p[1] ? " on" : "") + '" data-z="' + p[1] + '" title="' + esc(p[2]) + '">' + p[0] + "</button>"; }).join("") +
    "</div>" +
    '<div id="z-summary" style="margin-top:16px"></div>' +
    "</div></div>";
  html += "</div>";

  if (!r.manifest_present) {
    html += '<div class="section-title">Per-service verdicts</div><div class="card"><div class="card-b"><div class="note warn">' +
      "<b>Mosca needs X and Y, and only the asset owner knows them.</b> " + esc(r.meta.name) +
      " has no service manifest, so no data lifetime or migration estimate has been declared. ECDAT reports this as " +
      "<b>not applicable</b> rather than substituting a default — a fabricated X would make every verdict below meaningless." +
      "<br><br>Switch to <b>Nivesh Financial Services</b> for the full calculation.</div></div></div>";
    return html;
  }

  /* -- per service -- */
  html += '<div class="section-title" id="mosca-verdicts-title">Per-service verdicts — recomputed live</div>';
  html += '<div id="mosca-list"></div>';
  return html;
}

function moscaLeg(sym, name, desc, color) {
  return '<div style="border-left:2px solid ' + color + ';padding-left:11px">' +
    '<div class="mono" style="font-size:17px;font-weight:700;color:' + color + '">' + sym + "</div>" +
    '<div style="font-size:12.4px;font-weight:640;margin:2px 0 4px">' + esc(name) + "</div>" +
    '<div style="font-size:11.5px;color:var(--ink-3);line-height:1.5">' + esc(desc) + "</div></div>";
}

function renderMoscaList() {
  var r = R();
  if (!r.manifest_present) return;
  var Z = moscaZ();
  var svcs = Object.keys(r.services).map(function (k) { return r.services[k]; });

  svcs.forEach(function (s) {
    var o = S.mosca.over[s.name] || {};
    s._x = o.x != null ? o.x : s.data_lifetime_years;
    s._y = o.y != null ? o.y : s.migration_time_years;
    s._sum = (s._x || 0) + (s._y || 0);
    s._gap = +(s._sum - Z).toFixed(1);
    s._exposed = s._sum > Z;
  });
  svcs.sort(function (a, b) { return b._gap - a._gap; });

  var maxScale = Math.max(Z, Math.max.apply(null, svcs.map(function (s) { return s._sum; })), 10) * 1.14;
  var exposed = svcs.filter(function (s) { return s._exposed && s.findings > 0; });

  /* summary */
  var sum = q("z-summary");
  if (sum) {
    var vulnInExposed = exposed.reduce(function (a, s) { return a + s.vulnerable_findings; }, 0);
    sum.innerHTML = exposed.length
      ? '<div class="note crit"><b>' + exposed.length + " of " + svcs.length + " services fail the inequality at Z = " + Z + " years.</b><br>" +
        "That is <b>" + vulnInExposed + " quantum-vulnerable findings</b> in code whose migration should already be under way — " +
        "not scheduled, under way.</div>"
      : '<div class="note ok"><b>Every service clears the inequality at Z = ' + Z + " years.</b><br>Migration remains a planning exercise rather than an active deadline. " +
        "Drag Z left to see which service breaks first.</div>";
  }

  var host = q("mosca-list");
  if (!host) return;

  host.innerHTML = '<div class="grid g2">' + svcs.map(function (s) {
    var xw = s._x / maxScale * 100, yw = s._y / maxScale * 100, zx = Z / maxScale * 100;
    var overStart = Math.max(zx, 0), overEnd = (s._sum / maxScale * 100);
    var ticks = [];
    var step = maxScale > 25 ? 10 : 5;
    for (var i = 0; i <= maxScale; i += step) ticks.push(i);

    return '<div class="card"><div class="card-b">' +
      '<div style="display:flex;align-items:center;gap:9px;margin-bottom:4px">' +
      '<span class="mono" style="font-weight:640;font-size:13.5px">' + esc(s.name) + "</span>" +
      '<span class="badge b-' + critTone(s.criticality_bucket) + '">' + esc(s.criticality_bucket) + "</span>" +
      '<span class="badge ' + (s._exposed ? "b-critical" : "b-safe") + '" style="margin-left:auto">' +
      (s._exposed ? "exposed +" + s._gap.toFixed(0) + "y" : "clear " + Math.abs(s._gap).toFixed(0) + "y") + "</span></div>" +

      '<div style="font-size:11.5px;color:var(--ink-3);margin-bottom:10px">' + esc(s.description) + "</div>" +

      '<div class="mosca-timeline">' +
      '<div class="mosca-seg" style="left:0;width:' + xw + '%;top:14px;background:#ff9142">' + (xw > 12 ? "X = " + s._x + "y" : "") + "</div>" +
      '<div class="mosca-seg" style="left:' + xw + "%;width:" + yw + '%;top:14px;background:#56a8f5">' + (yw > 12 ? "Y = " + s._y + "y" : "") + "</div>" +
      (s._exposed ? '<div class="mosca-over" style="left:' + overStart + "%;width:" + Math.max(overEnd - overStart, 0.6) + '%;top:14px"></div>' : "") +
      '<div class="mosca-z" style="left:' + zx + '%"><span>Z = ' + Z + "y</span></div>" +
      '<div class="mosca-axis"></div>' +
      ticks.map(function (t) { return '<div class="mosca-tick" style="left:' + (t / maxScale * 100) + '%">' + t + "</div>"; }).join("") +
      "</div>" +

      '<div class="slider-row"><label>X · data lifetime</label>' +
      '<input type="range" class="m-x" data-svc="' + esc(s.name) + '" min="0" max="30" value="' + s._x + '">' +
      '<span class="rv">' + s._x + "y</span></div>" +
      '<div class="slider-row"><label>Y · migration time</label>' +
      '<input type="range" class="m-y" data-svc="' + esc(s.name) + '" min="0" max="12" value="' + s._y + '">' +
      '<span class="rv">' + s._y + "y</span></div>" +

      '<div class="formula" style="font-size:11.5px">' + s._x + " <span class=op>+</span> " + s._y +
      " <span class=op>=</span> " + s._sum + " &nbsp;<span class=op>vs</span>&nbsp; Z <span class=op>=</span> " + Z +
      ' &nbsp;→&nbsp; <span class="res" style="color:' + (s._exposed ? "var(--critical)" : "var(--safe)") + '">' +
      (s._exposed ? "exposed by " + s._gap.toFixed(0) + " years" : "clear by " + Math.abs(s._gap).toFixed(0) + " years") + "</span></div>" +

      (s._exposed && s.migration_constraints.length
        ? '<div class="sub-h" style="margin-top:14px">What makes Y this long</div><ul class="checklist">' +
          s.migration_constraints.map(function (c) { return '<li><span class="mk mk-n">!</span>' + esc(c) + "</li>"; }).join("") + "</ul>"
        : "") +

      '<div style="display:flex;gap:14px;font-size:11.5px;color:var(--ink-3);margin-top:12px;padding-top:11px;border-top:1px solid var(--line)">' +
      "<span>findings <b class='mono' style='color:var(--ink)'>" + s.findings + "</b></span>" +
      "<span>quantum-vulnerable <b class='mono' style='color:var(--critical)'>" + s.vulnerable_findings + "</b></span></div>" +
      "</div></div>";
  }).join("") + "</div>";
}

/* ============================================================
   VIEW: Migration Passport
   ============================================================ */

function viewPassport() {
  var B = D.benchmark, env = B.environment;
  var sigs = B.signatures, kex = B.key_exchange, certs = B.certificates;

  function find(list, nm) { for (var i = 0; i < list.length; i++) if (list[i].name === nm) return list[i]; return null; }
  /* Certificate records are keyed on `algorithm`, not `name`. */
  function findCert(nm) { for (var i = 0; i < certs.length; i++) if (certs[i].algorithm === nm && certs[i].issued) return certs[i]; return null; }
  var rsa = find(sigs, "RSA-2048"), mldsa = find(sigs, "ML-DSA-65");
  var ecdh = find(kex, "ECDH-P256"), mlkem = find(kex, "ML-KEM-768");
  var certRsa = findCert("RSA-2048"), certMl = findCert("ML-DSA-65");

  var html = "";

  html += '<div class="card"><div class="card-b"><div class="note">' +
    "<b>Every number on this page was measured on this machine, minutes ago — not quoted from a datasheet.</b> " +
    esc(env.cryptography_version ? "python-cryptography " + env.cryptography_version : "") + " against " + esc(env.openssl) +
    ", which ships NIST-standardised ML-KEM (FIPS 203) and ML-DSA (FIPS 204) natively. " +
    esc(B.method) + "</div></div></div>";

  /* -- headline comparisons -- */
  html += '<div class="section-title">Signing — RSA-2048 → ML-DSA-65</div>';
  if (rsa && mldsa) {
    html += '<div class="card"><div class="card-b"><div class="cmp">' +
      cmpSide("Today", "RSA-2048", [
        ["sign", rsa.sign.median_ms.toFixed(3) + " ms"],
        ["verify", rsa.verify.median_ms.toFixed(3) + " ms"],
        ["signature", rsa.signature_bytes + " B"],
        ["public key", rsa.public_key_bytes + " B"]
      ], "shor-broken") +
      '<div class="cmp-arrow">→</div>' +
      cmpSide("Candidate", "ML-DSA-65", [
        ["sign", mldsa.sign.median_ms.toFixed(3) + " ms", ratio(mldsa.sign.median_ms, rsa.sign.median_ms)],
        ["verify", mldsa.verify.median_ms.toFixed(3) + " ms", ratio(mldsa.verify.median_ms, rsa.verify.median_ms)],
        ["signature", mldsa.signature_bytes + " B", ratio(mldsa.signature_bytes, rsa.signature_bytes)],
        ["public key", mldsa.public_key_bytes + " B", ratio(mldsa.public_key_bytes, rsa.public_key_bytes)]
      ], "quantum-safe") +
      "</div>" +
      '<div class="note ok" style="margin-top:16px"><b>The headline is not speed — it is size.</b> ML-DSA-65 signs only ' +
      ratio(mldsa.sign.median_ms, rsa.sign.median_ms).replace("×", "×") + " the cost of RSA-2048, which is a rounding error in most services. " +
      "But its signature is <b>" + mldsa.signature_bytes + " bytes against " + rsa.signature_bytes + "</b> — " +
      ratio(mldsa.signature_bytes, rsa.signature_bytes) + " larger. Payload size, MTUs, embedded clients and certificate chains are " +
      "what actually break during a PQC migration, and that is the number a migration plan has to budget for.</div></div></div>";
  }

  html += '<div class="section-title">Key establishment — ECDH-P256 → ML-KEM-768</div>';
  if (ecdh && mlkem) {
    html += '<div class="card"><div class="card-b"><div class="cmp">' +
      cmpSide("Today", "ECDH-P256", [
        ["full exchange", ecdh.operation.median_ms.toFixed(3) + " ms"],
        ["public key", ecdh.public_key_bytes + " B"],
        ["ciphertext", "—"],
        ["shared secret", ecdh.shared_secret_bytes + " B"]
      ], "shor-broken") +
      '<div class="cmp-arrow">→</div>' +
      cmpSide("Candidate", "ML-KEM-768", [
        ["full exchange", mlkem.operation.median_ms.toFixed(3) + " ms", ratio(mlkem.operation.median_ms, ecdh.operation.median_ms)],
        ["public key", mlkem.public_key_bytes + " B", ratio(mlkem.public_key_bytes, ecdh.public_key_bytes)],
        ["ciphertext", mlkem.ciphertext_bytes + " B"],
        ["shared secret", mlkem.shared_secret_bytes + " B"]
      ], "quantum-safe") + "</div>";

    var p384 = find(kex, "ECDH-P384");
    if (p384) {
      html += '<div class="note" style="margin-top:16px"><b>An honest surprise worth showing a jury.</b> ' +
        "ML-KEM-768 completes a full key establishment in <b>" + mlkem.operation.median_ms.toFixed(3) + " ms</b>, against <b>" +
        p384.operation.median_ms.toFixed(3) + " ms</b> for ECDH-P384 on this same machine. " +
        "Post-quantum is not universally slower — at comparable security levels ML-KEM is <b>" +
        (p384.operation.median_ms / mlkem.operation.median_ms).toFixed(1) + "× faster</b> here. It costs bytes, not cycles.</div>";
    }
    html += "</div></div>";
  }

  /* -- full tables -- */
  html += '<div class="section-title">Full measurement set</div>';
  html += '<div class="grid g2">';
  html += '<div class="card"><div class="card-h"><h3>Signature algorithms</h3><span class="right">median of ' + (rsa ? rsa.sign.samples : "n") + "+ samples</span></div>" +
    '<div class="card-b flush"><table class="tbl"><thead><tr><th>Algorithm</th><th class="num">Sign</th><th class="num">Verify</th><th class="num">Sig</th><th class="num">Pub key</th></tr></thead><tbody>' +
    sigs.map(function (s) {
      return '<tr style="cursor:default">' +
        "<td>" + qDot(s.quantum) + ' <span class="mono">' + esc(s.name) + "</span>" +
        (s.standard ? ' <span class="badge b-pqc">' + esc(s.standard) + "</span>" : "") + "</td>" +
        '<td class="num">' + s.sign.median_ms.toFixed(3) + "</td>" +
        '<td class="num">' + s.verify.median_ms.toFixed(3) + "</td>" +
        '<td class="num">' + n(s.signature_bytes) + "</td>" +
        '<td class="num">' + n(s.public_key_bytes) + "</td></tr>";
    }).join("") + "</tbody></table></div></div>";

  html += '<div class="card"><div class="card-h"><h3>Key establishment</h3></div>' +
    '<div class="card-b flush"><table class="tbl"><thead><tr><th>Algorithm</th><th class="num">Full op</th><th class="num">Pub key</th><th class="num">Ciphertext</th></tr></thead><tbody>' +
    kex.map(function (s) {
      return '<tr style="cursor:default">' +
        "<td>" + qDot(s.quantum) + ' <span class="mono">' + esc(s.name) + "</span>" +
        (s.standard ? ' <span class="badge b-pqc">' + esc(s.standard) + "</span>" : "") + "</td>" +
        '<td class="num">' + s.operation.median_ms.toFixed(3) + "</td>" +
        '<td class="num">' + n(s.public_key_bytes) + "</td>" +
        '<td class="num">' + (s.ciphertext_bytes ? n(s.ciphertext_bytes) : "—") + "</td></tr>";
    }).join("") + "</tbody></table></div></div>";
  html += "</div>";

  /* -- certificate size, the real blocker -- */
  html += '<div class="section-title">Certificate size — the constraint that actually breaks TLS</div>';
  var issued = certs.filter(function (c) { return c.issued; });
  var maxCert = Math.max.apply(null, issued.map(function (c) { return c.certificate_bytes; }));
  html += '<div class="card"><div class="card-b">' +
    '<div style="font-size:12.6px;color:var(--ink-2);margin-bottom:14px;line-height:1.6">' +
    "ECDAT issues a <b>real X.509 certificate</b> under each candidate algorithm and weighs it. " +
    "These are not estimates — the certificates were built and DER-encoded during this run.</div>" +
    '<div style="display:flex;flex-direction:column;gap:9px">' +
    issued.map(function (c) {
      var isPqc = c.algorithm.indexOf("ML-DSA") === 0;
      return '<div class="hbar-wrap"><span class="mono" style="width:104px;font-size:11.5px;color:' + (isPqc ? "var(--pqc)" : "var(--ink-2)") + '">' + esc(c.algorithm) + "</span>" +
        '<div class="hbar"><i style="width:' + (c.certificate_bytes / maxCert * 100) + "%;background:" + (isPqc ? "linear-gradient(90deg,#7c4ddb,#a78bfa)" : "linear-gradient(90deg,#1d64c4,#4da3ff)") + '"></i>' +
        "<b>" + n(c.certificate_bytes) + " B" + (certRsa ? '  <span style="color:var(--ink-3);font-weight:500">' + (c.certificate_bytes / certRsa.certificate_bytes).toFixed(1) + "×</span>" : "") + "</b></div></div>";
    }).join("") + "</div>";

  if (certRsa && certMl) {
    var chainRsa = certRsa.certificate_bytes * 3, chainMl = certMl.certificate_bytes * 3;
    var ICW = 14600;
    html += '<div class="note ' + (chainMl > ICW ? "warn" : "ok") + '" style="margin-top:18px">' +
      "<b>What this costs on the wire.</b> A typical TLS chain sends three certificates (leaf, intermediate, cross-sign). " +
      "At RSA-2048 that is <b>" + n(chainRsa) + " bytes</b>; at ML-DSA-65 it becomes <b>" + n(chainMl) + " bytes</b>. " +
      "TCP's initial congestion window is about <b>" + n(ICW) + " bytes</b> (10 × MSS). " +
      (chainMl > ICW
        ? "The post-quantum chain <b>overflows it</b>, so the handshake needs an extra round trip before any application data moves — " +
          "on a 60 ms link that is 60 ms added to every fresh connection. This is a real, budgetable consequence, and it is why " +
          "certificate size, not signing speed, drives PQC migration planning."
        : "The post-quantum chain still fits, so no extra round trip is incurred.") + "</div>";
  }
  html += "</div></div>";

  /* -- the passport record -- */
  var r = D.repos["nivesh-core"];
  var pay = r && r.services["payment-api"];
  if (pay && rsa && mldsa && ecdh && mlkem && certRsa && certMl) {
    var passport = {
      service: "payment-api",
      scanned_evidence: {
        findings: pay.findings,
        quantum_vulnerable: pay.vulnerable_findings,
        algorithms: pay.algorithms
      },
      current: { signature: "RSA-2048", key_exchange: "ECDH-P256" },
      candidate: { signature: "ML-DSA-65 (FIPS 204)", key_exchange: "ML-KEM-768 (FIPS 203)" },
      measured: {
        sign_ms: { before: rsa.sign.median_ms, after: mldsa.sign.median_ms },
        verify_ms: { before: rsa.verify.median_ms, after: mldsa.verify.median_ms },
        key_exchange_ms: { before: ecdh.operation.median_ms, after: mlkem.operation.median_ms },
        signature_bytes: { before: rsa.signature_bytes, after: mldsa.signature_bytes },
        certificate_bytes: { before: certRsa.certificate_bytes, after: certMl.certificate_bytes }
      },
      blockers: pay.migration_constraints,
      next_action: "Pilot ML-DSA-65 signing on the staging settlement path; re-measure with the HSM in the loop before any rollout.",
      scope_limits: [
        "Measured on one machine, one software stack (" + env.openssl + ").",
        "Algorithm-level measurement. No end-to-end TLS handshake against a live counterparty was performed.",
        "HSM firmware support for ML-DSA is unverified and is the binding constraint, not these timings."
      ],
      evidence: {
        environment: env.platform + " / " + env.machine,
        library: "python-cryptography " + env.cryptography_version,
        generated_at: D.generated_at
      }
    };
    html += '<div class="section-title">Migration Passport — payment-api</div>';
    html += '<div class="card"><div class="card-h"><h3>Machine-readable record</h3>' +
      '<span class="sub">what a security lead hands to the platform team</span>' +
      (CAN_DOWNLOAD ? '<span class="right"><button class="pill" id="dl-passport">download .json</button></span>' : "") + "</div>" +
      '<div class="card-b"><div class="codeblock" style="max-height:440px;overflow:auto">' + esc(JSON.stringify(passport, null, 2)) + "</div>" +
      '<div class="note warn" style="margin-top:14px"><b>Note the <code>scope_limits</code> block.</b> ' +
      "It is part of the record, not a disclaimer bolted on afterwards. A migration passport that overstates its own scope is worse " +
      "than none at all — it produces confident decisions from a single-machine microbenchmark.</div></div></div>";
    window.__passport = passport;
  }

  /* -- environment -- */
  html += '<div class="section-title">Measurement environment</div>';
  html += '<div class="card"><div class="card-b"><dl class="kv">' +
    Object.keys(env).map(function (k) {
      return "<dt>" + esc(titleCase(k)) + '</dt><dd class="mono">' + esc(String(env[k])) + "</dd>";
    }).join("") + "</dl></div></div>";

  return html;
}

function cmpSide(lab, alg, rows, qstat) {
  return '<div class="cmp-side"><div class="lab">' + esc(lab) + "</div>" +
    '<div class="alg">' + qDot(qstat) + " " + esc(alg) + "</div>" +
    rows.map(function (r) {
      return '<div style="display:flex;align-items:baseline;gap:8px;font-size:12.3px;padding:3.5px 0;border-top:1px solid rgba(30,40,54,.6)">' +
        '<span style="color:var(--ink-4)">' + esc(r[0]) + "</span>" +
        '<b class="mono" style="margin-left:auto">' + esc(r[1]) + "</b>" +
        (r[2] ? '<span class="delta ' + (/less/.test(r[2]) ? "down" : "up") + '">' + esc(r[2]) + "</span>" : "") +
        "</div>";
    }).join("") + "</div>";
}
/* a relative to b: ">1×" means the candidate costs more, "× less" means it costs less. */
function ratio(a, b) { var v = a / b; return (v >= 1 ? v.toFixed(1) + "×" : (1 / v).toFixed(1) + "× less"); }

/* ============================================================
   VIEW: CBOM
   ============================================================ */

function viewCbom() {
  if (S.repo === "all") return '<div class="empty">Select a single target to export its CBOM.</div>';
  var r = R(), bom = r.cbom;
  var byType = {};
  bom.components.forEach(function (c) {
    var t = c.type === "library" ? "library" : (c.cryptoProperties && c.cryptoProperties.assetType) || "other";
    byType[t] = (byType[t] || 0) + 1;
  });

  var html = '<div class="grid g4">' +
    tile("CBOM components", n(bom.components.length), "CycloneDX " + bom.specVersion + " cryptographic-asset records", "accent") +
    tile("Algorithms", n(byType.algorithm || 0), "each with every occurrence and its evidence", "") +
    tile("Certificates", n(byType.certificate || 0), "parsed from real X.509 files on disk", "") +
    tile("Crypto libraries", n(byType.library || 0), "from requirements.txt and pom.xml", "") +
    "</div>";

  html += '<div class="section-title">Why the standard format matters</div>';
  html += '<div class="card"><div class="card-b"><div class="note">' +
    "<b>CycloneDX 1.6 added the <code>cryptographic-asset</code> component type in 2024, specifically for this job.</b> " +
    "Emitting the standard rather than a bespoke JSON shape is what lets a CBOM flow into an organisation's existing " +
    "SBOM tooling, vulnerability management and procurement checks. It is also what the problem statement means by " +
    "<i>catalogue all cryptographic artefacts</i> — a catalogue nobody else can read is not a catalogue." +
    "</div></div></div>";

  html += '<div class="section-title">Components</div>';
  var algs = bom.components.filter(function (c) { return c.cryptoProperties && c.cryptoProperties.assetType === "algorithm"; });
  html += '<div class="card"><div class="card-b flush"><table class="tbl"><thead><tr>' +
    "<th>Component</th><th>Primitive</th><th>Quantum status</th><th class='num'>Occurrences</th><th>Recommended replacement</th>" +
    "</tr></thead><tbody>" + algs.map(function (c) {
      function prop(nm) { for (var i = 0; i < c.properties.length; i++) if (c.properties[i].name === nm) return c.properties[i].value; return null; }
      var qs = prop("ecdat:quantum_status");
      return '<tr style="cursor:default"><td>' + qDot(qs) + ' <span class="mono">' + esc(c.name) + "</span></td>" +
        '<td class="dim">' + esc(c.cryptoProperties.algorithmProperties.primitive) + "</td>" +
        "<td>" + esc(Q_LABEL[qs] || qs) + "</td>" +
        '<td class="num">' + esc(prop("ecdat:occurrences")) + "</td>" +
        '<td class="dim" style="font-size:11.5px">' + esc(prop("ecdat:recommended_replacement") || "—") + "</td></tr>";
    }).join("") + "</tbody></table></div></div>";

  html += '<div class="section-title">Raw CycloneDX document</div>';
  html += '<div class="card"><div class="card-h"><h3>' + esc(bom.metadata.component.name) + "</h3>" +
    (CAN_DOWNLOAD ? '<span class="right"><button class="pill" id="dl-cbom">download cbom.json</button></span>' : "") + "</div>" +
    '<div class="card-b"><div class="codeblock" style="max-height:520px;overflow:auto">' +
    esc(JSON.stringify(bom, null, 2).slice(0, 24000)) + (JSON.stringify(bom).length > 24000 ? "\n\n… truncated for display; the download contains the full document." : "") +
    "</div></div></div>";

  return html;
}

/* ============================================================
   VIEW: Method
   ============================================================ */

function viewMethod() {
  var t = D.totals;
  /* Method describes the whole run, so these totals span every target, not the selected one. */
  var triagedTotal = REPO_IDS.reduce(function (a, id) { return a + (D.repos[id].telemetry.triaged_out || 0); }, 0);
  var html = '<div class="grid g2">';

  html += '<div class="card"><div class="card-h"><h3>How a finding is produced</h3></div><div class="card-b"><div class="prose">' +
    "<p>Four stages, cheapest first. Nothing is sent anywhere; there is no model in the detection path.</p>" +
    "<h4>1 &middot; Triage</h4><p>Every file is checked for a set of literal substrings that any crypto call must contain. " +
    "Across this run <b>" + n(t.source_files) + "</b> source files were opened and <b>" + n(triagedTotal) +
    "</b> of them (" + pct(triagedTotal, t.source_files) + "%) were eliminated here, before any parsing.</p>" +
    "<h4>2 &middot; Rules</h4><p><b>" + D.rule_count + "</b> compiled patterns locate candidate call sites across Python, Java and configuration. " +
    "Where a call declares its own algorithm — <code>Signature.getInstance(\"SHA256withRSA\")</code>, or a TLS suite name — " +
    "that string is decoded rather than guessed at.</p>" +
    "<h4>3 &middot; Parameter resolution</h4><p>Only files that produced a hit are parsed further. Python goes through the " +
    "<code>ast</code> module to recover concrete arguments — <code>key_size=2048</code>, <code>ec.SECP256R1()</code> — and the " +
    "enclosing function name. Java gets a bounded look-around for the matching <code>initialize(2048)</code>.</p>" +
    "<h4>4 &middot; Classification</h4><p>The algorithm is looked up in a table of <b>" + Object.keys(D.algorithms).length +
    "</b> primitives that records how Shor's and Grover's algorithms affect each one. Business criticality comes from the " +
    "service manifest. Risk combines the two.</p>" +
    "</div></div></div>";

  html += '<div class="card"><div class="card-h"><h3>What is real, and what is staged</h3></div><div class="card-b"><div class="prose">' +
    "<p>A prototype that blurs this line cannot be trusted on anything else, so it is stated plainly.</p>" +
    "<h4>Real</h4><ul class='checklist'>" +
    ck(true, "<b>" + n(t.source_files) + " source files</b> from paramiko, JJWT and Django, cloned unmodified from upstream and scanned here.") +
    ck(true, "<b>" + n(t.findings) + " findings</b>, each carrying a file, line, column and the source text that matched.") +
    ck(true, "<b>" + n(t.certificates) + " X.509 certificates</b> parsed from disk — real key sizes, real Key Usage flags, real expiry.") +
    ck(true, "<b>Every benchmark number</b>, measured with OpenSSL's native ML-KEM and ML-DSA during this run.") +
    ck(true, "<b>Scan timings</b> including the " + t.incremental_speedup + "× incremental speedup, measured back to back.") +
    "</ul><h4>Staged for the demonstration</h4><ul class='checklist'>" +
    ck(false, "<b>Nivesh Financial Services is fictional.</b> Its code, certificates and configuration are real files that were really scanned — but the organisation, and the manifest describing it, were written for this demonstration.") +
    ck(false, "<b>The service manifest is filled in by hand.</b> In production it would come from a CMDB or asset registry. That integration does not exist yet.") +
    ck(false, "<b>No live TLS handshake.</b> The passport measures algorithms directly. A full sandboxed handshake against an oqs-provider endpoint is the next step, not a claim made today.") +
    "</ul></div></div></div>";
  html += "</div>";

  html += '<div class="section-title">Limitations we will state before a jury asks</div>';
  html += '<div class="grid g3">';
  [
    ["Static analysis has a ceiling", "Algorithm names built at runtime, reflection, and dynamically loaded providers are invisible to this approach. ECDAT reports what it can evidence and marks the rest unknown."],
    ["Two languages, not all of them", "Python and Java are supported, plus TLS configuration and X.509. Go, C/C++, JavaScript and compiled binaries are out of scope for this prototype and are not implied to work."],
    ["A dependency is not a usage", "Finding <code>cryptography</code> in requirements.txt proves it is installed, not that RSA is reachable in production. Dependency evidence is kept separate from call-site evidence for exactly this reason."],
    ["Criticality is only as good as its manifest", "With no manifest, ECDAT degrades to path keywords and says so. It never manufactures a business criticality it cannot trace to a declaration."],
    ["Z is an assumption, not a forecast", "ECDAT does not predict when a quantum computer will break RSA. It makes the assumption explicit, adjustable, and visible in every verdict."],
    ["One machine, one stack", "The benchmark reflects this laptop and this OpenSSL build. An HSM, a different CPU, or a constrained device will produce different numbers — which is why the passport records its own environment."]
  ].map(function (p) {
    html += '<div class="card"><div class="card-b">' +
      '<div style="font-size:13px;font-weight:640;margin-bottom:7px">' + p[0] + "</div>" +
      '<div style="font-size:12.2px;color:var(--ink-3);line-height:1.6">' + p[1] + "</div></div></div>";
  });
  html += "</div>";

  html += '<div class="section-title">Standards and sources this is built on</div>';
  html += '<div class="card"><div class="card-b"><div class="grid g2" style="gap:22px">' +
    srcCol("Cryptographic standards", [
      ["FIPS 203", "ML-KEM — module-lattice key encapsulation"],
      ["FIPS 204", "ML-DSA — module-lattice digital signatures"],
      ["FIPS 205", "SLH-DSA — stateless hash-based signatures"],
      ["NIST IR 8547", "Transition to post-quantum standards: deprecate classical PKC by 2030, disallow by 2035"],
      ["NIST SP 800-57", "Key-management minimums used for the certificate checks"]
    ]) +
    srcCol("Formats and references", [
      ["CycloneDX 1.6", "The CBOM format emitted, including cryptographic-asset"],
      ["RFC 5280", "X.509 Key Usage flags, read directly rather than inferred"],
      ["RFC 8996", "Deprecation of TLS 1.0 and 1.1"],
      ["RFC 7465", "Prohibition of RC4 in TLS"],
      ["Mosca (2015)", "The X + Y > Z threat-horizon inequality"]
    ]) +
    "</div></div></div>";

  return html;
}
function ck(ok, txt) { return '<li><span class="mk ' + (ok ? "mk-y" : "mk-n") + '">' + (ok ? "✓" : "!") + "</span><span>" + txt + "</span></li>"; }
function srcCol(title, rows) {
  return "<div><div class='sub-h'>" + esc(title) + "</div>" + rows.map(function (r) {
    return '<div style="display:flex;gap:12px;padding:7px 0;border-bottom:1px solid rgba(30,40,54,.55);font-size:12.3px">' +
      '<b class="mono" style="flex:0 0 116px;color:var(--accent);font-size:11.5px">' + esc(r[0]) + "</b>" +
      '<span style="color:var(--ink-3);line-height:1.5">' + esc(r[1]) + "</span></div>";
  }).join("") + "</div>";
}

/* ============================================================
   Drawer
   ============================================================ */

function openFinding(repoId, fid) {
  var repo = D.repos[repoId];
  var f = null;
  for (var i = 0; i < repo.findings.length; i++) if (repo.findings[i].id === fid) { f = repo.findings[i]; break; }
  if (!f) return;
  S.selected = fid;

  var c = f.criticality, m = f.mosca, rk = f.risk;
  var meta = D.algorithms[f.algorithm] || {};

  q("drawer-h").innerHTML =
    "<div>" + qDot(f.quantum) + "<h2 style='display:inline;margin-left:7px'>" + esc(f.label) + "</h2>" +
    '<div style="display:flex;gap:6px;margin-top:8px;flex-wrap:wrap">' + riskBadge(rk.bucket) +
    '<span class="badge b-muted">' + esc(titleCase(f.function)) + "</span>" +
    '<span class="badge b-muted">' + esc(f.language) + "</span>" +
    (f.nist_standard ? '<span class="badge b-pqc">' + esc(f.nist_standard) + "</span>" : "") + "</div></div>" +
    '<button class="x-btn" onclick="window.__closeDrawer()">×</button>';

  var h = "";

  /* evidence */
  h += '<div class="sub-h">Evidence</div>';
  h += '<div class="codeblock"><span class="gut">' + esc(f.file) + ":" + f.line + ":" + f.col + "</span>\n\n" +
    '<span class="gut">' + String(f.line).padStart(4, " ") + " │</span> " + hilite(f.snippet, f.match) + "</div>";
  h += '<dl class="kv" style="margin-top:12px">' +
    "<dt>Rule</dt><dd class='mono'>" + esc(f.rule_id) + "</dd>" +
    "<dt>Matched</dt><dd class='mono'>" + esc(f.match) + "</dd>" +
    (f.symbol ? "<dt>Enclosing symbol</dt><dd class='mono'>" + esc(f.symbol) + "</dd>" : "") +
    (f.extra && f.extra.key_size ? "<dt>Key size</dt><dd class='mono'>" + f.extra.key_size + " bits" + (f.extra.curve ? " (" + esc(f.extra.curve) + ")" : "") + "</dd>" : "") +
    (f.extra && f.extra.mode ? "<dt>Mode</dt><dd class='mono'>" + esc(f.extra.mode) + "</dd>" : "") +
    (f.extra && f.extra.digest ? "<dt>Digest</dt><dd class='mono'>" + esc(f.extra.digest) + "</dd>" : "") +
    (f.extra && f.extra.suites ? "<dt>Cipher suites</dt><dd class='mono' style='font-size:11px'>" + esc(f.extra.suites.join(", ")) + "</dd>" : "") +
    (f.extra && f.extra.protocol ? "<dt>Protocol</dt><dd class='mono'>" + esc(f.extra.protocol) + "</dd>" : "") +
    (f.role ? "<dt>Role in suite</dt><dd>" + esc(f.role) + "</dd>" : "") +
    "</dl>";

  if (f.extra && f.extra.weak_protocols && f.extra.weak_protocols.length) {
    h += '<div class="note crit" style="margin-top:12px"><b>Deprecated protocol versions enabled</b><br>' +
      f.extra.weak_protocols.map(function (w) { return "<b>" + esc(w.version) + "</b> — " + esc(w.reason); }).join("<br>") + "</div>";
  }

  /* quantum */
  h += '<div class="sub-h">Quantum assessment</div>';
  h += '<div class="note ' + (f.quantum === "quantum-safe" ? "ok" : f.quantum === "grover-reduced" ? "warn" : "crit") + '">' +
    "<b>" + esc(Q_LABEL[f.quantum] || f.quantum) + ".</b> " + esc(meta.note || "") +
    (meta.replacement ? "<br><br><b>Recommended replacement:</b> " + esc(meta.replacement) : "") + "</div>";

  /* criticality */
  h += '<div class="sub-h">Business criticality &mdash; where this number comes from</div>';
  h += '<div style="display:flex;gap:8px;margin-bottom:11px;flex-wrap:wrap">' +
    '<span class="badge b-' + critTone(c.bucket) + '">' + esc(c.bucket) + "</span>" + confBadge(c.confidence) + "</div>";
  h += '<div class="note" style="margin-bottom:11px"><b>Evidence:</b> ' + esc(c.evidence) + "</div>";
  h += '<div class="formula">' +
    "data <b>" + esc(c.data_classification) + '</b> <span class="op">=</span> ' + c.working.data_classification_weight + "<br>" +
    "function <b>" + esc(c.business_function) + '</b> <span class="op">=</span> ' + c.working.business_function_weight + "<br>" +
    "exposure <b>" + esc(c.exposure) + '</b> <span class="op">=</span> ×' + c.working.exposure_multiplier + "<br>" +
    '<span class="op">──────────────────────</span><br>' +
    "(" + c.working.data_classification_weight + " + " + c.working.business_function_weight + ") × " +
    c.working.exposure_multiplier + ' <span class="op">=</span> <span class="res">' + c.score + "</span></div>";
  if (c.service) {
    h += '<dl class="kv" style="margin-top:11px"><dt>Service</dt><dd class="mono">' + esc(c.service) + "</dd>" +
      (c.owner ? "<dt>Owner</dt><dd class='mono'>" + esc(c.owner) + "</dd>" : "") + "</dl>";
  }

  /* mosca */
  h += '<div class="sub-h">Mosca horizon</div>';
  if (m && m.applicable) {
    h += '<div class="formula">X <span class="op">=</span> <b>' + m.x + "</b>y &nbsp; + &nbsp; Y <span class='op'>=</span> <b>" + m.y + "</b>y" +
      " &nbsp;<span class='op'>=</span>&nbsp; <b>" + m.x_plus_y + "</b>y &nbsp;<span class='op'>vs</span>&nbsp; Z <span class='op'>=</span> <b>" + m.z + "</b>y<br>" +
      '<span class="res" style="color:' + (m.exposed ? "var(--critical)" : "var(--safe)") + '">' + esc(m.verdict) + "</span></div>";
  } else {
    h += '<div class="note">Not applicable — ' + esc((m && m.reason) || "no lifetime declared") + ".</div>";
  }

  /* risk */
  h += '<div class="sub-h">Risk score</div>';
  h += '<div class="formula">' +
    "quantum urgency <b>" + rk.quantum_urgency + "</b> &nbsp;×&nbsp; criticality factor <b>" + rk.criticality_factor + "</b> &nbsp;×&nbsp; 2 " +
    '<span class="op">=</span> ' + rk.base + "<br>" +
    "Mosca pressure <span class='op'>+</span> <b>" + rk.mosca_pressure + "</b><br>" +
    '<span class="op">──────────────────────</span><br>' +
    '<span class="res">' + rk.score + "</span> → " + esc(rk.bucket) + "</div>";
  h += '<div style="font-size:11.5px;color:var(--ink-4);margin-top:9px;font-family:var(--mono)">' + esc(rk.formula) + "</div>";

  q("drawer-b").innerHTML = h;
  q("drawer").classList.add("open");
  q("scrim").classList.add("open");
  render();
}

function hilite(snippet, match) {
  var s = esc(snippet || ""), m = esc(match || "");
  if (!m) return s;
  var i = s.indexOf(m);
  if (i < 0) return s;
  return s.slice(0, i) + '<span class="hl">' + m + "</span>" + s.slice(i + m.length);
}

window.__closeDrawer = function () {
  q("drawer").classList.remove("open");
  q("scrim").classList.remove("open");
  S.selected = null;
  render();
};

/* ============================================================
   Download helper
   ============================================================ */

function download(name, text) {
  var blob = new Blob([text], { type: "application/json" });
  var a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a); a.click();
  setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 400);
}

/* ============================================================
   Router + render
   ============================================================ */

var VIEWS = {
  overview: { t: "Command Centre", c: "Cryptographic posture across every scanned target", f: viewOverview },
  inventory: { t: "Cryptographic Inventory", c: "Every finding, with the source evidence that produced it", f: viewInventory },
  criticality: { t: "Business Criticality", c: "What each piece of cryptography actually protects", f: viewCriticality },
  mosca: { t: "Mosca Threat Horizon", c: "X + Y > Z — which services are already past the line", f: viewMosca },
  passport: { t: "Migration Passport", c: "Measured cost of moving to ML-KEM and ML-DSA", f: viewPassport },
  cbom: { t: "CBOM Export", c: "CycloneDX 1.6 cryptographic bill of materials", f: viewCbom },
  method: { t: "Method & Limits", c: "How findings are produced, and what this prototype does not do", f: viewMethod }
};

function render() {
  var v = VIEWS[S.view] || VIEWS.overview;
  q("tb-title").textContent = v.t;
  q("tb-crumb").textContent = v.c;

  Array.prototype.forEach.call(document.querySelectorAll("#nav a"), function (a) {
    a.classList.toggle("on", a.getAttribute("data-v") === S.view);
  });
  q("nc-inv").textContent = n(allFindings().length);

  q("page").innerHTML = v.f();
  if (S.view === "mosca") renderMoscaList();
  wire();
}

function renderRepoSwitch() {
  var html = REPO_IDS.map(function (id) {
    var r = D.repos[id];
    return '<button data-repo="' + id + '"' + (S.repo === id ? ' class="on"' : "") + '>' +
      esc(r.meta.name) + (r.meta.kind === "demo-estate" ? '<span class="tag">manifest</span>' : "") + "</button>";
  }).join("");
  html += '<button data-repo="all"' + (S.repo === "all" ? ' class="on"' : "") + ">All targets</button>";
  q("repo-switch").innerHTML = html;
}

function wire() {
  /* rows -> drawer */
  Array.prototype.forEach.call(document.querySelectorAll("tr[data-fid]"), function (tr) {
    tr.onclick = function () { openFinding(tr.getAttribute("data-repo"), tr.getAttribute("data-fid")); };
  });

  /* sorting */
  Array.prototype.forEach.call(document.querySelectorAll("th[data-sort]"), function (th) {
    th.onclick = function () {
      var k = th.getAttribute("data-sort");
      if (S.sort.key === k) S.sort.dir *= -1; else { S.sort.key = k; S.sort.dir = -1; }
      render();
    };
  });

  /* filters */
  var s = q("f-search");
  if (s) {
    s.oninput = function () {
      S.filters.search = s.value;
      var pos = s.selectionStart;
      render();
      var ns = q("f-search"); if (ns) { ns.focus(); ns.setSelectionRange(pos, pos); }
    };
  }
  [["f-alg", "algorithm"], ["f-fn", "fn"], ["f-conf", "conf"]].forEach(function (p) {
    var e = q(p[0]);
    if (e) e.onchange = function () { S.filters[p[1]] = e.value; render(); };
  });
  Array.prototype.forEach.call(document.querySelectorAll("[data-risk]"), function (b) {
    b.onclick = function () { S.filters.risk = b.getAttribute("data-risk"); render(); };
  });

  /* mosca */
  var z = q("z-slider");
  if (z) {
    z.oninput = function () {
      S.mosca.z = +z.value;
      q("z-val").textContent = z.value + "y";
      Array.prototype.forEach.call(document.querySelectorAll("[data-z]"), function (b) {
        b.classList.toggle("on", +b.getAttribute("data-z") === S.mosca.z);
      });
      renderMoscaList(); wireMoscaSliders();
    };
  }
  Array.prototype.forEach.call(document.querySelectorAll("[data-z]"), function (b) {
    b.onclick = function () {
      S.mosca.z = +b.getAttribute("data-z");
      var zz = q("z-slider"); if (zz) zz.value = S.mosca.z;
      var zv = q("z-val"); if (zv) zv.textContent = S.mosca.z + "y";
      Array.prototype.forEach.call(document.querySelectorAll("[data-z]"), function (x) {
        x.classList.toggle("on", +x.getAttribute("data-z") === S.mosca.z);
      });
      renderMoscaList(); wireMoscaSliders();
    };
  });
  wireMoscaSliders();

  /* downloads */
  var dc = q("dl-cbom");
  if (dc) dc.onclick = function () { download("cbom-" + S.repo + ".json", JSON.stringify(R().cbom, null, 2)); };
  var dp = q("dl-passport");
  if (dp) dp.onclick = function () { download("migration-passport-payment-api.json", JSON.stringify(window.__passport, null, 2)); };
}

function wireMoscaSliders() {
  Array.prototype.forEach.call(document.querySelectorAll(".m-x,.m-y"), function (inp) {
    inp.oninput = function () {
      var svc = inp.getAttribute("data-svc");
      S.mosca.over[svc] = S.mosca.over[svc] || {};
      S.mosca.over[svc][inp.className.indexOf("m-x") >= 0 ? "x" : "y"] = +inp.value;
      renderMoscaList(); wireMoscaSliders();
    };
  });
}

function route() {
  var h = (location.hash || "#/overview").replace("#/", "");
  if (!VIEWS[h]) h = "overview";
  S.view = h;
  render();
}

/* ---------------- boot ---------------- */

Array.prototype.forEach.call(document.querySelectorAll(".ico"), function (e) {
  e.innerHTML = icon(e.getAttribute("data-i"));
});

q("foot-ver").textContent = D.ecdat_version;
q("foot-env").textContent = D.environment.platform + " · python " + D.environment.python;
q("tb-stamp").innerHTML = "scan " + esc(D.generated_at.slice(0, 10)) + "<br>" +
  n(D.totals.source_files) + " files · " + n(D.totals.findings) + " findings";

q("repo-switch").onclick = function (e) {
  var b = e.target.closest("button[data-repo]");
  if (!b) return;
  S.repo = b.getAttribute("data-repo");
  S.mosca = { z: null, over: {} };
  renderRepoSwitch();
  render();
};

q("scrim").onclick = window.__closeDrawer;
document.addEventListener("keydown", function (e) { if (e.key === "Escape") window.__closeDrawer(); });
window.addEventListener("hashchange", route);

renderRepoSwitch();
route();

})();
