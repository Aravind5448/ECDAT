"""
ECDAT cryptographic knowledge base.

Two tables live here:

  ALGORITHMS -- what each primitive is, and how a cryptographically-relevant
                quantum computer (CRQC) affects it.
  RULES      -- how each primitive appears in real source code and config.

Nothing in this file is a guess about the future. The quantum classification
follows NIST IR 8547 (transition to PQC standards) and the published effect of
Shor's and Grover's algorithms on each primitive family.
"""

import re

# --------------------------------------------------------------------------
# Quantum status vocabulary
#
#  shor-broken        Public-key primitive fully broken by Shor's algorithm.
#                     A CRQC recovers the private key from the public key.
#  classically-broken Already broken or deprecated today, without any quantum
#                     computer. Higher urgency than quantum risk.
#  grover-reduced     Symmetric primitive whose effective strength is reduced
#                     (not broken) by Grover's algorithm.
#  quantum-safe       No known practical quantum advantage at this parameter
#                     size, or a NIST PQC standard.
# --------------------------------------------------------------------------

ALGORITHMS = {
    # ---- Public key: broken by Shor ----------------------------------------
    "RSA": dict(family="asymmetric", quantum="shor-broken", nist_pqc=None,
                note="Shor's algorithm factors the modulus, recovering the private key from the public key.",
                replacement="ML-KEM (key transport) / ML-DSA (signatures)"),
    "ECDSA": dict(family="asymmetric", quantum="shor-broken", nist_pqc=None,
                  note="Shor's algorithm solves the elliptic-curve discrete log, recovering the signing key.",
                  replacement="ML-DSA (FIPS 204)"),
    "ECDH": dict(family="asymmetric", quantum="shor-broken", nist_pqc=None,
                 note="Shor recovers the shared secret. Recorded traffic is decryptable retroactively.",
                 replacement="ML-KEM (FIPS 203), hybrid X25519MLKEM768 during transition"),
    "DH": dict(family="asymmetric", quantum="shor-broken", nist_pqc=None,
               note="Finite-field discrete log falls to Shor. Recorded handshakes are retroactively readable.",
               replacement="ML-KEM (FIPS 203)"),
    "DSA": dict(family="asymmetric", quantum="shor-broken", nist_pqc=None,
                note="Shor-broken, and already withdrawn for new signatures by FIPS 186-5.",
                replacement="ML-DSA (FIPS 204)"),
    "Ed25519": dict(family="asymmetric", quantum="shor-broken", nist_pqc=None,
                    note="Edwards-curve signature. Shor applies to the discrete log exactly as for ECDSA.",
                    replacement="ML-DSA (FIPS 204)"),
    "X25519": dict(family="asymmetric", quantum="shor-broken", nist_pqc=None,
                   note="Montgomery-curve key exchange. Shor recovers the shared secret.",
                   replacement="X25519MLKEM768 hybrid, then ML-KEM"),
    "ElGamal": dict(family="asymmetric", quantum="shor-broken", nist_pqc=None,
                    note="Discrete-log based; broken by Shor.", replacement="ML-KEM"),

    # ---- Already broken today ----------------------------------------------
    "MD5": dict(family="hash", quantum="classically-broken", nist_pqc=None,
                note="Practical collisions since 2004. Unsafe for any security purpose today; quantum is irrelevant.",
                replacement="SHA-256 or SHA-3"),
    "SHA-1": dict(family="hash", quantum="classically-broken", nist_pqc=None,
                  note="Chosen-prefix collisions demonstrated (SHAmbles, 2020). Disallowed by NIST after 2030.",
                  replacement="SHA-256 or SHA-3"),
    "DES": dict(family="symmetric", quantum="classically-broken", nist_pqc=None,
                note="56-bit key, brute-forceable in hours on commodity hardware.", replacement="AES-256"),
    "RC4": dict(family="symmetric", quantum="classically-broken", nist_pqc=None,
                note="Biased keystream; prohibited in TLS by RFC 7465.", replacement="AES-256-GCM"),
    "3DES": dict(family="symmetric", quantum="classically-broken", nist_pqc=None,
                 note="112-bit effective strength and a 64-bit block (Sweet32). Deprecated by NIST after 2023.",
                 replacement="AES-256-GCM"),
    "Blowfish": dict(family="symmetric", quantum="classically-broken", nist_pqc=None,
                     note="64-bit block, vulnerable to birthday attacks on long-lived sessions.", replacement="AES-256-GCM"),
    "RC2": dict(family="symmetric", quantum="classically-broken", nist_pqc=None,
                note="Obsolete 64-bit block cipher.", replacement="AES-256-GCM"),
    "MD4": dict(family="hash", quantum="classically-broken", nist_pqc=None,
                note="Broken since 1995.", replacement="SHA-256"),

    # ---- Symmetric: weakened but not broken --------------------------------
    "AES-128": dict(family="symmetric", quantum="grover-reduced", nist_pqc=None,
                    note="Grover halves the effective search space to ~2^64 operations. Still infeasible in practice, but NIST advises AES-256 where confidentiality must outlive the CRQC.",
                    replacement="AES-256 for long-lived data"),
    "AES-192": dict(family="symmetric", quantum="grover-reduced", nist_pqc=None,
                    note="Grover reduces effective strength to ~96 bits.", replacement="AES-256 for long-lived data"),
    "AES-256": dict(family="symmetric", quantum="quantum-safe", nist_pqc=None,
                    note="~128-bit effective strength even under Grover. Approved for the post-quantum era.",
                    replacement=None),
    "AES": dict(family="symmetric", quantum="grover-reduced", nist_pqc=None,
                note="Key size is not resolvable from this call site. AES-256 is quantum-safe; AES-128 is Grover-reduced.",
                replacement="Confirm 256-bit keys for long-lived data"),
    "ChaCha20": dict(family="symmetric", quantum="quantum-safe", nist_pqc=None,
                     note="256-bit key; ~128-bit effective strength under Grover.", replacement=None),

    # ---- Hashes ------------------------------------------------------------
    "SHA-256": dict(family="hash", quantum="quantum-safe", nist_pqc=None,
                    note="Grover reduces preimage resistance to ~2^128, which remains infeasible. Collision resistance is unaffected in practice.",
                    replacement=None),
    "SHA-384": dict(family="hash", quantum="quantum-safe", nist_pqc=None, note="Approved at all security levels.", replacement=None),
    "SHA-512": dict(family="hash", quantum="quantum-safe", nist_pqc=None, note="Approved at all security levels.", replacement=None),
    "SHA-224": dict(family="hash", quantum="grover-reduced", nist_pqc=None,
                    note="112-bit collision resistance; below the 128-bit floor for long-lived data.", replacement="SHA-256"),
    "SHA-3": dict(family="hash", quantum="quantum-safe", nist_pqc=None, note="Sponge construction, approved.", replacement=None),
    "BLAKE2": dict(family="hash", quantum="quantum-safe", nist_pqc=None, note="Not NIST-standardised, but cryptographically sound.", replacement=None),

    # ---- MAC / KDF / RNG ---------------------------------------------------
    "HMAC": dict(family="mac", quantum="quantum-safe", nist_pqc=None,
                 note="Security rests on the key, not on collision resistance. No practical quantum advantage.", replacement=None),
    "PBKDF2": dict(family="kdf", quantum="quantum-safe", nist_pqc=None,
                   note="Grover offers at most a square-root speedup against the password space; iteration count is the real control.", replacement=None),
    "HKDF": dict(family="kdf", quantum="quantum-safe", nist_pqc=None, note="Extract-and-expand KDF; no quantum weakness.", replacement=None),
    "scrypt": dict(family="kdf", quantum="quantum-safe", nist_pqc=None, note="Memory-hard KDF.", replacement=None),
    "bcrypt": dict(family="kdf", quantum="quantum-safe", nist_pqc=None, note="Password hashing; no quantum weakness.", replacement=None),
    "CSPRNG": dict(family="rng", quantum="quantum-safe", nist_pqc=None, note="Cryptographically secure randomness source.", replacement=None),
    "WEAK-PRNG": dict(family="rng", quantum="classically-broken", nist_pqc=None,
                      note="Non-cryptographic PRNG. Predictable output; unsafe for keys, nonces or tokens.",
                      replacement="secrets / os.urandom / SecureRandom"),

    # ---- PQC: the destination ---------------------------------------------
    "ML-KEM": dict(family="kem", quantum="quantum-safe", nist_pqc="FIPS 203",
                   note="Module-lattice key encapsulation. The NIST standard replacement for ECDH/RSA key transport.", replacement=None),
    "ML-DSA": dict(family="asymmetric", quantum="quantum-safe", nist_pqc="FIPS 204",
                   note="Module-lattice digital signature. The NIST standard replacement for RSA/ECDSA signing.", replacement=None),
    "SLH-DSA": dict(family="asymmetric", quantum="quantum-safe", nist_pqc="FIPS 205",
                    note="Stateless hash-based signature. Conservative fallback; larger signatures, slower signing.", replacement=None),
}

