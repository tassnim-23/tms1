package com.grpo.tms.repository;

import com.grpo.tms.entity.Facture;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository pour les factures
 */
@Repository
public interface FactureRepository extends JpaRepository<Facture, Long> {

    /**
     * Trouver toutes les factures d'un client
     */
    List<Facture> findByClientId(Long clientId);

    /**
     * Trouver une facture par numero
     */
    Facture findByNumero(String numero);

    /**
     * Trouver les factures d'un client par statut
     */
    List<Facture> findByClientIdAndStatut(Long clientId, Facture.StatutFacture statut);
}
