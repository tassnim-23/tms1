package com.grpo.tms.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * Entité GPS — Stocke les positions en temps réel des camions.
 * Chaque chauffeur envoie sa position toutes les X secondes.
 */
@Entity
@Table(name = "positions_gps", indexes = {
    @Index(name = "idx_position_chauffeur", columnList = "chauffeur_id"),
    @Index(name = "idx_position_tournee",   columnList = "tournee_id"),
    @Index(name = "idx_position_date",      columnList = "timestamp")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Position {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Latitude GPS (ex: 36.8189) */
    @Column(nullable = false)
    private Double latitude;

    /** Longitude GPS (ex: 10.1658) */
    @Column(nullable = false)
    private Double longitude;

    /** Vitesse en km/h (optionnel, envoyée par l'appareil GPS) */
    @Column
    private Double vitesse;

    /** Précision du signal GPS en mètres */
    @Column
    private Double precision;

    /** ID du chauffeur qui envoie la position */
    @Column(name = "chauffeur_id", nullable = false)
    private Long chauffeurId;

    /** ID de la tournée en cours (peut être null si le chauffeur n'est pas en tournée) */
    @Column(name = "tournee_id")
    private Long tourneeId;

    /** Nom du chauffeur (dénormalisé pour l'affichage rapide) */
    @Column(name = "chauffeur_nom", length = 200)
    private String chauffeurNom;

    /** Statut du camion */
    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    @Builder.Default
    private StatutCamion statut = StatutCamion.EN_ROUTE;

    @CreationTimestamp
    @Column(name = "timestamp", updatable = false)
    private LocalDateTime timestamp;

    public enum StatutCamion {
        EN_ROUTE,    // En déplacement
        A_LARRET,    // Arrêté (vitesse = 0)
        LIVRAISON,   // En train de livrer
        PAUSE        // En pause
    }
}