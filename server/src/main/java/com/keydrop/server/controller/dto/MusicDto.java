package com.keydrop.server.controller.dto;

public record MusicDto(
    long musicId,
    String title,
    long bpm,
    String artists,
    String genre,
    float duration,
    String url
) {}