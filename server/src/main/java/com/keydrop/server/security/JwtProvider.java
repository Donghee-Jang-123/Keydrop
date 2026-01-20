package com.keydrop.server.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.time.Duration;
import java.util.Date;

@Component
public class JwtProvider {

  private final Key key;

  public JwtProvider(@Value("${jwt.secret}") String secret) {
    this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
  }

  private enum TokenType { ACCESS, SIGNUP, PRE_SIGNUP }
  
  public String createAccessToken(Long userId, String email) {
    return createToken(userId, email, TokenType.ACCESS, Duration.ofHours(2));
  }

  // 구 user 기반 토큰 (Legacy or for step-by-step local signup?)
  // 현재 로컬 가입은 한방이라 안 쓰이지만 유지
  public String createSignupToken(Long userId, String email) {
    return createToken(userId, email, TokenType.SIGNUP, Duration.ofMinutes(20));
  }

  public String createPreSignupToken(String email, String providerId) {
    Date now = new Date();
    Date exp = new Date(now.getTime() + Duration.ofMinutes(20).toMillis());

    return Jwts.builder()
        .setSubject(email) // User ID 대신 이메일 사용
        .claim("provider_id", providerId)
        .claim("token_type", TokenType.PRE_SIGNUP.name())
        .setIssuedAt(now)
        .setExpiration(exp)
        .signWith(key, SignatureAlgorithm.HS256)
        .compact();
  }

  private String createToken(Long userId, String email, TokenType type, Duration ttl) {
    Date now = new Date();
    Date exp = new Date(now.getTime() + ttl.toMillis());

    return Jwts.builder()
        .setSubject(String.valueOf(userId))
        .claim("email", email)
        .claim("token_type", type.name())
        .setIssuedAt(now)
        .setExpiration(exp)
        .signWith(key, SignatureAlgorithm.HS256)
        .compact();
  }

  public Long getUserIdFromAccessToken(String token) {
    return parseAndValidateType(token, TokenType.ACCESS);
  }

  public Long getUserIdFromSignupToken(String token) {
    return parseAndValidateType(token, TokenType.SIGNUP);
  }
  
  public Claims getClaimsFromPreSignupToken(String token) {
      Claims claims = Jwts.parserBuilder()
        .setSigningKey(key)
        .build()
        .parseClaimsJws(token)
        .getBody();

    String tokenType = claims.get("token_type", String.class);
    if (tokenType == null || !TokenType.PRE_SIGNUP.name().equals(tokenType)) {
      throw new IllegalArgumentException("Invalid token type: expected PRE_SIGNUP");
    }
    return claims;
  }

  private Long parseAndValidateType(String token, TokenType expected) {
    Claims claims = Jwts.parserBuilder()
        .setSigningKey(key)
        .build()
        .parseClaimsJws(token)
        .getBody();

    String tokenType = claims.get("token_type", String.class);
    if (tokenType == null || !expected.name().equals(tokenType)) {
      throw new IllegalArgumentException("Invalid token type");
    }

    return Long.parseLong(claims.getSubject());
  }
}