"""
ECDAT source scanner.

Layered analysis, cheapest first -- exactly the staged approach the design
calls for:

  1. Enumerate files, skipping vendored/build/binary content.
  2. Run compiled regex rules to find candidate call sites (cheap triage).
  3. Re-parse only the Python files that produced a hit, with the `ast` module,
     to resolve concrete parameters (RSA key size, EC curve, enclosing
     function). Java gets a bounded textual look-around for the same purpose.
  4. Attach evidence: file, line, column, the source line, the enclosing
     symbol, and the rule id that fired.

Every finding carries the rule that produced it, so any number in the
dashboard can be traced back to a line of real source.
"""

import ast
import bisect
import hashlib
import io
import os
import re
import time

import rules

IGNORE_DIRS = {
    ".git", ".hg", ".svn", "node_modules", "__pycache__", ".tox", ".venv", "venv",
    "env", "build", "dist", "target", "out", ".idea", ".gradle", ".mvn",
    "site-packages", "vendor", "third_party", "migrations", ".pytest_cache",
    ".mypy_cache", "htmlcov", "coverage", ".eggs",
}

LANG_BY_EXT = {
    ".py": "python", ".pyi": "python",
    ".java": "java",
    ".conf": "config", ".cnf": "config", ".ini": "config", ".cfg": "config",
    ".properties": "config", ".yaml": "config", ".yml": "config", ".toml": "config",
}

CERT_EXT = {".pem", ".crt", ".cer", ".der", ".p12", ".pfx", ".jks", ".key"}
DEP_FILES = {"requirements.txt", "pom.xml", "package.json", "go.mod", "build.gradle", "Pipfile", "pyproject.toml"}

MAX_FILE_BYTES = 1_500_000


# --------------------------------------------------------------------------
# File enumeration
# --------------------------------------------------------------------------

def enumerate_files(root):
    """Walk the tree once, classifying every file we care about."""
    src, certs, deps = [], [], []
    total_files = 0
    total_bytes = 0
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if d not in IGNORE_DIRS and not d.startswith(".")]
        for fn in filenames:
            full = os.path.join(dirpath, fn)
            try:
                size = os.path.getsize(full)
            except OSError:
                continue
            total_files += 1
            total_bytes += size
            ext = os.path.splitext(fn)[1].lower()
            rel = os.path.relpath(full, root).replace("\\", "/")
            if fn in DEP_FILES:
                deps.append((rel, full, size))
            elif ext in CERT_EXT:
                certs.append((rel, full, size))
            elif ext in LANG_BY_EXT and size <= MAX_FILE_BYTES:
                src.append((rel, full, size, LANG_BY_EXT[ext]))
    return dict(source=src, certs=certs, deps=deps,
                total_files=total_files, total_bytes=total_bytes)


def read_text(path):
    try:
        with io.open(path, "r", encoding="utf-8", errors="replace") as fh:
            return fh.read()
    except OSError:
        return None


# --------------------------------------------------------------------------
# Python AST enrichment
# --------------------------------------------------------------------------

EC_CURVE_BITS = {
    "SECP192R1": 192, "SECP224R1": 224, "SECP256R1": 256, "SECP256K1": 256,
    "SECP384R1": 384, "SECP521R1": 521, "BrainpoolP256R1": 256,
    "BrainpoolP384R1": 384, "BrainpoolP512R1": 512,
}
EC_CURVE_NAME = {
    "SECP256R1": "P-256", "SECP384R1": "P-384", "SECP521R1": "P-521",
    "SECP224R1": "P-224", "SECP192R1": "P-192", "SECP256K1": "secp256k1",
}


