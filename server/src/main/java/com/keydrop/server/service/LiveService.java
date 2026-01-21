package com.keydrop.server.service;

import com.keydrop.server.controller.LiveController;
import io.livekit.server.AccessToken;
import io.livekit.server.VideoGrant;
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

    VideoGrant grant = new VideoGrant();
    grant.setRoom(room);
    grant.setRoomJoin(true);
    grant.setCanSubscribe(true);
    grant.setCanPublish(isDj);

    AccessToken token = new AccessToken(apiKey, apiSecret);
    token.setIdentity(identity);
    token.setName(identity);
    token.addGrant(grant);

    return new LiveController.TokenResponse(token.toJwt(), livekitUrl);
  }
}