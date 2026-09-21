package com.grpo.tms.controller;

import com.grpo.tms.dto.ClientDTO;
import com.grpo.tms.dto.CommandeDTO;
import com.grpo.tms.entity.Client;
import com.grpo.tms.service.ClientService;
import com.grpo.tms.service.CommandeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.Authentication;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Contrôleur REST pour la gestion des clients.
 */

@RestController
@RequestMapping("/clients")
@RequiredArgsConstructor
public class ClientController {
    
    @GetMapping("/test")
    public String test() {
        return "ClientController fonctionne!";
    }

    private final ClientService clientService;
    private final CommandeService commandeService;
    private final com.grpo.tms.repository.UserRepository userRepository;

    @GetMapping("/me")
    public ResponseEntity<ClientDTO> getMonProfil(Authentication authentication) {
        Long clientId = getCurrentClientId(authentication);
        return ResponseEntity.ok(clientService.getClientById(clientId));
    }
    
    @PutMapping("/me")
    public ResponseEntity<ClientDTO> updateMonProfil(
            @RequestBody ClientDTO dto, Authentication authentication) {
        Long clientId = getCurrentClientId(authentication);
        return ResponseEntity.ok(clientService.updateClient(clientId, dto));
    }

    /**
     * GET /api/clients - Liste tous les clients (pagination + recherche).
     */
    @GetMapping
    public ResponseEntity<Page<ClientDTO>> getAllClients(
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir) {

        Sort sort = sortDir.equalsIgnoreCase("desc")
                ? Sort.by(sortBy).descending()
                : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);
        return ResponseEntity.ok(clientService.getAllClients(search, pageable));
    }

    /**
     * GET /api/clients/{id} - Détails d'un client.
     */
    @GetMapping("/{id}")
    public ResponseEntity<ClientDTO> getClientById(@PathVariable Long id) {
        return ResponseEntity.ok(clientService.getClientById(id));
    }

    /**
     * POST /api/clients - Créer un client.
     */
    @PostMapping
    public ResponseEntity<ClientDTO> createClient(@Valid @RequestBody ClientDTO dto) {
        ClientDTO created = clientService.createClient(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * PUT /api/clients/{id} - Modifier un client.
     */
    @PutMapping("/{id}")
    public ResponseEntity<ClientDTO> updateClient(
            @PathVariable Long id, @Valid @RequestBody ClientDTO dto) {
        return ResponseEntity.ok(clientService.updateClient(id, dto));
    }

    /**
     * DELETE /api/clients/{id} - Supprimer un client.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteClient(@PathVariable Long id) {
        clientService.deleteClient(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * GET /api/clients/{id}/commandes - Toutes les commandes d'un client.
     */
    @GetMapping("/{id}/commandes")
    public ResponseEntity<List<CommandeDTO>> getCommandesByClient(@PathVariable Long id) {
        // Vérifier que le client existe
        clientService.getClientById(id);
        return ResponseEntity.ok(commandeService.getCommandesByClientId(id));
    }

    private Long getCurrentClientId(Authentication authentication) {
        String username = authentication.getName();
        return userRepository.findByUsername(username)
                .map(user -> user.getClientId())
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable: " + username));
    }
}