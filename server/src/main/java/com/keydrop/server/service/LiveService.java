package com.keydrop.server.service;

import com.keydrop.server.controller.LiveController;
import io.livekit.server.AccessToken;
import io.livekit.server.RoomJoin;
import io.livekit.server.RoomName;
import io.livekit.server.CanPublish;
import io.livekit.server.CanSubscribe;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class LiveService {

  @Value("${livekit.url}")
  private String livekitUrl;

  @Value("${livekit.apiKey}")
  private String apiKey;

  @Value("${livekit.apiSecret}")
  private String apiSecret;

  public LiveController.TokenResponse issue(LiveController.TokenRequest req) {

    // Validate configuration
    if (livekitUrl == null || livekitUrl.isBlank() ||
        apiKey == null || apiKey.isBlank() ||
        apiSecret == null || apiSecret.isBlank()) {
      throw new RuntimeException("LiveKit configuration missing: Check LIVEKIT_URL, LIVEKIT_API_KEY, and LIVEKIT_API_SECRET");
    }

    try {
      String room = (req.room() == null || req.room().isBlank())
          ? "default"
          : req.room();

      String role = (req.role() == null)
          ? "VIEWER"
          : req.role().toUpperCase();

      String identity = (req.identity() == null || req.identity().isBlank())
          ? role.toLowerCase() + "-" + UUID.randomUUID()
          : req.identity();

      boolean isDj = "DJ".equals(role);

      AccessToken token = new AccessToken(apiKey, apiSecret);
      token.setIdentity(identity);
      token.setName(identity);
      
      // Add grants using individual grant classes
      token.addGrants(
          new RoomJoin(true),
          new RoomName(room),
          new CanSubscribe(true),
          new CanPublish(isDj)
      );

      return new LiveController.TokenResponse(token.toJwt(), livekitUrl);
    } catch (Exception e) {
      // Log the full stack trace
      e.printStackTrace();
      throw new RuntimeException("Failed to generate LiveKit token: " + e.getMessage(), e);
    }
  }
}