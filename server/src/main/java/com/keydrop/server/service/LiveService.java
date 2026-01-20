package com.keydrop.server.service;

import com.keydrop.server.controller.LiveController;
import io.livekit.server.AccessToken;
import io.livekit.server.VideoGrant;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class LiveService {

  @Value("${livekit.url}")
  private String livekitUrl;

  @Value("${livekit.apiKey}")
  private String apiKey;

  @Value("${livekit.apiSecret}")
  private String apiSecret;

  public LiveController.TokenResponse issue(LiveController.TokenRequest req) {
    String room = (req.room() == null || req.room().isBlank()) ? "default" : req.room();
    String role = (req.role() == null) ? "VIEWER" : req.role().toUpperCase();

    String identity = (req.identity() == null || req.identity().isBlank())
        ? role.toLowerCase() + "-" + UUID.randomUUID()
        : req.identity();

    boolean isDj = "DJ".equals(role);

    VideoGrant grant = new VideoGrant()
        .setRoomJoin(true)
        .setRoom(room)
        .setCanSubscribe(true)
        .setCanPublish(isDj);

    AccessToken token = new AccessToken(apiKey, apiSecret)
        .setName(identity)
        .setIdentity(identity)
        .addGrant(grant);

    return new LiveController.TokenResponse(token.toJwt(), livekitUrl);
  }
}