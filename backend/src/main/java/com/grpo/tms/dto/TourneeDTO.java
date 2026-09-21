package com.grpo.tms.dto;

import com.grpo.tms.entity.Tournee;
import jakarta.validation.constraints.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

/**
 * DTO pour les tournées — découple l'API REST des entités JPA.
 */
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class TourneeDTO {

    private Long id;
    private String numeroTournee;

    @NotNull(message = "La date de tournée est obligatoire")
    private LocalDate dateTournee;

    private LocalTime heureDebut;
    private LocalTime heureFin;

    // ── Chauffeur ─────────────────────────────────────────────────
    @NotNull(message = "Le chauffeur est obligatoire")
    private Long chauffeurId;
    private String chauffeurNom;      // prénom + nom
    private String chauffeurTelephone;

    // ── Véhicule ──────────────────────────────────────────────────
    @NotNull(message = "Le véhicule est obligatoire")
    private Long vehiculeId;
    private String vehiculeLabel;     // marque + modèle + immatriculation
    private String vehiculeImmatriculation;

    // ── Commandes ─────────────────────────────────────────────────
    private List<Long> commandeIds;
    private List<CommandeResume> commandes;
    private int nombreCommandes;

    // ── Métriques ─────────────────────────────────────────────────
    private Double distanceTotale;
    private Tournee.StatutTournee statut;
    private String remarques;

    // ── Audit ─────────────────────────────────────────────────────
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    /**
     * Résumé d'une commande dans la tournée (évite la récursion).
     */
    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class CommandeResume {
        private Long id;
        private String numeroCommande;
        private String adresseLivraison;
        private String villeLivraison;
        private String clientNom;
        private String statut;
    }
}
