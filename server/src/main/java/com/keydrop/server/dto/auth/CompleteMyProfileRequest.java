package com.keydrop.server.dto.auth;

import jakarta.validation.constraints.*;
import lombok.*;
import java.time.LocalDate;

@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
public class CompleteMyProfileRequest {

  @Email
  @Size(max = 255)
  private String email;

  @NotBlank
  @Size(max = 50)
  private String nickname;

  @NotNull
  private LocalDate birthDate;

  @NotBlank
  private String djLevel;
}