package com.keydrop.server.controller;

import com.keydrop.server.dto.MusicDto;
import com.keydrop.server.service.MusicService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/music")
public class MusicController {

  private final MusicService service;

  public MusicController(MusicService service) {
    this.service = service;
  }

  @GetMapping
  public List<MusicDto> list() {
    return service.list();
  }

  @GetMapping("/{id}")
  public MusicDto get(@PathVariable long id) {
    return service.get(id);
  }
}