package com.grpo.tms.dto;

import lombok.*;
import jakarta.validation.constraints.NotBlank;

/**
 * Request pour créer un message de support
 */
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class SupportMessageRequest {
    @NotBlank(message = "Le sujet est obligatoire")
    private String sujet;

    @NotBlank(message = "Le contenu est obligatoire")
    private String contenu;
}