FUNCTIONS = [
    "digital-signature", "key-exchange", "key-encapsulation", "public-key-encryption",
    "symmetric-encryption", "hashing", "message-authentication", "key-derivation",
    "random-generation", "certificate-identity", "transport-protocol", "unknown",
]


def _norm_hash(u):
    u = (u or "").upper().replace("-", "").replace("/", "").replace("_", "")
    return {
        "MD5": "MD5", "MD4": "MD4", "SHA1": "SHA-1", "SHA": "SHA-1",
        "SHA224": "SHA-224", "SHA256": "SHA-256", "SHA384": "SHA-384",
        "SHA512": "SHA-512", "SHA3": "SHA-3", "SHA3256": "SHA-3", "SHA3512": "SHA-3",
    }.get(u)


def resolve_jca(spec):
    """
    Resolve a JCA/OpenSSL-style algorithm string to (algorithm, function, extra).

    Strings like "SHA256withRSA" declare their own meaning, so decoding them is
    a high-confidence read of the source, not an inference.
    """
    s = (spec or "").strip()
    u = s.upper().replace(" ", "")
    extra = {}

    m = re.match(r"^(MD5|SHA-?1|SHA-?224|SHA-?256|SHA-?384|SHA-?512)WITH(RSAANDMGF1|RSA|DSA|ECDSA)$", u)
    if m:
        extra["digest"] = _norm_hash(m.group(1))
        sigalg = "RSA" if m.group(2).startswith("RSA") else m.group(2)
        return sigalg, "digital-signature", extra
    if u in ("RSASSA-PSS", "PSS"):
        return "RSA", "digital-signature", extra
    if u in ("ED25519", "EDDSA"):
        return "Ed25519", "digital-signature", extra

    if "/" in u or u in ("AES", "DESEDE", "TRIPLEDES", "DES", "RC4", "ARCFOUR", "BLOWFISH", "RC2", "CHACHA20"):
        parts = u.split("/")
        base = parts[0]
        if len(parts) > 1:
            extra["mode"] = parts[1]
        mapping = {
            "RSA": ("RSA", "public-key-encryption"),
            "AES": ("AES", "symmetric-encryption"),
            "DESEDE": ("3DES", "symmetric-encryption"),
            "TRIPLEDES": ("3DES", "symmetric-encryption"),
            "DES": ("DES", "symmetric-encryption"),
            "RC4": ("RC4", "symmetric-encryption"),
            "ARCFOUR": ("RC4", "symmetric-encryption"),
            "BLOWFISH": ("Blowfish", "symmetric-encryption"),
            "RC2": ("RC2", "symmetric-encryption"),
        }
        if base in mapping:
            return mapping[base][0], mapping[base][1], extra
        if base.startswith("CHACHA"):
            return "ChaCha20", "symmetric-encryption", extra

    if u in ("ECDH", "ECDHE"):
        return "ECDH", "key-exchange", extra
    if u in ("DH", "DIFFIEHELLMAN", "DHE"):
        return "DH", "key-exchange", extra
    if u in ("RSA",):
        return "RSA", "digital-signature", extra
    if u in ("EC", "ECDSA"):
        return "ECDSA", "digital-signature", extra
    if u in ("DSA",):
        return "DSA", "digital-signature", extra

    if u.startswith("HMAC"):
        extra["digest"] = _norm_hash(u[4:])
        return "HMAC", "message-authentication", extra

    h = _norm_hash(u)
    if h:
        return h, "hashing", extra

    if u.startswith("TLS") or u.startswith("SSL"):
        return None, "transport-protocol", {"protocol": s}

    return None, "unknown", extra


