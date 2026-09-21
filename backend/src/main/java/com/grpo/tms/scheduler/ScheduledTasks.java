package com.grpo.tms.scheduler;

import com.grpo.tms.entity.Commande;
import com.grpo.tms.entity.Tournee;
import com.grpo.tms.entity.Vehicule;
import com.grpo.tms.repository.ChauffeurRepository;
import com.grpo.tms.repository.CommandeRepository;
import com.grpo.tms.repository.TourneeRepository;
import com.grpo.tms.repository.VehiculeRepository;
import com.grpo.tms.service.ConfirmationLivraisonService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class ScheduledTasks {

    private final TourneeRepository   tourneeRepository;
    private final ChauffeurRepository chauffeurRepository;
    private final VehiculeRepository  vehiculeRepository;
    private final CommandeRepository  commandeRepository;
    
    // CHANGEMENT 1 — Ajout du champ injecté
    private final ConfirmationLivraisonService confirmationLivraisonService;

    /**
     * Toutes les minutes — vérifie et met à jour les statuts.
     *
     * Règles :
     *  PLANIFIEE + heure_debut <= maintenant  →  EN_COURS
     *  EN_COURS  + heure_fin   <= maintenant  →  TERMINEE
     */
    @Scheduled(fixedDelay = 60000) // toutes les 60 secondes
    @Transactional
    public void mettreAJourStatuts() {
        LocalDate today = LocalDate.now();
        LocalTime now   = LocalTime.now();

        // ── 1. PLANIFIEE → EN_COURS ───────────────────────────────
        List<Tournee> planifiees = tourneeRepository
            .findByDateTourneeAndStatut(today, Tournee.StatutTournee.PLANIFIEE);

        for (Tournee t : planifiees) {
            try {
                // Démarrer si heure_debut est atteinte (ou pas définie)
                boolean doitDemarrer = t.getHeureDebut() == null
                    || !now.isBefore(t.getHeureDebut());

                if (doitDemarrer) {
                    t.setStatut(Tournee.StatutTournee.EN_COURS);

                    // Chauffeur → Non disponible
                    if (t.getChauffeur() != null) {
                        t.getChauffeur().setDisponible(false);
                        chauffeurRepository.save(t.getChauffeur());
                    }
                    // Véhicule → EN_SERVICE
                    if (t.getVehicule() != null) {
                        t.getVehicule().setStatut(Vehicule.StatutVehicule.EN_SERVICE);
                        vehiculeRepository.save(t.getVehicule());
                    }
                    // Commandes → EN_COURS
                    for (Commande c : t.getCommandes()) {
                        if (c.getStatut() == Commande.StatutCommande.ASSIGNEE
                         || c.getStatut() == Commande.StatutCommande.EN_ATTENTE) {
                            c.setStatut(Commande.StatutCommande.EN_COURS);
                            commandeRepository.save(c);
                        }
                    }
                    tourneeRepository.save(t);
                    log.info("✅ Tournée {} → EN_COURS (heure: {})",
                        t.getNumeroTournee(), t.getHeureDebut());
                }
            } catch (Exception e) {
                log.error("Erreur démarrage tournée {}: {}", t.getId(), e.getMessage());
            }
        }

        // ── 2. EN_COURS → TERMINEE ────────────────────────────────
        // Tournées EN_COURS aujourd'hui dont l'heure de fin est atteinte
        List<Tournee> enCoursAujourdhui = tourneeRepository
            .findByDateTourneeAndStatut(today, Tournee.StatutTournee.EN_COURS);

        // Tournées EN_COURS des jours passés (oubliées)
        List<Tournee> enCoursPassees = tourneeRepository
            .findByDateTourneeBeforeAndStatut(today, Tournee.StatutTournee.EN_COURS);

        for (Tournee t : enCoursAujourdhui) {
            try {
                // Terminer si heure_fin est atteinte
                boolean doitTerminer = t.getHeureFin() != null
                    && !now.isBefore(t.getHeureFin());

                if (doitTerminer) {
                    terminerTournee(t);
                    log.info("✅ Tournée {} → TERMINEE (heure fin: {})",
                        t.getNumeroTournee(), t.getHeureFin());
                }
            } catch (Exception e) {
                log.error("Erreur clôture tournée {}: {}", t.getId(), e.getMessage());
            }
        }

        // Clôturer automatiquement les tournées des jours passés
        for (Tournee t : enCoursPassees) {
            try {
                terminerTournee(t);
                log.info("✅ Tournée {} → TERMINEE (date dépassée: {})",
                    t.getNumeroTournee(), t.getDateTournee());
            } catch (Exception e) {
                log.error("Erreur clôture tournée passée {}: {}", t.getId(), e.getMessage());
            }
        }
    }

    /**
     * Tous les jours à 23h59 — clôture forcée de sécurité.
     */
    @Scheduled(cron = "0 59 23 * * *")
    @Transactional
    public void clotureForceeQuotidienne() {
        List<Tournee> restantes = tourneeRepository
            .findByDateTourneeAndStatut(LocalDate.now(), Tournee.StatutTournee.EN_COURS);
        for (Tournee t : restantes) {
            try {
                terminerTournee(t);
                log.info("Clôture forcée 23h59 : {}", t.getNumeroTournee());
            } catch (Exception e) {
                log.error("Erreur clôture forcée {}: {}", t.getId(), e.getMessage());
            }
        }
    }

    // CHANGEMENT 2 — Tâche planifiée pour expirer les tokens obsolètes
    
    /**
     * Expire les tokens de confirmation dont la date limite est dépassée.
     * Exécuté toutes les heures.
     */
    @Scheduled(fixedRate = 3_600_000)  // toutes les heures (3 600 000 ms = 1 heure)
    @Transactional
    public void expirerConfirmationsObsoletes() {
        log.info("[SCHEDULER] Expiration des tokens de confirmation obsolètes...");
        try {
            confirmationLivraisonService.expirerTokensObsoletes();
        } catch (Exception e) {
            log.error("[SCHEDULER] Erreur expiration tokens: {}", e.getMessage());
        }
    }

    // ── Méthode interne ──────────────────────────────────────────
    private void terminerTournee(Tournee t) {
        t.setStatut(Tournee.StatutTournee.TERMINEE);

        // Chauffeur → Disponible
        if (t.getChauffeur() != null) {
            t.getChauffeur().setDisponible(true);
            chauffeurRepository.save(t.getChauffeur());
        }
        // Véhicule → DISPONIBLE
        if (t.getVehicule() != null) {
            t.getVehicule().setStatut(Vehicule.StatutVehicule.DISPONIBLE);
            vehiculeRepository.save(t.getVehicule());
        }
        // Commandes → LIVREE
        for (Commande c : t.getCommandes()) {
            if (c.getStatut() != Commande.StatutCommande.ANNULEE) {
                c.setStatut(Commande.StatutCommande.LIVREE);
                commandeRepository.save(c);
            }
        }
        tourneeRepository.save(t);
    }
}