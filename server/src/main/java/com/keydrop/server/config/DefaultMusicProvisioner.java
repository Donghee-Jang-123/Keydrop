package com.keydrop.server.config;

import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;

/**
 * Copies bundled default music files from classpath (/defaultmusic/*)
 * into app.media.dir so they can be served via the existing /media/** file handler.
 *
 * DB seeding is handled by resources/data.sql (inserts rows with mp3_file_path like "Revenger.mp3").
 */
@Configuration
public class DefaultMusicProvisioner {

  @Value("${app.media.dir}")
  private String mediaDir;

  @Bean
  CommandLineRunner provisionDefaultMusicFiles() {
    return args -> {
      Path targetDir = Paths.get(mediaDir);
      Files.createDirectories(targetDir);

      PathMatchingResourcePatternResolver resolver = new PathMatchingResourcePatternResolver();
      Resource[] resources = resolver.getResources("classpath:/defaultmusic/*");

      for (Resource r : resources) {
        String filename = r.getFilename();
        if (filename == null || filename.isBlank()) continue;
        if (!r.isReadable()) continue;

        Path dest = targetDir.resolve(filename);
        // 이미 존재하면 덮어쓰지 않음 (운영에서 파일을 교체하지 않도록)
        if (Files.exists(dest) && Files.size(dest) > 0) continue;

        try (InputStream in = r.getInputStream()) {
          Files.copy(in, dest, StandardCopyOption.REPLACE_EXISTING);
        }
      }
    };
  }
}

