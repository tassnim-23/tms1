package com.grpo.tms.repository;

import com.grpo.tms.entity.Chauffeur;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

/**
 * Repository pour l'entité Chauffeur.
 */
@Repository
public interface ChauffeurRepository extends JpaRepository<Chauffeur, Long> {
    Optional<Chauffeur> findByEmail(String email);
    Optional<Chauffeur> findByNumeroPermis(String numeroPermis);
    boolean existsByEmail(String email);
    boolean existsByNumeroPermis(String numeroPermis);

    List<Chauffeur> findByDisponibleTrue();

    @Query("SELECT c FROM Chauffeur c WHERE c.disponible = true AND " +
           "c.id NOT IN (SELECT t.chauffeur.id FROM Tournee t WHERE t.statut = 'EN_COURS')")
    List<Chauffeur> findChauffeursDisponiblesEtLibres();
}
