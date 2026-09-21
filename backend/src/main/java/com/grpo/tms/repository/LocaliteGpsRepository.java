package com.grpo.tms.repository;

import com.grpo.tms.entity.LocaliteGps;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

/**
 * Repository pour la table localite_gps.
 * Fournit toutes les methodes de recherche utilisees par LocaliteGpsService.
 */
public interface LocaliteGpsRepository extends JpaRepository<LocaliteGps, Long> {

    /**
     * Recherche exacte insensible a la casse.
     * Ex: "Jemmal" = "jemmal" = "JEMMAL"
     */
    Optional<LocaliteGps> findByNomIgnoreCaseAndActifTrue(String nom);

    /**
     * Recherche par code officiel (ex: "3219").
     */
    Optional<LocaliteGps> findByCodeAndActifTrue(String code);

    /**
     * Recherche partielle — nom contient la chaine cherchee.
     * Utile pour "Ksar Hellal" quand l'utilisateur saisit "ksar".
     */
    @Query("SELECT l FROM LocaliteGps l WHERE l.actif = true " +
           "AND LOWER(l.nom) LIKE LOWER(CONCAT('%', :terme, '%'))")
    List<LocaliteGps> rechercherParNomPartiel(@Param("terme") String terme);

    /**
     * Toutes les localites d'un gouvernorat.
     */
    List<LocaliteGps> findByGouvernoratIgnoreCaseAndActifTrue(String gouvernorat);

    /**
     * Autocompletion — retourne les noms correspondants.
     * Limite a 10 resultats pour la performance.
     */
    @Query("SELECT l FROM LocaliteGps l WHERE l.actif = true " +
           "AND LOWER(l.nom) LIKE LOWER(CONCAT(:debut, '%')) " +
           "ORDER BY l.nom LIMIT 10")
    List<LocaliteGps> autocomplete(@Param("debut") String debut);
}