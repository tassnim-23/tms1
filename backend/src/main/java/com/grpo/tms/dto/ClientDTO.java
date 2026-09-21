package com.grpo.tms.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

/**
 * ClientDTO — Objet de transfert pour l'API REST /api/clients
 * Contient tous les champs anciens ET nouveaux.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ClientDTO {

    private Long id;

    // ── NOUVEAUX CHAMPS (v2 enrichi) ─────────────────────────────────

    /** Nom légal de l'entreprise — Ex : "GRPO Consulting SARL" */
    private String raisonSociale;

    /** Matricule fiscal — Ex : "1234567ABC" */
    private String matriculeFiscale;

    /** Nom du contact principal — Ex : "Ahmed Ben Ali" */
    private String responsableEntreprise;

    /** Adresse complète avec ville et pays */
    private String adresseComplete;

    /** Secteur : Transport, Logistique, Commerce, Distribution... */
    private String activite;

    // ── ANCIENS CHAMPS (compatibilité avec l'existant) ────────────────

    private String nom;
    private String prenom;

    @Email
    private String email;

    private String telephone;
    private String adresse;
    private String ville;
    private String codePostal;
    private String pays;
    private Boolean actif;

    // ── MÉTADONNÉES (lecture seule) ───────────────────────────────────

    private String createdAt;
    private String updatedAt;
}
