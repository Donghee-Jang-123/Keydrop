package com.keydrop.server.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

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

  // "내 녹음" 필터링용 (권한 체크는 하지 않고, 목록 조회에만 사용)
  @Column(name = "user_id")
  private Long userId;

  @Column(name = "file_name", nullable = false, length = 255)
  private String fileName;

  @Column(name = "content_type", nullable = false, length = 100)
  private String contentType;

  @Column(name = "size_bytes", nullable = false)
  private Long sizeBytes;

  @Column(name = "created_at", nullable = false)
  @Builder.Default
  private LocalDateTime createdAt = LocalDateTime.now();

  @Basic(fetch = FetchType.LAZY)
  // Postgres: bytea 로 저장 (LOB/oid 매핑으로 bigint가 들어가는 문제 방지)
  @JdbcTypeCode(SqlTypes.VARBINARY)
  @Column(name = "audio_data", nullable = false, columnDefinition = "bytea")
  private byte[] audioData;
}

