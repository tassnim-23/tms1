package com.grpo.tms.dto;

import lombok.*;
import java.time.LocalDateTime;

/**
 * DTO pour les messages de support
 */
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class SupportMessageDTO {
    private Long id;
    private String sujet;
    private String contenu;
    private LocalDateTime dateEnvoi;
    private String statut;  // NOUVEAU, EN_COURS, RESOLU
    private Long clientId;
}
