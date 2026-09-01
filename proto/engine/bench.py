"""
Migration Passport benchmark.

This is the part of ECDAT that stops describing risk and starts measuring the
cost of fixing it. Every number produced here is measured on the machine the
scan runs on -- nothing is quoted from a datasheet.

What it measures, for each candidate migration path:

  * signing and verification throughput (classical vs ML-DSA)
  * key establishment throughput (ECDH/X25519 vs ML-KEM)
  * on-the-wire sizes: public key, signature, ciphertext
  * real X.509 certificate size when issued under each algorithm

The size numbers matter as much as the timings. ML-DSA is competitive on
speed, but a ML-DSA-65 signature is 3309 bytes against 256 for RSA-2048 --
that is the constraint that actually breaks protocols, MTUs and embedded
clients, and it is the thing a migration plan has to budget for.
"""

import datetime
import platform
import statistics
import time

from cryptography import x509
from cryptography.x509.oid import NameOID
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import rsa, ec, ed25519, x25519, padding

try:
    from cryptography.hazmat.primitives.asymmetric import mldsa, mlkem
    PQC_AVAILABLE = True
except ImportError:                                    # pragma: no cover
    PQC_AVAILABLE = False

MESSAGE = b"NIVESH-SETTLEMENT-BATCH-2026-08-31|amount=48250000|currency=INR|txn=91847362"


def _time_op(fn, min_iters=30, min_seconds=0.35, max_iters=3000):
    """
    Time an operation properly: warm up, then run until both a minimum
    iteration count and a minimum wall-clock window are satisfied. Report the
    median (robust to scheduler noise) alongside mean and spread.
    """
    for _ in range(5):
        fn()
    samples = []
    t_start = time.perf_counter()
    while len(samples) < max_iters:
        t0 = time.perf_counter()
        fn()
        samples.append((time.perf_counter() - t0) * 1000.0)
        if len(samples) >= min_iters and (time.perf_counter() - t_start) >= min_seconds:
            break
    samples.sort()
    return dict(
        median_ms=round(statistics.median(samples), 4),
        mean_ms=round(statistics.fmean(samples), 4),
        p95_ms=round(samples[min(len(samples) - 1, int(len(samples) * 0.95))], 4),
        min_ms=round(samples[0], 4),
        stdev_ms=round(statistics.pstdev(samples), 4) if len(samples) > 1 else 0.0,
        ops_per_sec=round(1000.0 / statistics.median(samples), 1),
        samples=len(samples),
    )


def _raw_pub_len(pub):
    for enc, fmt in ((serialization.Encoding.Raw, serialization.PublicFormat.Raw),
                     (serialization.Encoding.DER, serialization.PublicFormat.SubjectPublicKeyInfo)):
        try:
            return len(pub.public_bytes(enc, fmt))
        except Exception:
            continue
    return None


def _spki_len(pub):
    try:
        return len(pub.public_bytes(serialization.Encoding.DER,
                                    serialization.PublicFormat.SubjectPublicKeyInfo))
    except Exception:
        return None


# --------------------------------------------------------------------------
# Signature algorithms
# --------------------------------------------------------------------------

