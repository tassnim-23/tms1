package com.grpo.tms.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import com.grpo.tms.entity.DemandeInscription;

public interface DemandeInscriptionRepository extends JpaRepository<DemandeInscription, Long> {
    boolean existsByEmail(String email);
    boolean existsByUsername(String username);
    List<DemandeInscription> findAllByOrderByDateCreationDesc();

    // Vérifie seulement les demandes EN_ATTENTE ou APPROUVEE (pas REJETEE)
    boolean existsByEmailAndStatutIn(String email, List<DemandeInscription.StatutDemande> statuts);
}