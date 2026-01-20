package com.keydrop.server.dto;

public record MusicDto(
    long musicId,
    String title,
    long bpm,
    String artists,
    String genre,
    double duration,
    String mp3Url,
    String imageUrl
) {}