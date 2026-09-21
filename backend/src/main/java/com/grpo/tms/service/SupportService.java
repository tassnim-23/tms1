package com.grpo.tms.service;

import com.grpo.tms.entity.SupportMessage;
import com.grpo.tms.entity.Client;
import com.grpo.tms.exception.BadRequestException;
import com.grpo.tms.exception.NotFoundException;
import com.grpo.tms.repository.SupportMessageRepository;
import com.grpo.tms.repository.ClientRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Service pour la gestion des messages de support client
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SupportService {

    private final SupportMessageRepository supportMessageRepository;
    private final ClientRepository clientRepository;

    /**
     * Envoyer un nouveau message de support
     */
    @Transactional
    public SupportMessage envoyerMessage(Long clientId, String sujet, String contenu) {
        log.info("Envoi d'un message de support pour le client: {}", clientId);

        Client client = clientRepository.findById(clientId)
                .orElseThrow(() -> new NotFoundException("Client non trouvé: " + clientId));

        if (sujet == null || sujet.isBlank()) {
            throw new BadRequestException("Le sujet est obligatoire");
        }
        if (contenu == null || contenu.isBlank()) {
            throw new BadRequestException("Le contenu est obligatoire");
        }

        SupportMessage message = SupportMessage.builder()
                .sujet(sujet)
                .contenu(contenu)
                .client(client)
                .clientId(clientId)
                .statut(SupportMessage.StatutMessage.NOUVEAU)
                .build();

        SupportMessage saved = supportMessageRepository.save(message);
        log.info("Message de support créé avec l'ID: {}", saved.getId());
        return saved;
    }

    /**
     * Récupérer tous les messages d'un client
     */
    @Transactional(readOnly = true)
    public List<SupportMessage> getMesMessages(Long clientId) {
        return supportMessageRepository.findByClientId(clientId);
    }

    /**
     * Récupérer un message par ID
     */
    @Transactional(readOnly = true)
    public SupportMessage getMessage(Long messageId) {
        return supportMessageRepository.findById(messageId)
                .orElseThrow(() -> new NotFoundException("Message non trouvé: " + messageId));
    }

    /**
     * Mettre à jour le statut d'un message
     */
    @Transactional
    public SupportMessage updateStatut(Long messageId, SupportMessage.StatutMessage nouveauStatut) {
        log.info("Mise à jour du statut du message: {} vers: {}", messageId, nouveauStatut);

        SupportMessage message = supportMessageRepository.findById(messageId)
                .orElseThrow(() -> new NotFoundException("Message non trouvé: " + messageId));

        message.setStatut(nouveauStatut);
        return supportMessageRepository.save(message);
    }

    /**
     * Supprimer un message
     */
    @Transactional
    public void supprimerMessage(Long messageId) {
        SupportMessage message = supportMessageRepository.findById(messageId)
                .orElseThrow(() -> new NotFoundException("Message non trouvé: " + messageId));
        supportMessageRepository.delete(message);
        log.info("Message de support supprimé: {}", messageId);
    }
}
