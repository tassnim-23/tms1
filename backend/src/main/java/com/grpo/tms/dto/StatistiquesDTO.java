package com.grpo.tms.dto;

import lombok.*;
import java.util.Map;

/**
 * DTO pour les statistiques du tableau de bord TMS.
 */
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class StatistiquesDTO {
    // Commandes
    private long totalCommandes;
    private long commandesEnAttente;
    private long commandesAssignees;
    private long commandesEnCours;
    private long commandesLivrees;
    private long commandesAnnulees;

    // Tournées
    private long totalTournees;
    private long tourneesEnCours;
    private long tourneesTerminees;
    private double distanceTotaleParcourue;

    // Clients & Ressources
    private long totalClients;
    private long totalChauffeurs;
    private long chauffeursDisponibles;
    private long totalVehicules;
    private long vehiculesDisponibles;

    // Stats mensuelles
    private Map<String, Long> commandesParMois;
    private Map<String, Long> tourneesParMois;

    // Taux
    private double tauxLivraison;
    private double tauxRetard;
}
