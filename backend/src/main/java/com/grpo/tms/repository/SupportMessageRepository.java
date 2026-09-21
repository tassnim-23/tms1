package com.grpo.tms.repository;

import com.grpo.tms.entity.SupportMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository pour les messages de support
 */
@Repository
public interface SupportMessageRepository extends JpaRepository<SupportMessage, Long> {

    /**
     * Trouver tous les messages d'un client
     */
    List<SupportMessage> findByClientId(Long clientId);

    /**
     * Trouver les messages par statut
     */
    List<SupportMessage> findByStatut(SupportMessage.StatutMessage statut);

    /**
     * Trouver les messages d'un client par statut
     */
    List<SupportMessage> findByClientIdAndStatut(Long clientId, SupportMessage.StatutMessage statut);
}
