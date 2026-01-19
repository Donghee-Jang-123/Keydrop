package com.keydrop.server.security;

import org.springframework.stereotype.Component;

@Component
public class JwtProvider {

  public String createAccessToken(Long userId, String email) {
    return "TEMP_TOKEN";
  }
}