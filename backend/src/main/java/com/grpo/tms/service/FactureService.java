package com.grpo.tms.service;

import com.grpo.tms.entity.Facture;
import com.grpo.tms.entity.Client;
import com.grpo.tms.exception.NotFoundException;
import com.grpo.tms.exception.BadRequestException;
import com.grpo.tms.repository.FactureRepository;
import com.grpo.tms.repository.ClientRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

/**
 * Service pour la gestion des factures client
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class FactureService {

    private final FactureRepository factureRepository;
    private final ClientRepository clientRepository;

    /**
     * Créer une nouvelle facture
     */
    @Transactional
    public Facture creerFacture(Long clientId, String numero, BigDecimal montant) {
        log.info("Création de facture pour le client: {}, numéro: {}", clientId, numero);

        Client client = clientRepository.findById(clientId)
                .orElseThrow(() -> new NotFoundException("Client non trouvé: " + clientId));

        if (numero == null || numero.isBlank()) {
            throw new BadRequestException("Le numéro de facture est obligatoire");
        }
        if (montant == null || montant.signum() <= 0) {
            throw new BadRequestException("Le montant doit être supérieur à zéro");
        }

        Facture facture = Facture.builder()
                .numero(numero)
                .montant(montant)
                .client(client)
                .clientId(clientId)
                .statut(Facture.StatutFacture.EN_ATTENTE)
                .build();

        Facture saved = factureRepository.save(facture);
        log.info("Facture créée avec l'ID: {}", saved.getId());
        return saved;
    }

    /**
     * Récupérer toutes les factures d'un client
     */
    @Transactional(readOnly = true)
    public List<Facture> getMesFactures(Long clientId) {
        log.info("Récupération des factures pour le client: {}", clientId);
        return factureRepository.findByClientId(clientId);
    }

    /**
     * Récupérer une facture par ID
     */
    @Transactional(readOnly = true)
    public Facture getFacture(Long factureId) {
        return factureRepository.findById(factureId)
                .orElseThrow(() -> new NotFoundException("Facture non trouvée: " + factureId));
    }

    /**
     * Télécharger le PDF d'une facture
     */
    @Transactional(readOnly = true)
    public byte[] telechargerFacture(Long factureId) {
        Facture facture = getFacture(factureId);

        if (facture.getPdfContent() == null) {
            throw new BadRequestException("Le PDF de la facture n'est pas disponible");
        }

        log.info("Téléchargement du PDF de la facture: {}", factureId);
        return facture.getPdfContent();
    }

    /**
     * Marquer une facture comme payée
     */
    @Transactional
    public Facture marquerCommePayee(Long factureId) {
        Facture facture = getFacture(factureId);
        facture.setStatut(Facture.StatutFacture.PAYEE);
        log.info("Facture marquée comme payée: {}", factureId);
        return factureRepository.save(facture);
    }

    /**
     * Mettre à jour le statut d'une facture
     */
    @Transactional
    public Facture updateStatut(Long factureId, Facture.StatutFacture nouveauStatut) {
        Facture facture = getFacture(factureId);
        facture.setStatut(nouveauStatut);
        log.info("Statut de la facture {} mis à jour à: {}", factureId, nouveauStatut);
        return factureRepository.save(facture);
    }

    /**
     * Supprimer une facture
     */
    @Transactional
    public void supprimerFacture(Long factureId) {
        Facture facture = getFacture(factureId);
        factureRepository.delete(facture);
        log.info("Facture supprimée: {}", factureId);
    }
}