def resolve_cipher_suite(suite):
    """
    Decode a TLS cipher suite name into its component primitives.

      TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384
        ECDHE       -> key exchange
        RSA         -> authentication (certificate signature)
        AES_256_GCM -> bulk encryption
        SHA384      -> handshake integrity

    Returns a list of (algorithm, function, role) triples.
    """
    u = suite.upper().replace("-", "_")
    out = []
    kx_map = {"ECDHE": "ECDH", "ECDH": "ECDH", "DHE": "DH", "DH": "DH", "RSA": "RSA"}

    if u.startswith("TLS_"):
        body = u[4:]
        kx_part, sep, rest = body.partition("_WITH_")
        if not sep:
            kx_part, rest = "", body
        toks = [t for t in kx_part.split("_") if t]
        if toks:
            kx = kx_map.get(toks[0])
            if kx:
                out.append((kx, "key-exchange", "key exchange"))
            if len(toks) > 1 and toks[1] in ("RSA", "ECDSA", "DSS"):
                out.append(("DSA" if toks[1] == "DSS" else toks[1], "digital-signature", "authentication"))
    else:
        rest = u
        for t in ("ECDHE", "DHE", "ECDH"):
            if u.startswith(t):
                out.append((kx_map[t], "key-exchange", "key exchange"))
                break
        for t in ("ECDSA", "RSA"):
            if u.startswith(t) or ("_" + t + "_") in ("_" + u + "_"):
                out.append((t, "digital-signature", "authentication"))
                break

    if "AES_256" in rest or "AES256" in rest:
        out.append(("AES-256", "symmetric-encryption", "bulk encryption"))
    elif "AES_128" in rest or "AES128" in rest:
        out.append(("AES-128", "symmetric-encryption", "bulk encryption"))
    elif "3DES" in rest or "DES_EDE" in rest:
        out.append(("3DES", "symmetric-encryption", "bulk encryption"))
    elif "RC4" in rest:
        out.append(("RC4", "symmetric-encryption", "bulk encryption"))
    elif "CHACHA20" in rest:
        out.append(("ChaCha20", "symmetric-encryption", "bulk encryption"))

    for h in ("SHA384", "SHA256", "SHA1", "SHA"):
        if rest.endswith(h):
            out.append((_norm_hash(h), "hashing", "handshake integrity"))
            break

    seen, uniq = set(), []
    for a, f, r in out:
        if a and (a, f, r) not in seen:
            seen.add((a, f, r))
            uniq.append((a, f, r))
    return uniq