def bench_signatures():
    out = []

    # -- RSA-2048 (what payment-api uses today) --
    for bits in (2048, 3072):
        key = rsa.generate_private_key(public_exponent=65537, key_size=bits)
        pub = key.public_key()
        pad = padding.PKCS1v15()
        sig = key.sign(MESSAGE, pad, hashes.SHA256())
        out.append(dict(
            name=f"RSA-{bits}", family="classical", role="signature",
            quantum="shor-broken",
            keygen=None,   # RSA keygen is highly variable; measured separately
            sign=_time_op(lambda: key.sign(MESSAGE, pad, hashes.SHA256())),
            verify=_time_op(lambda: pub.verify(sig, MESSAGE, pad, hashes.SHA256())),
            signature_bytes=len(sig),
            public_key_bytes=_spki_len(pub),
            security_note="Shor recovers the private key from the public key.",
        ))

    # -- ECDSA P-256 (what citizen-portal uses today) --
    eckey = ec.generate_private_key(ec.SECP256R1())
    ecpub = eckey.public_key()
    ecsig = eckey.sign(MESSAGE, ec.ECDSA(hashes.SHA256()))
    out.append(dict(
        name="ECDSA-P256", family="classical", role="signature", quantum="shor-broken",
        keygen=_time_op(lambda: ec.generate_private_key(ec.SECP256R1())),
        sign=_time_op(lambda: eckey.sign(MESSAGE, ec.ECDSA(hashes.SHA256()))),
        verify=_time_op(lambda: ecpub.verify(ecsig, MESSAGE, ec.ECDSA(hashes.SHA256()))),
        signature_bytes=len(ecsig),
        public_key_bytes=_spki_len(ecpub),
        security_note="Shor solves the elliptic-curve discrete log.",
    ))

    # -- Ed25519 --
    edkey = ed25519.Ed25519PrivateKey.generate()
    edpub = edkey.public_key()
    edsig = edkey.sign(MESSAGE)
    out.append(dict(
        name="Ed25519", family="classical", role="signature", quantum="shor-broken",
        keygen=_time_op(ed25519.Ed25519PrivateKey.generate),
        sign=_time_op(lambda: edkey.sign(MESSAGE)),
        verify=_time_op(lambda: edpub.verify(edsig, MESSAGE)),
        signature_bytes=len(edsig),
        public_key_bytes=_raw_pub_len(edpub),
        security_note="Shor applies exactly as it does to ECDSA.",
    ))

    # -- ML-DSA (FIPS 204): the standardised replacement --
    if PQC_AVAILABLE:
        for label, cls, level in (("ML-DSA-44", mldsa.MLDSA44PrivateKey, 2),
                                  ("ML-DSA-65", mldsa.MLDSA65PrivateKey, 3),
                                  ("ML-DSA-87", mldsa.MLDSA87PrivateKey, 5)):
            key = cls.generate()
            pub = key.public_key()
            sig = key.sign(MESSAGE)
            out.append(dict(
                name=label, family="post-quantum", role="signature", quantum="quantum-safe",
                standard="FIPS 204", nist_level=level,
                keygen=_time_op(cls.generate),
                sign=_time_op(lambda k=key: k.sign(MESSAGE)),
                verify=_time_op(lambda p=pub, s=sig: p.verify(s, MESSAGE)),
                signature_bytes=len(sig),
                public_key_bytes=_raw_pub_len(pub),
                security_note="Module-lattice signature. No known quantum attack.",
            ))
    return out


# --------------------------------------------------------------------------
# Key establishment
# --------------------------------------------------------------------------

def bench_key_exchange():
    out = []

    for label, curve in (("ECDH-P256", ec.SECP256R1()), ("ECDH-P384", ec.SECP384R1())):
        peer = ec.generate_private_key(curve).public_key()

        def full_exchange(c=curve, p=peer):
            k = ec.generate_private_key(c)
            return k.exchange(ec.ECDH(), p)

        k = ec.generate_private_key(curve)
        out.append(dict(
            name=label, family="classical", role="key-exchange", quantum="shor-broken",
            keygen=_time_op(lambda c=curve: ec.generate_private_key(c)),
            operation=_time_op(full_exchange),
            operation_label="keygen + shared secret",
            public_key_bytes=_spki_len(k.public_key()),
            ciphertext_bytes=None,
            shared_secret_bytes=len(k.exchange(ec.ECDH(), peer)),
            security_note="Shor recovers the shared secret from recorded traffic.",
        ))

    peer25519 = x25519.X25519PrivateKey.generate().public_key()

    def x_exchange():
        k = x25519.X25519PrivateKey.generate()
        return k.exchange(peer25519)

    kx = x25519.X25519PrivateKey.generate()
    out.append(dict(
        name="X25519", family="classical", role="key-exchange", quantum="shor-broken",
        keygen=_time_op(x25519.X25519PrivateKey.generate),
        operation=_time_op(x_exchange),
        operation_label="keygen + shared secret",
        public_key_bytes=_raw_pub_len(kx.public_key()),
        ciphertext_bytes=None,
        shared_secret_bytes=len(kx.exchange(peer25519)),
        security_note="Shor recovers the shared secret from recorded traffic.",
    ))

    if PQC_AVAILABLE:
        for label, cls, level in (("ML-KEM-768", mlkem.MLKEM768PrivateKey, 3),
                                  ("ML-KEM-1024", mlkem.MLKEM1024PrivateKey, 5)):
            key = cls.generate()
            pub = key.public_key()
            # pyca/cryptography returns (shared_key, ciphertext) -- secret first.
            ss, ct = pub.encapsulate()

            def full(c=cls):
                k = c.generate()
                p = k.public_key()
                _, ciph = p.encapsulate()
                return k.decapsulate(ciph)

            out.append(dict(
                name=label, family="post-quantum", role="key-exchange", quantum="quantum-safe",
                standard="FIPS 203", nist_level=level,
                keygen=_time_op(cls.generate),
                operation=_time_op(full),
                operation_label="keygen + encapsulate + decapsulate",
                encapsulate=_time_op(lambda p=pub: p.encapsulate()),
                decapsulate=_time_op(lambda k=key, c=ct: k.decapsulate(c)),
                public_key_bytes=_raw_pub_len(pub),
                ciphertext_bytes=len(ct),
                shared_secret_bytes=len(ss),
                security_note="Module-lattice KEM. No known quantum attack.",
            ))
    return out


