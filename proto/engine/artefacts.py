"""
Non-source cryptographic artefacts: X.509 certificates and dependency manifests.

Certificates are the highest-confidence evidence in the whole system. A
certificate is not inferred from a call site -- it *declares* its own public-key
algorithm, key size, signature algorithm, validity window and Key Usage flags.
We parse those directly (RFC 5280) rather than guessing.

Private key material is never read, never stored and never displayed. Only
metadata leaves this module.
"""

import datetime
import os
import re

from cryptography import x509
from cryptography.hazmat.primitives.asymmetric import rsa, ec, dsa, ed25519, ed448

import rules

# Key Usage flags -> the cryptographic function they declare (RFC 5280 §4.2.1.3)
KEY_USAGE_FUNCTION = [
    ("digital_signature", "digital-signature"),
    ("content_commitment", "digital-signature"),
    ("key_encipherment", "public-key-encryption"),
    ("key_agreement", "key-exchange"),
    ("key_cert_sign", "certificate-identity"),
    ("crl_sign", "digital-signature"),
]

# NIST SP 800-57 minimum key sizes still acceptable classically
MIN_CLASSICAL_BITS = {"RSA": 2048, "DSA": 2048, "ECDSA": 224}


def _pubkey_info(pub):
    if isinstance(pub, rsa.RSAPublicKey):
        return "RSA", pub.key_size, None
    if isinstance(pub, ec.EllipticCurvePublicKey):
        name = pub.curve.name
        pretty = {"secp256r1": "P-256", "secp384r1": "P-384", "secp521r1": "P-521",
                  "secp224r1": "P-224"}.get(name, name)
        return "ECDSA", pub.curve.key_size, pretty
    if isinstance(pub, dsa.DSAPublicKey):
        return "DSA", pub.key_size, None
    if isinstance(pub, ed25519.Ed25519PublicKey):
        return "Ed25519", 256, "Ed25519"
    if isinstance(pub, ed448.Ed448PublicKey):
        return "Ed25519", 448, "Ed448"
    return None, None, None


def parse_certificate(rel, full, today):
    """Parse one certificate file. Returns None if it is not a certificate."""
    try:
        raw = open(full, "rb").read()
    except OSError:
        return None
    if b"PRIVATE KEY" in raw and b"CERTIFICATE" not in raw:
        # A private key file. Record that it exists; never read the material.
        return dict(kind="private-key-file", file=rel, note="Private key material present; not parsed or stored.")
    try:
        cert = x509.load_pem_x509_certificate(raw) if b"-----BEGIN" in raw else x509.load_der_x509_certificate(raw)
    except Exception:
        return None

    alg, bits, curve = _pubkey_info(cert.public_key())
    meta = rules.ALGORITHMS.get(alg, {})

    # Signature algorithm on the certificate itself
    sig_hash = getattr(cert.signature_hash_algorithm, "name", None)
    sig_hash_norm = rules._norm_hash(sig_hash or "")

    # Declared purpose, straight from the Key Usage extension
    functions, usage_flags = [], []
    try:
        ku = cert.extensions.get_extension_for_class(x509.KeyUsage).value
        for attr, func in KEY_USAGE_FUNCTION:
            try:
                if getattr(ku, attr):
                    usage_flags.append(attr)
                    if func not in functions:
                        functions.append(func)
            except ValueError:
                pass
    except x509.ExtensionNotFound:
        pass

    try:
        eku = cert.extensions.get_extension_for_class(x509.ExtendedKeyUsage).value
        ekus = [o._name for o in eku]
    except x509.ExtensionNotFound:
        ekus = []

    try:
        san = cert.extensions.get_extension_for_class(x509.SubjectAlternativeName).value
        dns_names = san.get_values_for_type(x509.DNSName)
    except x509.ExtensionNotFound:
        dns_names = []

    not_after = cert.not_valid_after_utc
    not_before = cert.not_valid_before_utc
    days_left = (not_after - today).days

    issues = []
    floor = MIN_CLASSICAL_BITS.get(alg)
    if floor and bits and bits < floor:
        issues.append(f"{alg}-{bits} is below the NIST SP 800-57 classical minimum of {floor} bits")
    if sig_hash_norm in ("MD5", "SHA-1"):
        issues.append(f"Certificate is signed with {sig_hash_norm}, which is broken today")
    if days_left < 0:
        issues.append(f"Expired {abs(days_left)} days ago")
    elif days_left < 90:
        issues.append(f"Expires in {days_left} days")
    validity_days = (not_after - not_before).days
    if validity_days > 1200:
        issues.append(f"Validity window of {validity_days} days exceeds the 398-day CA/Browser Forum maximum for TLS")

    def cn(name):
        try:
            return name.get_attributes_for_oid(x509.oid.NameOID.COMMON_NAME)[0].value
        except (IndexError, Exception):
            return name.rfc4514_string()

    return dict(
        kind="certificate",
        file=rel,
        subject=cn(cert.subject),
        issuer=cn(cert.issuer),
        serial=format(cert.serial_number, "x")[:32],
        algorithm=alg,
        key_size=bits,
        curve=curve,
        signature_hash=sig_hash_norm or sig_hash,
        quantum=meta.get("quantum"),
        quantum_note=meta.get("note"),
        functions=functions or ["certificate-identity"],
        key_usage=usage_flags,
        extended_key_usage=ekus,
        dns_names=dns_names,
        not_before=not_before.date().isoformat(),
        not_after=not_after.date().isoformat(),
        validity_days=validity_days,
        days_remaining=days_left,
        issues=issues,
        # Key Usage is a declaration, not an inference -- highest confidence tier.
        function_confidence="declared-by-certificate" if usage_flags else "not-declared",
    )


