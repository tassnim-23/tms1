package com.grpo.tms.repository;

import com.grpo.tms.entity.Tournee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

/**
 * Repository JPA pour les tournées.
 */
@Repository
public interface TourneeRepository extends JpaRepository<Tournee, Long> {

    /** Tournées par statut */
    List<Tournee> findByStatutOrderByDateTourneeDesc(Tournee.StatutTournee statut);

    /** Tournées d'une date donnée */
    List<Tournee> findByDateTourneeOrderByHeureDebut(LocalDate date);

    /** Tournées entre deux dates */
    List<Tournee> findByDateTourneeBetweenOrderByDateTourneeDesc(LocalDate debut, LocalDate fin);

    /** Tournées d'un chauffeur pour une date (vérifier disponibilité) */
    @Query("""
        SELECT t FROM Tournee t
        WHERE t.dateTournee = :date
          AND t.chauffeur.id = :chauffeurId
          AND t.statut IN ('PLANIFIEE', 'EN_COURS')
        """)
    List<Tournee> findByDateTourneeAndChauffeurId(
        @Param("date") LocalDate date,
        @Param("chauffeurId") Long chauffeurId
    );

    /** Tournées d'un véhicule pour une date (vérifier disponibilité) */
    @Query("""
        SELECT t FROM Tournee t
        WHERE t.dateTournee = :date
          AND t.vehicule.id = :vehiculeId
          AND t.statut IN ('PLANIFIEE', 'EN_COURS')
        """)
    List<Tournee> findByDateTourneeAndVehiculeId(
        @Param("date") LocalDate date,
        @Param("vehiculeId") Long vehiculeId
    );

    /** IDs des chauffeurs OCCUPÉS pour une date */
    @Query("""
        SELECT DISTINCT t.chauffeur.id FROM Tournee t
        WHERE t.dateTournee = :date
          AND t.statut IN ('PLANIFIEE', 'EN_COURS')
          AND (:tourneeId IS NULL OR t.id <> :tourneeId)
        """)
    List<Long> findChauffeurIdsOccupes(
        @Param("date") LocalDate date,
        @Param("tourneeId") Long tourneeId
    );

    /** IDs des véhicules OCCUPÉS pour une date */
    @Query("""
        SELECT DISTINCT t.vehicule.id FROM Tournee t
        WHERE t.dateTournee = :date
          AND t.statut IN ('PLANIFIEE', 'EN_COURS')
          AND (:tourneeId IS NULL OR t.id <> :tourneeId)
        """)
    List<Long> findVehiculeIdsOccupes(
        @Param("date") LocalDate date,
        @Param("tourneeId") Long tourneeId
    );

    /** Nombre de tournées d'un chauffeur */
    long countByChauffeurId(Long chauffeurId);

    /** Nombre de tournées d'un véhicule */
    long countByVehiculeId(Long vehiculeId);

    /** Utilisées par ScheduledTasks — rappel et clôture */
    List<Tournee> findByDateTourneeAndStatut(LocalDate date, Tournee.StatutTournee statut);

    List<Tournee> findByDateTourneeBeforeAndStatut(LocalDate date, Tournee.StatutTournee statut);

    /** Dernières tournées pour le dashboard */
    List<Tournee> findTop10ByOrderByCreatedAtDesc();

    /**
     * ✅ CORRIGÉE — utilisée par le scheduler de démarrage automatique
     * Remplace l'ancienne findByStatutAndHeureDepartBefore (champ inexistant)
     * Utilise dateTournee (LocalDate) + heureDebut (LocalTime) qui existent dans l'entité
     */
    List<Tournee> findByDateTourneeAndStatutAndHeureDebutLessThanEqual(
        LocalDate dateTournee,
        Tournee.StatutTournee statut,
        LocalTime heureDebut
    );
}