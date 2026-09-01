"""
ECDAT scan orchestrator.

Runs the full pipeline over every configured target and writes the dataset the
dashboard reads:

    scan -> classify function -> classify criticality -> Mosca -> risk score
         -> certificates -> dependencies -> CBOM -> benchmark -> ui/data.js

The dashboard is a static file. It reads `ui/data.js`, which this script
produces. Nothing in the UI calls out to a network, which is the point: the
whole tool runs air-gapped.
"""

import collections
import datetime
import json
import os
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import artefacts
import bench
import cbom
import criticality as crit
import rules
import scanner

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
TARGETS = os.path.join(ROOT, "targets")
DATA = os.path.join(ROOT, "data")
UI = os.path.join(ROOT, "ui")

NOW = datetime.datetime(2026, 8, 31, tzinfo=datetime.timezone.utc)

REPOS = [
    dict(id="nivesh-core", name="Nivesh Financial Services",
         kind="demo-estate",
         description="A six-service financial estate with a completed ECDAT service manifest. "
                     "Every criticality label here traces to a declared manifest entry.",
         manifest="ecdat-manifest.yaml",
         upstream=None,
         note="Purpose-built for this demonstration so that the manifest-driven criticality and "
              "Mosca layers can be shown end to end. The code, certificates and configuration are real "
              "and really scanned -- but the organisation is fictional."),
    dict(id="paramiko", name="paramiko",
         kind="real-oss",
         description="Pure-Python SSHv2 implementation. Dense in host-key, user-key and "
                     "key-exchange cryptography -- and already shipping a post-quantum KEX.",
         manifest=None,
         upstream="https://github.com/paramiko/paramiko",
         note="Cloned from upstream and scanned unmodified. No manifest exists, so every criticality "
              "label falls back to the path heuristic and is labelled as such."),
    dict(id="jjwt", name="JJWT (Java JWT)",
         kind="real-oss",
         description="The most widely used JWT library on the JVM. Signature algorithm selection "
                     "is its core concern, which makes it a dense source of RSA/ECDSA evidence.",
         manifest=None,
         upstream="https://github.com/jwtk/jjwt",
         note="Cloned from upstream and scanned unmodified."),
    dict(id="django", name="Django",
         kind="real-oss",
         description="A large production web framework. Included to show ECDAT's behaviour at "
                     "realistic scale and to exercise the staged-triage performance path.",
         manifest=None,
         upstream="https://github.com/django/django",
         note="Cloned from upstream and scanned unmodified."),
]


# --------------------------------------------------------------------------
# Risk scoring
# --------------------------------------------------------------------------

QUANTUM_URGENCY = {
    "classically-broken": 5,   # broken today, no quantum computer required
    "shor-broken": 4,          # broken by a CRQC
    "grover-reduced": 2,       # weakened, not broken
    "quantum-safe": 0,         # inventory only
}

RISK_BUCKETS = [(8.0, "critical"), (5.5, "high"), (3.0, "medium"), (0.8, "low")]


def risk_for(algorithm, criticality, mosca_result):
    """
    Transparent priority score. Every term is shown in the finding detail view.

        risk = quantum_urgency
             x (criticality_score / 20)      how much this asset matters
             x 2                             scale back to a 0-10 range
             + mosca_pressure                how far past the migration line

    Quantum-safe primitives score zero by construction: they are recorded in
    the inventory but are not migration work.
    """
    meta = rules.ALGORITHMS.get(algorithm, {})
    q = QUANTUM_URGENCY.get(meta.get("quantum"), 0)
    c_norm = (criticality["score"] or 0) / 20.0
    base = q * c_norm * 2.0

    pressure = 0.0
    if mosca_result and mosca_result.get("applicable") and mosca_result.get("exposed") and q > 0:
        pressure = min(3.0, mosca_result["gap_years"] / 5.0)

    total = round(base + pressure, 2)
    bucket = "informational"
    for limit, name in RISK_BUCKETS:
        if total >= limit:
            bucket = name
            break
    return dict(
        score=total, bucket=bucket,
        quantum_urgency=q,
        quantum_status=meta.get("quantum", "unknown"),
        criticality_factor=round(c_norm, 3),
        base=round(base, 2),
        mosca_pressure=round(pressure, 2),
        formula="quantum_urgency x (criticality_score / 20) x 2 + mosca_pressure",
    )


# --------------------------------------------------------------------------

