package com.grpo.tms.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

/**
 * Entité représentant un utilisateur du système TMS.
 */
@Entity
@Table(name = "users",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = "username"),
                @UniqueConstraint(columnNames = "email")
        })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Le nom d'utilisateur est obligatoire")
    @Size(min = 3, max = 50, message = "Le nom d'utilisateur doit contenir entre 3 et 50 caractères")
    @Column(nullable = false, unique = true, length = 50)
    private String username;

    @NotBlank(message = "L'email est obligatoire")
    @Email(message = "Format d'email invalide")
    @Column(nullable = false, unique = true, length = 100)
    private String email;

    @NotBlank(message = "Le mot de passe est obligatoire")
    @Column(nullable = false)
    private String password;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "user_roles", joinColumns = @JoinColumn(name = "user_id"))
    @Column(name = "role")
    @Builder.Default
    private Set<String> roles = new HashSet<>(Set.of("USER"));

    // ✅ AJOUTER CE CHAMP
    @Column(nullable = false)
    @Builder.Default
    private Boolean active = true;

    // ── Vérification email après approbation ──────────────────
    private String codeVerification;
    private java.time.LocalDateTime codeVerifExpire;
    private Boolean emailVerifie = false;

    // ✅ NOUVEAU: Statut d'approbation du client
    @Enumerated(EnumType.STRING)
    @Column(name = "statut_approval", nullable = false, length = 20)
    @Builder.Default
    private StatutApproval statutApproval = StatutApproval.EN_ATTENTE;

    // ✅ NOUVEAU: Client ID (si applicable)
    @Column(name = "client_id")
    private Long clientId;

    // ✅ NOUVEAU: Relation OneToOne avec DemandeInscription
    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private DemandeInscription demandeInscription;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    /**
     * Enum pour le statut d'approbation des clients
     */
    public enum StatutApproval {
        EN_ATTENTE, APPROUVEE, REJETEE
    }

    // ── Getters/Setters vérification email ──────────────────
    public String getCodeVerification()                          { return codeVerification; }
    public void setCodeVerification(String v)                    { this.codeVerification = v; }
    public java.time.LocalDateTime getCodeVerifExpire()          { return codeVerifExpire; }
    public void setCodeVerifExpire(java.time.LocalDateTime v)    { this.codeVerifExpire = v; }
    public Boolean getEmailVerifie()                             { return emailVerifie != null && emailVerifie; }
    public void setEmailVerifie(Boolean v)                       { this.emailVerifie = v; }
}