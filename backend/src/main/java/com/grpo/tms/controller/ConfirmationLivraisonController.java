package com.grpo.tms.controller;

import com.grpo.tms.entity.Commande;
import com.grpo.tms.entity.ConfirmationLivraison;
import com.grpo.tms.exception.BadRequestException;
import com.grpo.tms.exception.ResourceNotFoundException;
import com.grpo.tms.service.ConfirmationLivraisonService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * ConfirmationLivraisonController — Endpoints publics (sans JWT) pour la confirmation client.
 *
 * Ces endpoints sont accessibles via le lien cliqué dans l'email du client.
 * Ils s'authentifient par le token UUID contenu dans le lien, sans session ni JWT.
 *
 * Routes :
 *   GET  /public/livraison/confirmer?token=xxx   → le client confirme (API JSON)
 *   GET  /public/livraison/refuser?token=xxx     → le client refuse (API JSON)
 *   POST /public/livraison/refuser               → formulaire de refus avec motif
 *   GET  /public/livraison/statut?token=xxx      → consulter le statut de la confirmation
 *   
 *   Routes legacy (HTML) :
 *   GET  /confirmation/confirmer?token=xxx       → page HTML pour confirmation
 *   GET  /confirmation/refuser?token=xxx         → page HTML pour refus
 *   GET  /confirmation/tournee/{id}              → admin : liste des statuts
 */
@Slf4j
@RestController
@CrossOrigin(origins = "*")   // Public — accès depuis n'importe quelle origine (lien email)
@RequiredArgsConstructor
public class ConfirmationLivraisonController {

    private final ConfirmationLivraisonService confirmationService;

    // ============================================================
    // SECTION 1 : ENDPOINTS PUBLICS (API JSON) - /public/livraison/*
    // ============================================================

