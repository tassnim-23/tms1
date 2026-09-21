package com.grpo.tms.controller;

import com.grpo.tms.dto.FactureDTO;
import com.grpo.tms.entity.Facture;
import com.grpo.tms.service.FactureService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/factures")
@RequiredArgsConstructor
@Slf4j
public class FactureController {

    private final FactureService factureService;
    private final com.grpo.tms.repository.UserRepository userRepository;

    @jakarta.annotation.PostConstruct
    public void init() {
        log.info("FactureController charge avec succes");
    }

    @GetMapping("/mes-factures")
    public ResponseEntity<List<FactureDTO>> getMesFactures(Authentication authentication) {
        Long clientId = getCurrentClientId(authentication);
        List<Facture> factures = factureService.getMesFactures(clientId);
        List<FactureDTO> dtos = factures.stream().map(this::mapToDTO).collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/{id}")
    public ResponseEntity<FactureDTO> getFacture(@PathVariable Long id) {
        Facture facture = factureService.getFacture(id);
        return ResponseEntity.ok(mapToDTO(facture));
    }

    @GetMapping("/{id}/download")
    public ResponseEntity<byte[]> telechargerFacture(@PathVariable Long id) {
        byte[] pdfContent = factureService.telechargerFacture(id);
        Facture facture = factureService.getFacture(id);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + facture.getNumero() + ".pdf\"")
                .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_PDF_VALUE)
                .body(pdfContent);
    }
    @GetMapping("/client/{clientId}")
    public ResponseEntity<List<FactureDTO>> getFacturesClient(@PathVariable Long clientId) {
        List<Facture> factures = factureService.getMesFactures(clientId);
        List<FactureDTO> dtos = factures.stream().map(this::mapToDTO).collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    @PutMapping("/{id}/marquer-payee")
    public ResponseEntity<FactureDTO> marquerCommePayee(@PathVariable Long id) {
        Facture facture = factureService.marquerCommePayee(id);
        return ResponseEntity.ok(mapToDTO(facture));
    }

    @PutMapping("/{id}/statut")
    public ResponseEntity<FactureDTO> updateStatut(@PathVariable Long id, @RequestParam String statut) {
        try {
            Facture.StatutFacture nouveau = Facture.StatutFacture.valueOf(statut);
            Facture facture = factureService.updateStatut(id, nouveau);
            return ResponseEntity.ok(mapToDTO(facture));
        } catch (IllegalArgumentException e) {
            throw new com.grpo.tms.exception.BadRequestException("Statut invalide: " + statut);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> supprimerFacture(@PathVariable Long id) {
        factureService.supprimerFacture(id);
        return ResponseEntity.noContent().build();
    }

    private FactureDTO mapToDTO(Facture facture) {
        return FactureDTO.builder()
                .id(facture.getId())
                .numero(facture.getNumero())
                .dateFacture(facture.getDateFacture())
                .montant(facture.getMontant())
                .statut(facture.getStatut().toString())
                .clientId(facture.getClientId())
                .build();
    }

    private Long getCurrentClientId(Authentication authentication) {
        String username = authentication.getName();
        return userRepository.findByUsername(username)
                .map(user -> user.getClientId())
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable: " + username));
    }
}