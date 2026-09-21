package com.grpo.tms.controller;

import com.grpo.tms.dto.TourneeDTO;
import com.grpo.tms.entity.*;
import com.grpo.tms.repository.ChauffeurRepository;
import com.grpo.tms.repository.VehiculeRepository;
import com.grpo.tms.service.TourneeService;
import com.grpo.tms.service.optimisation.OptimisationService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Contrôleur REST pour la gestion des tournées.
 * Endpoints sécurisés par rôles JWT.
 */
@Slf4j
@RestController
@RequestMapping("/tournees")
@CrossOrigin(origins = "http://localhost:4200")
@RequiredArgsConstructor
public class TourneeController {

    private final TourneeService tourneeService;
    private final OptimisationService optimisationService;
    private final ChauffeurRepository chauffeurRepo;
    private final VehiculeRepository vehiculeRepo;

    @GetMapping("/test")
    public String test() {
        return "TourneeController fonctionne!";
    }

    // ── GET ALL ───────────────────────────────────────────────────
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<List<TourneeDTO>> getAll(
            @RequestParam(required = false) Tournee.StatutTournee statut) {
        if (statut != null) {
            return ResponseEntity.ok(tourneeService.listerParStatut(statut));
        }
        return ResponseEntity.ok(tourneeService.listerTournees());
    }

    // ── APPLY OPTIMISATION ────────────────────────────────────────
    @PostMapping("/appliquer-optimisation")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> appliquerOptimisation(
            @RequestBody List<Map<String, Object>> tourneesOptimisees) {

        Map<String, Object> response = new HashMap<>();
        int creees = 0;

        // Récupérer premier chauffeur et véhicule disponibles
        List<Chauffeur> chauffeurs = chauffeurRepo.findAll();
        List<Vehicule> vehicules = vehiculeRepo.findAll();

        if (chauffeurs.isEmpty() || vehicules.isEmpty()) {
            response.put("erreur", "Aucun chauffeur ou véhicule disponible");
            return ResponseEntity.badRequest().body(response);
        }

        int ressourceIndex = 0;

        for (Map<String, Object> t : tourneesOptimisees) {
            try {
                // Récupérer IDs des commandes
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> commandes = (List<Map<String, Object>>) t.get("commandes");
                List<Long> commandeIds = commandes.stream()
                        .map(c -> Long.valueOf(c.get("id").toString()))
                        .collect(Collectors.toList());

                // Assigner chauffeur et véhicule en rotation
                Chauffeur chauffeur = chauffeurs.get(ressourceIndex % chauffeurs.size());
                Vehicule vehicule = vehicules.get(ressourceIndex % vehicules.size());
                ressourceIndex++;

                // Créer le DTO tournée
                TourneeDTO dto = new TourneeDTO();
                dto.setDateTournee(LocalDate.now().plusDays(1));
                dto.setChauffeurId(chauffeur.getId());
                dto.setVehiculeId(vehicule.getId());
                dto.setCommandeIds(commandeIds);
                dto.setDistanceTotale(
                    t.get("distanceKm") != null ? Double.valueOf(t.get("distanceKm").toString()) : 0.0
                );
                dto.setRemarques("Tournée créée par optimisation automatique");

                tourneeService.creerTournee(dto);
                creees++;

            } catch (Exception e) {
                log.warn("Erreur création tournée optimisée: {}", e.getMessage());
            }
        }

        response.put("message", creees + " tournée(s) créée(s) avec succès");
        response.put("nombre", creees);
        return ResponseEntity.ok(response);
    }

    // ── GET BY ID ─────────────────────────────────────────────────
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<TourneeDTO> getById(@PathVariable Long id) {
        return ResponseEntity.ok(tourneeService.getTournee(id));
    }

    // ── CHAUFFEURS DISPONIBLES ────────────────────────────────────
    @GetMapping("/chauffeurs-disponibles")
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<List<Map<String, Object>>> getChauffeursDisponibles(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) Long tourneeId) {
        log.info("GET /chauffeurs-disponibles?date={}&tourneeId={}", date, tourneeId);
        List<Map<String, Object>> result = tourneeService.getChauffeursDisponibles(date, tourneeId)
            .stream().map(c -> {
                Map<String, Object> m = new HashMap<>();
                m.put("id",        c.getId());
                m.put("nom",       c.getNom());
                m.put("prenom",    c.getPrenom());
                m.put("telephone", c.getTelephone());
                m.put("email",     c.getEmail());
                m.put("disponible", c.getDisponible());
                return m;
            }).collect(Collectors.toList());
        log.info("Chauffeurs disponibles retournés : {}", result.size());
        return ResponseEntity.ok(result);
    }

    // ── VÉHICULES DISPONIBLES ─────────────────────────────────────
    @GetMapping("/vehicules-disponibles")
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<List<Map<String, Object>>> getVehiculesDisponibles(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) Long tourneeId) {
        log.info("GET /vehicules-disponibles?date={}&tourneeId={}", date, tourneeId);
        List<Map<String, Object>> result = tourneeService.getVehiculesDisponibles(date, tourneeId)
            .stream().map(v -> {
                Map<String, Object> m = new HashMap<>();
                m.put("id",             v.getId());
                m.put("marque",         v.getMarque());
                m.put("modele",         v.getModele());
                m.put("immatriculation", v.getImmatriculation());
                m.put("capaciteCharge", v.getCapaciteCharge());
                m.put("statut",         v.getStatut());
                return m;
            }).collect(Collectors.toList());
        log.info("Véhicules disponibles retournés : {}", result.size());
        return ResponseEntity.ok(result);
    }

    // ── CREATE ────────────────────────────────────────────────────
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<TourneeDTO> create(@Valid @RequestBody TourneeDTO dto) {
        log.info("POST /api/tournees — création tournée date={}", dto.getDateTournee());
        return ResponseEntity.status(HttpStatus.CREATED).body(tourneeService.creerTournee(dto));
    }

    // ── UPDATE ────────────────────────────────────────────────────
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<TourneeDTO> update(
            @PathVariable Long id, @Valid @RequestBody TourneeDTO dto) {
        return ResponseEntity.ok(tourneeService.modifierTournee(id, dto));
    }

    // ── DELETE ────────────────────────────────────────────────────
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        tourneeService.supprimerTournee(id);
        return ResponseEntity.noContent().build();
    }

    // ── CHANGER STATUT ────────────────────────────────────────────
    @PatchMapping("/{id}/statut")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<TourneeDTO> changerStatut(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        Tournee.StatutTournee statut = Tournee.StatutTournee.valueOf(body.get("statut"));
        return ResponseEntity.ok(tourneeService.changerStatut(id, statut));
    }

    // ── OPTIMISER ─────────────────────────────────────────────────
    @GetMapping("/optimiser")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Map<String, Object>>> optimiser() {
        log.info("GET /tournees/optimiser — lancement optimisation");
        return ResponseEntity.ok(optimisationService.optimiser());
    }
}