package com.keydrop.server.domain;

import jakarta.persistence.*;
import lombok.Getter;

@Getter
@Entity
@Table(name = "music")
public class Music {

  @Id
  @Column(name = "music_id")
  private Long musicId;

  @Column(name = "file_path", nullable = false)
  private String filePath;

  @Column(name = "title", nullable = false, length = 100)
  private String title;

  @Column(name = "bpm", nullable = false)
  private Long bpm;

  @Column(name = "artists", nullable = false, length = 50)
  private String artists;

  @Column(name = "genre", length = 50)
  private String genre;

  @Column(name = "duration", nullable = false)
  private Float duration;
}