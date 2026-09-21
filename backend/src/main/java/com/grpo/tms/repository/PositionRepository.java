package com.grpo.tms.repository;

import com.grpo.tms.entity.Position;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface PositionRepository extends JpaRepository<Position, Long> {

    /**
     * Dernière position connue d'un chauffeur.
     * Utilisé pour afficher la position actuelle sur la carte.
     */
    Optional<Position> findTopByChauffeurIdOrderByTimestampDesc(Long chauffeurId);

    /**
     * Dernières positions de TOUS les chauffeurs actifs.
     * Requête optimisée : 1 position par chauffeur (la plus récente).
     */
    @Query("""
        SELECT p FROM Position p
        WHERE p.timestamp = (
            SELECT MAX(p2.timestamp)
            FROM Position p2
            WHERE p2.chauffeurId = p.chauffeurId
        )
    """)
    List<Position> findDernieresPositionsTousLesChauffeurs();

    /**
     * Historique de trajet d'une tournée.
     * Retourne toutes les positions dans l'ordre chronologique.
     */
    List<Position> findByTourneeIdOrderByTimestampAsc(Long tourneeId);

    /**
     * Positions d'un chauffeur dans un intervalle de temps.
     * Utile pour rejouer un trajet.
     */
    List<Position> findByChauffeurIdAndTimestampBetweenOrderByTimestampAsc(
        Long chauffeurId, LocalDateTime debut, LocalDateTime fin
    );

    /**
     * Supprime les positions anciennes (> 30 jours).
     * Appelé par la tâche planifiée de nettoyage.
     */
    void deleteByTimestampBefore(LocalDateTime dateLimit);

    /**
     * Nombre de positions enregistrées pour une tournée.
     */
    long countByTourneeId(Long tourneeId);

    /**
     * Positions actives des chauffeurs d'une tournée spécifique.
     */
    @Query("""
        SELECT p FROM Position p
        WHERE p.tourneeId = :tourneeId
        AND p.timestamp >= :depuis
        ORDER BY p.timestamp DESC
    """)
    List<Position> findPositionsTourneeRecentes(
        @Param("tourneeId") Long tourneeId,
        @Param("depuis") LocalDateTime depuis
    );
}