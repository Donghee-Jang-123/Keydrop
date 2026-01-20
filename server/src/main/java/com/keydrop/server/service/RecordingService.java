package com.keydrop.server.service;

import com.keydrop.server.domain.Recording;
import com.keydrop.server.dto.RecordingDto;
import com.keydrop.server.repository.RecordingRepository;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@Service
public class RecordingService {

  private final RecordingRepository repo;

  public RecordingService(RecordingRepository repo) {
    this.repo = repo;
  }

  public RecordingDto create(MultipartFile file, Long userId) {
    if (file == null || file.isEmpty()) throw new IllegalArgumentException("file is required");
    if (userId == null) throw new IllegalArgumentException("userId is required");

    byte[] bytes;
    try {
      bytes = file.getBytes();
    } catch (IOException e) {
      throw new IllegalStateException("failed to read upload", e);
    }

    String fileName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "recording";
    String contentType = file.getContentType() != null ? file.getContentType() : "application/octet-stream";

    Recording saved = repo.save(Recording.builder()
        .userId(userId)
        .fileName(fileName)
        .contentType(contentType)
        .sizeBytes((long) bytes.length)
        .audioData(bytes)
        .build());

    return toDto(saved);
  }

  public List<RecordingDto> listByUserId(Long userId) {
    if (userId == null) throw new IllegalArgumentException("userId is required");
    return repo.findAllByUserIdOrderByCreatedAtDesc(userId).stream().map(this::toDto).toList();
  }

  public RecordingDto get(long id) {
    Recording r = repo.findById(id).orElseThrow();
    return toDto(r);
  }

  public Recording getEntity(long id) {
    return repo.findById(id).orElseThrow();
  }

  private RecordingDto toDto(Recording r) {
    return new RecordingDto(
        r.getRecordingId(),
        r.getFileName(),
        r.getContentType(),
        r.getSizeBytes(),
        r.getCreatedAt(),
        "/api/recordings/" + r.getRecordingId() + "/file"
    );
  }
}

