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

  @PostMapping("/login/google")
  public AuthTokenResponse googleLogin(@RequestBody @Valid GoogleLoginRequest req) {
    return authService.googleLogin(req);
  }

  @PostMapping("/profile/complete")
  public ResponseEntity<Void> completeMyProfile(
      @RequestHeader("Authorization") String authorization,
      @RequestBody @Valid CompleteMyProfileRequest req
  ) {
    String token = authorization.replace("Bearer ", "");
    Long userId = jwtProvider.getUserId(token);
    authService.completeMyProfile(userId, req);
    return ResponseEntity.noContent().build();
  }

}