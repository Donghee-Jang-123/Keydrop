package com.keydrop.server.controller;

import com.keydrop.server.domain.Recording;
import com.keydrop.server.dto.RecordingDto;
import com.keydrop.server.security.JwtProvider;
import com.keydrop.server.service.RecordingService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/recordings")
public class RecordingController {

  private final RecordingService service;
  private final JwtProvider jwtProvider;

  public RecordingController(RecordingService service, JwtProvider jwtProvider) {
    this.service = service;
    this.jwtProvider = jwtProvider;
  }

  @GetMapping
  public List<RecordingDto> list(@RequestHeader(value = "Authorization", required = false) String authorization) {
    Long userId = resolveUserIdOrThrow(authorization);
    return service.listByUserId(userId);
  }

  @GetMapping("/{id}")
  public RecordingDto get(@PathVariable long id) {
    return service.get(id);
  }

  @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  public RecordingDto upload(
      @RequestHeader(value = "Authorization", required = false) String authorization,
      @RequestPart("file") MultipartFile file
  ) {
    Long userId = resolveUserIdOrThrow(authorization);
    return service.create(file, userId);
  }

  @GetMapping("/{id}/file")
  public ResponseEntity<byte[]> download(@PathVariable long id) {
    Recording r = service.getEntity(id);

    return ResponseEntity.ok()
        .header(HttpHeaders.CONTENT_TYPE, r.getContentType())
        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + safeFileName(r.getFileName()) + "\"")
        .body(r.getAudioData());
  }

  private String safeFileName(String name) {
    if (name == null || name.isBlank()) return "recording";
    // 단순 헤더 인젝션 방지
    return name.replaceAll("[\\r\\n\"]", "_");
  }

  private Long resolveUserIdOrThrow(String authorization) {
    if (authorization == null || authorization.isBlank()) {
      throw new IllegalArgumentException("Authorization is required");
    }
    String token = authorization.replace("Bearer ", "").trim();
    return jwtProvider.getUserIdFromAccessToken(token);
  }
}

