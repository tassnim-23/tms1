package com.grpo.tms.service;

import com.grpo.tms.dto.PositionDTO;
import com.grpo.tms.entity.Chauffeur;
import com.grpo.tms.entity.Position;
import com.grpo.tms.exception.ResourceNotFoundException;
import com.grpo.tms.repository.PositionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service GPS — Gestion des positions en temps réel des camions.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class GpsService {

    private final PositionRepository positionRepository;
    private final ChauffeurService chauffeurService;

    // ─────────────────────────────────────────────────────────────────
    // ENREGISTRER UNE POSITION
    // ─────────────────────────────────────────────────────────────────

    /**
     * Enregistre la position envoyée par un camion/chauffeur.
     * Appelé par POST /api/gps/position
     *
     * @param dto PositionDTO avec latitude, longitude, chauffeurId
     * @return La position sauvegardée
     */
    public PositionDTO enregistrerPosition(PositionDTO dto) {
        // Récupérer les infos du chauffeur pour dénormalisation
        Chauffeur chauffeur = chauffeurService.findChauffeurById(dto.getChauffeurId());

        // Déterminer le statut automatiquement selon la vitesse
        Position.StatutCamion statut = determinerStatut(dto.getVitesse());

        Position position = Position.builder()
                .latitude(dto.getLatitude())
                .longitude(dto.getLongitude())
                .vitesse(dto.getVitesse())
                .precision(dto.getPrecision())
                .chauffeurId(dto.getChauffeurId())
                .tourneeId(dto.getTourneeId())
                .chauffeurNom(chauffeur.getNomComplet())
                .statut(dto.getStatut() != null ? dto.getStatut() : statut)
                .build();

        Position saved = positionRepository.save(position);
        log.debug("Position GPS enregistrée — Chauffeur: {} | Lat: {} | Lon: {}",
                chauffeur.getNomComplet(), dto.getLatitude(), dto.getLongitude());

        return toDTO(saved);
    }

    // ─────────────────────────────────────────────────────────────────
    // LIRE LES POSITIONS
    // ─────────────────────────────────────────────────────────────────

    /**
     * Retourne la dernière position de TOUS les chauffeurs.
     * Utilisé par la carte principale du dashboard.
     */
    @Transactional(readOnly = true)
    public List<PositionDTO> getDernieresPositions() {
        return positionRepository.findDernieresPositionsTousLesChauffeurs()
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Retourne la dernière position d'un chauffeur spécifique.
     */
    @Transactional(readOnly = true)
    public PositionDTO getDernierePositionChauffeur(Long chauffeurId) {
        Position position = positionRepository
                .findTopByChauffeurIdOrderByTimestampDesc(chauffeurId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Aucune position GPS pour le chauffeur ID: " + chauffeurId));
        return toDTO(position);
    }

    /**
     * Retourne l'historique complet du trajet d'une tournée.
     * Utile pour rejouer le trajet après la tournée.
     */
    @Transactional(readOnly = true)
    public List<PositionDTO> getHistoriqueTournee(Long tourneeId) {
        return positionRepository.findByTourneeIdOrderByTimestampAsc(tourneeId)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Retourne les positions récentes d'une tournée (dernières 2 heures).
     * Utilisé pour suivre une tournée en cours.
     */
    @Transactional(readOnly = true)
    public List<PositionDTO> getPositionsTourneeEnCours(Long tourneeId) {
        LocalDateTime depuis = LocalDateTime.now().minusHours(2);
        return positionRepository.findPositionsTourneeRecentes(tourneeId, depuis)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    // ─────────────────────────────────────────────────────────────────
    // SIMULATION (pour les tests sans GPS réel)
    // ─────────────────────────────────────────────────────────────────

    /**
     * Simule le déplacement d'un chauffeur entre deux points.
     * Génère N positions intermédiaires entre départ et arrivée.
     * Utilisé UNIQUEMENT pour les tests / démonstrations.
     *
     * @param chauffeurId  ID du chauffeur à simuler
     * @param tourneeId    ID de la tournée
     * @param latDepart    Latitude de départ
     * @param lonDepart    Longitude de départ
     * @param latArrivee   Latitude d'arrivée
     * @param lonArrivee   Longitude d'arrivée
     * @param nbPoints     Nombre de points intermédiaires à générer
     */
    public void simulerTrajet(Long chauffeurId, Long tourneeId,
                               double latDepart, double lonDepart,
                               double latArrivee, double lonArrivee,
                               int nbPoints) {
        Chauffeur chauffeur = chauffeurService.findChauffeurById(chauffeurId);

        log.info("Simulation trajet démarée pour {} — {} points", chauffeur.getNomComplet(), nbPoints);

        for (int i = 0; i <= nbPoints; i++) {
            double ratio = (double) i / nbPoints;

            // Interpolation linéaire entre départ et arrivée
            double lat = latDepart + (latArrivee - latDepart) * ratio;
            double lon = lonDepart + (lonArrivee - lonDepart) * ratio;

            // Vitesse simulée : départ lent, milieu rapide, fin lent
            double vitesse = 60.0 * Math.sin(ratio * Math.PI);

            Position position = Position.builder()
                    .latitude(lat)
                    .longitude(lon)
                    .vitesse(vitesse)
                    .precision(5.0)
                    .chauffeurId(chauffeurId)
                    .tourneeId(tourneeId)
                    .chauffeurNom(chauffeur.getNomComplet())
                    .statut(vitesse < 5 ? Position.StatutCamion.A_LARRET : Position.StatutCamion.EN_ROUTE)
                    .build();

            positionRepository.save(position);
        }

        log.info("Simulation terminée — {} positions créées", nbPoints + 1);
    }

    // ─────────────────────────────────────────────────────────────────
    // NETTOYAGE AUTOMATIQUE (tâche planifiée)
    // ─────────────────────────────────────────────────────────────────

    /**
     * Supprime les positions GPS de plus de 30 jours.
     * Exécuté chaque nuit à 02h00 pour éviter que la table grossisse.
     */
    @Scheduled(cron = "0 0 2 * * *")
    public void nettoyerPositionsAnciennes() {
        LocalDateTime limite = LocalDateTime.now().minusDays(30);
        positionRepository.deleteByTimestampBefore(limite);
        log.info("Nettoyage GPS : positions antérieures à {} supprimées", limite.toLocalDate());
    }

    // ─────────────────────────────────────────────────────────────────
    // UTILITAIRES PRIVÉS
    // ─────────────────────────────────────────────────────────────────

    /** Détermine le statut du camion selon sa vitesse. */
    private Position.StatutCamion determinerStatut(Double vitesse) {
        if (vitesse == null) return Position.StatutCamion.EN_ROUTE;
        if (vitesse < 3)    return Position.StatutCamion.A_LARRET;
        return Position.StatutCamion.EN_ROUTE;
    }

    /** Formate la différence de temps en texte lisible. */
    private String formatDerniereMaj(LocalDateTime timestamp) {
        if (timestamp == null) return "Inconnu";
        long minutes = ChronoUnit.MINUTES.between(timestamp, LocalDateTime.now());
        if (minutes < 1)   return "À l'instant";
        if (minutes < 60)  return "Il y a " + minutes + " min";
        long heures = minutes / 60;
        if (heures < 24)   return "Il y a " + heures + "h";
        return "Il y a " + (heures / 24) + " jour(s)";
    }

    /** Convertit une entité Position en DTO. */
    public PositionDTO toDTO(Position p) {
        return PositionDTO.builder()
                .id(p.getId())
                .latitude(p.getLatitude())
                .longitude(p.getLongitude())
                .vitesse(p.getVitesse())
                .precision(p.getPrecision())
                .chauffeurId(p.getChauffeurId())
                .tourneeId(p.getTourneeId())
                .chauffeurNom(p.getChauffeurNom())
                .statut(p.getStatut())
                .timestamp(p.getTimestamp())
                .derniereMaj(formatDerniereMaj(p.getTimestamp()))
                .build();
    }
}