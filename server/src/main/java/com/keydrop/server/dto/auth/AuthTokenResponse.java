package com.keydrop.server.dto.auth;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter @AllArgsConstructor
public class AuthTokenResponse {
  private String accessToken;
  private boolean isNewUser;
}