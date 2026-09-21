package com.grpo.tms.service;

import com.grpo.tms.entity.*;
import com.grpo.tms.exception.BadRequestException;
import com.grpo.tms.exception.ResourceNotFoundException;
import com.grpo.tms.repository.CommandeRepository;
import com.grpo.tms.repository.ConfirmationLivraisonRepository;
import com.grpo.tms.repository.TourneeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Gère le cycle complet de confirmation client pour une tournée.
 *
 * Règle métier :
 *   - Minimum MIN_COMMANDES_PAR_TOURNEE commandes par tournée (défaut : 8)
 *   - Quand un client refuse → la commande passe EN_ATTENTE et sort de la tournée
 *   - Si la tournée passe sous le minimum → remplissage automatique :
 *       1. Commandes EN_ATTENTE de la MÊME ZONE (gouvernorat), date la plus proche
 *       2. Si pas assez → élargir à toutes zones, même logique
 *       3. Les commandes ajoutées reçoivent un email de confirmation
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class ConfirmationLivraisonService {

    // ── Règle métier : taille minimale d'une tournée ─────────────────────────
    /** Nombre minimum de commandes qu'une tournée doit contenir.
     *  En dessous, le système tente de remplir automatiquement.
     *  Justification : un chauffeur sort avec au moins 10 arrêts pour rentabiliser
     *  la tournée (carburant, temps de chargement, coût de la ressource).
     *  NOTE: Changé de 8 à 10 pour correspondre aux exigences utilisateur (10/10 cible).  */
    static final int MIN_COMMANDES_PAR_TOURNEE = 10;

    // ── Paramètres de confirmation ────────────────────────────────────────────
    private static final int MARGE_RETARD_MINUTES      = 15;
    private static final int TOKEN_VALIDITE_HEURES     = 48;
    private static final int TOKEN_EXPIRATION_HEURES   = 48;
    private static final int TEMPS_ARRET_MINUTES       = 15;
    private static final double VITESSE_MOYENNE_KMH    = 50.0;
    private static final int TEMPS_PAR_COMMANDE_MIN    = 20;

    private final CommandeRepository              commandeRepo;
    private final TourneeRepository               tourneeRepo;
    private final ConfirmationLivraisonRepository confirmationRepo;
    private final EmailService                    emailService;

    // ============================================================
    // SECTION 1 : APPROCHE SIMPLE (token dans Commande)
    // ============================================================

    public void envoyerEmailsConfirmation(Tournee tournee) {
        log.info("Envoi emails confirmation tournée {} ({} commandes)",
                tournee.getNumeroTournee(), tournee.getCommandes().size());

        LocalTime heureDepart = tournee.getHeureDebut() != null
                ? tournee.getHeureDebut() : LocalTime.of(8, 0);

        int ordre = 0;
        for (Commande commande : tournee.getCommandes()) {
            int minutesAvant = calculerMinutesAvant(tournee, ordre);
            LocalTime heurePrevue = heureDepart.plusMinutes(minutesAvant);
            LocalTime heureLimite = heurePrevue.plusMinutes(MARGE_RETARD_MINUTES);

            String token = UUID.randomUUID().toString();
            LocalDateTime exp = LocalDateTime.now().plusHours(TOKEN_EXPIRATION_HEURES);

            commande.setHeureLivraisonPrevue(heurePrevue);
            commande.setHeureLivraisonLimite(heureLimite);
            commande.setTokenConfirmation(token);
            commande.setTokenExpiration(exp);
            commande.setConfirmationClient(Commande.ConfirmationClient.EN_ATTENTE);
            commandeRepo.save(commande);

            emailService.envoyerEmailConfirmationLivraison(commande, tournee, token);
            log.info("Email envoyé → commande {} | {}–{}", commande.getNumeroCommande(), heurePrevue, heureLimite);
            ordre++;
        }
    }

    public Commande confirmerLivraison(String token) {
        Commande commande = trouverParToken(token);
        if (commande.getConfirmationClient() == Commande.ConfirmationClient.CONFIRMEE) return commande;
        if (commande.getConfirmationClient() == Commande.ConfirmationClient.REFUSEE)
            throw new BadRequestException("Cette livraison a déjà été refusée.");

        commande.setConfirmationClient(Commande.ConfirmationClient.CONFIRMEE);
        commande.setDateConfirmation(LocalDateTime.now());
        commandeRepo.save(commande);
        emailService.envoyerEmailNotificationConfirmation(commande);
        log.info("CONFIRMEE — commande {}", commande.getNumeroCommande());
        return commande;
    }

    public Commande refuserLivraison(String token, String motifRefus) {
        Commande commande = trouverParToken(token);
        if (commande.getConfirmationClient() == Commande.ConfirmationClient.REFUSEE) return commande;
        if (commande.getConfirmationClient() == Commande.ConfirmationClient.CONFIRMEE)
            throw new BadRequestException("Cette livraison a déjà été confirmée.");

        commande.setConfirmationClient(Commande.ConfirmationClient.REFUSEE);
        commande.setDateConfirmation(LocalDateTime.now());
        commande.setMotifRefus(motifRefus);

        for (Tournee t : commande.getTournees()) {
            t.getCommandes().remove(commande);
            tourneeRepo.save(t);
            // Déclencher le remplissage automatique
            remplirTourneeApresRefus(t, commande);
        }

        commande.setStatut(Commande.StatutCommande.EN_ATTENTE);
        commande.getTournees().clear();
        commandeRepo.save(commande);

        emailService.envoyerEmailNotificationRefus(commande, motifRefus);
        log.info("REFUSEE — commande {} | motif : {}", commande.getNumeroCommande(), motifRefus);
        return commande;
    }

    @Transactional(readOnly = true)
    public Commande getCommandeParToken(String token) {
        return trouverParToken(token);
    }

    // ============================================================
    // SECTION 2 : APPROCHE COMPLÈTE (table ConfirmationLivraison)
    // ============================================================

    public void creerConfirmationsPourTournee(Tournee tournee) {
        List<Commande> commandes = tournee.getCommandes();
        if (commandes == null || commandes.isEmpty()) return;

        LocalDateTime heureDebutDateTime = buildHeureDebut(tournee);
        LocalDateTime now = LocalDateTime.now();

        for (int i = 0; i < commandes.size(); i++) {
            Commande commande = commandes.get(i);

            double distanceParStop = (tournee.getDistanceTotale() != null && !commandes.isEmpty())
                    ? tournee.getDistanceTotale() / commandes.size() : 20.0;

            int minutesDepuisDebut = i * TEMPS_ARRET_MINUTES
                    + (int) Math.round((distanceParStop * i / VITESSE_MOYENNE_KMH) * 60);

            LocalDateTime heureArriveeEstimee   = heureDebutDateTime.plusMinutes(minutesDepuisDebut);
            LocalDateTime heureArriveeAvecMarge = heureArriveeEstimee.plusMinutes(MARGE_RETARD_MINUTES);

            String token = UUID.randomUUID().toString().replace("-", "");

            ConfirmationLivraison confirmation = ConfirmationLivraison.builder()
                    .token(token)
                    .commande(commande)
                    .tournee(tournee)
                    .heureArriveeEstimee(heureArriveeEstimee)
                    .heureArriveeAvecMarge(heureArriveeAvecMarge)
                    .statut(ConfirmationLivraison.StatutConfirmation.CREE)
                    .expireLe(now.plusHours(TOKEN_VALIDITE_HEURES))
                    .build();

            confirmationRepo.save(confirmation);

            try {
                emailService.envoyerEmailConfirmationTourneeClient(commande, tournee, confirmation);
                log.info("Email confirmation envoyé → {} / {}", commande.getClient().getEmail(), commande.getNumeroCommande());
            } catch (Exception ex) {
                log.error("Erreur envoi email confirmation {} : {}", commande.getNumeroCommande(), ex.getMessage());
            }
        }
    }

    public String confirmerParToken(String token) {
        ConfirmationLivraison confirmation = findTokenValide(token);
        confirmation.setStatut(ConfirmationLivraison.StatutConfirmation.CONFIRME);
        confirmation.setReponduLe(LocalDateTime.now());
        confirmationRepo.save(confirmation);
        log.info("✅ ACCEPTÉE — commande {} tournée {}",
                confirmation.getCommande().getNumeroCommande(),
                confirmation.getTournee().getNumeroTournee());
        return "CONFIRME";
    }

    /**
     * Le client refuse via le lien email.
     * 1. Marque le token REFUSE
     * 2. Retire la commande de la tournée → EN_ATTENTE
     * 3. Lance le remplissage automatique si la tournée est sous le minimum
     * 4. Notifie l'admin
     */
    public String refuserParToken(String token) {
        ConfirmationLivraison confirmation = findTokenValide(token);

        Commande commande = confirmation.getCommande();
        Tournee  tournee  = confirmation.getTournee();

        // 1. Marquer refusé
        confirmation.setStatut(ConfirmationLivraison.StatutConfirmation.REFUSE);
        confirmation.setReponduLe(LocalDateTime.now());
        confirmationRepo.save(confirmation);

        // 2. Charger la tournée avec ses commandes et retirer la commande refusée
        Tournee tourneeChargee = tourneeRepo.findById(tournee.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Tournée introuvable"));
        tourneeChargee.getCommandes().removeIf(c -> c.getId().equals(commande.getId()));
        tourneeRepo.save(tourneeChargee);

        // 3. Repasser la commande EN_ATTENTE
        commande.setStatut(Commande.StatutCommande.EN_ATTENTE);
        commande.setConfirmationClient(Commande.ConfirmationClient.REFUSEE);
        commandeRepo.save(commande);

        log.info("❌ REFUSÉE — commande {} retirée de la tournée {} ({} commandes restantes)",
                commande.getNumeroCommande(),
                tourneeChargee.getNumeroTournee(),
                tourneeChargee.getCommandes().size());

        // 4. Remplissage automatique si sous le minimum
        remplirTourneeApresRefus(tourneeChargee, commande);

        // 5. Notifier l'admin
        try {
            emailService.envoyerEmailRefusClient(commande, tourneeChargee);
        } catch (Exception ex) {
            log.warn("Erreur notification refus admin: {}", ex.getMessage());
        }

        return "REFUSE";
    }

    // ============================================================
    // REMPLISSAGE AUTOMATIQUE — logique métier principale
    // ============================================================

    /**
     * Après le refus d'un client, remplit la tournée si elle est sous le minimum.
     *
     * Algorithme :
     *   1. Calcule le déficit = MIN_COMMANDES_PAR_TOURNEE - taille actuelle
     *   2. Cherche des commandes EN_ATTENTE dans la MÊME zone (gouvernorat),
     *      triées par dateLivraisonPrevue ASC (les plus urgentes en premier)
     *   3. Si pas assez dans la zone → élargit à toutes les zones
     *   4. Ajoute les commandes trouvées à la tournée (statut → ASSIGNEE)
     *   5. Envoie un email de confirmation aux nouveaux clients ajoutés
     *
     * @param tournee  La tournée après retrait de la commande refusée
     * @param refusee  La commande qui vient d'être refusée (pour déterminer la zone)
     */
    private void remplirTourneeApresRefus(Tournee tournee, Commande refusee) {
        int nbActuel = tournee.getCommandes().size();
        int deficit  = MIN_COMMANDES_PAR_TOURNEE - nbActuel;

        log.info("═══════════════════════════════════════════════════════════════");
        log.info("🔍 DIAGNOSTIC REMPLISSAGE AUTOMATIQUE");
        log.info("   Tournée: {} | Commandes actuelles: {} | Minimum requis: {} | Déficit: {}",
                tournee.getNumeroTournee(), nbActuel, MIN_COMMANDES_PAR_TOURNEE, deficit);
        log.info("   Commande refusée: {} | Gouvernorat: {}",
                refusee.getNumeroCommande(), refusee.getGouvernoratLivraison());
        log.info("═══════════════════════════════════════════════════════════════");

        if (deficit <= 0) {
            log.info("✅ Tournée {} à {} commandes — au-dessus du minimum ({}), pas de remplissage nécessaire",
                    tournee.getNumeroTournee(), nbActuel, MIN_COMMANDES_PAR_TOURNEE);
            return;
        }

        log.info("⚠️ Tournée {} SOUS LE MINIMUM ({}/{}) — recherche de {} commande(s) de remplacement",
                tournee.getNumeroTournee(), nbActuel, MIN_COMMANDES_PAR_TOURNEE, deficit);

        // IDs déjà dans la tournée (à exclure de la recherche)
        List<Long> excludeIds = tournee.getCommandes().stream()
                .map(Commande::getId)
                .collect(Collectors.toList());
        // Inclure aussi la commande refusée
        excludeIds.add(refusee.getId());
        // Garde-fou : JPA IN() ne supporte pas les listes vides
        if (excludeIds.isEmpty()) excludeIds.add(-1L);

        log.info("📋 Exclusions (IDs): {} commandes", excludeIds.size());

        // Déterminer la zone de référence
        String gouvernorat = refusee.getGouvernoratLivraison();
        
        log.info("🗺️ Gouvernorat de référence pour recherche: '{}'", gouvernorat != null ? gouvernorat : "(NULL)");

        List<Commande> candidates = new ArrayList<>();

        // Étape 1 : même zone
        if (gouvernorat != null && !gouvernorat.isBlank()) {
            log.info("🔎 ÉTAPE 1: Recherche dans la même zone '{}'", gouvernorat);
            candidates = commandeRepo.findRemplacantsMemeZone(gouvernorat, excludeIds);
            log.info("   → {} commande(s) EN_ATTENTE trouvées dans zone '{}'", candidates.size(), gouvernorat);
        } else {
            log.warn("⚠️ ÉTAPE 1: Gouvernorat NULL ou vide — passage direct à élargissement");
        }

        // Étape 2 : élargir si insuffisant
        if (candidates.size() < deficit) {
            log.info("🔎 ÉTAPE 2: Insuffisant {} < {} — élargissement à toutes zones", candidates.size(), deficit);
            // Mettre à jour excludeIds avec les candidats déjà trouvés
            List<Long> excludeIdsElargi = new ArrayList<>(excludeIds);
            candidates.stream().map(Commande::getId).forEach(excludeIdsElargi::add);
            List<Commande> complement = commandeRepo.findRemplacantsToutes(excludeIdsElargi);
            log.info("   → {} commande(s) supplémentaires EN_ATTENTE de toutes zones", complement.size());
            candidates.addAll(complement);
        } else {
            log.info("✅ ÉTAPE 2: Assez de candidats {} >= {} — pas d'élargissement", candidates.size(), deficit);
        }

        // Prendre les N premiers (les plus urgents)
        List<Commande> aAjouter = candidates.stream()
                .limit(deficit)
                .collect(Collectors.toList());

        log.info("📦 Sélection finale: {} commande(s) à ajouter (sur {} candidates)", aAjouter.size(), candidates.size());

        if (aAjouter.isEmpty()) {
            log.error("❌ ERREUR REMPLISSAGE: Tournée {} — AUCUNE commande disponible (stock épuisé)",
                    tournee.getNumeroTournee());
            // Notifier l'admin que la tournée est sous le minimum
            notifierAdminStockInsuffisant(tournee, nbActuel);
            return;
        }

        // Ajouter les commandes et envoyer les emails de confirmation
        List<Commande> ajoutees = new ArrayList<>();
        for (Commande c : aAjouter) {
            tournee.ajouterCommande(c);
            c.setStatut(Commande.StatutCommande.ASSIGNEE);
            c.setConfirmationClient(Commande.ConfirmationClient.EN_ATTENTE);
            commandeRepo.save(c);
            ajoutees.add(c);
            log.info("✅ Ajoutée à tournée {} : commande {} ({} km de livraison)",
                    tournee.getNumeroTournee(), c.getNumeroCommande(), c.getGouvernoratLivraison());
        }

        tourneeRepo.save(tournee);

        log.info("✅ REMPLISSAGE RÉUSSI: Tournée {} — {} ajoutée(s), total = {} / {}",
                tournee.getNumeroTournee(), ajoutees.size(), tournee.getCommandes().size(), MIN_COMMANDES_PAR_TOURNEE);
        log.info("═══════════════════════════════════════════════════════════════");

        // Envoyer les emails de confirmation aux nouveaux clients
        envoyerConfirmationsNouvellesCommandes(tournee, ajoutees);
    }

    /**
     * Envoie les emails de confirmation aux clients des commandes nouvellement ajoutées.
     */
    private void envoyerConfirmationsNouvellesCommandes(Tournee tournee, List<Commande> nouvelles) {
        LocalDateTime heureDebut = buildHeureDebut(tournee);
        int nbTotal = tournee.getCommandes().size();

        for (Commande c : nouvelles) {
            // Calculer la position approximative dans la tournée (fin de liste)
            int position = nbTotal - nouvelles.indexOf(c);
            double distParStop = (tournee.getDistanceTotale() != null && nbTotal > 0)
                    ? tournee.getDistanceTotale() / nbTotal : 20.0;
            int minutes = position * TEMPS_ARRET_MINUTES
                    + (int) Math.round(distParStop * position / VITESSE_MOYENNE_KMH * 60);

            LocalDateTime heureEstimee   = heureDebut.plusMinutes(minutes);
            LocalDateTime heureAvecMarge = heureEstimee.plusMinutes(MARGE_RETARD_MINUTES);

            String token = UUID.randomUUID().toString().replace("-", "");

            ConfirmationLivraison confirmation = ConfirmationLivraison.builder()
                    .token(token)
                    .commande(c)
                    .tournee(tournee)
                    .heureArriveeEstimee(heureEstimee)
                    .heureArriveeAvecMarge(heureAvecMarge)
                    .statut(ConfirmationLivraison.StatutConfirmation.CREE)
                    .expireLe(LocalDateTime.now().plusHours(TOKEN_VALIDITE_HEURES))
                    .build();

            confirmationRepo.save(confirmation);

            try {
                emailService.envoyerEmailConfirmationTourneeClient(c, tournee, confirmation);
                log.info("📧 Email confirmation (remplacement) → {}", c.getClient().getEmail());
            } catch (Exception ex) {
                log.error("Erreur email confirmation remplacement {} : {}", c.getNumeroCommande(), ex.getMessage());
            }
        }
    }

    /**
     * Notifie l'admin que la tournée est sous le minimum et qu'il n'y a pas
     * assez de commandes en stock pour la remplir.
     */
    private void notifierAdminStockInsuffisant(Tournee tournee, int nbActuel) {
        try {
            // Réutilise envoyerEmailRefusClient avec un message spécial
            log.warn("⚠️ Admin à notifier : tournée {} sous le minimum ({}/{}) — stock insuffisant",
                    tournee.getNumeroTournee(), nbActuel, MIN_COMMANDES_PAR_TOURNEE);
            // emailService.envoyerEmailAlerteTourneeIncomplete(tournee, nbActuel, MIN_COMMANDES_PAR_TOURNEE);
            // (méthode optionnelle à créer dans EmailService si besoin)
        } catch (Exception ex) {
            log.warn("Erreur notification admin stock insuffisant : {}", ex.getMessage());
        }
    }

    // ============================================================
    // UTILITAIRES
    // ============================================================

    public void expirerTokensObsoletes() {
        List<ConfirmationLivraison> expirees = confirmationRepo.findExpires(LocalDateTime.now());
        expirees.forEach(c -> {
            c.setStatut(ConfirmationLivraison.StatutConfirmation.EXPIRE);
            confirmationRepo.save(c);
        });
        if (!expirees.isEmpty())
            log.info("{} token(s) expirés traités", expirees.size());
    }

    @Transactional(readOnly = true)
    public List<ConfirmationLivraison> getConfirmationsDeTournee(Long tourneeId) {
        return confirmationRepo.findByTourneeId(tourneeId);
    }

    private Commande trouverParToken(String token) {
        Commande commande = commandeRepo.findByTokenConfirmation(token)
                .orElseThrow(() -> new ResourceNotFoundException("Lien de confirmation invalide ou inexistant."));
        if (LocalDateTime.now().isAfter(commande.getTokenExpiration()))
            throw new BadRequestException("Ce lien a expiré (valable 48h). Veuillez contacter notre service client.");
        return commande;
    }

    private ConfirmationLivraison findTokenValide(String token) {
        ConfirmationLivraison confirmation = confirmationRepo.findByToken(token)
                .orElseThrow(() -> new ResourceNotFoundException("Lien de confirmation invalide ou introuvable."));
        if (confirmation.getStatut() != ConfirmationLivraison.StatutConfirmation.CREE)
            throw new BadRequestException("Ce lien a déjà été utilisé (statut: " + confirmation.getStatut() + ").");
        if (LocalDateTime.now().isAfter(confirmation.getExpireLe())) {
            confirmation.setStatut(ConfirmationLivraison.StatutConfirmation.EXPIRE);
            confirmationRepo.save(confirmation);
            throw new BadRequestException("Ce lien de confirmation a expiré. Veuillez contacter GRPO Consulting.");
        }
        return confirmation;
    }

    private int calculerMinutesAvant(Tournee tournee, int ordre) {
        if (ordre == 0) return 0;
        int nb = tournee.getCommandes().size();
        if (tournee.getTempsEstimeMinutes() != null && tournee.getTempsEstimeMinutes() > 0)
            return ordre * (tournee.getTempsEstimeMinutes() / nb);
        return ordre * TEMPS_PAR_COMMANDE_MIN;
    }

    private LocalDateTime buildHeureDebut(Tournee tournee) {
        LocalDate  date  = tournee.getDateTournee();
        LocalTime  heure = tournee.getHeureDebut() != null ? tournee.getHeureDebut() : LocalTime.of(8, 0);
        return LocalDateTime.of(date, heure);
    }
}