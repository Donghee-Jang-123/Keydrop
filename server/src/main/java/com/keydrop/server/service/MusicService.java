package com.keydrop.server.service;

import com.keydrop.server.dto.MusicDto;
import com.keydrop.server.domain.Music;
import com.keydrop.server.repository.MusicRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class MusicService {

  private final MusicRepository repo;

  @Value("${app.media.urlPrefix}")
  private String urlPrefix;

  public MusicService(MusicRepository repo) {
    this.repo = repo;
  }

  public List<MusicDto> list() {
    return repo.findAll().stream().map(this::toDto).toList();
  }

  public MusicDto get(long id) {
    Music m = repo.findById(id).orElseThrow();
    return toDto(m);
  }

  private MusicDto toDto(Music m) {
    // 프론트가 바로 사용할 URL
    String url = urlPrefix + "/" + m.getFilePath();
    return new MusicDto(
        m.getMusicId(),
        m.getTitle(),
        m.getBpm(),
        m.getArtists(),
        m.getGenre(),
        m.getDuration(),
        url
    );
  }
}