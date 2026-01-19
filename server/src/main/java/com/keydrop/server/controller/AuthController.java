package com.keydrop.server.controller;

import com.keydrop.server.dto.auth.AuthTokenResponse;
import com.keydrop.server.dto.auth.LocalLoginRequest;
import com.keydrop.server.dto.auth.LocalSignupRequest;
import com.keydrop.server.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {
  private final AuthService authService;

  @PostMapping("/signup")
  public AuthTokenResponse localSignup(@RequestBody @Valid LocalSignupRequest req) {
    return authService.localSignup(req);
  }

  @PostMapping("/login")
  public AuthTokenResponse localLogin(@RequestBody @Valid LocalLoginRequest req) {
    return authService.localLogin(req);
  }
}