package com.grpo.tms.repository;

import com.grpo.tms.entity.Commande;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CommandeRepository extends JpaRepository<Commande, Long> {

    // ============================================================
    // MÉTHODES EXISTANTES
    // ============================================================

    List<Commande> findByClientId(Long clientId);

    @EntityGraph(attributePaths = {"client"})
    List<Commande> findByStatut(Commande.StatutCommande statut);

    long countByStatut(Commande.StatutCommande statut);

    List<Commande> findTop10ByOrderByCreatedAtDesc();

    Page<Commande> findAll(Pageable pageable);

    boolean existsByNumeroCommande(String numeroCommande);

    // ============================================================
    // MÉTHODES POUR LA CONFIRMATION DE LIVRAISON
    // ============================================================

    Optional<Commande> findByTokenConfirmation(String tokenConfirmation);

    @Query("""
        SELECT c FROM Commande c
        JOIN c.tournees t
        WHERE t.id = :tourneeId
          AND c.confirmationClient = 'EN_ATTENTE'
    """)
    List<Commande> findCommandesEnAttenteConfirmation(@Param("tourneeId") Long tourneeId);

    List<Commande> findByConfirmationClientAndStatut(
        Commande.ConfirmationClient confirmationClient,
        Commande.StatutCommande statut
    );

    @Query("""
        SELECT c FROM Commande c
        WHERE c.tokenConfirmation IS NOT NULL
          AND c.tokenExpiration > CURRENT_TIMESTAMP
          AND c.confirmationClient = 'EN_ATTENTE'
    """)
    List<Commande> findCommandesEnAttenteAvecTokenValide();

    boolean existsByTokenConfirmation(String tokenConfirmation);

    // ============================================================
    // MÉTHODES POUR LE REMPLACEMENT AUTOMATIQUE (REFUS CLIENT)
    // ============================================================

    /**
     * Commandes EN_ATTENTE dans la même zone (gouvernorat),
     * exclut celles déjà dans la tournée.
     * Triées par date de livraison prévue ASC puis priorité DESC.
     * Utilisé pour remplissage automatique après refus client.
     */
    @Query("""
        SELECT c FROM Commande c
        LEFT JOIN FETCH c.client
        WHERE c.statut = 'EN_ATTENTE'
          AND c.gouvernoratLivraison = :gouvernorat
          AND c.id NOT IN :excludeIds
        ORDER BY c.dateLivraisonPrevue ASC, c.priorite DESC
    """)
    List<Commande> findRemplacantsMemeZone(
        @Param("gouvernorat") String gouvernorat,
        @Param("excludeIds") List<Long> excludeIds
    );

    /**
     * Fallback : toutes commandes EN_ATTENTE sans filtre zone,
     * quand la zone n'a pas assez de commandes disponibles.
     */
    @Query("""
        SELECT c FROM Commande c
        LEFT JOIN FETCH c.client
        WHERE c.statut = 'EN_ATTENTE'
          AND c.id NOT IN :excludeIds
        ORDER BY c.dateLivraisonPrevue ASC, c.priorite DESC
    """)
    List<Commande> findRemplacantsToutes(@Param("excludeIds") List<Long> excludeIds);
}