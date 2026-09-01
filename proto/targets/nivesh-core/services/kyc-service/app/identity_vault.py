"""
Aadhaar-linked KYC identity vault.

Stores the encrypted demographic record and the signed consent artefact for
every onboarded customer. Records are retained for the full regulatory
retention window (8 years past account closure) under PMLA rules.
"""

import hashlib
import os

from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import padding, rsa, ec
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC


def generate_vault_identity():
    """Long-lived signing identity for consent artefacts."""
    return rsa.generate_private_key(public_exponent=65537, key_size=2048)


def sign_consent_artefact(private_key, consent_document: bytes) -> bytes:
    """Sign the customer's e-KYC consent so it is admissible later."""
    return private_key.sign(
        consent_document,
        padding.PSS(mgf=padding.MGF1(hashes.SHA256()), salt_length=32),
        hashes.SHA256(),
    )


def wrap_record_key(vault_public_key, record_key: bytes) -> bytes:
    """Wrap the per-record AES key under the vault's public key."""
    return vault_public_key.encrypt(
        record_key,
        padding.OAEP(
            mgf=padding.MGF1(algorithm=hashes.SHA256()),
            algorithm=hashes.SHA256(),
            label=None,
        ),
    )


def encrypt_demographic_record(record_key: bytes, plaintext: bytes):
    """AES-256-GCM over the demographic payload (name, DOB, address)."""
    nonce = os.urandom(12)
    cipher = Cipher(algorithms.AES(record_key), modes.GCM(nonce))
    enc = cipher.encryptor()
    return nonce, enc.update(plaintext) + enc.finalize(), enc.tag


def derive_offline_unlock_key(passphrase: bytes, salt: bytes) -> bytes:
    """Operator unlock key for the offline recovery console."""
    kdf = PBKDF2HMAC(algorithm=hashes.SHA256(), length=32, salt=salt, iterations=600_000)
    return kdf.derive(passphrase)


def establish_uidai_session(peer_public_key):
    """Ephemeral ECDH against the UIDAI auth endpoint."""
    ours = ec.generate_private_key(ec.SECP256R1())
    shared = ours.exchange(ec.ECDH(), peer_public_key)
    return shared


def aadhaar_reference_token(aadhaar_number: str) -> str:
    """Non-reversible reference token stored in place of the raw number."""
    return hashlib.sha256(aadhaar_number.encode()).hexdigest()


def legacy_dedupe_key(aadhaar_number: str) -> str:
    """Deduplication index inherited from the 2016 onboarding pipeline."""
    return hashlib.sha1(aadhaar_number.encode()).hexdigest()
