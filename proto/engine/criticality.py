"""
Business-criticality classification and Mosca threat-horizon reasoning.

This is the layer no competing tool implements. It answers the question a
scanner cannot answer on its own: *this RSA key -- what does it actually
protect, and does that matter?*

Two stages:

  Stage A  What is this crypto doing?  (function)   -- done in scanner.py by
           decoding the API call and its parameters.
  Stage B  How much does it matter?    (criticality) -- done here, driven by
           the service manifest.

Every criticality value carries the evidence that produced it and an honest
confidence tier:

  manifest-confirmed  the asset owner declared this path in ecdat-manifest.yaml
  path-heuristic      no manifest entry matched; a keyword in the path did
  unknown             neither matched; ECDAT says so instead of guessing
"""

import fnmatch
import os

import yaml

# ---- Weights. Every one of these is visible in the UI and editable here. ----

DATA_CLASSIFICATION_WEIGHT = {
    "public": 1,
    "internal": 2,
    "financial": 4,
    "sensitive-pii": 5,
}

BUSINESS_FUNCTION_WEIGHT = {
    "test": 0,
    "internal-tooling": 1,
    "records-archival": 3,
    "payment-processing": 4,
    "authentication": 4,
    "unknown": 2,
}

EXPOSURE_MULTIPLIER = {
    "offline": 1.0,
    "internal": 1.5,
    "internet-facing": 2.0,
    "unknown": 1.5,
}

# score = (data_classification + business_function) * exposure_multiplier
BUCKETS = [(3.0, "low"), (7.0, "medium"), (12.0, "high"), (99.0, "critical")]

# Fallback ontology, used only when no manifest entry matches. The matched
# keyword is always surfaced, so "the tool guessed" becomes "the tool showed
# its reasoning".
FUNCTION_KEYWORDS = {
    "payment-processing": ["payment", "billing", "invoice", "checkout", "transaction", "settlement", "acquirer", "merchant"],
    "authentication": ["auth", "login", "session", "token", "sso", "oauth", "jwt", "identity", "kyc", "credential"],
    "records-archival": ["archive", "archival", "record", "ledger", "registry", "retention", "vault"],
    "internal-tooling": ["admin", "internal", "ops", "tooling", "console", "devtool"],
    "test": ["test", "tests", "mock", "fixture", "sample", "demo", "staging", "spec", "conftest", "example"],
}

CLASSIFICATION_KEYWORDS = {
    "sensitive-pii": ["pii", "aadhaar", "kyc", "identity", "personal", "biometric", "passport"],
    "financial": ["payment", "billing", "settlement", "treasury", "ledger", "invoice", "transaction"],
}


def load_manifest(path):
    if not path or not os.path.exists(path):
        return None
    with open(path, "r", encoding="utf-8") as fh:
        return yaml.safe_load(fh)


def _specificity(pattern):
    """More path separators and fewer wildcards = more specific. Same rule
    .gitignore and web routers use when two patterns both match."""
    return (pattern.count("/"), -pattern.count("*"), len(pattern))


def match_service(file_path, manifest):
    """Glob-match a file path against every manifest entry; most specific wins."""
    if not manifest:
        return None, None
    best = None
    for svc in manifest.get("services", []):
        for pat in svc.get("path_patterns", []) or []:
            if fnmatch.fnmatch(file_path, pat) or fnmatch.fnmatch("/" + file_path, pat):
                sp = _specificity(pat)
                if best is None or sp > best[0]:
                    best = (sp, svc, pat)
    if best:
        return best[1], best[2]
    return None, None


def heuristic_service(file_path):
    """No manifest entry matched. Fall back to path keywords, and say so."""
    low = file_path.lower()
    fn_hit = None
    for func, kws in FUNCTION_KEYWORDS.items():
        for kw in kws:
            if kw in low:
                # a longer keyword is a stronger signal
                if fn_hit is None or len(kw) > len(fn_hit[1]):
                    fn_hit = (func, kw)
    cls_hit = None
    for cls, kws in CLASSIFICATION_KEYWORDS.items():
        for kw in kws:
            if kw in low:
                if cls_hit is None or len(kw) > len(cls_hit[1]):
                    cls_hit = (cls, kw)
    return fn_hit, cls_hit


