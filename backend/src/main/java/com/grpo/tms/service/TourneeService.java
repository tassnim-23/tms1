package com.grpo.tms.service;

import com.grpo.tms.dto.TourneeDTO;
import com.grpo.tms.entity.*;
import com.grpo.tms.exception.BadRequestException;
import com.grpo.tms.exception.ResourceNotFoundException;
import com.grpo.tms.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service métier pour la gestion des tournées de livraison.
 * Gère la disponibilité des ressources, la validation, et le cycle de vie des tournées.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class TourneeService {

    private final TourneeRepository    tourneeRepo;
    private final ChauffeurRepository  chauffeurRepo;
    private final VehiculeRepository   vehiculeRepo;
    private final CommandeRepository   commandeRepo;
    private final CommandeService      commandeService;
    
    // CHANGEMENT 1 — Ajout des dépendances
    private final ConfirmationLivraisonService confirmationLivraisonService;
    private final EmailService emailService;

    // ════════════════════════════════════════════════════════════
    // LECTURE
    // ════════════════════════════════════════════════════════════

    /** Retourne toutes les tournées, triées par date décroissante */
    @Transactional(readOnly = true)
    public List<TourneeDTO> listerTournees() {
        return tourneeRepo.findAll().stream()
            .sorted((a, b) -> b.getDateTournee().compareTo(a.getDateTournee()))
            .map(this::toDTO)
            .collect(Collectors.toList());
    }

    /** Retourne les tournées d'un statut donné */
    @Transactional(readOnly = true)
    public List<TourneeDTO> listerParStatut(Tournee.StatutTournee statut) {
        return tourneeRepo.findByStatutOrderByDateTourneeDesc(statut).stream()
            .map(this::toDTO).collect(Collectors.toList());
    }

    /** Retourne le détail d'une tournée par son ID */
    @Transactional(readOnly = true)
    public TourneeDTO getTournee(Long id) {
        return toDTO(findById(id));
    }

    /** Tournées d'un chauffeur — utilisé par ChauffeurController */
    @Transactional(readOnly = true)
    public List<TourneeDTO> getTourneesByChauffeur(Long chauffeurId) {
        return tourneeRepo.findAll().stream()
            .filter(t -> t.getChauffeur() != null && t.getChauffeur().getId().equals(chauffeurId))
            .map(this::toDTO)
            .collect(Collectors.toList());
    }

    /** Retourne l'entité tournée (utilisé par d'autres services) */
    @Transactional(readOnly = true)
    public Tournee findTourneeById(Long id) {
        return findById(id);
    }

    // ════════════════════════════════════════════════════════════
    // DISPONIBILITÉS
    // ════════════════════════════════════════════════════════════

    /**
     * Retourne les chauffeurs disponibles pour une date.
     * Exclut ceux déjà assignés à une tournée PLANIFIEE ou EN_COURS ce jour-là.
     *
     * @param date        Date à vérifier
     * @param tourneeId   ID de la tournée en cours de modification (null si création)
     */
    @Transactional(readOnly = true)
    public List<Chauffeur> getChauffeursDisponibles(LocalDate date, Long tourneeId) {
        List<Long> occupes = tourneeRepo.findChauffeurIdsOccupes(date, tourneeId);
        log.debug("Chauffeurs occupés le {} : {}", date, occupes);
        // Retourne tous les chauffeurs NON occupés ce jour
        // (le filtre disponible est géré par le module chauffeurs)
        return chauffeurRepo.findAll().stream()
            .filter(c -> !occupes.contains(c.getId()))
            .collect(Collectors.toList());
    }

    /**
     * Retourne les véhicules disponibles pour une date.
     * Exclut ceux déjà assignés à une tournée PLANIFIEE ou EN_COURS ce jour-là.
     */
    @Transactional(readOnly = true)
    public List<Vehicule> getVehiculesDisponibles(LocalDate date, Long tourneeId) {
        List<Long> occupes = tourneeRepo.findVehiculeIdsOccupes(date, tourneeId);
        log.debug("Véhicules occupés le {} : {}", date, occupes);
        // Retourne tous les véhicules NON occupés ce jour
        return vehiculeRepo.findAll().stream()
            .filter(v -> !occupes.contains(v.getId()))
            .collect(Collectors.toList());
    }

    /**
     * Vérifie si un chauffeur est disponible pour une date.
     *
     * @param chauffeurId ID du chauffeur
     * @param date        Date à vérifier
     * @param tourneeId   Exclure cette tournée de la vérification (modification)
     */
    @Transactional(readOnly = true)
    public boolean isChauffeurDisponible(Long chauffeurId, LocalDate date, Long tourneeId) {
        List<Long> occupes = tourneeRepo.findChauffeurIdsOccupes(date, tourneeId);
        return !occupes.contains(chauffeurId);
    }

    /**
     * Vérifie si un véhicule est disponible pour une date.
     */
    @Transactional(readOnly = true)
    public boolean isVehiculeDisponible(Long vehiculeId, LocalDate date, Long tourneeId) {
        List<Long> occupes = tourneeRepo.findVehiculeIdsOccupes(date, tourneeId);
        return !occupes.contains(vehiculeId);
    }

    // ════════════════════════════════════════════════════════════
    // CRUD
    // ════════════════════════════════════════════════════════════

    /**
     * Crée une nouvelle tournée après validation complète.
     *
     * @param dto Données de la nouvelle tournée
     * @throws BadRequestException si chauffeur/véhicule indisponible
     */
    public TourneeDTO creerTournee(TourneeDTO dto) {
        log.info("Création tournée — date: {}, chauffeur: {}, véhicule: {}",
            dto.getDateTournee(), dto.getChauffeurId(), dto.getVehiculeId());

        // ── Charger les entités ───────────────────────────────────
        Chauffeur chauffeur = chauffeurRepo.findById(dto.getChauffeurId())
            .orElseThrow(() -> new ResourceNotFoundException("Chauffeur introuvable : " + dto.getChauffeurId()));

        Vehicule vehicule = vehiculeRepo.findById(dto.getVehiculeId())
            .orElseThrow(() -> new ResourceNotFoundException("Véhicule introuvable : " + dto.getVehiculeId()));

        // ── Vérifier disponibilités ───────────────────────────────
        if (!isChauffeurDisponible(dto.getChauffeurId(), dto.getDateTournee(), null)) {
            throw new BadRequestException(String.format(
                "Le chauffeur %s n'est pas disponible le %s",
                chauffeur.getPrenom() + " " + chauffeur.getNom(),
                dto.getDateTournee().format(DateTimeFormatter.ofPattern("dd/MM/yyyy"))
            ));
        }

        if (!isVehiculeDisponible(dto.getVehiculeId(), dto.getDateTournee(), null)) {
            throw new BadRequestException(String.format(
                "Le véhicule %s %s (%s) n'est pas disponible le %s",
                vehicule.getMarque(), vehicule.getModele(), vehicule.getImmatriculation(),
                dto.getDateTournee().format(DateTimeFormatter.ofPattern("dd/MM/yyyy"))
            ));
        }

        // ── Construire l'entité ───────────────────────────────────
        Tournee tournee = Tournee.builder()
            .numeroTournee(genererNumero())
            .dateTournee(dto.getDateTournee())
            .heureDebut(dto.getHeureDebut())
            .heureFin(dto.getHeureFin())
            .chauffeur(chauffeur)
            .vehicule(vehicule)
            .distanceTotale(dto.getDistanceTotale())
            .remarques(dto.getRemarques())
            .statut(Tournee.StatutTournee.PLANIFIEE)
            .build();

        // ── Ajouter les commandes ─────────────────────────────────
        if (dto.getCommandeIds() != null && !dto.getCommandeIds().isEmpty()) {
            for (Long commandeId : dto.getCommandeIds()) {
                Commande commande = commandeService.findCommandeById(commandeId);
                tournee.ajouterCommande(commande);
                // Passer la commande en ASSIGNEE
                commande.setStatut(Commande.StatutCommande.ASSIGNEE);
                commandeRepo.save(commande);
            }
        }

        Tournee saved = tourneeRepo.save(tournee);
        log.info("Tournée créée : {} (ID: {})", saved.getNumeroTournee(), saved.getId());

        // CHANGEMENT 2 — Envoyer les emails de confirmation aux clients
        // ── Envoyer les emails de confirmation aux clients ────────
        try {
            confirmationLivraisonService.creerConfirmationsPourTournee(saved);
        } catch (Exception ex) {
            // Non bloquant : la tournée est créée même si l'email échoue
            log.error("Erreur envoi confirmations clients pour tournée {}: {}",
                saved.getNumeroTournee(), ex.getMessage());
        }

        // ── Notifier le chauffeur ─────────────────────────────────
        try {
            emailService.envoyerEmailAssignationTournee(saved);
        } catch (Exception ex) {
            log.error("Erreur envoi email chauffeur: {}", ex.getMessage());
        }

        return toDTO(saved);
    }

    /**
     * Modifie une tournée existante.
     * Seules les tournées PLANIFIEES peuvent être modifiées.
     */
    public TourneeDTO modifierTournee(Long id, TourneeDTO dto) {
        Tournee tournee = findById(id);
        log.info("Modification tournée {} ({})", tournee.getNumeroTournee(), id);

        if (!tournee.estModifiable()) {
            throw new BadRequestException(
                "La tournée " + tournee.getNumeroTournee() + " ne peut plus être modifiée (statut: " + tournee.getStatut() + ")"
            );
        }

        // ── Vérifier disponibilité si changement chauffeur ────────
        if (dto.getChauffeurId() != null && !dto.getChauffeurId().equals(tournee.getChauffeur().getId())) {
            Chauffeur nouveauChauffeur = chauffeurRepo.findById(dto.getChauffeurId())
                .orElseThrow(() -> new ResourceNotFoundException("Chauffeur introuvable"));
            if (!isChauffeurDisponible(dto.getChauffeurId(), tournee.getDateTournee(), id)) {
                throw new BadRequestException(String.format(
                    "Le chauffeur %s n'est pas disponible le %s",
                    nouveauChauffeur.getPrenom() + " " + nouveauChauffeur.getNom(),
                    tournee.getDateTournee().format(DateTimeFormatter.ofPattern("dd/MM/yyyy"))
                ));
            }
            tournee.setChauffeur(nouveauChauffeur);
        }

        // ── Vérifier disponibilité si changement véhicule ─────────
        if (dto.getVehiculeId() != null && !dto.getVehiculeId().equals(tournee.getVehicule().getId())) {
            Vehicule nouveauVehicule = vehiculeRepo.findById(dto.getVehiculeId())
                .orElseThrow(() -> new ResourceNotFoundException("Véhicule introuvable"));
            if (!isVehiculeDisponible(dto.getVehiculeId(), tournee.getDateTournee(), id)) {
                throw new BadRequestException(String.format(
                    "Le véhicule %s %s n'est pas disponible le %s",
                    nouveauVehicule.getMarque(), nouveauVehicule.getModele(),
                    tournee.getDateTournee().format(DateTimeFormatter.ofPattern("dd/MM/yyyy"))
                ));
            }
            tournee.setVehicule(nouveauVehicule);
        }

        // ── Modifier la date si changée (re-vérifier disponibilités) ──
        if (dto.getDateTournee() != null && !dto.getDateTournee().equals(tournee.getDateTournee())) {
            if (!isChauffeurDisponible(tournee.getChauffeur().getId(), dto.getDateTournee(), id)) {
                throw new BadRequestException("Le chauffeur n'est pas disponible à la nouvelle date");
            }
            if (!isVehiculeDisponible(tournee.getVehicule().getId(), dto.getDateTournee(), id)) {
                throw new BadRequestException("Le véhicule n'est pas disponible à la nouvelle date");
            }
            tournee.setDateTournee(dto.getDateTournee());
        }

        // ── Mettre à jour les autres champs ───────────────────────
        if (dto.getHeureDebut()    != null) tournee.setHeureDebut(dto.getHeureDebut());
        if (dto.getHeureFin()      != null) tournee.setHeureFin(dto.getHeureFin());
        if (dto.getDistanceTotale() != null) tournee.setDistanceTotale(dto.getDistanceTotale());
        if (dto.getRemarques()     != null) tournee.setRemarques(dto.getRemarques());

        // ── Mettre à jour les commandes si modifiées ──────────────
        if (dto.getCommandeIds() != null) {
            // Remettre les anciennes commandes en EN_ATTENTE
            for (Commande c : tournee.getCommandes()) {
                if (!dto.getCommandeIds().contains(c.getId())) {
                    c.setStatut(Commande.StatutCommande.EN_ATTENTE);
                    commandeRepo.save(c);
                }
            }
            tournee.getCommandes().clear();

            // Assigner les nouvelles commandes
            for (Long commandeId : dto.getCommandeIds()) {
                Commande commande = commandeService.findCommandeById(commandeId);
                tournee.ajouterCommande(commande);
                commande.setStatut(Commande.StatutCommande.ASSIGNEE);
                commandeRepo.save(commande);
            }
        }

        return toDTO(tourneeRepo.save(tournee));
    }

    /**
     * Supprime une tournée.
     * Seules les tournées PLANIFIEES peuvent être supprimées.
     */
    public void supprimerTournee(Long id) {
        Tournee tournee = findById(id);

        if (!tournee.estModifiable()) {
            throw new BadRequestException(
                "La tournée " + tournee.getNumeroTournee() + " ne peut pas être supprimée (statut: " + tournee.getStatut() + ")"
            );
        }

        // Remettre le chauffeur et véhicule disponibles
        if (tournee.getChauffeur() != null) {
            tournee.getChauffeur().setDisponible(true);
            chauffeurRepo.save(tournee.getChauffeur());
        }
        if (tournee.getVehicule() != null) {
            tournee.getVehicule().setStatut(com.grpo.tms.entity.Vehicule.StatutVehicule.DISPONIBLE);
            vehiculeRepo.save(tournee.getVehicule());
        }

        // Remettre les commandes en EN_ATTENTE
        for (Commande c : tournee.getCommandes()) {
            c.setStatut(Commande.StatutCommande.EN_ATTENTE);
            commandeRepo.save(c);
        }
        tournee.getCommandes().clear();

        tourneeRepo.delete(tournee);
        log.info("Tournée supprimée : {} (ID: {})", tournee.getNumeroTournee(), id);
    }

    /**
     * Change le statut d'une tournée.
     */
    public TourneeDTO changerStatut(Long id, Tournee.StatutTournee nouveauStatut) {
        Tournee tournee = findById(id);
        log.info("Changement statut tournée {} : {} → {}", tournee.getNumeroTournee(), tournee.getStatut(), nouveauStatut);

        // Validation des transitions
        validerTransitionStatut(tournee.getStatut(), nouveauStatut);

        tournee.setStatut(nouveauStatut);

        // ── EN_COURS : chauffeur et véhicule deviennent NON disponibles ──
        if (nouveauStatut == Tournee.StatutTournee.EN_COURS) {
            // Chauffeur → non disponible
            if (tournee.getChauffeur() != null) {
                tournee.getChauffeur().setDisponible(false);
                chauffeurRepo.save(tournee.getChauffeur());
                log.info("Chauffeur {} → Non disponible", tournee.getChauffeur().getNomComplet());
            }
            // Véhicule → EN_SERVICE
            if (tournee.getVehicule() != null) {
                tournee.getVehicule().setStatut(com.grpo.tms.entity.Vehicule.StatutVehicule.EN_SERVICE);
                vehiculeRepo.save(tournee.getVehicule());
                log.info("Véhicule {} → EN_SERVICE", tournee.getVehicule().getImmatriculation());
            }
            // Commandes → EN_COURS
            for (Commande c : tournee.getCommandes()) {
                c.setStatut(Commande.StatutCommande.EN_COURS);
                commandeRepo.save(c);
            }
        }

        // ── TERMINÉE : chauffeur et véhicule redeviennent disponibles ──
        if (nouveauStatut == Tournee.StatutTournee.TERMINEE) {
            // Chauffeur → disponible
            if (tournee.getChauffeur() != null) {
                tournee.getChauffeur().setDisponible(true);
                chauffeurRepo.save(tournee.getChauffeur());
                log.info("Chauffeur {} → Disponible", tournee.getChauffeur().getNomComplet());
            }
            // Véhicule → DISPONIBLE
            if (tournee.getVehicule() != null) {
                tournee.getVehicule().setStatut(com.grpo.tms.entity.Vehicule.StatutVehicule.DISPONIBLE);
                vehiculeRepo.save(tournee.getVehicule());
                log.info("Véhicule {} → DISPONIBLE", tournee.getVehicule().getImmatriculation());
            }
            // Commandes → LIVREE
            for (Commande c : tournee.getCommandes()) {
                c.setStatut(Commande.StatutCommande.LIVREE);
                commandeRepo.save(c);
            }
        }

        return toDTO(tourneeRepo.save(tournee));
    }

    // ════════════════════════════════════════════════════════════
    // CHANGEMENT 3 — Méthode pour retirer une commande d'une tournée
    // ════════════════════════════════════════════════════════════

    /**
     * Retire une commande d'une tournée sans supprimer celle-ci.
     * Utilisé par ConfirmationLivraisonService quand un client refuse.
     *
     * @param tourneeId  ID de la tournée
     * @param commandeId ID de la commande à retirer
     */
    public void retirerCommandeDeTournee(Long tourneeId, Long commandeId) {
        Tournee tournee = findById(tourneeId);
        Commande commande = commandeService.findCommandeById(commandeId);

        tournee.getCommandes().removeIf(c -> c.getId().equals(commandeId));
        tourneeRepo.save(tournee);

        commande.setStatut(Commande.StatutCommande.EN_ATTENTE);
        commandeRepo.save(commande);

        log.info("Commande {} retirée de la tournée {} — repassée EN_ATTENTE",
            commande.getNumeroCommande(), tournee.getNumeroTournee());
    }

    // ════════════════════════════════════════════════════════════
    // PRIVÉ
    // ════════════════════════════════════════════════════════════

    private Tournee findById(Long id) {
        return tourneeRepo.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Tournée introuvable : " + id));
    }

    private void validerTransitionStatut(Tournee.StatutTournee actuel, Tournee.StatutTournee nouveau) {
        boolean valide = switch (actuel) {
            case PLANIFIEE -> nouveau == Tournee.StatutTournee.EN_COURS;
            case EN_COURS  -> nouveau == Tournee.StatutTournee.TERMINEE;
            case TERMINEE  -> false;
        };
        if (!valide) {
            throw new BadRequestException("Transition invalide : " + actuel + " → " + nouveau);
        }
    }

    /** Génère un numéro de tournée unique : TRN-YYYYMMDD-XXXX */
    private String genererNumero() {
        String date  = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        long   count = tourneeRepo.count() + 1;
        return String.format("TRN-%s-%04d", date, count);
    }

    /** Convertit une entité Tournee en DTO */
    public TourneeDTO toDTO(Tournee t) {
        List<TourneeDTO.CommandeResume> commandesResume = t.getCommandes().stream()
            .map(c -> TourneeDTO.CommandeResume.builder()
                .id(c.getId())
                .numeroCommande(c.getNumeroCommande())
                .adresseLivraison(c.getAdresseLivraison())
                .villeLivraison(c.getVilleLivraison())
                .clientNom(c.getClient() != null ? c.getClient().getRaisonSociale() : null)
                .statut(c.getStatut() != null ? c.getStatut().name() : null)
                .build())
            .collect(Collectors.toList());

        return TourneeDTO.builder()
            .id(t.getId())
            .numeroTournee(t.getNumeroTournee())
            .dateTournee(t.getDateTournee())
            .heureDebut(t.getHeureDebut())
            .heureFin(t.getHeureFin())
            .chauffeurId(t.getChauffeur() != null ? t.getChauffeur().getId() : null)
            .chauffeurNom(t.getChauffeur() != null ? t.getChauffeur().getPrenom() + " " + t.getChauffeur().getNom() : null)
            .chauffeurTelephone(t.getChauffeur() != null ? t.getChauffeur().getTelephone() : null)
            .vehiculeId(t.getVehicule() != null ? t.getVehicule().getId() : null)
            .vehiculeLabel(t.getVehicule() != null ?
                t.getVehicule().getMarque() + " " + t.getVehicule().getModele() + " — " + t.getVehicule().getImmatriculation() : null)
            .vehiculeImmatriculation(t.getVehicule() != null ? t.getVehicule().getImmatriculation() : null)
            .commandeIds(t.getCommandes().stream().map(Commande::getId).collect(Collectors.toList()))
            .commandes(commandesResume)
            .nombreCommandes(t.getCommandes().size())
            .distanceTotale(t.getDistanceTotale())
            .statut(t.getStatut())
            .remarques(t.getRemarques())
            .createdAt(t.getCreatedAt())
            .updatedAt(t.getUpdatedAt())
            .build();
    }
}