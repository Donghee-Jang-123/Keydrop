package com.keydrop.server.dto.auth;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class LocalLoginRequest {
  @NotBlank
  private String email;
  @NotBlank
  private String password;
}