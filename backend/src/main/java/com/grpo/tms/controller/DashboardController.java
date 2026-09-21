package com.grpo.tms.controller;

import com.grpo.tms.entity.Commande;
import com.grpo.tms.repository.ClientRepository;
import com.grpo.tms.repository.CommandeRepository;
import com.grpo.tms.repository.ChauffeurRepository;
import com.grpo.tms.repository.VehiculeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/dashboard")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class DashboardController {

    private final ClientRepository clientRepository;
    private final CommandeRepository commandeRepository;
    private final ChauffeurRepository chauffeurRepository;
    private final VehiculeRepository vehiculeRepository;

    @GetMapping("/stats")
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<Map<String, Object>> getStats() {
        log.info("Dashboard stats demandées");
        Map<String, Object> stats = new HashMap<>();

        try {
            List<Commande> commandes = commandeRepository.findAll();

            stats.put("totalClients",    clientRepository.count());
            stats.put("totalCommandes",  commandes.size());
            stats.put("totalChauffeurs", chauffeurRepository.count());
            stats.put("totalVehicules",  vehiculeRepository.count());

            // Répartition par statut
            Map<String, Long> parStatut = commandes.stream()
                .collect(Collectors.groupingBy(
                    c -> c.getStatut() != null ? c.getStatut().name() : "INCONNU",
                    Collectors.counting()
                ));
            stats.put("commandesParStatut", parStatut);

            // Chiffre d'affaires estimé
            double ca = commandes.stream()
                .filter(c -> c.getCoutEstime() != null)
                .mapToDouble(c -> c.getCoutEstime())
                .sum();
            stats.put("chiffreAffairesEstime", ca);

        } catch (Exception e) {
            log.error("Erreur lors du calcul des stats dashboard : {}", e.getMessage());
            stats.put("error", "Erreur lors du calcul des statistiques");
        }

        return ResponseEntity.ok(stats);
    }

    @GetMapping("/recent-commandes")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getRecentCommandes() {
        log.info("Récupération des commandes récentes");
        try {
            List<Commande> recentes = commandeRepository.findTop10ByOrderByCreatedAtDesc();
            return ResponseEntity.ok(recentes);
        } catch (Exception e) {
            log.error("Erreur commandes récentes : {}", e.getMessage());
            return ResponseEntity.ok(Collections.emptyList());
        }
    }
}
