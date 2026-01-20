package com.keydrop.server.controller;

import com.keydrop.server.domain.Recording;
import com.keydrop.server.dto.RecordingDto;
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

  public RecordingController(RecordingService service) {
    this.service = service;
  }

  @GetMapping
  public List<RecordingDto> list() {
    return service.list();
  }

  @GetMapping("/{id}")
  public RecordingDto get(@PathVariable long id) {
    return service.get(id);
  }

  @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  public RecordingDto upload(@RequestPart("file") MultipartFile file) {
    return service.create(file);
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
}

