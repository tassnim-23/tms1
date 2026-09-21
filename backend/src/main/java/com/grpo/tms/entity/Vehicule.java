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
 * Entité représentant un véhicule dans le système TMS.
 */
@Entity
@Table(name = "vehicules")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Vehicule {

    /**
     * Statuts possibles d'un véhicule.
     */
    public enum StatutVehicule {
        DISPONIBLE, EN_SERVICE, EN_MAINTENANCE
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "L'immatriculation est obligatoire")
    @Column(nullable = false, unique = true, length = 20)
    private String immatriculation;

    @NotBlank(message = "La marque est obligatoire")
    @Column(nullable = false, length = 100)
    private String marque;

    @NotBlank(message = "Le modèle est obligatoire")
    @Column(nullable = false, length = 100)
    private String modele;

    @Min(value = 0, message = "La capacité de charge doit être positive")
    @Column(name = "capacite_charge")
    private Double capaciteCharge;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private StatutVehicule statut = StatutVehicule.DISPONIBLE;

    @Min(value = 0, message = "Le kilométrage doit être positif")
    @Column(nullable = false)
    @Builder.Default
    private Integer kilometrage = 0;

    @Column(name = "date_mise_en_service")
    private LocalDate dateMiseEnService;

    @OneToMany(mappedBy = "vehicule", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<Tournee> tournees = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
