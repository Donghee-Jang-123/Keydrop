package com.keydrop.server.domain;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "users",
  uniqueConstraints = {
    @UniqueConstraint(name="uq_users_provider", columnNames={"provider", "provider_id"}),
    @UniqueConstraint(name="uq_users_username", columnNames={"username"})
  }
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class User {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Column(name = "user_id")
  private Long userId;

  @Column(nullable = false, length = 50)
  private String username;

  @Column(nullable = false, length = 50)
  private String nickname;

  @Column(nullable = false, length = 20)
  private String provider; // "GOOGLE" or "LOCAL"

  @Column(name = "provider_id", length = 255)
  private String providerId;

  @Column(length = 255)
  private String email;

  @Column(length = 255)
  private String password; // LOCAL일 때만 사용 (BCrypt 해시 저장)

  private LocalDate birthDate;

  @Column(nullable = false)
  private LocalDateTime createdAt;

  @PrePersist
  void prePersist() {
    if (createdAt == null) createdAt = LocalDateTime.now();
    if (provider == null) provider = "GOOGLE";
  }

  public void changePassword(String encoded) {
    this.password = encoded;
  }
}