"""Internal operations console. Reachable only from the ops jump host."""

import hashlib
import hmac

from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import ed25519


def sign_runbook_action(key, action: bytes) -> bytes:
    """Operators sign destructive runbook actions for the audit trail."""
    return key.sign(action)


def generate_operator_key():
    return ed25519.Ed25519PrivateKey.generate()


def config_checksum(blob: bytes) -> str:
    """Detect drift in the deployed config bundle."""
    return hashlib.md5(blob).hexdigest()


def verify_webhook(secret: bytes, body: bytes, provided: str) -> bool:
    expected = hmac.new(secret, body, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, provided)