def process_repo(repo, do_incremental=True):
    root = os.path.join(TARGETS, repo["id"])
    if not os.path.isdir(root):
        print(f"  !! missing target {root}")
        return None

    manifest = None
    if repo["manifest"]:
        manifest = crit.load_manifest(os.path.join(root, repo["manifest"]))
    z_years = (manifest or {}).get("threat_horizon_years", 15)

    print(f"  scanning {repo['id']} ...", end="", flush=True)
    res = scanner.scan_tree(root, repo["id"])
    tel = res["telemetry"]
    print(f" {len(res['findings'])} findings in {tel['scan_seconds']}s")

    if do_incremental:
        res2 = scanner.scan_tree(root, repo["id"], cache=res["cache"])
        tel["incremental_seconds"] = res2["telemetry"]["scan_seconds"]
        tel["incremental_speedup"] = round(
            tel["scan_seconds"] / max(res2["telemetry"]["scan_seconds"], 1e-6), 1)
        tel["incremental_findings_identical"] = len(res2["findings"]) == len(res["findings"])

    # -- certificates and dependencies --
    certs = artefacts.scan_certificates(root, res["inventory"]["certs"], NOW)
    deps = artefacts.scan_dependencies(root, res["inventory"]["deps"])

    # -- classify + score every finding --
    service_cache = {}
    for f in res["findings"]:
        if f["file"] not in service_cache:
            service_cache[f["file"]] = crit.classify(f["file"], manifest)
        c = service_cache[f["file"]]
        m = crit.mosca(c["data_lifetime_years"], c["migration_time_years"], z_years)
        meta = rules.ALGORITHMS.get(f["algorithm"], {})
        f["criticality"] = c
        f["mosca"] = m
        f["risk"] = risk_for(f["algorithm"], c, m)
        f["quantum"] = meta.get("quantum", "unknown")
        f["quantum_note"] = meta.get("note")
        f["replacement"] = meta.get("replacement")
        f["nist_standard"] = meta.get("nist_pqc")
        f["algorithm_family"] = meta.get("family")
        # display label, e.g. RSA-2048 / ECDSA-P256
        ks = (f.get("extra") or {}).get("key_size")
        cv = (f.get("extra") or {}).get("curve")
        f["label"] = f["algorithm"] or "(protocol)"
        if cv:
            f["label"] = f"{f['algorithm']}-{cv}"
        elif ks and f["algorithm"] in ("RSA", "DSA", "ECDSA", "DH"):
            f["label"] = f"{f['algorithm']}-{ks}"

    # -- per-service rollup --
    services = {}
    if manifest:
        for svc in manifest["services"]:
            sf = [f for f in res["findings"] if (f["criticality"].get("service") == svc["name"])]
            c0 = crit.classify((svc.get("path_patterns") or ["x"])[0].replace("**", "x"), manifest)
            m = crit.mosca(svc.get("data_lifetime_years"), svc.get("migration_time_years"), z_years)
            vuln = [f for f in sf if f["quantum"] in ("shor-broken", "classically-broken")]
            services[svc["name"]] = dict(
                name=svc["name"],
                description=svc.get("description", ""),
                data_classification=svc.get("data_classification"),
                business_function=svc.get("business_function"),
                exposure=svc.get("exposure"),
                owner=svc.get("owner"),
                path_patterns=svc.get("path_patterns"),
                data_lifetime_years=svc.get("data_lifetime_years"),
                migration_time_years=svc.get("migration_time_years"),
                migration_constraints=svc.get("migration_constraints") or [],
                criticality_score=c0["score"] if c0["service"] == svc["name"] else None,
                criticality_bucket=c0["bucket"] if c0["service"] == svc["name"] else None,
                criticality_working=c0["working"],
                mosca=m,
                findings=len(sf),
                vulnerable_findings=len(vuln),
                max_risk=max([f["risk"]["score"] for f in sf], default=0),
                algorithms=sorted({f["label"] for f in sf if f["algorithm"]}),
            )

    bom = cbom.build(repo["id"],
                     dict(name=repo["name"], description=repo["description"],
                          files_scanned=tel["source_files_scanned"]),
                     res["findings"], certs, deps, NOW.isoformat())

    # -- aggregates --
    by_alg = collections.Counter(f["label"] for f in res["findings"] if f["algorithm"])
    by_quantum = collections.Counter(f["quantum"] for f in res["findings"])
    by_function = collections.Counter(f["function"] for f in res["findings"])
    by_risk = collections.Counter(f["risk"]["bucket"] for f in res["findings"])
    by_lang = collections.Counter(f["language"] for f in res["findings"])
    by_conf = collections.Counter(f["criticality"]["confidence"] for f in res["findings"])

    return dict(
        meta=repo,
        telemetry=tel,
        findings=res["findings"],
        certificates=certs,
        dependencies=deps,
        services=services,
        manifest_present=manifest is not None,
        threat_horizon_years=z_years,
        horizon_basis=(manifest or {}).get("horizon_basis"),
        cbom=bom,
        summary=dict(
            total_findings=len(res["findings"]),
            quantum_vulnerable=sum(v for k, v in by_quantum.items()
                                   if k in ("shor-broken", "classically-broken")),
            shor_broken=by_quantum.get("shor-broken", 0),
            classically_broken=by_quantum.get("classically-broken", 0),
            quantum_safe=by_quantum.get("quantum-safe", 0),
            grover_reduced=by_quantum.get("grover-reduced", 0),
            certificates=len([c for c in certs if c.get("kind") == "certificate"]),
            cert_issues=sum(len(c.get("issues", [])) for c in certs if c.get("kind") == "certificate"),
            dependencies=len(deps),
            by_algorithm=dict(by_alg.most_common()),
            by_quantum=dict(by_quantum),
            by_function=dict(by_function),
            by_risk=dict(by_risk),
            by_language=dict(by_lang),
            by_confidence=dict(by_conf),
            cbom_components=len(bom["components"]),
        ),
    )