# --------------------------------------------------------------------------
# Detection rules.
#
# kind:
#   "jca"   -- capture group 1 is an algorithm string, resolved by resolve_jca
#   "suite" -- capture group 1 is a TLS cipher-suite list
#   "fixed" -- the pattern itself identifies the algorithm
#
# Rule ids are stable so a finding can always be traced back to the rule that
# produced it.
# --------------------------------------------------------------------------

RULES = [
    # ---------------- Java (JCA) ----------------
    dict(id="java-signature", langs=["java"], kind="jca", function=None,
         pattern=r'Signature\s*\.\s*getInstance\s*\(\s*"([^"]+)"'),
    dict(id="java-cipher", langs=["java"], kind="jca", function=None,
         pattern=r'Cipher\s*\.\s*getInstance\s*\(\s*"([^"]+)"'),
    dict(id="java-keypairgen", langs=["java"], kind="jca", function="key-generation",
         pattern=r'KeyPairGenerator\s*\.\s*getInstance\s*\(\s*"([^"]+)"'),
    dict(id="java-keyagreement", langs=["java"], kind="jca", function="key-exchange",
         pattern=r'KeyAgreement\s*\.\s*getInstance\s*\(\s*"([^"]+)"'),
    dict(id="java-digest", langs=["java"], kind="jca", function="hashing",
         pattern=r'MessageDigest\s*\.\s*getInstance\s*\(\s*"([^"]+)"'),
    dict(id="java-mac", langs=["java"], kind="jca", function="message-authentication",
         pattern=r'Mac\s*\.\s*getInstance\s*\(\s*"([^"]+)"'),
    dict(id="java-keyfactory", langs=["java"], kind="jca", function=None,
         pattern=r'KeyFactory\s*\.\s*getInstance\s*\(\s*"([^"]+)"'),
    dict(id="java-keygen", langs=["java"], kind="jca", function=None,
         pattern=r'KeyGenerator\s*\.\s*getInstance\s*\(\s*"([^"]+)"'),
    dict(id="java-sslcontext", langs=["java"], kind="fixed", function="transport-protocol",
         algorithm=None, pattern=r'SSLContext\s*\.\s*getInstance\s*\(\s*"(TLS[^"]*|SSL[^"]*)"',
         capture_protocol=True),
    dict(id="java-securerandom", langs=["java"], kind="fixed", function="random-generation",
         algorithm="CSPRNG", pattern=r'\bnew\s+SecureRandom\s*\('),
    dict(id="java-weak-random", langs=["java"], kind="fixed", function="random-generation",
         algorithm="WEAK-PRNG", pattern=r'\bnew\s+java\.util\.Random\s*\(|\bMath\s*\.\s*random\s*\('),
    dict(id="jjwt-sigalg", langs=["java"], kind="fixed", function="digital-signature",
         algorithm=None, pattern=r'SignatureAlgorithm\s*\.\s*(RS\d{3}|ES\d{3}|PS\d{3}|HS\d{3}|EdDSA)',
         jwt_alg=True),
    dict(id="jwt-alg-string", langs=["java", "python"], kind="fixed", function="digital-signature",
         algorithm=None, pattern=r'["\'](RS256|RS384|RS512|ES256|ES384|ES512|PS256|PS384|PS512|HS256|HS384|HS512|EdDSA)["\']',
         jwt_alg=True),

    # ---------------- Python: pyca/cryptography ----------------
    dict(id="py-rsa-gen", langs=["python"], kind="fixed", function="key-generation",
         algorithm="RSA", pattern=r'\brsa\s*\.\s*generate_private_key\s*\('),
    dict(id="py-ec-gen", langs=["python"], kind="fixed", function="key-generation",
         algorithm="ECDSA", pattern=r'\bec\s*\.\s*generate_private_key\s*\('),
    dict(id="py-dsa-gen", langs=["python"], kind="fixed", function="key-generation",
         algorithm="DSA", pattern=r'\bdsa\s*\.\s*generate_private_key\s*\('),
    dict(id="py-dh-gen", langs=["python"], kind="fixed", function="key-exchange",
         algorithm="DH", pattern=r'\bdh\s*\.\s*generate_parameters\s*\(|\bDHParameterNumbers\s*\('),
    dict(id="py-ecdh", langs=["python"], kind="fixed", function="key-exchange",
         algorithm="ECDH", pattern=r'\bec\s*\.\s*ECDH\s*\(|\.exchange\s*\(\s*ec\.ECDH\s*\('),
    dict(id="py-x25519", langs=["python"], kind="fixed", function="key-exchange",
         algorithm="X25519", pattern=r'\bX25519PrivateKey\b|\bx25519\s*\.\s*generate'),
    dict(id="py-x448", langs=["python"], kind="fixed", function="key-exchange",
         algorithm="X25519", pattern=r'\bX448PrivateKey\b'),
    dict(id="py-ed25519", langs=["python"], kind="fixed", function="digital-signature",
         algorithm="Ed25519", pattern=r'\bEd25519PrivateKey\b|\bed25519\s*\.\s*Ed25519'),
    dict(id="py-ed448", langs=["python"], kind="fixed", function="digital-signature",
         algorithm="Ed25519", pattern=r'\bEd448PrivateKey\b'),
    dict(id="py-padding-pkcs1", langs=["python"], kind="fixed", function="digital-signature",
         algorithm="RSA", pattern=r'\bpadding\s*\.\s*PKCS1v15\s*\('),
    dict(id="py-padding-pss", langs=["python"], kind="fixed", function="digital-signature",
         algorithm="RSA", pattern=r'\bpadding\s*\.\s*PSS\s*\('),
    dict(id="py-padding-oaep", langs=["python"], kind="fixed", function="public-key-encryption",
         algorithm="RSA", pattern=r'\bpadding\s*\.\s*OAEP\s*\('),
    dict(id="py-aes", langs=["python"], kind="fixed", function="symmetric-encryption",
         algorithm="AES", pattern=r'\balgorithms\s*\.\s*AES\s*\(|\bAESGCM\s*\(|\bAESCCM\s*\(|\bAESSIV\s*\('),
    dict(id="py-3des", langs=["python"], kind="fixed", function="symmetric-encryption",
         algorithm="3DES", pattern=r'\balgorithms\s*\.\s*TripleDES\s*\('),
    dict(id="py-rc4", langs=["python"], kind="fixed", function="symmetric-encryption",
         algorithm="RC4", pattern=r'\balgorithms\s*\.\s*ARC4\s*\('),
    dict(id="py-blowfish", langs=["python"], kind="fixed", function="symmetric-encryption",
         algorithm="Blowfish", pattern=r'\balgorithms\s*\.\s*Blowfish\s*\('),
    dict(id="py-chacha", langs=["python"], kind="fixed", function="symmetric-encryption",
         algorithm="ChaCha20", pattern=r'\balgorithms\s*\.\s*ChaCha20\s*\(|\bChaCha20Poly1305\s*\('),
    dict(id="py-hash-md5", langs=["python"], kind="fixed", function="hashing",
         algorithm="MD5", pattern=r'\bhashlib\s*\.\s*md5\s*\(|\bhashes\s*\.\s*MD5\s*\('),
    dict(id="py-hash-sha1", langs=["python"], kind="fixed", function="hashing",
         algorithm="SHA-1", pattern=r'\bhashlib\s*\.\s*sha1\s*\(|\bhashes\s*\.\s*SHA1\s*\('),
    dict(id="py-hash-sha256", langs=["python"], kind="fixed", function="hashing",
         algorithm="SHA-256", pattern=r'\bhashlib\s*\.\s*sha256\s*\(|\bhashes\s*\.\s*SHA256\s*\('),
    dict(id="py-hash-sha384", langs=["python"], kind="fixed", function="hashing",
         algorithm="SHA-384", pattern=r'\bhashlib\s*\.\s*sha384\s*\(|\bhashes\s*\.\s*SHA384\s*\('),
    dict(id="py-hash-sha512", langs=["python"], kind="fixed", function="hashing",
         algorithm="SHA-512", pattern=r'\bhashlib\s*\.\s*sha512\s*\(|\bhashes\s*\.\s*SHA512\s*\('),
    dict(id="py-hash-sha3", langs=["python"], kind="fixed", function="hashing",
         algorithm="SHA-3", pattern=r'\bhashlib\s*\.\s*sha3_\d+\s*\(|\bhashes\s*\.\s*SHA3_\d+\s*\('),
    dict(id="py-hmac", langs=["python"], kind="fixed", function="message-authentication",
         algorithm="HMAC", pattern=r'\bhmac\s*\.\s*new\s*\(|\bhmac\s*\.\s*HMAC\s*\(|\bHMAC\s*\('),
    dict(id="py-pbkdf2", langs=["python"], kind="fixed", function="key-derivation",
         algorithm="PBKDF2", pattern=r'\bPBKDF2HMAC\s*\(|\bpbkdf2_hmac\s*\('),
    dict(id="py-hkdf", langs=["python"], kind="fixed", function="key-derivation",
         algorithm="HKDF", pattern=r'\bHKDF\s*\(|\bHKDFExpand\s*\('),
    dict(id="py-scrypt", langs=["python"], kind="fixed", function="key-derivation",
         algorithm="scrypt", pattern=r'\bScrypt\s*\(|\bhashlib\s*\.\s*scrypt\s*\('),
    dict(id="py-bcrypt", langs=["python"], kind="fixed", function="key-derivation",
         algorithm="bcrypt", pattern=r'\bbcrypt\s*\.\s*hashpw\s*\(|\bbcrypt\s*\.\s*gensalt\s*\('),
    dict(id="py-csprng", langs=["python"], kind="fixed", function="random-generation",
         algorithm="CSPRNG", pattern=r'\bos\s*\.\s*urandom\s*\(|\bsecrets\s*\.\s*token_|\bsecrets\s*\.\s*choice\s*\('),
    dict(id="py-weak-random", langs=["python"], kind="fixed", function="random-generation",
         algorithm="WEAK-PRNG", pattern=r'\brandom\s*\.\s*(random|randint|choice|randrange|getrandbits)\s*\('),

    # ---------------- Python: PyCryptodome / rsa / ssl ----------------
    dict(id="pycrypto-aes", langs=["python"], kind="fixed", function="symmetric-encryption",
         algorithm="AES", pattern=r'\bAES\s*\.\s*new\s*\('),
    dict(id="pycrypto-des3", langs=["python"], kind="fixed", function="symmetric-encryption",
         algorithm="3DES", pattern=r'\bDES3\s*\.\s*new\s*\('),
    dict(id="pycrypto-des", langs=["python"], kind="fixed", function="symmetric-encryption",
         algorithm="DES", pattern=r'\bDES\s*\.\s*new\s*\('),
    dict(id="pycrypto-arc4", langs=["python"], kind="fixed", function="symmetric-encryption",
         algorithm="RC4", pattern=r'\bARC4\s*\.\s*new\s*\('),
    dict(id="pycrypto-rsa", langs=["python"], kind="fixed", function="key-generation",
         algorithm="RSA", pattern=r'\bRSA\s*\.\s*generate\s*\(|\bPKCS1_OAEP\s*\.\s*new\s*\(|\bpkcs1_15\s*\.\s*new\s*\('),
    dict(id="py-ssl-protocol", langs=["python"], kind="fixed", function="transport-protocol",
         algorithm=None, pattern=r'ssl\s*\.\s*(PROTOCOL_TLSv1(?:_\d)?|PROTOCOL_SSLv2|PROTOCOL_SSLv3|PROTOCOL_TLS)\b',
         capture_protocol=True),
    dict(id="py-ssl-ciphers", langs=["python"], kind="suite", function="transport-protocol",
         pattern=r'set_ciphers\s*\(\s*["\']([^"\']+)["\']'),

    # ---------------- PQC (the destination state) ----------------
    dict(id="pqc-mlkem", langs=["python", "java"], kind="fixed", function="key-encapsulation",
         algorithm="ML-KEM", pattern=r'\bML[-_]?KEM[-_]?(?:512|768|1024)?\b|\bMLKEM\d*(?:PrivateKey|PublicKey)\b|\bKyber\d*\b'),
    dict(id="pqc-mldsa", langs=["python", "java"], kind="fixed", function="digital-signature",
         algorithm="ML-DSA", pattern=r'\bML[-_]?DSA[-_]?(?:44|65|87)?\b|\bMLDSA\d*(?:PrivateKey|PublicKey)\b|\bDilithium\d*\b'),
    dict(id="pqc-slhdsa", langs=["python", "java"], kind="fixed", function="digital-signature",
         algorithm="SLH-DSA", pattern=r'\bSLH[-_]?DSA\b|\bSPHINCS\+?\b'),

    # ---------------- Config / infrastructure ----------------
    dict(id="cfg-cipher-list", langs=["config"], kind="suite", function="transport-protocol",
         pattern=r'^\s*(?:ssl_ciphers|CipherSuites|Ciphers|ssl_cipher_list)\s*[= ]\s*["\']?([A-Za-z0-9_:+!\-,]+)'),
    dict(id="cfg-tls-protocols", langs=["config"], kind="fixed", function="transport-protocol",
         algorithm=None, pattern=r'^\s*(?:ssl_protocols|MinProtocol|Protocols|SSLProtocol)\s*[= ]\s*([A-Za-z0-9_.: v]+)',
         capture_protocol=True),
    dict(id="cfg-ecdh-curve", langs=["config"], kind="fixed", function="key-exchange",
         algorithm="ECDH", pattern=r'^\s*(?:ssl_ecdh_curve|Groups|Curves)\s*[= ]\s*([A-Za-z0-9_:\-]+)'),
]

