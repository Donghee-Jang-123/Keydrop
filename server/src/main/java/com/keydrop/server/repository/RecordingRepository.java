package com.keydrop.server.repository;

import com.keydrop.server.domain.Recording;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RecordingRepository extends JpaRepository<Recording, Long> {
}

