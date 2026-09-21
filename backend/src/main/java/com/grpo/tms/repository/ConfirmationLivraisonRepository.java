// ─────────────────────────────────────────────────────────────────────────────
// FICHIER : src/main/java/com/grpo/tms/repository/ConfirmationLivraisonRepository.java
// NOUVEAU FICHIER — à créer
// ─────────────────────────────────────────────────────────────────────────────
package com.grpo.tms.repository;

import com.grpo.tms.entity.ConfirmationLivraison;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ConfirmationLivraisonRepository extends JpaRepository<ConfirmationLivraison, Long> {

    /** Cherche un token pour validation */
    Optional<ConfirmationLivraison> findByToken(String token);

    /** Toutes les confirmations d'une tournée */
    List<ConfirmationLivraison> findByTourneeId(Long tourneeId);

    /** Confirmations d'une commande */
    List<ConfirmationLivraison> findByCommandeId(Long commandeId);

    /** Tokens expirés encore au statut CREE */
    @Query("""
        SELECT c FROM ConfirmationLivraison c
        WHERE c.statut = 'CREE'
          AND c.expireLe < :now
    """)
    List<ConfirmationLivraison> findExpires(LocalDateTime now);

    /** Vérifie si toutes les commandes d'une tournée ont été confirmées */
    @Query("""
        SELECT COUNT(c) = 0 FROM ConfirmationLivraison c
        WHERE c.tournee.id = :tourneeId
          AND c.statut = 'CREE'
    """)
    boolean toutesConfirmeesOuRefusees(Long tourneeId);

    /** Compte les REFUSES pour une tournée */
    long countByTourneeIdAndStatut(Long tourneeId, ConfirmationLivraison.StatutConfirmation statut);
}