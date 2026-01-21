package com.keydrop.server.controller;

import com.keydrop.server.service.LiveService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/live")
public class LiveController {

  private final LiveService liveService;

  public LiveController(LiveService liveService) {
    this.liveService = liveService;
  }

  @PostMapping("/token")
  public TokenResponse token(@RequestBody TokenRequest req) {
    return liveService.issue(req);
  }

  public record TokenRequest(String room, String role, String identity) {}
  public record TokenResponse(String token, String url) {}
}