    /**
     * Le client clique sur « ✅ Confirmer ma livraison » dans l'email.
     * Retourne une réponse JSON (compatible appel API).
     *
     * GET /public/livraison/confirmer?token=<uuid>
     */
    @GetMapping("/public/livraison/confirmer")
    public ResponseEntity<Map<String, Object>> confirmerLivraison(@RequestParam String token) {
        log.info("Confirmation livraison — token: {}...", token.substring(0, Math.min(8, token.length())));
        try {
            Commande commande = confirmationService.confirmerLivraison(token);
            return ResponseEntity.ok(Map.of(
                "statut",   "CONFIRMEE",
                "message",  "Merci ! Votre livraison est confirmée.",
                "commande", commande.getNumeroCommande(),
                "heurePrevue", commande.getHeureLivraisonPrevue() != null
                    ? commande.getHeureLivraisonPrevue().toString() : "",
                "heureLimite", commande.getHeureLivraisonLimite() != null
                    ? commande.getHeureLivraisonLimite().toString() : ""
            ));
        } catch (Exception e) {
            log.warn("Échec confirmation token {} : {}", token, e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                "statut",  "ERREUR",
                "message", e.getMessage()
            ));
        }
    }

    /**
     * Le client clique sur « ❌ Je ne peux pas réceptionner » dans l'email.
     * Version simple sans motif (GET depuis lien email).
     *
     * GET /public/livraison/refuser?token=<uuid>
     */
    @GetMapping("/public/livraison/refuser")
    public ResponseEntity<Map<String, Object>> refuserSansMotif(@RequestParam String token) {
        log.info("Refus livraison (sans motif) — token: {}...", token.substring(0, Math.min(8, token.length())));
        try {
            Commande commande = confirmationService.refuserLivraison(token, null);
            return ResponseEntity.ok(Map.of(
                "statut",   "REFUSEE",
                "message",  "Votre refus a été enregistré. Votre commande sera replanifiée à un autre créneau.",
                "commande", commande.getNumeroCommande()
            ));
        } catch (Exception e) {
            log.warn("Échec refus token {} : {}", token, e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                "statut",  "ERREUR",
                "message", e.getMessage()
            ));
        }
    }

    /**
     * Le client soumet le formulaire de refus avec un motif.
     * Appelé par la page frontend après récupération du token.
     *
     * POST /public/livraison/refuser
     * Body: { "token": "uuid", "motif": "Je suis absent ce jour-là" }
     */
    @PostMapping("/public/livraison/refuser")
    public ResponseEntity<Map<String, Object>> refuserAvecMotif(@RequestBody Map<String, String> body) {
        String token = body.get("token");
        String motif = body.getOrDefault("motif", "Aucun motif précisé");

        if (token == null || token.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of(
                "statut",  "ERREUR",
                "message", "Token manquant."
            ));
        }

        log.info("Refus livraison (avec motif) — token: {}..., motif: {}",
            token.substring(0, Math.min(8, token.length())), motif);

        try {
            Commande commande = confirmationService.refuserLivraison(token, motif);
            return ResponseEntity.ok(Map.of(
                "statut",   "REFUSEE",
                "message",  "Votre refus a été enregistré. Votre commande sera replanifiée à un autre créneau.",
                "commande", commande.getNumeroCommande()
            ));
        } catch (Exception e) {
            log.warn("Échec refus token {} : {}", token, e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                "statut",  "ERREUR",
                "message", e.getMessage()
            ));
        }
    }

    /**
     * Permet au client de consulter l'état actuel de sa confirmation
     * (utile si la page frontend doit afficher le statut sans recharger).
     *
     * GET /public/livraison/statut?token=<uuid>
     */
    @GetMapping("/public/livraison/statut")
    public ResponseEntity<Map<String, Object>> consulterStatut(@RequestParam String token) {
        try {
            Commande commande = confirmationService.getCommandeParToken(token);
            return ResponseEntity.ok(Map.of(
                "statut",        commande.getConfirmationClient().name(),
                "commande",      commande.getNumeroCommande(),
                "heurePrevue",   commande.getHeureLivraisonPrevue() != null
                    ? commande.getHeureLivraisonPrevue().toString() : "",
                "heureLimite",   commande.getHeureLivraisonLimite() != null
                    ? commande.getHeureLivraisonLimite().toString() : "",
                "dateConfirmation", commande.getDateConfirmation() != null
                    ? commande.getDateConfirmation().toString() : null
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "statut",  "ERREUR",
                "message", e.getMessage()
            ));
        }
    }

    // ============================================================
    // SECTION 2 : ENDPOINTS LEGACY (HTML) - /confirmation/*
    // ============================================================

    /**
     * Le client clique "Je confirme" dans son email.
     * Retourne une page HTML de remerciement directement lisible dans un navigateur.
     *
     * GET /confirmation/confirmer?token=xxx
     */
    @GetMapping(value = "/confirmation/confirmer", produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<String> confirmerHtml(@RequestParam String token) {
        log.info("GET /confirmation/confirmer — token: {}...", token.substring(0, Math.min(8, token.length())));
        try {
            confirmationService.confirmerParToken(token);
            return ResponseEntity.ok(buildPageSucces(
                "✅ Livraison Confirmée",
                "Merci pour votre confirmation !",
                "Nous avons bien enregistré votre disponibilité. Notre chauffeur se présentera à l'heure convenue.",
                "#28a745"
            ));
        } catch (BadRequestException e) {
            return ResponseEntity.ok(buildPageErreur("Lien déjà utilisé", e.getMessage()));
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.ok(buildPageErreur("Lien invalide", e.getMessage()));
        }
    }

    /**
     * Le client clique "Je refuse / Je ne serai pas disponible" dans son email.
     * La commande est retirée de la tournée.
     *
     * GET /confirmation/refuser?token=xxx
     */
    @GetMapping(value = "/confirmation/refuser", produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<String> refuserHtml(@RequestParam String token) {
        log.info("GET /confirmation/refuser — token: {}...", token.substring(0, Math.min(8, token.length())));
        try {
            confirmationService.refuserParToken(token);
            return ResponseEntity.ok(buildPageSucces(
                "Livraison Refusée",
                "Votre réponse a été enregistrée.",
                "Nous avons annulé la livraison prévue à votre adresse. " +
                "Notre équipe vous recontactera pour planifier un autre créneau.",
                "#dc3545"
            ));
        } catch (BadRequestException e) {
            return ResponseEntity.ok(buildPageErreur("Lien déjà utilisé", e.getMessage()));
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.ok(buildPageErreur("Lien invalide", e.getMessage()));
        }
    }

    // ============================================================
    // SECTION 3 : ENDPOINT ADMIN (protégé par SecurityConfig)
    // ============================================================

    /**
     * Retourne la liste des confirmations pour une tournée (usage admin dashboard).
     *
     * GET /confirmation/tournee/{tourneeId}
     */
    @GetMapping("/confirmation/tournee/{tourneeId}")
    public ResponseEntity<List<Map<String, Object>>> getConfirmationsTournee(
            @PathVariable Long tourneeId) {
        List<ConfirmationLivraison> confirmations = confirmationService.getConfirmationsDeTournee(tourneeId);
        List<Map<String, Object>> result = confirmations.stream().map(c -> Map.<String, Object>of(
            "commandeId",            c.getCommande().getId(),
            "numeroCommande",        c.getCommande().getNumeroCommande(),
            "clientNom",             c.getCommande().getClient().getRaisonSociale(),
            "clientEmail",           c.getCommande().getClient().getEmail(),
            "heureArriveeEstimee",   c.getHeureArriveeEstimee().toString(),
            "heureArriveeAvecMarge", c.getHeureArriveeAvecMarge().toString(),
            "statut",                c.getStatut().name(),
            "reponduLe",             c.getReponduLe() != null ? c.getReponduLe().toString() : ""
        )).toList();
        return ResponseEntity.ok(result);
    }

    // ============================================================
    // PAGES HTML INLINE (pas de frontend nécessaire)
    // ============================================================

    private String buildPageSucces(String titre, String headline, String message, String couleur) {
        String icone = couleur.equals("#28a745") ? "✅" : "🚫";
        return """
            <!DOCTYPE html>
            <html lang="fr">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>%s</title>
              <style>
                * { box-sizing: border-box; margin: 0; padding: 0; }
                body { font-family: 'Segoe UI', Arial, sans-serif; background: #f4f6f9;
                       display: flex; align-items: center; justify-content: center;
                       min-height: 100vh; padding: 20px; }
                .card { background: white; border-radius: 16px; padding: 48px 40px;
                        max-width: 520px; width: 100%%; box-shadow: 0 8px 32px rgba(0,0,0,.12);
                        text-align: center; }
                .icon { font-size: 64px; margin-bottom: 20px; }
                h1 { color: %s; font-size: 1.8rem; margin-bottom: 12px; }
                p { color: #555; line-height: 1.6; font-size: 1rem; margin-bottom: 8px; }
                .brand { margin-top: 36px; font-size: .85rem; color: #aaa; }
                .brand strong { color: #333; }
              </style>
            </head>
            <body>
              <div class="card">
                <div class="icon">%s</div>
                <h1>%s</h1>
                <p>%s</p>
                <div class="brand">— <strong>GRPO Consulting — TMS</strong> —</div>
              </div>
            </body>
            </html>
            """.formatted(titre, couleur, icone, headline, message);
    }

    private String buildPageErreur(String titre, String message) {
        return """
            <!DOCTYPE html>
            <html lang="fr">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>%s</title>
              <style>
                * { box-sizing: border-box; margin: 0; padding: 0; }
                body { font-family: 'Segoe UI', Arial, sans-serif; background: #f4f6f9;
                       display: flex; align-items: center; justify-content: center;
                       min-height: 100vh; padding: 20px; }
                .card { background: white; border-radius: 16px; padding: 48px 40px;
                        max-width: 520px; width: 100%%; box-shadow: 0 8px 32px rgba(0,0,0,.12);
                        text-align: center; }
                .icon { font-size: 64px; margin-bottom: 20px; }
                h1 { color: #e67e22; font-size: 1.6rem; margin-bottom: 12px; }
                p { color: #555; line-height: 1.6; font-size: 1rem; }
                .brand { margin-top: 36px; font-size: .85rem; color: #aaa; }
              </style>
            </head>
            <body>
              <div class="card">
                <div class="icon">⚠️</div>
                <h1>%s</h1>
                <p>%s</p>
                <p style="margin-top:12px;font-size:.9rem;color:#aaa">
                  Contactez-nous si vous pensez qu'il s'agit d'une erreur.
                </p>
                <div class="brand">— <strong>GRPO Consulting — TMS</strong> —</div>
              </div>
            </body>
            </html>
            """.formatted(titre, titre, message);
    }
}