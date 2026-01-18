package com.keydrop.server.controller;

import com.keydrop.server.domain.entity.Track;
import com.keydrop.server.domain.repository.TrackRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.util.UUID;

@RestController
@RequestMapping("/api/tracks")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:5173"}) // React(Vite) 연동을 위한 설정
public class TrackController {

    private final TrackRepository trackRepository;

    @PostMapping("/upload")
    public ResponseEntity<Track> uploadTrack(@RequestParam("file") MultipartFile file) throws IOException {
        // 1. 파일을 저장할 경로 설정 (서버 프로젝트 루트의 uploads 폴더)
        String uploadDir = System.getProperty("user.dir") + "/uploads/";
        File folder = new File(uploadDir);
        if (!folder.exists()) folder.mkdirs();

        // 2. 파일명 중복 방지를 위해 UUID 사용
        String fileName = UUID.randomUUID() + "_" + file.getOriginalFilename();
        File saveFile = new File(uploadDir + fileName);
        file.transferTo(saveFile);

        // 3. DB에 저장할 객체 생성 (Builder 사용)
        Track track = Track.builder()
                .title(file.getOriginalFilename())
                .filePath(saveFile.getAbsolutePath())
                .bpm(120.0) // 기본값 설정
                .build();

        return ResponseEntity.ok(trackRepository.save(track));
    }
}
