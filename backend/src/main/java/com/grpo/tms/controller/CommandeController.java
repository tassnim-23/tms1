package com.grpo.tms.controller;

import com.grpo.tms.dto.CommandeDTO;
import com.grpo.tms.entity.Commande;
import com.grpo.tms.service.CommandeService;
import jakarta.validation.Valid;
import org.springframework.data.domain.*;
import org.springframework.http.*;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/commandes")
@CrossOrigin(origins = "http://localhost:4200")
public class CommandeController {

    private final CommandeService commandeService;
    private final com.grpo.tms.repository.UserRepository userRepository;

    public CommandeController(CommandeService commandeService,
                               com.grpo.tms.repository.UserRepository userRepository) {
        this.commandeService = commandeService;
        this.userRepository = userRepository;
    }

    @GetMapping("/mes-commandes")
    public ResponseEntity<List<CommandeDTO>> getMesCommandes(Authentication authentication) {
        Long clientId = getCurrentClientId(authentication);
        return ResponseEntity.ok(commandeService.getCommandesByClientId(clientId));
    }

    @PostMapping("/mes-commandes")
    public ResponseEntity<CommandeDTO> creerMaCommande(
            @RequestBody CommandeDTO dto, Authentication authentication) {
        Long clientId = getCurrentClientId(authentication);
        dto.setClientId(clientId);
        return ResponseEntity.status(HttpStatus.CREATED).body(commandeService.createCommande(dto));
    }

    @GetMapping("/test")
    public String test() {
        return "CommandeController fonctionne!";
    }

    @GetMapping
    public ResponseEntity<Page<CommandeDTO>> getAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        Sort sort = sortDir.equalsIgnoreCase("desc")
                ? Sort.by(sortBy).descending()
                : Sort.by(sortBy).ascending();
        return ResponseEntity.ok(commandeService.getAllCommandes(PageRequest.of(page, size, sort)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<CommandeDTO> getById(@PathVariable Long id) {
        return ResponseEntity.ok(commandeService.getCommandeById(id));
    }

    @PostMapping
    public ResponseEntity<CommandeDTO> create(@Valid @RequestBody CommandeDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(commandeService.createCommande(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CommandeDTO> update(
            @PathVariable Long id, @Valid @RequestBody CommandeDTO dto) {
        return ResponseEntity.ok(commandeService.updateCommande(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        commandeService.deleteCommande(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/statut")
    public ResponseEntity<CommandeDTO> updateStatut(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        Commande.StatutCommande statut = Commande.StatutCommande.valueOf(body.get("statut"));
        return ResponseEntity.ok(commandeService.updateStatut(id, statut));
    }

    @GetMapping("/client/{clientId}")
    public ResponseEntity<List<CommandeDTO>> getByClient(@PathVariable Long clientId) {
        return ResponseEntity.ok(commandeService.getCommandesByClientId(clientId));
    }

    @GetMapping("/en-attente")
    public ResponseEntity<List<CommandeDTO>> getEnAttente() {
        return ResponseEntity.ok(commandeService.getCommandesEnAttente());
    }

    @GetMapping("/statistiques")
    public ResponseEntity<Map<String, Object>> getStatistiques() {
        return ResponseEntity.ok(commandeService.getStatistiques());
    }

    private Long getCurrentClientId(Authentication authentication) {
        String username = authentication.getName();
        return userRepository.findByUsername(username)
                .map(user -> user.getClientId())
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable: " + username));
    }
}