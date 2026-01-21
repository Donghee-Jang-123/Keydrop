package com.keydrop.server.dto;

import java.time.LocalDateTime;

public record RecordingDto(
    long id,
    String fileName,
    String contentType,
    long sizeBytes,
    Double durationSec,
    LocalDateTime createdAt,
    String fileUrl
) {}

