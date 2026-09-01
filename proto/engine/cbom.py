"""
CBOM export -- CycloneDX 1.6 Cryptographic Bill of Materials.

CycloneDX 1.6 (published 2024) added the `cryptographic-asset` component type
specifically for this purpose. Emitting the standard format rather than a
bespoke JSON shape is what makes ECDAT's output ingestible by other tooling,
and it is what the problem statement means by "catalogue all cryptographic
artefacts".
"""

import hashlib
import json

import rules

ECDAT_VERSION = "0.9.0-prototype"

# ECDAT function -> CycloneDX cryptoProperties.algorithmProperties primitive
PRIMITIVE_MAP = {
    "digital-signature": "signature",
    "key-generation": "key-gen",
    "key-exchange": "key-agree",
    "key-encapsulation": "kem",
    "public-key-encryption": "pke",
    "symmetric-encryption": "block-cipher",
    "hashing": "hash",
    "message-authentication": "mac",
    "key-derivation": "kdf",
    "random-generation": "drbg",
    "certificate-identity": "signature",
    "transport-protocol": "other",
    "unknown": "unknown",
}

# NIST security level, where the primitive has one
NIST_LEVEL = {
    "ML-KEM": 3, "ML-DSA": 3, "SLH-DSA": 1,
    "AES-256": 5, "AES-192": 3, "AES-128": 1,
}


def _bom_ref(kind, *parts):
    h = hashlib.sha1("|".join(str(p) for p in parts).encode()).hexdigest()[:16]
    return f"crypto:{kind}:{h}"


def _algorithm_component(alg, findings):
    """One CycloneDX component per distinct algorithm, with every occurrence."""
    meta = rules.ALGORITHMS.get(alg, {})
    functions = sorted({f["function"] for f in findings if f.get("function")})
    primitive = PRIMITIVE_MAP.get(functions[0] if functions else "unknown", "unknown")
    key_sizes = sorted({f["extra"]["key_size"] for f in findings
                        if isinstance(f.get("extra"), dict) and f["extra"].get("key_size")})

    props = [
        {"name": "ecdat:quantum_status", "value": meta.get("quantum", "unknown")},
        {"name": "ecdat:occurrences", "value": str(len(findings))},
    ]
    if meta.get("note"):
        props.append({"name": "ecdat:quantum_rationale", "value": meta["note"]})
    if meta.get("replacement"):
        props.append({"name": "ecdat:recommended_replacement", "value": meta["replacement"]})
    if meta.get("nist_pqc"):
        props.append({"name": "ecdat:nist_standard", "value": meta["nist_pqc"]})

    crypto_props = {
        "assetType": "algorithm",
        "algorithmProperties": {
            "primitive": primitive,
            "executionEnvironment": "software-plain-ram",
            "implementationPlatform": "generic",
            "cryptoFunctions": sorted({
                {"digital-signature": "sign", "key-generation": "keygen",
                 "key-exchange": "keygen", "key-encapsulation": "encapsulate",
                 "public-key-encryption": "encrypt", "symmetric-encryption": "encrypt",
                 "hashing": "digest", "message-authentication": "tag",
                 "key-derivation": "keyderive", "random-generation": "generate",
                 "certificate-identity": "verify", "transport-protocol": "other",
                 "unknown": "unknown"}.get(fn, "unknown")
                for fn in functions
            }),
        },
        "oid": None,
    }
    if key_sizes:
        crypto_props["algorithmProperties"]["parameterSetIdentifier"] = str(key_sizes[-1])
    if alg in NIST_LEVEL:
        crypto_props["algorithmProperties"]["nistQuantumSecurityLevel"] = NIST_LEVEL[alg]
    crypto_props.pop("oid")

    occurrences = [
        {"location": f["file"], "line": f["line"], "offset": f.get("col"),
         "additionalContext": (f.get("snippet") or "")[:160]}
        for f in findings[:60]
    ]

    return {
        "type": "cryptographic-asset",
        "bom-ref": _bom_ref("alg", alg),
        "name": alg,
        "description": meta.get("note", ""),
        "cryptoProperties": crypto_props,
        "properties": props,
        "evidence": {"occurrences": occurrences},
    }


