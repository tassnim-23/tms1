package com.grpo.tms.service;

import com.grpo.tms.entity.*;
import com.twilio.Twilio;
import com.twilio.rest.api.v2010.account.Message;
import com.twilio.type.PhoneNumber;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.format.DateTimeFormatter;

/**
 * Service d'envoi de SMS via Twilio.
 */
@Service
@Slf4j
public class SmsService {

    @Value("${twilio.account.sid}")
    private String accountSid;

    @Value("${twilio.auth.token}")
    private String authToken;

    @Value("${twilio.phone.number}")
    private String fromNumber;

    @Value("${twilio.enabled:false}")
    private boolean twilioEnabled;

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter TIME_FMT = DateTimeFormatter.ofPattern("HH:mm");

    @PostConstruct
    public void init() {
        if (twilioEnabled) {
            Twilio.init(accountSid, authToken);
            log.info("Twilio initialisé avec succès");
        } else {
            log.info("Twilio désactivé (twilio.enabled=false)");
        }
    }

    /**
     * Envoie un SMS de confirmation de commande au client.
     */
    @Async
    public void envoyerSmsConfirmationCommande(Commande commande) {
        String message = String.format(
                "GRPO TMS - Commande %s confirmée. Livraison prévue le %s de %s à %s. Merci !",
                commande.getNumeroCommande(),
                commande.getDateSouhaitee().format(DATE_FMT),
                commande.getAdresseChargement(),
                commande.getAdresseLivraison()
        );
        sendSms(commande.getClient().getTelephone(), message);
    }

    /**
     * Envoie un SMS d'assignation de tournée au chauffeur.
     */
    @Async
    public void envoyerSmsAssignationTournee(Tournee tournee) {
        String message = String.format(
                "GRPO TMS - Nouvelle tournée assignée. Date: %s, Départ: %s, Véhicule: %s. Bonne route !",
                tournee.getDateTournee().format(DATE_FMT),
                tournee.getHeureDebut().format(TIME_FMT),
                tournee.getVehicule().getImmatriculation()
        );
        sendSms(tournee.getChauffeur().getTelephone(), message);
    }

    /**
     * Envoie un SMS de rappel de tournée au chauffeur (tâche planifiée).
     */
    @Async
    public void envoyerSmsRappelTournee(Tournee tournee) {
        String message = String.format(
                "GRPO TMS - RAPPEL: Tournée demain %s à %s. Véhicule: %s. %d livraisons.",
                tournee.getDateTournee().format(DATE_FMT),
                tournee.getHeureDebut().format(TIME_FMT),
                tournee.getVehicule().getImmatriculation(),
                tournee.getCommandes().size()
        );
        sendSms(tournee.getChauffeur().getTelephone(), message);
    }

    /**
     * Envoie un SMS d'alerte retard au chauffeur.
     */
    @Async
    public void envoyerSmsAlerteRetard(Tournee tournee) {
        String message = String.format(
                "GRPO TMS - ALERTE: La tournée #%d est en retard. Heure fin prévue: %s. Contactez le responsable.",
                tournee.getId(),
                tournee.getHeureFin() != null ? tournee.getHeureFin().format(TIME_FMT) : "N/A"
        );
        sendSms(tournee.getChauffeur().getTelephone(), message);
    }

    /**
     * Méthode générique d'envoi de SMS.
     */
    private void sendSms(String to, String messageContent) {
        if (!twilioEnabled) {
            log.info("[SMS DÉSACTIVÉ] À: {} - Message: {}", to, messageContent);
            return;
        }
        try {
            // Normaliser le numéro de téléphone
            String normalizedTo = normalizePhoneNumber(to);
            Message message = Message.creator(
                    new PhoneNumber(normalizedTo),
                    new PhoneNumber(fromNumber),
                    messageContent
            ).create();
            log.info("SMS envoyé à {} - SID: {}", to, message.getSid());
        } catch (Exception e) {
            log.error("Erreur lors de l'envoi du SMS à {}: {}", to, e.getMessage());
        }
    }

    /**
     * Normalise un numéro de téléphone tunisien.
     */
    private String normalizePhoneNumber(String phone) {
        if (phone == null) return "";
        phone = phone.trim().replaceAll("\\s+", "");
        if (!phone.startsWith("+")) {
            // Numéro tunisien sans indicatif
            if (phone.startsWith("00")) {
                phone = "+" + phone.substring(2);
            } else if (phone.length() == 8) {
                phone = "+216" + phone;
            }
        }
        return phone;
    }
}
