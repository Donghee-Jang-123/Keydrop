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
      .djLevel(req.getDjLevel())
      .provider("LOCAL")
      .providerId(null)
      .build();

    userRepository.save(user);

    String token = jwtProvider.createAccessToken(user.getUserId(), user.getEmail());
    return AuthTokenResponse.builder()
        .accessToken(token)
        .isNewUser(false)
        .build();
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
    return AuthTokenResponse.builder()
        .accessToken(token)
        .isNewUser(false)
        .build();
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
    String providerId = payload.getSubject();
    String email = payload.getEmail();

    User user = userRepository.findByProviderAndProviderId("GOOGLE", providerId)
        .orElse(null);

    // 신규 유저인 경우 (DB 저장 안 함!)
    if (user == null) {
      // 이미 존재하는 이메일인지 확인 (다른 소셜/로컬로 가입된 경우)
      userRepository.findByEmail(email).ifPresent(u -> {
        throw new IllegalArgumentException("이미 가입된 이메일입니다 (" + u.getProvider() + ").");
      });

      // User ID 없이, 이메일과 Provider ID만 담은 토큰 발급
      String preSignupToken = jwtProvider.createPreSignupToken(email, providerId);
      
      return AuthTokenResponse.builder()
          .isNewUser(true)
          .signupToken(preSignupToken)
          .email(email)
          .build();
    }

    // 기존 유저인 경우 (로그인 처리)
    boolean profileComplete =
        user.getNickname() != null &&
        user.getBirthDate() != null &&
        user.getDjLevel() != null;

    if (!profileComplete) {
       // 기존 로직 유지 (혹시 DB에 들어갔는데 미완성인 경우를 위해)
       String signupToken = jwtProvider.createSignupToken(user.getUserId(), user.getEmail());
       return AuthTokenResponse.builder()
           .isNewUser(true)
           .signupToken(signupToken)
           .email(user.getEmail())
           .build();
    }

    String accessToken = jwtProvider.createAccessToken(user.getUserId(), user.getEmail());
    return AuthTokenResponse.builder()
        .isNewUser(false)
        .accessToken(accessToken)
        .build();
  }

  // 구글 회원가입 확정 (Stateless Token 검증 후 DB 저장)
  @Transactional
  public AuthTokenResponse registerGoogleUser(String token, CompleteMyProfileRequest req) {
      io.jsonwebtoken.Claims claims = jwtProvider.getClaimsFromPreSignupToken(token);
      String email = claims.getSubject();
      String providerId = claims.get("provider_id", String.class);
      
      // 이중 체크
      if (userRepository.existsByEmail(email)) {
          throw new IllegalArgumentException("이미 가입된 이메일입니다.");
      }
      
      // 드디어 DB Entity 생성 및 저장
      User user = User.builder()
          .email(email)
          .provider("GOOGLE")
          .providerId(providerId)
          .nickname(req.getNickname())
          .birthDate(req.getBirthDate())
          .djLevel(req.getDjLevel())
          .createdAt(java.time.LocalDateTime.now())
          .build();
          
      userRepository.save(user); // <--- 진짜 저장은 이때만!

      String accessToken = jwtProvider.createAccessToken(user.getUserId(), user.getEmail());
      return AuthTokenResponse.builder()
          .isNewUser(false)
          .accessToken(accessToken)
          .build();
  }

  @Transactional
  public AuthTokenResponse completeMyProfile(Long userId, CompleteMyProfileRequest req) {
    // ... (Legacy support for existing incomplete users)
    // 이 메서드는 기존 DB에 있는 유저를 위한 것.
    // 기존에 이미 userId를 받으므로 그대로 둡니다.
    User user = userRepository.findById(userId)
        .orElseThrow(() -> new IllegalArgumentException("유저를 찾을 수 없습니다."));

    if (!"GOOGLE".equals(user.getProvider())) {
      throw new IllegalArgumentException("구글 가입자만 프로필 완료를 진행합니다.");
    }

    // (기존 로직 유지)
    String newEmail = user.getEmail();
    if (req.getEmail() != null && !req.getEmail().isBlank()) {
       newEmail = req.getEmail();
    }

    user.completeProfile(
        newEmail,
        req.getNickname(),
        req.getBirthDate(),
        req.getDjLevel()
    );
    // ...
    userRepository.save(user);

    String accessToken = jwtProvider.createAccessToken(user.getUserId(), user.getEmail());
    return AuthTokenResponse.builder()
        .isNewUser(false)
        .accessToken(accessToken)
        .build();
  }
}