package com.grpo.tms.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Entité représentant une tournée de livraison.
 * Une tournée associe un chauffeur + un véhicule à un ensemble de commandes pour une date donnée.
 */
@Entity
@Table(name = "tournees")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Tournee {

    /** Statuts possibles d'une tournée */
    public enum StatutTournee {
        PLANIFIEE,   // Créée, en attente d'exécution
        EN_COURS,    // En cours de livraison
        TERMINEE     // Toutes livraisons effectuées
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Référence unique auto-générée : TRN-YYYYMMDD-XXXX */
    @Column(name = "numero_tournee", unique = true, length = 30)
    private String numeroTournee;

    /** Date d'exécution de la tournée */
    @NotNull(message = "La date de tournée est obligatoire")
    @Column(name = "date_tournee", nullable = false)
    private LocalDate dateTournee;

    /** Heure de départ prévue */
    @Column(name = "heure_debut")
    private LocalTime heureDebut;

    /** Heure de fin prévue */
    @Column(name = "heure_fin")
    private LocalTime heureFin;

    /** Chauffeur assigné à cette tournée */
    @NotNull(message = "Le chauffeur est obligatoire")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "chauffeur_id", nullable = false)
    private Chauffeur chauffeur;

    /** Véhicule assigné à cette tournée */
    @NotNull(message = "Le véhicule est obligatoire")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicule_id", nullable = false)
    private Vehicule vehicule;

    /** Commandes à livrer dans cette tournée (ordonnées) */
    @ManyToMany(fetch = FetchType.LAZY, cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    @JoinTable(
        name = "tournee_commande",
        joinColumns = @JoinColumn(name = "tournee_id"),
        inverseJoinColumns = @JoinColumn(name = "commande_id")
    )
    @Builder.Default
    private List<Commande> commandes = new ArrayList<>();

    /** Distance totale prévue en km */
    @Min(value = 0, message = "La distance doit être positive")
    @Column(name = "distance_totale")
    private Double distanceTotale;
    @Column(name = "temps_estime_minutes")
    private Integer tempsEstimeMinutes;

    @Column(name = "cout_estime_dt")
    private Double coutEstimeDT;

    @Column(name = "optimisee")
    @Builder.Default
    private Boolean optimisee = false;

    /** Statut courant de la tournée */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private StatutTournee statut = StatutTournee.PLANIFIEE;

    /** Notes et observations */
    @Column(columnDefinition = "TEXT")
    private String remarques;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // ── Méthodes utilitaires ──────────────────────────────────────

    /** Ajoute une commande à la tournée */
    public void ajouterCommande(Commande commande) {
        this.commandes.add(commande);
    }

    /** Retire une commande de la tournée */
    public void retirerCommande(Commande commande) {
        this.commandes.remove(commande);
    }

    /** Indique si la tournée est modifiable */
    public boolean estModifiable() {
        return this.statut == StatutTournee.PLANIFIEE;
    }
}
