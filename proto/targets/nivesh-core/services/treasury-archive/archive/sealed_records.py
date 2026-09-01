"""
Sealed treasury record archive.

Holds signed and encrypted copies of sovereign debt instruments, inter-ministry
settlement statements and bond registry snapshots. Statutory retention is
25 years; several instrument classes are retained permanently.

Nothing in this service is internet-facing -- it is reached only from the
treasury operations VLAN.
"""

import os

from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import dsa, ec, rsa, padding
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes


def generate_archival_sealing_key():
    """The key that seals a record for its entire 25-year retention life."""
    return rsa.generate_private_key(public_exponent=65537, key_size=3072)


def seal_record(sealing_key, record_bytes: bytes) -> bytes:
    """Archival signature. Must remain verifiable for 25 years."""
    return sealing_key.sign(record_bytes, padding.PKCS1v15(), hashes.SHA256())


def generate_registry_notary_key():
    """Bond registry notary identity, inherited from the 2009 registry build."""
    return dsa.generate_private_key(key_size=2048)


def encrypt_archive_volume(volume_key: bytes, plaintext: bytes):
    """AES-256-CBC volume encryption for cold storage tapes."""
    iv = os.urandom(16)
    cipher = Cipher(algorithms.AES(volume_key), modes.CBC(iv))
    enc = cipher.encryptor()
    return iv, enc.update(plaintext) + enc.finalize()


def establish_vault_channel(peer_public_key):
    """ECDH to the offline vault appliance."""
    ours = ec.generate_private_key(ec.SECP384R1())
    return ours.exchange(ec.ECDH(), peer_public_key)


def volume_integrity_digest(volume: bytes) -> bytes:
    digest = hashes.Hash(hashes.SHA512())
    digest.update(volume)
    return digest.finalize()
