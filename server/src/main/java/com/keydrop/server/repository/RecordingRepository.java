package com.keydrop.server.repository;

import com.keydrop.server.domain.Recording;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RecordingRepository extends JpaRepository<Recording, Long> {
  List<Recording> findAllByUserIdOrderByCreatedAtDesc(Long userId);
}

