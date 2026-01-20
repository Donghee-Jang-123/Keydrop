package com.keydrop.server.dto.auth;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuthTokenResponse {
  private String accessToken;  // 기존유저 또는 complete 이후
  private String signupToken;  // 신규유저
  
  @JsonProperty("isNewUser")
  private boolean isNewUser;
  
  private String email;        // 신규유저일 때 프론트 채움용(선택)
}