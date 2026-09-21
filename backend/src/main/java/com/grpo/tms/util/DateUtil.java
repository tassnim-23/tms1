package com.grpo.tms.util;

import org.springframework.stereotype.Component;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Random;

/**
 * Utilitaire pour la gestion des dates et numéros de commande.
 */
@Component
public class DateUtil {

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyyMMdd");
    private static final DateTimeFormatter DISPLAY_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final Random RANDOM = new Random();

    /**
     * Génère un numéro de commande unique au format CMD-YYYYMMDD-XXXX.
     */
    public String generateNumeroCommande() {
        String dateStr = LocalDate.now().format(DATE_FORMATTER);
        int randomNum = RANDOM.nextInt(9000) + 1000;
        return "CMD-" + dateStr + "-" + randomNum;
    }

    /**
     * Formate une date pour l'affichage.
     */
    public String formatDate(LocalDate date) {
        return date != null ? date.format(DISPLAY_FORMATTER) : "";
    }

    /**
     * Formate une date-heure pour l'affichage.
     */
    public String formatDateTime(LocalDateTime dateTime) {
        return dateTime != null
                ? dateTime.format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm"))
                : "";
    }

    /**
     * Vérifie si une date est dans le futur.
     */
    public boolean isFuture(LocalDate date) {
        return date != null && date.isAfter(LocalDate.now());
    }

    /**
     * Retourne la date de demain.
     */
    public LocalDate demain() {
        return LocalDate.now().plusDays(1);
    }
}
