package in.nivesh.payment;

import java.security.*;
import java.security.spec.*;
import javax.crypto.Cipher;
import javax.crypto.KeyAgreement;
import java.util.Base64;

/**
 * Signs outbound settlement instructions sent to the NPCI clearing gateway.
 * Every instruction carries a detached signature that the counterparty bank
 * verifies before funds move.
 */
public class PaymentSigner {

    private final PrivateKey settlementKey;

    public PaymentSigner(PrivateKey settlementKey) {
        this.settlementKey = settlementKey;
    }

    /** Generate the long-lived settlement identity keypair. */
    public static KeyPair generateSettlementIdentity() throws Exception {
        KeyPairGenerator kpg = KeyPairGenerator.getInstance("RSA");
        kpg.initialize(2048);
        return kpg.generateKeyPair();
    }

    /** Detached signature over the canonical settlement payload. */
    public String signSettlementInstruction(byte[] canonicalPayload) throws Exception {
        Signature sig = Signature.getInstance("SHA256withRSA");
        sig.initSign(settlementKey);
        sig.update(canonicalPayload);
        return Base64.getEncoder().encodeToString(sig.sign());
    }

    /** Wraps the per-batch AES key for the receiving bank. */
    public byte[] wrapBatchKey(PublicKey counterpartyKey, byte[] aesKey) throws Exception {
        Cipher cipher = Cipher.getInstance("RSA/ECB/OAEPWithSHA-256AndMGF1Padding");
        cipher.init(Cipher.WRAP_MODE, counterpartyKey);
        return cipher.doFinal(aesKey);
    }

    /** Ephemeral session establishment with the clearing gateway. */
    public byte[] deriveGatewaySessionSecret(PrivateKey ours, PublicKey theirs) throws Exception {
        KeyAgreement ka = KeyAgreement.getInstance("ECDH");
        ka.init(ours);
        ka.doPhase(theirs, true);
        return ka.generateSecret();
    }

    /** Bulk encryption of the settlement batch at rest. */
    public byte[] encryptBatch(byte[] plaintext, java.security.Key k) throws Exception {
        Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
        cipher.init(Cipher.ENCRYPT_MODE, k);
        return cipher.doFinal(plaintext);
    }

    /** Idempotency key for the settlement ledger. */
    public String batchFingerprint(byte[] batch) throws Exception {
        MessageDigest md = MessageDigest.getInstance("SHA-256");
        return Base64.getEncoder().encodeToString(md.digest(batch));
    }
}
