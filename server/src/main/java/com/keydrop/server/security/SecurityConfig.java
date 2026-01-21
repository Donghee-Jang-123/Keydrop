package com.keydrop.server.security;

import java.util.List;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
public class SecurityConfig {

  @Bean
  public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    http
      .csrf(csrf -> csrf.disable())
      .cors(Customizer.withDefaults())
      .httpBasic(httpBasic -> httpBasic.disable())
      .formLogin(form -> form.disable())
      .authorizeHttpRequests(auth -> auth
        // 프리플라이트 무조건 허용
        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

        // 헬스체크 허용(컨테이너 재시작 방지용)
        .requestMatchers("/health").permitAll()
        .requestMatchers("/actuator/health").permitAll()

        // 일단 전체 허용(배포 안정화용)
        .anyRequest().permitAll()
      );

    return http.build();
  }

  @Bean
  public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration config = new CorsConfiguration();

    // 프론트 도메인(정확히)
    config.setAllowedOrigins(List.of("https://keydrop-rho.vercel.app"));

    config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
    config.setAllowedHeaders(List.of("*"));
    config.setExposedHeaders(List.of("*"));

    config.setAllowCredentials(true);

    config.setAllowedOrigins(List.of(
      "https://keydrop-rho.vercel.app",
      "http://localhost:5173"
    ));

    config.setMaxAge(3600L);

    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", config);
    return source;
  }
}