class _PyIndex(ast.NodeVisitor):
    """Builds line -> enclosing symbol, and line -> resolved parameters."""

    def __init__(self):
        self.scopes = []          # (start, end, qualname)
        self.params = {}          # line -> dict

    # -- scope tracking --
    def _push(self, node, name):
        end = getattr(node, "end_lineno", node.lineno)
        self.scopes.append((node.lineno, end, name))

    def visit_FunctionDef(self, node):
        self._push(node, node.name)
        self.generic_visit(node)

    visit_AsyncFunctionDef = visit_FunctionDef

    def visit_ClassDef(self, node):
        self._push(node, node.name)
        self.generic_visit(node)

    # -- parameter resolution --
    def visit_Call(self, node):
        fn = _dotted(node.func)
        if fn:
            info = {}
            tail = fn.split(".")[-1]

            if tail == "generate_private_key":
                for kw in node.keywords:
                    if kw.arg == "key_size" and isinstance(kw.value, ast.Constant):
                        info["key_size"] = kw.value.value
                # positional curve: ec.generate_private_key(ec.SECP256R1())
                for a in node.args:
                    c = _dotted(a.func) if isinstance(a, ast.Call) else _dotted(a)
                    if c:
                        curve = c.split(".")[-1].upper()
                        if curve in EC_CURVE_BITS:
                            info["curve"] = EC_CURVE_NAME.get(curve, curve)
                            info["key_size"] = EC_CURVE_BITS[curve]
                if not info.get("key_size"):
                    for a in node.args:
                        if isinstance(a, ast.Constant) and isinstance(a.value, int):
                            info["key_size"] = a.value

            elif tail == "generate":  # RSA.generate(2048) -- PyCryptodome
                for a in node.args:
                    if isinstance(a, ast.Constant) and isinstance(a.value, int) and a.value >= 512:
                        info["key_size"] = a.value

            elif tail in ("PBKDF2HMAC", "pbkdf2_hmac"):
                for kw in node.keywords:
                    if kw.arg == "iterations" and isinstance(kw.value, ast.Constant):
                        info["iterations"] = kw.value.value

            elif tail == "AES":
                # algorithms.AES(key) -- try a literal length
                for a in node.args:
                    if isinstance(a, ast.Constant) and isinstance(a.value, (bytes, str)):
                        info["key_size"] = len(a.value) * 8

            if info:
                self.params.setdefault(node.lineno, {}).update(info)
        self.generic_visit(node)

    def symbol_at(self, line):
        best = None
        for s, e, name in self.scopes:
            if s <= line <= e:
                if best is None or s > best[0]:
                    best = (s, name)
        return best[1] if best else None


def _dotted(node):
    parts = []
    while isinstance(node, ast.Attribute):
        parts.append(node.attr)
        node = node.value
    if isinstance(node, ast.Name):
        parts.append(node.id)
        return ".".join(reversed(parts))
    return None


def index_python(text):
    try:
        tree = ast.parse(text)
    except (SyntaxError, ValueError, RecursionError):
        return None
    idx = _PyIndex()
    try:
        idx.visit(tree)
    except RecursionError:
        return None
    return idx


# --------------------------------------------------------------------------
# Java look-around enrichment
# --------------------------------------------------------------------------

JAVA_METHOD_RX = re.compile(
    r'^\s*(?:public|private|protected|static|final|synchronized|abstract|\s)*'
    r'[\w<>\[\],.\s]+\s+(\w+)\s*\([^;{]*\)\s*(?:throws [\w ,.]+)?\s*\{',
    re.MULTILINE)
JAVA_CLASS_RX = re.compile(r'^\s*(?:public|final|abstract|\s)*(?:class|interface|enum)\s+(\w+)', re.MULTILINE)
JAVA_INIT_RX = re.compile(r'\.\s*(?:initialize|init)\s*\(\s*(\d{3,5})\b')


def java_symbols(text):
    """Map each line number to the method that encloses it (best effort)."""
    marks = []
    for m in JAVA_METHOD_RX.finditer(text):
        marks.append((text.count("\n", 0, m.start()) + 1, m.group(1)))
    for m in JAVA_CLASS_RX.finditer(text):
        marks.append((text.count("\n", 0, m.start()) + 1, m.group(1)))
    marks.sort()
    return marks


def symbol_before(marks, line):
    best = None
    for ln, name in marks:
        if ln <= line:
            best = name
        else:
            break
    return best


def java_keysize_near(lines, line_idx, window=6):
    """KeyPairGenerator.getInstance("RSA") ... kpg.initialize(2048)"""
    for i in range(line_idx, min(len(lines), line_idx + window)):
        m = JAVA_INIT_RX.search(lines[i])
        if m:
            return int(m.group(1))
    return None


