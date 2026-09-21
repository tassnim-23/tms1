package com.grpo.tms.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Entité représentant un chauffeur dans le système TMS.
 */
@Entity
@Table(name = "chauffeurs",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = "email"),
                @UniqueConstraint(columnNames = "numero_permis")
        })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Chauffeur {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Le nom est obligatoire")
    @Column(nullable = false, length = 100)
    private String nom;

    @NotBlank(message = "Le prénom est obligatoire")
    @Column(nullable = false, length = 100)
    private String prenom;

    @NotBlank(message = "L'email est obligatoire")
    @Email(message = "Format d'email invalide")
    @Column(nullable = false, unique = true, length = 100)
    private String email;

    @NotBlank(message = "Le téléphone est obligatoire")
    @Pattern(regexp = "^[+]?[0-9]{8,15}$", message = "Format de téléphone invalide")
    @Column(nullable = false, length = 20)
    private String telephone;

    @NotBlank(message = "Le numéro de permis est obligatoire")
    @Column(name = "numero_permis", nullable = false, unique = true, length = 50)
    private String numeroPermis;

    @NotNull(message = "La date de validité du permis est obligatoire")
    @Future(message = "La date de validité du permis doit être dans le futur")
    @Column(name = "date_validite_permis", nullable = false)
    private LocalDate dateValiditePermis;

    @Column(nullable = false)
    @Builder.Default
    private Boolean disponible = true;

    @OneToMany(mappedBy = "chauffeur", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<Tournee> tournees = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    /**
     * Retourne le nom complet du chauffeur.
     */
    public String getNomComplet() {
        return prenom + " " + nom;
    }
}
