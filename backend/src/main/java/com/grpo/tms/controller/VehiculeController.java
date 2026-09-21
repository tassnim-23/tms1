package com.grpo.tms.controller;

import com.grpo.tms.dto.VehiculeDTO;
import com.grpo.tms.entity.Vehicule;
import com.grpo.tms.service.VehiculeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Contrôleur REST pour la gestion des véhicules.
 */
@RestController
@RequestMapping("/vehicules")
@RequiredArgsConstructor
public class VehiculeController {

    private final VehiculeService vehiculeService;

    @GetMapping
    public ResponseEntity<Page<VehiculeDTO>> getAllVehicules(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("immatriculation").ascending());
        return ResponseEntity.ok(vehiculeService.getAllVehicules(pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<VehiculeDTO> getVehiculeById(@PathVariable Long id) {
        return ResponseEntity.ok(vehiculeService.getVehiculeById(id));
    }

    @GetMapping("/disponibles")
    public ResponseEntity<List<VehiculeDTO>> getVehiculesDisponibles() {
        return ResponseEntity.ok(vehiculeService.getVehiculesDisponibles());
    }

    @PostMapping
    public ResponseEntity<VehiculeDTO> createVehicule(@Valid @RequestBody VehiculeDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(vehiculeService.createVehicule(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<VehiculeDTO> updateVehicule(
            @PathVariable Long id, @Valid @RequestBody VehiculeDTO dto) {
        return ResponseEntity.ok(vehiculeService.updateVehicule(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteVehicule(@PathVariable Long id) {
        vehiculeService.deleteVehicule(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/statut")
    public ResponseEntity<VehiculeDTO> updateStatut(
            @PathVariable Long id, @RequestParam Vehicule.StatutVehicule statut) {
        return ResponseEntity.ok(vehiculeService.updateStatut(id, statut));
    }

    @PutMapping("/{id}/kilometrage")
    public ResponseEntity<VehiculeDTO> updateKilometrage(
            @PathVariable Long id, @RequestParam Integer kilometrage) {
        return ResponseEntity.ok(vehiculeService.updateKilometrage(id, kilometrage));
    }
}
