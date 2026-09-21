package com.grpo.tms.dto;

import com.grpo.tms.entity.Position;
import jakarta.validation.constraints.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * DTO pour les positions GPS.
 * Utilisé pour recevoir ET envoyer les données de position.
 */
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class PositionDTO {

    private Long id;

    @NotNull(message = "La latitude est obligatoire")
    @DecimalMin(value = "-90.0",  message = "Latitude invalide")
    @DecimalMax(value = "90.0",   message = "Latitude invalide")
    private Double latitude;

    @NotNull(message = "La longitude est obligatoire")
    @DecimalMin(value = "-180.0", message = "Longitude invalide")
    @DecimalMax(value = "180.0",  message = "Longitude invalide")
    private Double longitude;

    /** Vitesse en km/h */
    private Double vitesse;

    /** Précision du signal GPS en mètres */
    private Double precision;

    @NotNull(message = "L'ID du chauffeur est obligatoire")
    private Long chauffeurId;

    /** ID de la tournée active (null si pas en tournée) */
    private Long tourneeId;

    private String chauffeurNom;

    private Position.StatutCamion statut;

    private LocalDateTime timestamp;

    // ─── Champs calculés pour le frontend (lecture seule) ────────────

    /** Adresse approximative (géocodage inverse, remplie par le service) */
    private String adresseApproximative;

    /** Dernière mise à jour en texte lisible (ex: "il y a 2 min") */
    private String derniereMaj;
}