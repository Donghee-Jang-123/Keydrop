package com.keydrop.server.dto.auth;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;
import jakarta.validation.constraints.*;
import java.time.LocalDate;

@Getter @Setter
public class LocalSignupRequest {
  @NotBlank
  private String email;
  @NotBlank
  private String password;
  @NotBlank
  private String passwordConfirm;

  @NotBlank
  private String nickname;
  @NotNull
  private LocalDate birthDate;
  @NotBlank
  private String djLevel;
}