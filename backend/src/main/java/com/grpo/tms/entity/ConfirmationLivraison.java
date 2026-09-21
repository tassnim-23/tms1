// ─────────────────────────────────────────────────────────────────────────────
// FICHIER : src/main/java/com/grpo/tms/entity/ConfirmationLivraison.java
// NOUVEAU FICHIER — à créer
// ─────────────────────────────────────────────────────────────────────────────
package com.grpo.tms.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * Enregistre le token de confirmation envoyé à chaque client
 * pour valider (ou refuser) la réception d'une commande dans une tournée.
 *
 * Cycle de vie :
 *   CREE       → email envoyé, en attente de réponse client
 *   CONFIRME   → client a accepté la livraison
 *   REFUSE     → client a refusé → la commande quitte la tournée
 *   EXPIRE     → délai dépassé sans réponse (géré par scheduler)
 */
@Entity
@Table(name = "confirmation_livraisons",
       indexes = @Index(name = "idx_token", columnList = "token", unique = true))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ConfirmationLivraison {

    public enum StatutConfirmation {
        CREE, CONFIRME, REFUSE, EXPIRE
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Token UUID unique inclus dans le lien email */
    @Column(nullable = false, unique = true, length = 64)
    private String token;

    /** La commande concernée */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "commande_id", nullable = false)
    private Commande commande;

    /** La tournée concernée */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tournee_id", nullable = false)
    private Tournee tournee;

    /** Heure d'arrivée estimée (calculée à la création) */
    @Column(name = "heure_arrivee_estimee", nullable = false)
    private LocalDateTime heureArriveeEstimee;

    /** Heure d'arrivée avec marge de 15 min (affichée au client) */
    @Column(name = "heure_arrivee_avec_marge", nullable = false)
    private LocalDateTime heureArriveeAvecMarge;

    /** Statut courant */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 15)
    @Builder.Default
    private StatutConfirmation statut = StatutConfirmation.CREE;

    /** Date/heure de réponse du client */
    @Column(name = "repondu_le")
    private LocalDateTime reponduLe;

    /** Date d'expiration du token (48h par défaut) */
    @Column(name = "expire_le", nullable = false)
    private LocalDateTime expireLe;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}