package com.grpo.tms.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.LocalDateTime;

/**
 * Entité Transport — représente une commande de livraison.
 *
 * ⚠️  SI VOUS AVEZ DÉJÀ une entité "Commande" ou "Transport",
 *     NE PAS copier ce fichier — utilisez le vôtre.
 *
 * Ce fichier n'est à copier QUE si votre projet n'a pas encore
 * d'entité pour les commandes de transport.
 */
@Entity
@Table(name = "transports")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Transport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true)
    private String reference;        // Ex: CMD-1748234

    private Long clientId;           // FK vers clients.id
    private String clientNom;        // Dénormalisé pour affichage

    private String origine;          // Ville de départ
    private String destination;      // Ville d'arrivée

    private LocalDateTime dateDepart;
    private LocalDateTime dateLivraison;

    @Builder.Default
    private String statut = "EN_ATTENTE";  // EN_ATTENTE | EN_COURS | LIVRE | ANNULE

    private String type;             // ROUTIER | MARITIME | AERIEN

    private Double poids;            // en kg
    private Double cout;             // en DT

    @Column(columnDefinition = "TEXT")
    private String description;

    private Long chauffeurId;
    private Long vehiculeId;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
