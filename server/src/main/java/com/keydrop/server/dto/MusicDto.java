package com.keydrop.server.dto;

public record MusicDto(
    long musicId,
    String title,
    long bpm,
    String artists,
    String genre,
    float duration,
    String url
) {}