package com.grpo.tms.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * Entité pour les messages de support client
 */
@Entity
@Table(name = "support_messages")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SupportMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Le sujet est obligatoire")
    @Column(nullable = false, length = 200)
    private String sujet;

    @NotBlank(message = "Le contenu est obligatoire")
    @Column(nullable = false, length = 2000, columnDefinition = "TEXT")
    private String contenu;

    @CreationTimestamp
    @Column(name = "date_envoi", updatable = false)
    private LocalDateTime dateEnvoi;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private StatutMessage statut = StatutMessage.NOUVEAU;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id", nullable = false)
    private Client client;

    @Column(name = "client_id", insertable = false, updatable = false)
    private Long clientId;

    /**
     * Enum pour le statut du message
     */
    public enum StatutMessage {
        NOUVEAU, EN_COURS, RESOLU
    }
}
