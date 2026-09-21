package com.grpo.tms.service;

import com.grpo.tms.entity.Client;
import com.grpo.tms.entity.Commande;
import com.grpo.tms.entity.Tournee;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final EmailService emailService;

    public void notifierCreationClient(Client client) {
        log.info("Notification bienvenue client: {}", client.getEmail());
        try { emailService.envoyerEmailBienvenueClient(client); }
        catch (Exception e) { log.error("Erreur bienvenue: {}", e.getMessage()); }
    }

    public void notifierConfirmationCommande(Commande commande) {
        log.info("Notification confirmation commande: {}", commande.getNumeroCommande());
        try { emailService.envoyerEmailConfirmationCommande(commande); }
        catch (Exception e) { log.error("Erreur confirmation commande: {}", e.getMessage()); }
    }

    public void notifierAssignationTournee(Tournee tournee) {
        log.info("Notification assignation tournée #{} au chauffeur: {}",
            tournee.getId(), tournee.getChauffeur().getEmail());
        try { emailService.envoyerEmailAssignationTournee(tournee); }
        catch (Exception e) { log.error("Erreur assignation tournée: {}", e.getMessage()); }
    }

    public void notifierLivraisonComplete(Tournee tournee) {
        log.info("Notification livraison complète tournée #{}", tournee.getId());
        try { emailService.envoyerEmailLivraisonComplete(tournee); }
        catch (Exception e) { log.error("Erreur livraison complète: {}", e.getMessage()); }
    }

    public void notifierRappelTournee(Tournee tournee) {
        log.info("Rappel tournée #{}", tournee.getId());
        try { emailService.envoyerEmailRappelTournee(tournee); }
        catch (Exception e) { log.error("Erreur rappel tournée: {}", e.getMessage()); }
    }

    public void notifierAlerteRetard(Tournee tournee, String emailResponsable) {
        log.warn("ALERTE RETARD - Tournée #{}", tournee.getId());
        try { emailService.envoyerEmailAlerteRetard(tournee, emailResponsable); }
        catch (Exception e) { log.error("Erreur alerte retard: {}", e.getMessage()); }
    }

    public void envoyerRapportHebdomadaire(String emailResponsable, String statsHtml) {
        log.info("Envoi rapport hebdomadaire à: {}", emailResponsable);
        try { emailService.envoyerRapportHebdomadaire(emailResponsable, statsHtml); }
        catch (Exception e) { log.error("Erreur rapport: {}", e.getMessage()); }
    }
}
