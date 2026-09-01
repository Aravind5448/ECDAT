"""Test-only fixtures. These keys are throwaway and never leave CI."""

import hashlib

from cryptography.hazmat.primitives.asymmetric import rsa


def make_throwaway_key():
    # Deliberately tiny so the unit tests stay fast.
    return rsa.generate_private_key(public_exponent=65537, key_size=1024)


def fake_digest(x: bytes) -> str:
    return hashlib.md5(x).hexdigest()
