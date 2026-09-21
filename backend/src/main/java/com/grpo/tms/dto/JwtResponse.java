package com.grpo.tms.dto;

import lombok.*;
import java.util.Set;

/**
 * DTO pour la réponse d'authentification JWT.
 */
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class JwtResponse {
    private String token;
    @Builder.Default
    private String type = "Bearer";
    private Long id;
    private String username;
    private String email;
    private Set<String> roles;
    private String role;
    
    // ✅ NOUVEAU: Champs pour l'approbation client
    @Builder.Default
    private String statutApproval = "EN_ATTENTE";  // EN_ATTENTE | APPROUVEE | REJETEE
    private Long clientId;
}
