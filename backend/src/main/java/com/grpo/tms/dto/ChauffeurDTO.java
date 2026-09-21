package com.grpo.tms.dto;

import jakarta.validation.constraints.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * DTO pour les opérations sur les chauffeurs.
 */
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ChauffeurDTO {
    private Long id;

    @NotBlank(message = "Le nom est obligatoire")
    private String nom;

    @NotBlank(message = "Le prénom est obligatoire")
    private String prenom;

    @NotBlank(message = "L'email est obligatoire")
    @Email(message = "Format d'email invalide")
    private String email;

    @NotBlank(message = "Le téléphone est obligatoire")
    @Pattern(regexp = "^[+]?[0-9]{8,15}$", message = "Format de téléphone invalide")
    private String telephone;

    @NotBlank(message = "Le numéro de permis est obligatoire")
    private String numeroPermis;

    @NotNull(message = "La date de validité du permis est obligatoire")
    @Future(message = "La date de validité du permis doit être dans le futur")
    private LocalDate dateValiditePermis;

    private Boolean disponible;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private int nombreTournees;
}
