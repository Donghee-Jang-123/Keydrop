package com.keydrop.server.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/live")
public class LiveController {

  private final LiveService liveService;

  @PostMapping("/token")
  public TokenResponse token(@RequestBody TokenRequest req) {
    return liveService.issue(req);
  }

  public record TokenRequest(String room, String role, String identity) {}
  public record TokenResponse(String token, String url) {}
}