def bucket_for(score):
    for limit, name in BUCKETS:
        if score <= limit:
            return name
    return "critical"


def classify(file_path, manifest):
    """
    Return the full criticality record for one file path, including the
    evidence trail and the arithmetic, so the UI can show the working.
    """
    svc, pattern = match_service(file_path, manifest)

    if svc:
        data_cls = svc.get("data_classification", "internal")
        biz_fn = svc.get("business_function", "unknown")
        exposure = svc.get("exposure", "unknown")
        confidence = "manifest-confirmed"
        evidence = f'manifest entry "{svc["name"]}" matched pattern {pattern}'
        service_name = svc["name"]
        owner = svc.get("owner")
        lifetime = svc.get("data_lifetime_years")
        migration = svc.get("migration_time_years")
        constraints = svc.get("migration_constraints") or []
    else:
        fn_hit, cls_hit = heuristic_service(file_path)
        if fn_hit or cls_hit:
            biz_fn = fn_hit[0] if fn_hit else "unknown"
            data_cls = cls_hit[0] if cls_hit else "internal"
            exposure = "unknown"
            confidence = "path-heuristic"
            bits = []
            if fn_hit:
                bits.append(f'path contains "{fn_hit[1]}" -> {fn_hit[0]}')
            if cls_hit:
                bits.append(f'path contains "{cls_hit[1]}" -> {cls_hit[0]}')
            evidence = "; ".join(bits)
            service_name = None
        else:
            biz_fn, data_cls, exposure = "unknown", "internal", "unknown"
            confidence = "unknown"
            evidence = "no manifest entry and no path keyword matched"
            service_name = None
        owner = None
        lifetime = None
        migration = None
        constraints = []

    w_data = DATA_CLASSIFICATION_WEIGHT.get(data_cls, 2)
    w_fn = BUSINESS_FUNCTION_WEIGHT.get(biz_fn, 2)
    mult = EXPOSURE_MULTIPLIER.get(exposure, 1.5)
    score = round((w_data + w_fn) * mult, 1)

    return dict(
        service=service_name,
        data_classification=data_cls,
        business_function=biz_fn,
        exposure=exposure,
        owner=owner,
        data_lifetime_years=lifetime,
        migration_time_years=migration,
        migration_constraints=constraints,
        score=score,
        bucket=bucket_for(score),
        confidence=confidence,
        evidence=evidence,
        working=dict(
            data_classification_weight=w_data,
            business_function_weight=w_fn,
            exposure_multiplier=mult,
            formula="(data_classification_weight + business_function_weight) * exposure_multiplier",
        ),
    )


# --------------------------------------------------------------------------
# Mosca's inequality
# --------------------------------------------------------------------------

def mosca(x_years, y_years, z_years):
    """
    Mosca's theorem, stated plainly:

        If  X + Y > Z  then you are already too late.

        X  how long the data must stay protected (or the signature must stay
           unforgeable)
        Y  how long the migration itself will realistically take
        Z  how long until a cryptographically-relevant quantum computer exists

    The output is a decision aid, not a prediction of when a CRQC will arrive.
    Z is an assumption the operator sets and can change; the UI exposes it as
    a slider precisely so that assumption stays visible.
    """
    if x_years is None or y_years is None or z_years is None:
        return dict(applicable=False, reason="service lifetime or migration time not declared in the manifest")
    total = x_years + y_years
    gap = round(total - z_years, 1)
    return dict(
        applicable=True,
        x=x_years, y=y_years, z=z_years,
        x_plus_y=round(total, 1),
        exposed=total > z_years,
        gap_years=gap,
        verdict=(
            f"Exposed by {gap:g} years -- migration must already be under way"
            if total > z_years else
            f"Within tolerance by {abs(gap):g} years -- plan, but not yet urgent"
        ),
    )
