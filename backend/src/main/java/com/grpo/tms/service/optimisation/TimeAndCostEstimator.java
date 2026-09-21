package com.grpo.tms.service.optimisation;

import org.springframework.stereotype.Component;

@Component
public class TimeAndCostEstimator {

    // Vitesse moyenne en Tunisie (km/h)
    private static final double VITESSE_MOYENNE = 50.0;
    // Temps moyen par arrêt (minutes)
    private static final int TEMPS_ARRET_MIN = 15;
    // Coût carburant par km (DT)
    private static final double COUT_KM = 0.85;
    // Salaire chauffeur par heure (DT)
    private static final double COUT_HEURE_CHAUFFEUR = 12.0;

    public int estimerTempsMinutes(double distanceKm, int nbCommandes) {
        double tempsRoute = (distanceKm / VITESSE_MOYENNE) * 60;
        double tempsArrets = nbCommandes * TEMPS_ARRET_MIN;
        return (int) Math.round(tempsRoute + tempsArrets);
    }

    public double estimerCoutDT(double distanceKm, int tempsMinutes) {
        double coutCarburant = distanceKm * COUT_KM;
        double coutChauffeur = (tempsMinutes / 60.0) * COUT_HEURE_CHAUFFEUR;
        return Math.round((coutCarburant + coutChauffeur) * 100.0) / 100.0;
    }
}