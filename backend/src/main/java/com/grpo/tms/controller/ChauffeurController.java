package com.grpo.tms.controller;

import com.grpo.tms.dto.ChauffeurDTO;
import com.grpo.tms.dto.TourneeDTO;
import com.grpo.tms.service.ChauffeurService;
import com.grpo.tms.service.TourneeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import java.util.*;

/**
 * Contrôleur REST pour la gestion des chauffeurs.
 */
@RestController
@RequestMapping("/chauffeurs")
@RequiredArgsConstructor
public class ChauffeurController {

    private final ChauffeurService chauffeurService;
    private final TourneeService tourneeService;
    @GetMapping("/test")
public String test() {
    return "ChauffeurController fonctionne!";
}

    @GetMapping
    public ResponseEntity<Page<ChauffeurDTO>> getAllChauffeurs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("nom").ascending());
        return ResponseEntity.ok(chauffeurService.getAllChauffeurs(pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ChauffeurDTO> getChauffeurById(@PathVariable Long id) {
        return ResponseEntity.ok(chauffeurService.getChauffeurById(id));
    }

    @GetMapping("/disponibles")
    public ResponseEntity<List<ChauffeurDTO>> getChauffeursDisponibles() {
        return ResponseEntity.ok(chauffeurService.getChauffeursDisponibles());
    }

    @PostMapping
    public ResponseEntity<ChauffeurDTO> createChauffeur(@Valid @RequestBody ChauffeurDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(chauffeurService.createChauffeur(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ChauffeurDTO> updateChauffeur(
            @PathVariable Long id, @Valid @RequestBody ChauffeurDTO dto) {
        return ResponseEntity.ok(chauffeurService.updateChauffeur(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteChauffeur(@PathVariable Long id) {
        chauffeurService.deleteChauffeur(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/tournees")
    public ResponseEntity<List<TourneeDTO>> getTourneesByChauffeur(@PathVariable Long id) {
        chauffeurService.getChauffeurById(id);
        return ResponseEntity.ok(tourneeService.getTourneesByChauffeur(id));
    }

    @PutMapping("/{id}/disponibilite")
    public ResponseEntity<ChauffeurDTO> updateDisponibilite(
            @PathVariable Long id, @RequestParam boolean disponible) {
        return ResponseEntity.ok(chauffeurService.updateDisponibilite(id, disponible));
    }
}
