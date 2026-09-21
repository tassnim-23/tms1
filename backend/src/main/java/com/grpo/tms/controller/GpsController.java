package com.grpo.tms.controller;

import com.grpo.tms.dto.PositionDTO;
import com.grpo.tms.service.GpsService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Contrôleur REST GPS — Endpoints pour le suivi en temps réel.
 * Base URL : /api/gps
 *
 * ┌─────────────────────────────────────────────────────────────┐
 * │ POST   /api/gps/position           → Envoyer sa position    │
 * │ GET    /api/gps/positions          → Tous les camions actifs │
 * │ GET    /api/gps/chauffeur/{id}     → Position d'un chauffeur │
 * │ GET    /api/gps/tournee/{id}       → Trajet d'une tournée    │
 * │ GET    /api/gps/tournee/{id}/live  → Positions récentes      │
 * │ POST   /api/gps/simuler            → Simuler un trajet       │
 * └─────────────────────────────────────────────────────────────┘
 */
@RestController
@RequestMapping("/api/gps")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class GpsController {

    private final GpsService gpsService;

    // ─────────────────────────────────────────────────────────────────
    // ENVOYER UNE POSITION (appelé par l'appareil GPS / l'app mobile)
    // ─────────────────────────────────────────────────────────────────

    /**
     * POST /api/gps/position
     *
     * Utilisé par :
     *  - L'application mobile du chauffeur
     *  - Le script de simulation
     *  - Un appareil GPS tracker connecté
     *
     * Body JSON exemple :
     * {
     *   "latitude": 36.8189,
     *   "longitude": 10.1658,
     *   "vitesse": 65.5,
     *   "precision": 5.0,
     *   "chauffeurId": 1,
     *   "tourneeId": 3
     * }
     */
    @PostMapping("/position")
    public ResponseEntity<PositionDTO> envoyerPosition(
            @Valid @RequestBody PositionDTO dto) {
        log.info("Position reçue — Chauffeur #{} | Lat: {} | Lon: {}",
                dto.getChauffeurId(), dto.getLatitude(), dto.getLongitude());
        return ResponseEntity.ok(gpsService.enregistrerPosition(dto));
    }

    // ─────────────────────────────────────────────────────────────────
    // LIRE LES POSITIONS (appelé par le frontend Angular)
    // ─────────────────────────────────────────────────────────────────

    /**
     * GET /api/gps/positions
     *
     * Retourne la dernière position connue de TOUS les chauffeurs.
     * Le frontend appelle cet endpoint toutes les 5 secondes (polling).
     */
    @GetMapping("/positions")
    public ResponseEntity<List<PositionDTO>> getDernieresPositions() {
        return ResponseEntity.ok(gpsService.getDernieresPositions());
    }

    /**
     * GET /api/gps/chauffeur/{id}
     *
     * Retourne la dernière position d'un chauffeur spécifique.
     */
    @GetMapping("/chauffeur/{id}")
    public ResponseEntity<PositionDTO> getPositionChauffeur(@PathVariable Long id) {
        return ResponseEntity.ok(gpsService.getDernierePositionChauffeur(id));
    }

    /**
     * GET /api/gps/tournee/{id}
     *
     * Retourne l'historique COMPLET du trajet d'une tournée terminée.
     * Utile pour rejouer le trajet ou calculer les distances réelles.
     */
    @GetMapping("/tournee/{id}")
    public ResponseEntity<List<PositionDTO>> getHistoriqueTournee(@PathVariable Long id) {
        return ResponseEntity.ok(gpsService.getHistoriqueTournee(id));
    }

    /**
     * GET /api/gps/tournee/{id}/live
     *
     * Retourne les positions des 2 dernières heures d'une tournée EN_COURS.
     * Appelé toutes les 5 secondes pour le suivi live.
     */
    @GetMapping("/tournee/{id}/live")
    public ResponseEntity<List<PositionDTO>> getPositionsLive(@PathVariable Long id) {
        return ResponseEntity.ok(gpsService.getPositionsTourneeEnCours(id));
    }

    // ─────────────────────────────────────────────────────────────────
    // SIMULATION (TEST UNIQUEMENT — à désactiver en production)
    // ─────────────────────────────────────────────────────────────────

    /**
     * POST /api/gps/simuler
     *
     * Simule un trajet entre deux points pour les démonstrations.
     * Body JSON exemple :
     * {
     *   "chauffeurId": 1,
     *   "tourneeId": 1,
     *   "latDepart": 36.8189,
     *   "lonDepart": 10.1658,
     *   "latArrivee": 35.6781,
     *   "lonArrivee": 10.0983,
     *   "nbPoints": 20
     * }
     */
    @PostMapping("/simuler")
    public ResponseEntity<Map<String, Object>> simulerTrajet(
            @RequestBody Map<String, Object> body) {

        Long chauffeurId = Long.parseLong(body.get("chauffeurId").toString());
        Long tourneeId   = Long.parseLong(body.get("tourneeId").toString());
        double latDep    = Double.parseDouble(body.get("latDepart").toString());
        double lonDep    = Double.parseDouble(body.get("lonDepart").toString());
        double latArr    = Double.parseDouble(body.get("latArrivee").toString());
        double lonArr    = Double.parseDouble(body.get("lonArrivee").toString());
        int nbPoints     = body.containsKey("nbPoints")
                           ? Integer.parseInt(body.get("nbPoints").toString()) : 20;

        gpsService.simulerTrajet(chauffeurId, tourneeId, latDep, lonDep, latArr, lonArr, nbPoints);

        return ResponseEntity.ok(Map.of(
            "message", "Simulation créée avec succès",
            "nbPoints", nbPoints + 1,
            "chauffeurId", chauffeurId,
            "tourneeId", tourneeId
        ));
    }
}