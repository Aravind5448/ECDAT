package in.nivesh.portal;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import java.security.KeyPairGenerator;
import java.security.MessageDigest;
import java.security.SecureRandom;
import javax.crypto.Mac;
import javax.net.ssl.SSLContext;

/** Public citizen portal: login sessions, statement downloads, grievance filing. */
public class SessionTokens {

    /** Portal session JWTs are signed with ES256 off the portal identity key. */
    public String issueSessionToken(java.security.PrivateKey portalKey, String subject) {
        return Jwts.builder()
                .setSubject(subject)
                .signWith(portalKey, SignatureAlgorithm.ES256)
                .compact();
    }

    /** Download links are signed with an HMAC so they cannot be forged. */
    public byte[] signDownloadLink(javax.crypto.SecretKey k, byte[] link) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(k);
        return mac.doFinal(link);
    }

    public static java.security.KeyPair generatePortalIdentity() throws Exception {
        KeyPairGenerator kpg = KeyPairGenerator.getInstance("EC");
        kpg.initialize(256);
        return kpg.generateKeyPair();
    }

    public SSLContext portalTlsContext() throws Exception {
        return SSLContext.getInstance("TLSv1.2");
    }

    public byte[] etag(byte[] body) throws Exception {
        return MessageDigest.getInstance("SHA-256").digest(body);
    }

    public byte[] csrfNonce() {
        byte[] b = new byte[32];
        new SecureRandom().nextBytes(b);
        return b;
    }
}
