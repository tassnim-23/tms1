package com.grpo.tms.controller;

import com.grpo.tms.entity.LocaliteGps;
import com.grpo.tms.service.optimisation.LocaliteGpsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * API REST pour la gestion des localites GPS.
 *
 * Endpoints :
 *   GET /api/localites/autocomplete?q=jemm      → suggestions pour le champ adresse
 *   GET /api/localites/gouvernorat/Monastir      → toutes les localites d'un gouvernorat
 *   GET /api/localites/resolve?ville=Jemmal      → coordonnees GPS d'une ville
 */
@RestController
@RequestMapping("/localites")
@RequiredArgsConstructor
public class LocaliteGpsController {

    private final LocaliteGpsService localiteService;

    /**
     * Autocomplete pour le champ "Ville de livraison" dans le formulaire commande.
     * Exemple : GET /localites/autocomplete?q=jem → ["Jemmal", "Menzel Ennour", ...]
     */
    @GetMapping("/autocomplete")
    public ResponseEntity<List<LocaliteGps>> autocomplete(@RequestParam String q) {
        return ResponseEntity.ok(localiteService.autocomplete(q));
    }

    /**
     * Liste toutes les localites d'un gouvernorat.
     * Exemple : GET /localites/gouvernorat/Monastir
     */
    @GetMapping("/gouvernorat/{gouvernorat}")
    public ResponseEntity<List<LocaliteGps>> parGouvernorat(
            @PathVariable String gouvernorat) {
        return ResponseEntity.ok(localiteService.getParGouvernorat(gouvernorat));
    }

    /**
     * Resout les coordonnees GPS d'une ville.
     * Utilise par le frontend pour afficher le marqueur sur la carte.
     * Exemple : GET /localites/resolve?ville=Ksar+Hellal
     */
    @GetMapping("/resolve")
    public ResponseEntity<Map<String, Object>> resolve(@RequestParam String ville) {
        double[] coords = localiteService.getCoordonnees(ville);
        if (coords == null) {
            return ResponseEntity.ok(Map.of(
                "ville",    ville,
                "trouve",   false,
                "message",  "Localite introuvable dans la base de donnees"
            ));
        }
        return ResponseEntity.ok(Map.of(
            "ville",    ville,
            "trouve",   true,
            "latitude", coords[0],
            "longitude",coords[1]
        ));
    }
}