# --------------------------------------------------------------------------
# Core scan
# --------------------------------------------------------------------------

COMMENT_PREFIX = re.compile(r'^\s*(#|//|\*|/\*|--)')

# Stage 1 triage: a file that contains none of these substrings cannot match
# any rule, so it never reaches the expensive stages. Cheap and conservative.
TRIAGE_TOKENS = (
    "getInstance", "SecureRandom", "Math.random", "SignatureAlgorithm",
    "generate_private_key", "padding.", "algorithms.", "hashlib", "hmac",
    "HMAC", "PBKDF2", "HKDF", "Scrypt", "scrypt", "bcrypt", "urandom",
    "secrets.", "random.", "AES", "DES", "ARC4", "RSA", "ChaCha", "ssl.",
    "set_ciphers", "Ed25519", "Ed448", "X25519", "X448", "ML-KEM", "ML_KEM",
    "MLKEM", "Kyber", "ML-DSA", "MLDSA", "Dilithium", "SLH-DSA", "SPHINCS",
    "ssl_ciphers", "CipherSuites", "ssl_protocols", "MinProtocol", "Ciphers",
    "ssl_ecdh_curve", "Groups", "Curves", "SSLProtocol", "Protocols",
    "RS256", "ES256", "HS256", "PS256", "EdDSA", "java.util.Random",
)


def line_offsets(text):
    """Byte offsets of each line start, for O(log n) offset -> line lookup."""
    offs = [0]
    start = 0
    while True:
        i = text.find("\n", start)
        if i < 0:
            break
        offs.append(i + 1)
        start = i + 1
    return offs


def scan_source_file(rel, full, lang, text, counters):
    """
    Run the applicable rules over one file.

    Stage 1  cheap substring triage -- skip the file entirely if impossible.
    Stage 2  compiled regex rules.
    Stage 3  AST / symbol indexing, built lazily and only once a rule has hit.
    """
    if not any(tok in text for tok in TRIAGE_TOKENS):
        counters["triaged_out"] += 1
        return []

    out = []
    lines = text.split("\n")
    offs = line_offsets(text)

    # Stage 3 indexes are built on first use only.
    lazy = {"py": "unset", "java": "unset"}

    def py_index():
        if lazy["py"] == "unset":
            lazy["py"] = index_python(text)
            counters["ast_parsed" if lazy["py"] else "ast_failed"] += 1
        return lazy["py"]

    def java_index():
        if lazy["java"] == "unset":
            lazy["java"] = java_symbols(text)
            counters["java_indexed"] += 1
        return lazy["java"]

    for rule in rules.RULES:
        if lang not in rule["langs"]:
            continue
        for m in rule["rx"].finditer(text):
            line_no = bisect.bisect_right(offs, m.start())
            src_line = lines[line_no - 1] if line_no - 1 < len(lines) else ""
            in_comment = bool(COMMENT_PREFIX.match(src_line))

            captured = m.group(1) if m.re.groups >= 1 else None
            components = []   # (algorithm, function, role)
            extra = {}

            if rule["kind"] == "jca":
                alg, func, ex = rules.resolve_jca(captured)
                extra.update(ex)
                if alg is None and func == "transport-protocol":
                    extra["protocol"] = captured
                    components.append((None, "transport-protocol", None))
                elif alg:
                    if rule.get("function") == "key-generation":
                        func = "key-generation"
                    components.append((alg, func, None))

            elif rule["kind"] == "suite":
                for part in re.split(r'[:,\s]+', captured or ""):
                    part = part.strip("!+-")
                    if not part or len(part) < 5:
                        continue
                    for a, f, role in rules.resolve_cipher_suite(part):
                        components.append((a, f, role))
                        extra.setdefault("suites", [])
                        if part not in extra["suites"]:
                            extra["suites"].append(part)

            elif rule.get("jwt_alg"):
                jwt = m.group(1)
                pair = rules.JWT_ALGS.get(jwt)
                if not pair:
                    continue
                alg, digest = pair
                extra["jwt_alg"] = jwt
                if digest:
                    extra["digest"] = digest
                components.append((alg, "digital-signature", None))

            elif rule.get("capture_protocol"):
                proto = (captured or "").strip()
                extra["protocol"] = proto
                for tok in re.split(r'[\s,:]+', proto.upper()):
                    tok = tok.strip()
                    if tok in rules.WEAK_PROTOCOLS:
                        extra.setdefault("weak_protocols", []).append(
                            {"version": tok, "reason": rules.WEAK_PROTOCOLS[tok]})
                components.append((None, "transport-protocol", None))

            else:
                alg = rule.get("algorithm")
                if alg is None:
                    continue
                components.append((alg, rule.get("function") or "unknown", None))
                if rule["id"] == "cfg-ecdh-curve" and captured:
                    extra["curves"] = captured

            if not components:
                continue

            # -- enrichment (stage 3, lazy) --------------------------------
            symbol = None
            if lang == "python":
                idx = py_index()
                if idx:
                    symbol = idx.symbol_at(line_no)
                    extra.update(idx.params.get(line_no) or {})
            elif lang == "java":
                symbol = symbol_before(java_index(), line_no)
                if rule["id"] == "java-keypairgen":
                    ks = java_keysize_near(lines, line_no - 1)
                    if ks:
                        extra["key_size"] = ks

            for alg, func, role in components:
                out.append(dict(
                    rule_id=rule["id"], file=rel, line=line_no,
                    col=m.start() - offs[line_no - 1] + 1,
                    snippet=src_line.strip()[:240],
                    match=m.group(0)[:120],
                    algorithm=alg, function=func, role=role,
                    symbol=symbol, language=lang,
                    in_comment=in_comment,
                    extra=dict(extra),
                ))
    return out


