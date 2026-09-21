package com.grpo.tms.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "demande_inscription")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DemandeInscription {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String prenom;
    private String nom;

    @Column(nullable = false, unique = true)
    private String email;

    private String telephone;

    @Column(nullable = false, unique = true)
    private String username;

    @Column(nullable = false)
    private String passwordHash;

    private String matriculeFiscale;

    @Column(length = 500)
    private String messageMotivation;

    private String raisonSociale;
    private String activite;
    private String responsableEntreprise;
    private String adresseComplete;

    @Column(name = "raison_rejet", length = 1000)
    private String raisonRejet;

    // commentaireAdmin = alias de raisonRejet pour compatibilité
    @Column(name = "commentaire_admin", length = 1000)
    private String commentaireAdmin;

    @ManyToOne
    @JoinColumn(name = "client_id")
    private Client client;

    // ✅ NOUVEAU: Relation OneToOne avec User
    @OneToOne(cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", unique = true)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private StatutDemande statut = StatutDemande.EN_ATTENTE;

    @CreationTimestamp
    private LocalDateTime dateCreation;

    private LocalDateTime dateTraitement;

    public enum StatutDemande {
        EN_ATTENTE, APPROUVEE, REJETEE
    }
}
