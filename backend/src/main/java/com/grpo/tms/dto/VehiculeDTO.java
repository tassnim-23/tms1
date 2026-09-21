package com.grpo.tms.dto;

import com.grpo.tms.entity.Vehicule;
import jakarta.validation.constraints.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * DTO pour les opérations sur les véhicules.
 */
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class VehiculeDTO {
    private Long id;

    @NotBlank(message = "L'immatriculation est obligatoire")
    private String immatriculation;

    @NotBlank(message = "La marque est obligatoire")
    private String marque;

    @NotBlank(message = "Le modèle est obligatoire")
    private String modele;

    @Min(value = 0, message = "La capacité de charge doit être positive")
    private Double capaciteCharge;

    private Vehicule.StatutVehicule statut;

    @Min(value = 0, message = "Le kilométrage doit être positif")
    private Integer kilometrage;

    private LocalDate dateMiseEnService;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
