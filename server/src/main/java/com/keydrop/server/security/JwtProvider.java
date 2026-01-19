package com.keydrop.server.security;

import java.nio.charset.StandardCharsets;
import java.util.Date;

import javax.crypto.SecretKey;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;

@Component
public class JwtProvider {

  private final SecretKey key;
  private final long expirationMs;

  public JwtProvider(
      @Value("${jwt.secret}") String secret,
      @Value("${jwt.expiration-ms:86400000}") long expirationMs
  ) {
    this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    this.expirationMs = expirationMs;
  }

  // access token 생성
  public String createAccessToken(Long userId, String email) {
    Date now = new Date();
    Date exp = new Date(now.getTime() + expirationMs);

    return Jwts.builder()
        // subject에 userId를 넣는 방식(가장 단순)
        .setSubject(String.valueOf(userId))
        .claim("email", email)
        .setIssuedAt(now)
        .setExpiration(exp)
        .signWith(key, SignatureAlgorithm.HS256)
        .compact();
  }

  // 토큰에서 userId 추출 (AuthController가 요구하는 메서드)
  public Long getUserId(String token) {
    Claims claims = Jwts.parserBuilder()
        .setSigningKey(key)
        .build()
        .parseClaimsJws(token)
        .getBody();

    // subject에 넣었으니 subject를 Long으로 변환
    return Long.valueOf(claims.getSubject());
  }

  public boolean validate(String token) {
    try {
      Jwts.parserBuilder().setSigningKey(key).build().parseClaimsJws(token);
      return true;
    } catch (Exception e) {
      return false;
    }
  }
}