package com.grpo.tms.controller;

import com.grpo.tms.entity.Transport;
import com.grpo.tms.service.TransportService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Contrôleur REST — Commandes de transport
 * Endpoints : /api/transports
 *
 * Si votre entité s'appelle "Commande" au lieu de "Transport",
 * adaptez les imports et le service utilisé.
 */
@RestController
@RequestMapping("/api/transports")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class TransportController {

    private final TransportService transportService;

    /** GET /api/transports?page=0&size=10&statut=EN_COURS */
    @GetMapping
    public ResponseEntity<Page<Transport>> getAll(
            @RequestParam(defaultValue = "0")   int page,
            @RequestParam(defaultValue = "10")  int size,
            @RequestParam(required = false)     String statut,
            @RequestParam(required = false)     String search) {

        Pageable pageable = PageRequest.of(page, size, Sort.by("id").descending());
        return ResponseEntity.ok(transportService.getAll(statut, search, pageable));
    }

    /** GET /api/transports/{id} */
    @GetMapping("/{id}")
    public ResponseEntity<Transport> getById(@PathVariable Long id) {
        return ResponseEntity.ok(transportService.getById(id));
    }

    /** POST /api/transports */
    @PostMapping
    public ResponseEntity<Transport> create(@Valid @RequestBody Transport dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(transportService.create(dto));
    }

    /** PUT /api/transports/{id} */
    @PutMapping("/{id}")
    public ResponseEntity<Transport> update(
            @PathVariable Long id,
            @Valid @RequestBody Transport dto) {
        return ResponseEntity.ok(transportService.update(id, dto));
    }

    /** PATCH /api/transports/{id}/statut */
    @PatchMapping("/{id}/statut")
    public ResponseEntity<Transport> updateStatut(
            @PathVariable Long id,
            @RequestBody java.util.Map<String, String> body) {
        String statut = body.get("statut");
        return ResponseEntity.ok(transportService.updateStatut(id, statut));
    }

    /** DELETE /api/transports/{id} */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        transportService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
