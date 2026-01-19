package com.keydrop.server.domain.repository;

import com.keydrop.server.domain.entity.Track;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TrackRepository extends JpaRepository<Track, Long> {
    // JpaRepository를 상속받으면 기본적인 CRUD(저장, 조회, 삭제) 기능이 자동으로 생성됩니다.
}