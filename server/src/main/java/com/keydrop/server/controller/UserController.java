package com.keydrop.server.controller;

import com.keydrop.server.domain.User;
import com.keydrop.server.dto.UserMeDto;
import com.keydrop.server.repository.UserRepository;
import com.keydrop.server.security.JwtProvider;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
public class UserController {

  private final UserRepository userRepository;
  private final JwtProvider jwtProvider;

  public UserController(UserRepository userRepository, JwtProvider jwtProvider) {
    this.userRepository = userRepository;
    this.jwtProvider = jwtProvider;
  }

  @GetMapping("/me")
  public UserMeDto me(@RequestHeader(value = "Authorization", required = false) String authorization) {
    Long userId = resolveUserIdOrThrow(authorization);

    User user = userRepository.findById(userId)
        .orElseThrow(() -> new IllegalArgumentException("유저를 찾을 수 없습니다."));

    return new UserMeDto(user.getEmail(), user.getNickname());
  }

  private Long resolveUserIdOrThrow(String authorization) {
    if (authorization == null || authorization.isBlank()) {
      throw new IllegalArgumentException("Authorization is required");
    }
    String token = authorization.replace("Bearer ", "").trim();
    return jwtProvider.getUserIdFromAccessToken(token);
  }
}

