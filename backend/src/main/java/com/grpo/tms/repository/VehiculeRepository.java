package com.grpo.tms.repository;

import com.grpo.tms.entity.Vehicule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

/**
 * Repository pour l'entité Vehicule.
 */
@Repository
public interface VehiculeRepository extends JpaRepository<Vehicule, Long> {
    Optional<Vehicule> findByImmatriculation(String immatriculation);
    boolean existsByImmatriculation(String immatriculation);

    List<Vehicule> findByStatut(Vehicule.StatutVehicule statut);

    long countByStatut(Vehicule.StatutVehicule statut);
}
