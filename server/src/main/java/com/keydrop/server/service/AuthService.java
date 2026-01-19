package com.keydrop.server.service;

import com.keydrop.server.dto.auth.AuthTokenResponse;
import com.keydrop.server.dto.auth.LocalLoginRequest;
import com.keydrop.server.dto.auth.LocalSignupRequest;
import com.keydrop.server.security.JwtProvider;
import com.keydrop.server.domain.User;
import com.keydrop.server.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

  private final UserRepository userRepository;
  private final PasswordEncoder passwordEncoder;
  private final JwtProvider jwtProvider;

  @Transactional
  public AuthTokenResponse localSignup(LocalSignupRequest req) {
    if (!req.getPassword().equals(req.getPasswordConfirm())) {
      throw new IllegalArgumentException("비밀번호가 일치하지 않습니다.");
    }
    if (userRepository.existsByUsername(req.getUsername())) {
      throw new IllegalArgumentException("이미 가입된 이메일입니다.");
    }

    User user = User.builder()
      .username(req.getUsername())
      .email(req.getEmail())
      .password(passwordEncoder.encode(req.getPassword()))
      .nickname(req.getNickname())
      .birthDate(req.getBirthDate())
      .provider("LOCAL")
      .providerId(null)
      .build();

    userRepository.save(user);

    String token = jwtProvider.createAccessToken(user.getUserId(), user.getUsername());
    return new AuthTokenResponse(token, false);
  }

  @Transactional(readOnly = true)
  public AuthTokenResponse localLogin(LocalLoginRequest req) {
    User user = userRepository.findByUsername(req.getUsername())
      .orElseThrow(() -> new IllegalArgumentException("아이디/비밀번호가 일치하지 않습니다."));

    if (!"LOCAL".equals(user.getProvider())) {
      throw new IllegalArgumentException("구글 로그인으로 가입된 계정입니다.");
    }

    if (user.getPassword() == null || !passwordEncoder.matches(req.getPassword(), user.getPassword())) {
      throw new IllegalArgumentException("아이디/비밀번호가 일치하지 않습니다.");
    }

    String token = jwtProvider.createAccessToken(user.getUserId(), user.getUsername());
    return new AuthTokenResponse(token, false);
  }
}