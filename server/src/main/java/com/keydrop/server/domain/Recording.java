package com.keydrop.server.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "recordings")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class Recording {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Column(name = "recording_id")
  private Long recordingId;

  @Column(name = "file_name", nullable = false, length = 255)
  private String fileName;

  @Column(name = "content_type", nullable = false, length = 100)
  private String contentType;

  @Column(name = "size_bytes", nullable = false)
  private Long sizeBytes;

  @Column(name = "created_at", nullable = false)
  @Builder.Default
  private LocalDateTime createdAt = LocalDateTime.now();

  @Lob
  @Basic(fetch = FetchType.LAZY)
  @Column(name = "audio_data", nullable = false)
  private byte[] audioData;
}

