package com.grpo.tms.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

/**
 * DTO pour la requête de connexion.
 */
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class LoginRequest {
    @NotBlank(message = "Le nom d'utilisateur est obligatoire")
    private String username;

    @NotBlank(message = "Le mot de passe est obligatoire")
    private String password;
}
