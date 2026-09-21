package com.grpo.tms.util;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

/**
 * JwtUtil — VERSION CORRIGÉE
 *
 * Corrections :
 *  1. clockSkewSeconds(300) → tolère 5 min de décalage d'horloge
 *     (corrige : "clock skew 0 milliseconds" dans les logs)
 *  2. expiration 7 jours → évite les déconnexions fréquentes
 */
@Component
@Slf4j
public class JwtUtil {

    @Value("${jwt.secret:tms-grpo-secret-key-very-long-min-32-chars}")
    private String secret;

    @Value("${jwt.expiration:604800000}")
    private long expiration;

    // ✅ 5 minutes de tolérance pour les décalages d'horloge
    private static final long CLOCK_SKEW_SECONDS = 300;

    public String generateToken(UserDetails userDetails) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("roles", userDetails.getAuthorities());
        return createToken(claims, userDetails.getUsername());
    }

    private String createToken(Map<String, Object> claims, String subject) {
        return Jwts.builder()
                .claims(claims)
                .subject(subject)
                .issuedAt(new Date(System.currentTimeMillis()))
                .expiration(new Date(System.currentTimeMillis() + expiration))
                .signWith(getSigningKey())
                .compact();
    }

    public boolean validateToken(String token, UserDetails userDetails) {
        try {
            final String username = extractUsername(token);
            return username.equals(userDetails.getUsername()) && !isTokenExpired(token);
        } catch (JwtException | IllegalArgumentException e) {
            log.error("Token JWT invalide: {}", e.getMessage());
            return false;
        }
    }

    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        return claimsResolver.apply(extractAllClaims(token));
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .clockSkewSeconds(CLOCK_SKEW_SECONDS) // ✅ Tolère 5 min de décalage
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    private boolean isTokenExpired(String token) {
        Date exp = extractExpiration(token);
        // Tolérance côté isTokenExpired aussi
        return exp.before(new Date(System.currentTimeMillis() - CLOCK_SKEW_SECONDS * 1000));
    }

    private SecretKey getSigningKey() {
        byte[] keyBytes = secret.getBytes(java.nio.charset.StandardCharsets.UTF_8);
        return Keys.hmacShaKeyFor(keyBytes);
    }
}