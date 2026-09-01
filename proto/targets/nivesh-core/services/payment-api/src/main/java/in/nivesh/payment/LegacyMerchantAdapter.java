package in.nivesh.payment;

import java.security.MessageDigest;
import java.security.Signature;
import javax.crypto.Cipher;
import javax.crypto.spec.SecretKeySpec;

/**
 * Compatibility shim for merchant terminals still on the 2011 acquirer protocol.
 * Scheduled for decommissioning, still carrying live traffic.
 */
public class LegacyMerchantAdapter {

    /** Legacy terminals checksum the message with MD5. */
    public byte[] legacyChecksum(byte[] msg) throws Exception {
        MessageDigest md = MessageDigest.getInstance("MD5");
        return md.digest(msg);
    }

    /** Old terminal firmware only speaks SHA1withRSA. */
    public byte[] legacySign(java.security.PrivateKey k, byte[] msg) throws Exception {
        Signature sig = Signature.getInstance("SHA1withRSA");
        sig.initSign(k);
        sig.update(msg);
        return sig.sign();
    }

    /** Triple-DES PIN block encryption, mandated by the legacy acquirer spec. */
    public byte[] encryptPinBlock(byte[] pinBlock, byte[] key) throws Exception {
        SecretKeySpec ks = new SecretKeySpec(key, "DESede");
        Cipher c = Cipher.getInstance("DESede/CBC/PKCS5Padding");
        c.init(Cipher.ENCRYPT_MODE, ks);
        return c.doFinal(pinBlock);
    }
}