def scan_certificates(root, cert_list, today):
    out = []
    for rel, full, size in cert_list:
        rec = parse_certificate(rel, full, today)
        if rec:
            rec["size_bytes"] = size
            out.append(rec)
    return out


# --------------------------------------------------------------------------
# Dependency manifests
# --------------------------------------------------------------------------

CRYPTO_PACKAGES = {
    "cryptography": "Primary Python crypto provider (RSA, EC, AES, X.509)",
    "pycryptodome": "Alternative Python crypto provider",
    "pycrypto": "Unmaintained since 2013; known CVEs",
    "pyopenssl": "OpenSSL bindings; TLS and X.509",
    "paramiko": "SSH implementation; RSA/ECDSA/Ed25519 host and user keys",
    "pyjwt": "JWT signing and verification (RS256/ES256/HS256)",
    "bcrypt": "Password hashing",
    "certifi": "CA trust store",
    "rsa": "Pure-Python RSA implementation",
    "ecdsa": "Pure-Python ECDSA implementation",
    "oscrypto": "Crypto bindings to system libraries",
    "nacl": "libsodium bindings (Ed25519, X25519)",
    "pynacl": "libsodium bindings (Ed25519, X25519)",
    "bcprov-jdk18on": "Bouncy Castle JCE provider",
    "bcprov-jdk15on": "Bouncy Castle JCE provider (older JDK target)",
    "bcpkix-jdk18on": "Bouncy Castle PKIX/CMS/certificate tooling",
    "jjwt-impl": "Java JWT implementation",
    "jjwt-api": "Java JWT API",
    "tink": "Google Tink crypto library",
    "conscrypt-openjdk": "Conscrypt JSSE provider",
    "liboqs-python": "Open Quantum Safe bindings -- post-quantum algorithms",
    "oqs": "Open Quantum Safe bindings -- post-quantum algorithms",
}

REQ_RX = re.compile(r'^\s*([A-Za-z0-9_.\-]+)\s*(?:\[[^\]]*\])?\s*([=<>!~]=?\s*[0-9][^\s;#]*)?', re.MULTILINE)
POM_DEP_RX = re.compile(
    r'<dependency>\s*(?:<groupId>([^<]+)</groupId>)?\s*<artifactId>([^<]+)</artifactId>\s*(?:<version>([^<]+)</version>)?',
    re.DOTALL)


def scan_dependencies(root, dep_list):
    out = []
    for rel, full, size in dep_list:
        name = os.path.basename(rel)
        try:
            text = open(full, "r", encoding="utf-8", errors="replace").read()
        except OSError:
            continue
        if name == "requirements.txt":
            for m in REQ_RX.finditer(text):
                pkg = m.group(1)
                if not pkg or pkg.startswith("#"):
                    continue
                key = pkg.lower()
                if key in CRYPTO_PACKAGES:
                    out.append(dict(file=rel, ecosystem="pypi", package=pkg,
                                    version=(m.group(2) or "").strip().lstrip("=<>~! "),
                                    role=CRYPTO_PACKAGES[key],
                                    line=text.count("\n", 0, m.start()) + 1))
        elif name == "pom.xml":
            for m in POM_DEP_RX.finditer(text):
                art = (m.group(2) or "").strip()
                if art.lower() in CRYPTO_PACKAGES:
                    out.append(dict(file=rel, ecosystem="maven",
                                    package=f"{(m.group(1) or '').strip()}:{art}".strip(":"),
                                    version=(m.group(3) or "").strip(),
                                    role=CRYPTO_PACKAGES[art.lower()],
                                    line=text.count("\n", 0, m.start()) + 1))
    return out
