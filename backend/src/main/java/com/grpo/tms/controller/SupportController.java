package com.grpo.tms.controller;

import com.grpo.tms.dto.SupportMessageDTO;
import com.grpo.tms.dto.SupportMessageRequest;
import com.grpo.tms.entity.SupportMessage;
import com.grpo.tms.exception.NotFoundException;
import com.grpo.tms.service.SupportService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Controller pour la gestion des messages de support
 */
@RestController
@RequestMapping("/support")
@RequiredArgsConstructor
@Slf4j
public class SupportController {

    private final SupportService supportService;
    private final com.grpo.tms.repository.UserRepository userRepository;

    /**
     * Créer un nouveau message de support
     */
    @PostMapping("/messages")
    public ResponseEntity<SupportMessageDTO> envoyerMessage(
            @Valid @RequestBody SupportMessageRequest request,
            Authentication authentication) {
        log.info("Création d'un message de support pour l'utilisateur: {}", authentication.getName());

        // Récupérer le clientId depuis le contexte de sécurité ou la BD
        Long clientId = getCurrentClientId(authentication);

        SupportMessage message = supportService.envoyerMessage(clientId, request.getSujet(), request.getContenu());
        SupportMessageDTO dto = mapToDTO(message);

        return ResponseEntity.status(HttpStatus.CREATED).body(dto);
    }

    /**
     * Récupérer tous les messages de support de l'utilisateur
     */
    @GetMapping("/mes-messages")
    public ResponseEntity<List<SupportMessageDTO>> getMesMessages(Authentication authentication) {
        Long clientId = getCurrentClientId(authentication);
        List<SupportMessage> messages = supportService.getMesMessages(clientId);
        List<SupportMessageDTO> dtos = messages.stream().map(this::mapToDTO).collect(Collectors.toList());

        return ResponseEntity.ok(dtos);
    }
    @GetMapping("/client/{clientId}")
    public ResponseEntity<List<SupportMessageDTO>> getMessagesClient(@PathVariable Long clientId) {
        List<SupportMessage> messages = supportService.getMesMessages(clientId);
        List<SupportMessageDTO> dtos = messages.stream().map(this::mapToDTO).collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    /**
     * Récupérer un message de support par ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<SupportMessageDTO> getMessage(@PathVariable Long id) {
        SupportMessage message = supportService.getMessage(id);
        SupportMessageDTO dto = mapToDTO(message);

        return ResponseEntity.ok(dto);
    }

    /**
     * Mettre à jour le statut d'un message (admin)
     */
    @PutMapping("/{id}/statut")
    public ResponseEntity<SupportMessageDTO> updateStatut(
            @PathVariable Long id,
            @RequestParam String statut) {
        try {
            SupportMessage.StatutMessage nouveau = SupportMessage.StatutMessage.valueOf(statut);
            SupportMessage message = supportService.updateStatut(id, nouveau);
            SupportMessageDTO dto = mapToDTO(message);

            return ResponseEntity.ok(dto);
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Statut invalide: " + statut);
        }
    }

    /**
     * Supprimer un message de support
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> supprimerMessage(@PathVariable Long id) {
        supportService.supprimerMessage(id);
        return ResponseEntity.noContent().build();
    }

    // ── Méthodes utilitaires ──────────────────────────────────────

    private SupportMessageDTO mapToDTO(SupportMessage message) {
        return SupportMessageDTO.builder()
                .id(message.getId())
                .sujet(message.getSujet())
                .contenu(message.getContenu())
                .dateEnvoi(message.getDateEnvoi())
                .statut(message.getStatut().toString())
                .clientId(message.getClientId())
                .build();
    }

    private Long getCurrentClientId(Authentication authentication) {
        String username = authentication.getName();
        return userRepository.findByUsername(username)
                .map(user -> user.getClientId())
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable: " + username));
    }
}

class BadRequestException extends RuntimeException {
    public BadRequestException(String message) {
        super(message);
    }
}