# --------------------------------------------------------------------------
# Real X.509 certificates issued under each algorithm
#
# This is the number that decides whether a TLS handshake still fits in the
# initial congestion window -- so we issue actual certificates and weigh them.
# --------------------------------------------------------------------------

def bench_certificates():
    subject = x509.Name([
        x509.NameAttribute(NameOID.COUNTRY_NAME, "IN"),
        x509.NameAttribute(NameOID.ORGANIZATION_NAME, "Nivesh Financial Services"),
        x509.NameAttribute(NameOID.COMMON_NAME, "settlement.nivesh.gov.in"),
    ])
    now = datetime.datetime(2026, 1, 15, tzinfo=datetime.timezone.utc)
    out = []

    candidates = [
        ("RSA-2048", lambda: rsa.generate_private_key(public_exponent=65537, key_size=2048), hashes.SHA256()),
        ("RSA-3072", lambda: rsa.generate_private_key(public_exponent=65537, key_size=3072), hashes.SHA256()),
        ("ECDSA-P256", lambda: ec.generate_private_key(ec.SECP256R1()), hashes.SHA256()),
        ("Ed25519", ed25519.Ed25519PrivateKey.generate, None),
    ]
    if PQC_AVAILABLE:
        candidates += [
            ("ML-DSA-44", mldsa.MLDSA44PrivateKey.generate, None),
            ("ML-DSA-65", mldsa.MLDSA65PrivateKey.generate, None),
            ("ML-DSA-87", mldsa.MLDSA87PrivateKey.generate, None),
        ]

    for label, gen, algo in candidates:
        try:
            key = gen()
            cert = (x509.CertificateBuilder()
                    .subject_name(subject)
                    .issuer_name(subject)
                    .public_key(key.public_key())
                    .serial_number(x509.random_serial_number())
                    .not_valid_before(now)
                    .not_valid_after(now + datetime.timedelta(days=397))
                    .add_extension(x509.BasicConstraints(ca=False, path_length=None), critical=True)
                    .add_extension(x509.SubjectAlternativeName([x509.DNSName("settlement.nivesh.gov.in")]), critical=False)
                    .sign(key, algo))
            der = cert.public_bytes(serialization.Encoding.DER)
            out.append(dict(algorithm=label, certificate_bytes=len(der),
                            pem_bytes=len(cert.public_bytes(serialization.Encoding.PEM)),
                            issued=True))
        except Exception as exc:
            out.append(dict(algorithm=label, issued=False, error=f"{type(exc).__name__}: {exc}"))
    return out


# --------------------------------------------------------------------------

def environment():
    from cryptography.hazmat.backends.openssl.backend import backend
    import cryptography
    return dict(
        python=platform.python_version(),
        platform=f"{platform.system()} {platform.release()}",
        machine=platform.machine(),
        processor=platform.processor() or "unknown",
        cryptography_version=cryptography.__version__,
        openssl=backend.openssl_version_text(),
        pqc_available=PQC_AVAILABLE,
    )


def run_all():
    t0 = time.perf_counter()
    sigs = bench_signatures()
    kex = bench_key_exchange()
    certs = bench_certificates()
    return dict(
        environment=environment(),
        signatures=sigs,
        key_exchange=kex,
        certificates=certs,
        benchmark_seconds=round(time.perf_counter() - t0, 2),
        method=("Each operation is warmed up 5 times, then sampled until both 30 iterations "
                "and 0.35 s of wall clock have elapsed. The median is reported; mean, p95 and "
                "standard deviation are retained so the spread is visible."),
    )


if __name__ == "__main__":
    import json
    print(json.dumps(run_all(), indent=2))
