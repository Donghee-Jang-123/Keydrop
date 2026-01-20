package com.keydrop.server.controller;

import com.keydrop.server.dto.auth.AuthTokenResponse;
import com.keydrop.server.dto.auth.LocalLoginRequest;
import com.keydrop.server.dto.auth.LocalSignupRequest;
import com.keydrop.server.dto.auth.GoogleLoginRequest;
import com.keydrop.server.dto.auth.CompleteMyProfileRequest;
import com.keydrop.server.service.AuthService;
import com.keydrop.server.security.JwtProvider;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {
  private final AuthService authService;
  private final JwtProvider jwtProvider;

  @PostMapping("/signup")
  public AuthTokenResponse localSignup(@RequestBody @Valid LocalSignupRequest req) {
    return authService.localSignup(req);
  }

  @PostMapping("/login")
  public AuthTokenResponse localLogin(@RequestBody @Valid LocalLoginRequest req) {
    return authService.localLogin(req);
  }

  @PostMapping("/logout")
  public ResponseEntity<Void> logout() {
    return ResponseEntity.ok().build();
  }

  @PostMapping("/login/google")
  public AuthTokenResponse googleLogin(@RequestBody @Valid GoogleLoginRequest req) {
    return authService.googleLogin(req);
  }

  @PostMapping("/profile/complete")
  public AuthTokenResponse completeMyProfile(
      @RequestHeader("Authorization") String authorization,
      @RequestBody @Valid CompleteMyProfileRequest req
  ) {
    String token = authorization.replace("Bearer ", "").trim();

    // 1. Stateless Google Signup (PreSignupToken) 시도
    try {
        return authService.registerGoogleUser(token, req);
    } catch (Exception e) {
        // 토큰 타입이 다르면(예: 이미 UserID가 있는 기존 Legacy Token) 아래 로직으로 넘어감
        // e.getMessage() 등을 확인해서 더 정교하게 분기할 수 있음
    }

    // 2. 기존 방식 (이미 DB에 User가 있는 경우)
    Long userId = jwtProvider.getUserIdFromSignupToken(token);
    return authService.completeMyProfile(userId, req);
  }

}