def scan_tree(root, repo_id, progress=None, cache=None):
    """
    Scan one repository root.

    `cache` maps content-hash -> findings from a previous run. Passing the
    cache from a prior scan turns this into an incremental rescan: unchanged
    files are matched by SHA-256 of their contents and their findings reused
    verbatim, so only changed files are re-analysed. The speedup this produces
    is measured, not asserted -- see run.py.
    """
    t0 = time.perf_counter()
    inv = enumerate_files(root)
    t_enum = time.perf_counter() - t0

    counters = dict(ast_parsed=0, ast_failed=0, java_indexed=0, triaged_out=0,
                    bytes_read=0, files_with_findings=0)
    findings = []
    new_cache = {}
    cache_hits = 0

    t1 = time.perf_counter()
    for i, (rel, full, size, lang) in enumerate(inv["source"]):
        text = read_text(full)
        if text is None:
            continue
        counters["bytes_read"] += len(text)
        key = rel + "|" + hashlib.sha256(text.encode("utf-8", "replace")).hexdigest()

        if cache is not None and key in cache:
            got = cache[key]
            cache_hits += 1
        else:
            got = scan_source_file(rel, full, lang, text, counters)
        new_cache[key] = got

        if got:
            counters["files_with_findings"] += 1
            findings.extend(got)
        if progress and i % 400 == 0:
            progress(i, len(inv["source"]))
    t_scan = time.perf_counter() - t1

    for f in findings:
        f["repo"] = repo_id
        f["id"] = "f-" + hashlib.sha1(
            f"{repo_id}|{f['file']}|{f['line']}|{f['rule_id']}|{f['algorithm']}|{f['function']}".encode()
        ).hexdigest()[:12]

    return dict(
        findings=findings,
        inventory=inv,
        cache=new_cache,
        telemetry=dict(
            enumerate_seconds=round(t_enum, 4),
            scan_seconds=round(t_scan, 4),
            source_files_scanned=len(inv["source"]),
            files_seen=inv["total_files"],
            bytes_scanned=counters["bytes_read"],
            files_with_findings=counters["files_with_findings"],
            triaged_out=counters["triaged_out"],
            python_ast_parsed=counters["ast_parsed"],
            python_ast_failed=counters["ast_failed"],
            java_files_indexed=counters["java_indexed"],
            cache_hits=cache_hits,
            rules_evaluated=len(rules.RULES),
        ),
    )
