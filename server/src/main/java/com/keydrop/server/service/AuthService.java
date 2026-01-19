package com.keydrop.server.service;

import com.keydrop.server.dto.auth.AuthTokenResponse;
import com.keydrop.server.dto.auth.LocalLoginRequest;
import com.keydrop.server.dto.auth.LocalSignupRequest;
import com.keydrop.server.dto.auth.GoogleLoginRequest;
import com.keydrop.server.dto.auth.CompleteMyProfileRequest;
import com.keydrop.server.security.JwtProvider;
import com.keydrop.server.domain.User;
import com.keydrop.server.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.beans.factory.annotation.Value;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.jackson2.JacksonFactory;

import java.util.Collections;

@Service
@RequiredArgsConstructor
public class AuthService {

  private final UserRepository userRepository;
  private final PasswordEncoder passwordEncoder;
  private final JwtProvider jwtProvider;

  @Value("${google.client-id}")
  private String googleClientId;

  @Transactional
  public AuthTokenResponse localSignup(LocalSignupRequest req) {
    if (!req.getPassword().equals(req.getPasswordConfirm())) {
      throw new IllegalArgumentException("비밀번호가 일치하지 않습니다.");
    }
    if (userRepository.existsByEmail(req.getEmail())) {
      throw new IllegalArgumentException("이미 가입된 이메일입니다.");
    }

    User user = User.builder()
      .email(req.getEmail())
      .password(passwordEncoder.encode(req.getPassword()))
      .nickname(req.getNickname())
      .birthDate(req.getBirthDate())
      .provider("LOCAL")
      .providerId(null)
      .build();

    userRepository.save(user);

    String token = jwtProvider.createAccessToken(user.getUserId(), user.getEmail());
    return new AuthTokenResponse(token, false);
  }

  
  @Transactional(readOnly = true)
  public AuthTokenResponse localLogin(LocalLoginRequest req) {
    User user = userRepository.findByEmail(req.getEmail())
      .orElseThrow(() -> new IllegalArgumentException("아이디/비밀번호가 일치하지 않습니다."));

    if (!"LOCAL".equals(user.getProvider())) {
      throw new IllegalArgumentException("구글 로그인으로 가입된 계정입니다.");
    }

    if (user.getPassword() == null || !passwordEncoder.matches(req.getPassword(), user.getPassword())) {
      throw new IllegalArgumentException("아이디/비밀번호가 일치하지 않습니다.");
    }

    String token = jwtProvider.createAccessToken(user.getUserId(), user.getEmail());
    return new AuthTokenResponse(token, false);
  }


  @Transactional
  public AuthTokenResponse googleLogin(GoogleLoginRequest req) {

    GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(
        new NetHttpTransport(),
        JacksonFactory.getDefaultInstance()
    ).setAudience(Collections.singletonList(googleClientId)).build();

    GoogleIdToken idToken;
    try {
      idToken = verifier.verify(req.getCredential());
    } catch (Exception e) {
      throw new IllegalArgumentException("구글 토큰 검증 실패");
    }

    if (idToken == null) {
      throw new IllegalArgumentException("구글 토큰이 유효하지 않습니다.");
    }

    GoogleIdToken.Payload payload = idToken.getPayload();
    String providerId = payload.getSubject();      // 구글 유저 고유 ID
    String email = payload.getEmail();

    // 이미 가입된 유저면 찾고, 없으면 생성
    User user = userRepository.findByProviderAndProviderId("GOOGLE", providerId)
        .orElseGet(() -> {
          User u = User.builder()
              .provider("GOOGLE")
              .providerId(providerId)
              .email(email)
              .nickname("user" + providerId.substring(0, 6)) // 임시 닉네임, 나중에 signup에서 수정
              .build();
          return userRepository.save(u);
        });

    boolean isNewUser = (user.getBirthDate() == null) || (user.getDjLevel() == null); // 기준은 원하는대로
    String token = jwtProvider.createAccessToken(user.getUserId(), user.getEmail());

    return new AuthTokenResponse(token, isNewUser);
  }

  @Transactional
  public void completeMyProfile(Long userId, CompleteMyProfileRequest req) {
    User user = userRepository.findById(userId)
        .orElseThrow(() -> new IllegalArgumentException("유저를 찾을 수 없습니다."));

    // 구글 가입자만 “추가정보 입력” 흐름을 타게 하고 싶으면 유지
    if (!"GOOGLE".equals(user.getProvider())) {
      throw new IllegalArgumentException("구글 가입자만 프로필 완료를 진행합니다.");
    }

    // email 중복 체크(원하면)
    if (req.getEmail() != null && !req.getEmail().isBlank()) {
      boolean emailChanged = (user.getEmail() == null) || !user.getEmail().equals(req.getEmail());
      if (emailChanged && userRepository.existsByEmail(req.getEmail())) {
        throw new IllegalArgumentException("이미 사용 중인 이메일입니다.");
      }
    }

    user.completeProfile(
        req.getEmail(),
        req.getNickname(),
        req.getBirthDate(),
        req.getDjLevel()
    );
  }
}