# Pre-compile
for _r in RULES:
    _r["rx"] = re.compile(_r["pattern"], re.MULTILINE)

# JWT "alg" header values -> underlying primitive
JWT_ALGS = {
    "RS256": ("RSA", "SHA-256"), "RS384": ("RSA", "SHA-384"), "RS512": ("RSA", "SHA-512"),
    "PS256": ("RSA", "SHA-256"), "PS384": ("RSA", "SHA-384"), "PS512": ("RSA", "SHA-512"),
    "ES256": ("ECDSA", "SHA-256"), "ES384": ("ECDSA", "SHA-384"), "ES512": ("ECDSA", "SHA-512"),
    "HS256": ("HMAC", "SHA-256"), "HS384": ("HMAC", "SHA-384"), "HS512": ("HMAC", "SHA-512"),
    "EdDSA": ("Ed25519", None),
}

# Deprecated / risky TLS protocol versions
WEAK_PROTOCOLS = {
    "SSLV2": "SSLv2 is prohibited (RFC 6176).",
    "SSLV3": "SSLv3 is prohibited (RFC 7568, POODLE).",
    "TLSV1": "TLS 1.0 is deprecated (RFC 8996).",
    "TLSV1.0": "TLS 1.0 is deprecated (RFC 8996).",
    "TLSV1_1": "TLS 1.1 is deprecated (RFC 8996).",
    "TLSV1.1": "TLS 1.1 is deprecated (RFC 8996).",
    "PROTOCOL_TLSV1": "TLS 1.0 is deprecated (RFC 8996).",
    "PROTOCOL_TLSV1_1": "TLS 1.1 is deprecated (RFC 8996).",
    "PROTOCOL_SSLV2": "SSLv2 is prohibited (RFC 6176).",
    "PROTOCOL_SSLV3": "SSLv3 is prohibited (RFC 7568, POODLE).",
}
