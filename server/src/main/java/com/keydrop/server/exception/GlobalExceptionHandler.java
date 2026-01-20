package com.keydrop.server.exception;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

  @ExceptionHandler(IllegalArgumentException.class)
  public ResponseEntity<Map<String, String>> handleIllegalArgument(IllegalArgumentException e) {
    return ResponseEntity
        .badRequest()
        .body(Map.of("error", e.getMessage() != null ? e.getMessage() : "Invalid Request"));
  }

  @ExceptionHandler(org.springframework.dao.DataIntegrityViolationException.class)
  public ResponseEntity<Map<String, String>> handleDataIntegrityViolation(org.springframework.dao.DataIntegrityViolationException e) {
    return ResponseEntity
        .status(org.springframework.http.HttpStatus.CONFLICT)
        .body(Map.of("error", "데이터 충돌이 발생했습니다 (이미 존재하는 이메일 등)."));
  }

  @ExceptionHandler(org.springframework.web.bind.MethodArgumentNotValidException.class)
  public ResponseEntity<Map<String, String>> handleValidationExceptions(org.springframework.web.bind.MethodArgumentNotValidException e) {
    String errorMessage = e.getBindingResult().getAllErrors().get(0).getDefaultMessage();
    return ResponseEntity
        .status(org.springframework.http.HttpStatus.BAD_REQUEST)
        .body(Map.of("error", errorMessage != null ? errorMessage : "Validation Failed"));
  }

  @ExceptionHandler(org.springframework.http.converter.HttpMessageNotReadableException.class)
  public ResponseEntity<Map<String, String>> handleJsonErrors(org.springframework.http.converter.HttpMessageNotReadableException e) {
    return ResponseEntity
        .status(org.springframework.http.HttpStatus.BAD_REQUEST)
        .body(Map.of("error", "JSON 파싱 실패 (날짜 형식 등을 확인하세요): " + e.getMessage()));
  }

  @ExceptionHandler(Exception.class)
  public ResponseEntity<Map<String, String>> handleException(Exception e) {
    e.printStackTrace(); // 서버 로그용
    
    // JWT 관련 에러인지 확인 (패키지명 체크)
    if (e.getClass().getName().contains("io.jsonwebtoken")) {
       return ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED)
           .body(Map.of("error", "인증 토큰이 유효하지 않습니다: " + e.getMessage()));
    }

    // 그 외 500 에러는 구체적인 클래스명과 메시지를 반환
    return ResponseEntity
        .internalServerError()
        .body(Map.of("error", e.getClass().getName() + ": " + e.getMessage()));
  }
}
