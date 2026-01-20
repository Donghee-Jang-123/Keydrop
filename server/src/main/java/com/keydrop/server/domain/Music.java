package com.keydrop.server.domain;

import jakarta.persistence.*;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Entity
@Table(name = "music")
public class Music {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Column(name = "music_id")
  private Long musicId;

  @Column(name = "mp3_file_path", nullable = false, unique = true)
  private String mp3FilePath;

  @Column(name = "image_file_path", nullable = false)
  private String imageFilePath;

  @Column(name = "title", nullable = false, length = 100)
  private String title;

  @Column(name = "bpm", nullable = false)
  private Integer bpm;

  @Column(name = "artists", nullable = false, length = 50)
  private String artists;

  @Column(name = "genre", length = 50)
  private String genre;

  @Column(name = "duration", nullable = false)
  private Double duration;

  @Column(name = "created_at", insertable = false, updatable = false)
  private LocalDateTime createdAt;

  protected Music() {
    // JPA
  }
}