def main():
    t0 = time.perf_counter()
    print("ECDAT scan run")
    print("=" * 62)

    repos = {}
    for repo in REPOS:
        out = process_repo(repo)
        if out:
            repos[repo["id"]] = out

    print("  running migration benchmark (real crypto operations) ...", end="", flush=True)
    benchmark = bench.run_all()
    print(f" {benchmark['benchmark_seconds']}s")

    totals = dict(
        repositories=len(repos),
        source_files=sum(r["telemetry"]["source_files_scanned"] for r in repos.values()),
        files_seen=sum(r["telemetry"]["files_seen"] for r in repos.values()),
        bytes_scanned=sum(r["telemetry"]["bytes_scanned"] for r in repos.values()),
        findings=sum(r["summary"]["total_findings"] for r in repos.values()),
        quantum_vulnerable=sum(r["summary"]["quantum_vulnerable"] for r in repos.values()),
        certificates=sum(r["summary"]["certificates"] for r in repos.values()),
        dependencies=sum(r["summary"]["dependencies"] for r in repos.values()),
        clean_scan_seconds=round(sum(r["telemetry"]["scan_seconds"] for r in repos.values()), 3),
        incremental_scan_seconds=round(sum(r["telemetry"].get("incremental_seconds", 0)
                                           for r in repos.values()), 3),
        rules=len(rules.RULES),
        algorithms_known=len(rules.ALGORITHMS),
    )
    totals["incremental_speedup"] = round(
        totals["clean_scan_seconds"] / max(totals["incremental_scan_seconds"], 1e-6), 1)
    totals["files_per_second"] = round(
        totals["source_files"] / max(totals["clean_scan_seconds"], 1e-6))

    payload = dict(
        generated_at=NOW.isoformat(),
        ecdat_version=cbom.ECDAT_VERSION,
        environment=benchmark["environment"],
        totals=totals,
        repos=repos,
        benchmark=benchmark,
        weights=dict(
            data_classification=crit.DATA_CLASSIFICATION_WEIGHT,
            business_function=crit.BUSINESS_FUNCTION_WEIGHT,
            exposure=crit.EXPOSURE_MULTIPLIER,
            quantum_urgency=QUANTUM_URGENCY,
        ),
        algorithms=rules.ALGORITHMS,
        rule_count=len(rules.RULES),
    )

    os.makedirs(DATA, exist_ok=True)
    os.makedirs(UI, exist_ok=True)

    with open(os.path.join(DATA, "scan_results.json"), "w", encoding="utf-8") as fh:
        json.dump(payload, fh, indent=1)

    js = "// Generated by ECDAT engine/run.py -- do not edit by hand.\n" \
         "window.ECDAT = " + json.dumps(payload, separators=(",", ":")) + ";\n"
    with open(os.path.join(UI, "data.js"), "w", encoding="utf-8") as fh:
        fh.write(js)

    for rid, r in repos.items():
        with open(os.path.join(DATA, f"cbom-{rid}.json"), "w", encoding="utf-8") as fh:
            fh.write(cbom.to_json(r["cbom"]))

    size_mb = os.path.getsize(os.path.join(UI, "data.js")) / 1e6
    print("=" * 62)
    print(f"  repositories      {totals['repositories']}")
    print(f"  source files      {totals['source_files']:,}")
    print(f"  findings          {totals['findings']:,}  ({totals['quantum_vulnerable']:,} quantum-vulnerable)")
    print(f"  certificates      {totals['certificates']}")
    print(f"  clean scan        {totals['clean_scan_seconds']}s  ({totals['files_per_second']:,} files/s)")
    print(f"  incremental       {totals['incremental_scan_seconds']}s  ({totals['incremental_speedup']}x faster)")
    print(f"  ui/data.js        {size_mb:.2f} MB")
    print(f"  total wall clock  {time.perf_counter() - t0:.1f}s")


if __name__ == "__main__":
    main()