def _certificate_component(cert):
    return {
        "type": "cryptographic-asset",
        "bom-ref": _bom_ref("cert", cert["file"], cert.get("serial", "")),
        "name": cert.get("subject") or cert["file"],
        "cryptoProperties": {
            "assetType": "certificate",
            "certificateProperties": {
                "subjectName": cert.get("subject"),
                "issuerName": cert.get("issuer"),
                "notValidBefore": cert.get("not_before"),
                "notValidAfter": cert.get("not_after"),
                "signatureAlgorithmRef": cert.get("signature_hash"),
                "subjectPublicKeyRef": f'{cert.get("algorithm")}-{cert.get("key_size")}',
                "certificateFormat": "X.509",
                "certificateExtension": "pem",
            },
        },
        "properties": [
            {"name": "ecdat:quantum_status", "value": cert.get("quantum") or "unknown"},
            {"name": "ecdat:key_usage", "value": ",".join(cert.get("key_usage") or [])},
            {"name": "ecdat:days_remaining", "value": str(cert.get("days_remaining"))},
        ] + [{"name": "ecdat:issue", "value": i} for i in cert.get("issues", [])],
        "evidence": {"occurrences": [{"location": cert["file"]}]},
    }


def _library_component(dep):
    return {
        "type": "library",
        "bom-ref": _bom_ref("lib", dep["ecosystem"], dep["package"], dep.get("version", "")),
        "name": dep["package"],
        "version": dep.get("version") or "unspecified",
        "description": dep.get("role", ""),
        "purl": (f'pkg:{"pypi" if dep["ecosystem"] == "pypi" else "maven"}/'
                 f'{dep["package"].replace(":", "/")}@{dep.get("version") or "unknown"}'),
        "evidence": {"occurrences": [{"location": dep["file"], "line": dep.get("line")}]},
    }


def build(repo_id, repo_meta, findings, certs, deps, generated_at):
    """Assemble a CycloneDX 1.6 CBOM for one scanned repository."""
    by_alg = {}
    for f in findings:
        if f.get("algorithm"):
            by_alg.setdefault(f["algorithm"], []).append(f)

    components = [_algorithm_component(a, fs) for a, fs in sorted(by_alg.items())]
    components += [_certificate_component(c) for c in certs if c.get("kind") == "certificate"]
    components += [_library_component(d) for d in deps]

    serial = "urn:uuid:" + hashlib.sha1(f"ecdat|{repo_id}|{generated_at}".encode()).hexdigest()[:8] + \
             "-0000-4000-8000-" + hashlib.sha1(repo_id.encode()).hexdigest()[:12]

    return {
        "bomFormat": "CycloneDX",
        "specVersion": "1.6",
        "serialNumber": serial,
        "version": 1,
        "metadata": {
            "timestamp": generated_at,
            "tools": {"components": [{
                "type": "application", "name": "ECDAT",
                "version": ECDAT_VERSION,
                "description": "Enterprise Cryptographic Discovery & Analysis Tool",
            }]},
            "component": {
                "type": "application",
                "bom-ref": _bom_ref("app", repo_id),
                "name": repo_meta.get("name", repo_id),
                "description": repo_meta.get("description", ""),
            },
            "properties": [
                {"name": "ecdat:ruleset_version", "value": ECDAT_VERSION},
                {"name": "ecdat:rules_evaluated", "value": str(len(rules.RULES))},
                {"name": "ecdat:source_files_scanned", "value": str(repo_meta.get("files_scanned", 0))},
            ],
        },
        "components": components,
    }


def to_json(bom):
    return json.dumps(bom, indent=2)
