package com.grpo.tms.service;

import com.grpo.tms.entity.*;
import com.grpo.tms.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.format.DateTimeFormatter;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Autowired
    private UserRepository userRepository;

    @Value("${app.email.from}")
    private String fromEmail;

    @Value("${app.email.enabled:true}")
    private boolean emailEnabled;

    @Value("${app.base-url:http://localhost:8080}")
    private String appBaseUrl;

    @Value("${app.frontend-url:http://localhost:4200}")
    private String frontendUrl;

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter TIME_FMT = DateTimeFormatter.ofPattern("HH:mm");

    // ============================================================
    // EMAILS PUBLICS
    // ============================================================

    @Async
    public void envoyerEmailBienvenueClient(Client client) {
        if (!emailEnabled) { log.info("[EMAIL DÉSACTIVÉ] Bienvenue client: {}", client.getEmail()); return; }
        sendHtmlEmail(client.getEmail(), "Bienvenue chez GRPO Consulting - TMS", buildEmailBienvenue(client));
    }

    @Async
    public void envoyerEmailConfirmationCommande(Commande commande) {
        if (!emailEnabled) { log.info("[EMAIL DÉSACTIVÉ] Confirmation commande: {}", commande.getNumeroCommande()); return; }
        
        for (String email : commande.getClient().getTousLesEmails()) {
            sendHtmlEmail(email,
                "Confirmation de votre commande " + commande.getNumeroCommande(),
                buildEmailConfirmationCommande(commande));
        }
    }

    @Async
    public void envoyerEmailAssignationTournee(Tournee tournee) {
        if (!emailEnabled) { log.info("[EMAIL DÉSACTIVÉ] Assignation tournée chauffeur: {}", tournee.getChauffeur().getEmail()); return; }
        sendHtmlEmail(tournee.getChauffeur().getEmail(),
            "Votre tournée du " + tournee.getDateTournee().format(DATE_FMT),
            buildEmailAssignationTournee(tournee));
    }

    @Async
    public void envoyerEmailConfirmationTourneeClient(
            Commande commande, Tournee tournee, ConfirmationLivraison confirmation) {
        if (!emailEnabled) {
            log.info("[EMAIL DÉSACTIVÉ] Confirmation tournée client: {} commande {}",
                commande.getClient().getEmail(), commande.getNumeroCommande());
            return;
        }
        for (String email : commande.getClient().getTousLesEmails()) {
            sendHtmlEmail(email,
                "📦 Votre livraison " + commande.getNumeroCommande() + " — Confirmez votre disponibilité",
                buildEmailConfirmationTourneeClient(commande, tournee, confirmation));
        }
    }

    @Async
    public void envoyerEmailConfirmationLivraison(Commande commande, Tournee tournee, String token) {
        if (!emailEnabled) { log.info("[EMAIL DÉSACTIVÉ] Confirmation livraison: {}", commande.getNumeroCommande()); return; }
        for (String email : commande.getClient().getTousLesEmails()) {
            sendHtmlEmail(email,
                "⏰ Votre livraison " + commande.getNumeroCommande() + " — Confirmez votre disponibilité",
                buildEmailConfirmationLivraison(commande, tournee, token));
        }
    }

    @Async
    public void envoyerEmailRefusClient(Commande commande, Tournee tournee) {
        if (!emailEnabled) return;
        String emailAdmin = userRepository.findAll().stream()
            .filter(u -> u.getRoles() != null && u.getRoles().stream().anyMatch(r -> r.contains("ADMIN")))
            .map(User::getEmail).findFirst().orElse(fromEmail);
        sendHtmlEmail(emailAdmin,
            "⚠️ Refus livraison — " + commande.getNumeroCommande() + " retiré de " + tournee.getNumeroTournee(),
            buildEmailRefusClient(commande, tournee));
    }

    @Async
    public void envoyerEmailLivraisonComplete(Tournee tournee) {
        if (!emailEnabled) return;
        tournee.getCommandes().forEach(commande -> {
            for (String email : commande.getClient().getTousLesEmails()) {
                sendHtmlEmail(email,
                    "Votre commande " + commande.getNumeroCommande() + " a été livrée !",
                    buildEmailLivraisonComplete(commande, tournee));
            }
        });
    }

    @Async
    public void envoyerEmailRappelTournee(Tournee tournee) {
        if (!emailEnabled) { log.info("[EMAIL DÉSACTIVÉ] Rappel tournée: {}", tournee.getId()); return; }
        sendHtmlEmail(tournee.getChauffeur().getEmail(),
            "Rappel - Tournée prévue demain " + tournee.getDateTournee().format(DATE_FMT),
            buildEmailRappelTournee(tournee));
    }

    @Async
    public void envoyerEmailAlerteRetard(Tournee tournee, String emailResponsable) {
        if (!emailEnabled) return;
        sendHtmlEmail(emailResponsable, "⚠️ ALERTE RETARD - Tournée #" + tournee.getId(), buildEmailAlerteRetard(tournee));
    }

    @Async
    public void envoyerRapportHebdomadaire(String emailResponsable, String statsHtml) {
        if (!emailEnabled) return;
        sendHtmlEmail(emailResponsable, "📊 Rapport hebdomadaire TMS - GRPO Consulting", statsHtml);
    }

    @Async
    public void envoyerEmailNotificationConfirmation(Commande commande) {
        if (!emailEnabled) return;
        try {
            var admins = userRepository.findAll().stream()
                .filter(u -> u.getRoles().stream().anyMatch(r -> r.contains("ADMIN"))).toList();
            String sujet = "✅ Livraison confirmée — " + commande.getNumeroCommande();
            String heurePrevue = commande.getHeureLivraisonPrevue() != null ? commande.getHeureLivraisonPrevue().format(TIME_FMT) : "–";
            String dateConf = commande.getDateConfirmation() != null ? commande.getDateConfirmation().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")) : "–";
            String clientEmails = String.join(", ", commande.getClient().getTousLesEmails());
            String contenu = htmlHeader("Livraison confirmée") + """
                <h2 style="color:#2E7D32;margin-top:0;">✅ Livraison confirmée par le client</h2>
                <p>Commande <strong>%s</strong> confirmée par <strong>%s</strong>.</p>
                <p>Emails du client : <strong>%s</strong></p>
                <p>Heure prévue : <strong>%s</strong> | Confirmé le : <strong>%s</strong></p>
                """.formatted(commande.getNumeroCommande(),
                    commande.getClient().getRaisonSociale() != null ? commande.getClient().getRaisonSociale() : commande.getClient().getEmail(),
                    clientEmails, heurePrevue, dateConf) + htmlFooter();
            for (var admin : admins) if (admin.getEmail() != null) sendHtmlEmail(admin.getEmail(), sujet, contenu);
        } catch (Exception e) { log.warn("Erreur notification confirmation admin : {}", e.getMessage()); }
    }

    @Async
    public void envoyerEmailNotificationRefus(Commande commande, String motifRefus) {
        if (!emailEnabled) return;
        try {
            var admins = userRepository.findAll().stream()
                .filter(u -> u.getRoles().stream().anyMatch(r -> r.contains("ADMIN"))).toList();
            String sujet = "❌ Livraison refusée — " + commande.getNumeroCommande();
            String dateConf = commande.getDateConfirmation() != null ? commande.getDateConfirmation().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")) : "–";
            String contenu = htmlHeader("Livraison refusée") + """
                <h2 style="color:#C62828;margin-top:0;">❌ Livraison refusée — Action requise</h2>
                <p>Commande <strong>%s</strong> refusée par <strong>%s</strong>.</p>
                <p>Motif : <em>%s</em> | Le : <strong>%s</strong></p>
                <p style="color:#E65100;font-weight:bold;">La commande est repassée EN_ATTENTE.</p>
                """.formatted(commande.getNumeroCommande(),
                    commande.getClient().getRaisonSociale() != null ? commande.getClient().getRaisonSociale() : commande.getClient().getEmail(),
                    motifRefus != null && !motifRefus.isBlank() ? motifRefus : "Aucun motif",
                    dateConf) + htmlFooter();
            for (var admin : admins) if (admin.getEmail() != null) sendHtmlEmail(admin.getEmail(), sujet, contenu);
        } catch (Exception e) { log.warn("Erreur notification refus admin : {}", e.getMessage()); }
    }

    // ============================================================
    // INSCRIPTION
    // ============================================================

    @Async
    public void envoyerEmailCodeVerification(DemandeInscription demande, String code) {
        // Email critique — toujours envoyé
        String contenu = htmlHeader("Code de Vérification") + """
            <h2 style="color:#1a237e;margin-top:0;">🔐 Code de vérification</h2>
            <div style="text-align:center;margin:32px 0;">
              <div style="display:inline-block;background:linear-gradient(135deg,#1a237e,#3f51b5);
                          border-radius:16px;padding:28px 48px;">
                <span style="color:#fff;font-size:48px;font-weight:900;
                             letter-spacing:12px;font-family:monospace;">%s</span>
              </div>
            </div>
            <p style="color:#555;text-align:center;">
              Entrez ce code dans l'application pour vérifier votre email.<br>
              <small>Valable 24h.</small>
            </p>
            """.formatted(code) + htmlFooter();
        sendHtmlEmail(demande.getEmail(), "TMS - 🔐 Votre code de vérification", contenu);
    }

    @Async
    public void envoyerEmailDemandeSoumise(DemandeInscription demande) {
        if (!emailEnabled) { log.info("[EMAIL DÉSACTIVÉ] Demande soumise: {}", demande.getEmail()); return; }
        String contenu = htmlHeader("Demande reçue") + """
            <h2 style="color:#1a237e;margin-top:0;">Demande d'inscription reçue ⏳</h2>
            <p style="color:#555;">Bonjour <strong>%s %s</strong>,</p>
            <p style="color:#555;">Votre demande sera examinée par un administrateur sous 24-48h.</p>
            """.formatted(demande.getPrenom(), demande.getNom()) + htmlFooter();
        sendHtmlEmail(demande.getEmail(), "TMS - Votre demande d'inscription a été reçue", contenu);
    }

    @Async
    public void notifierAdminsNouvelleDemande(DemandeInscription demande) {
        if (!emailEnabled) return;
        // notification admin — optionnel
    }

    @Async
    public void envoyerEmailCompteApprouve(DemandeInscription demande) {
        if (!emailEnabled) return;
        // email compte approuvé — optionnel
    }

    @Async
    public void envoyerEmailCompteRejete(DemandeInscription demande) {
        if (!emailEnabled) return;
        // email compte rejeté — optionnel
    }

    public void envoyerRappelTournee(Tournee tournee) { }

    public void envoyerNotificationCommande(String email, String sujet, String message) { }

    public void envoyerEmail(String to, String sujet, String corps) {
        sendHtmlEmail(to, sujet, corps);
    }

    // ============================================================
    // MÉTHODE D'ENVOI
    // ============================================================

    private void sendHtmlEmail(String to, String subject, String htmlContent) {
        if (to == null || to.isBlank()) {
            log.warn("⚠️ Email non envoyé : adresse vide");
            return;
        }
        int maxRetries = 3;
        int retryCount = 0;
        while (retryCount < maxRetries) {
            try {
                MimeMessage message = mailSender.createMimeMessage();
                MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
                helper.setFrom(fromEmail);
                helper.setTo(to);
                helper.setSubject(subject);
                helper.setText(htmlContent, true);
                mailSender.send(message);
                log.info("✅ Email envoyé → {} | Sujet: {}", to, subject);
                return;
            } catch (MessagingException e) {
                retryCount++;
                if (retryCount >= maxRetries) {
                    log.error("❌ ÉCHEC final envoi email (après {} tentatives) → {} | {}", maxRetries, to, e.getMessage());
                } else {
                    log.warn("⚠️ Retry {} / {} | Email → {} | Erreur: {}", retryCount, maxRetries, to, e.getMessage());
                    try {
                        Thread.sleep(1000 * retryCount);
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                    }
                }
            } catch (Exception e) {
                retryCount++;
                if (retryCount >= maxRetries) {
                    log.error("❌ ERREUR SMTP final (après {} tentatives) → {} | {}", maxRetries, to, e.getMessage(), e);
                } else {
                    log.warn("⚠️ Retry {} / {} | Erreur SMTP → {} | {}", retryCount, maxRetries, to, e.getMessage());
                    try {
                        Thread.sleep(1000 * retryCount);
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                    }
                }
            }
        }
    }

    // ============================================================
    // TEMPLATES HTML
    // ============================================================

    private String htmlHeader(String titre) {
        return """
            <!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8">
            <title>%s</title></head>
            <body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif;">
            <table width="100%%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:20px 0;">
            <tr><td align="center">
            <table width="600" cellpadding="0" cellspacing="0"
                   style="background:#fff;border-radius:8px;overflow:hidden;
                          box-shadow:0 2px 10px rgba(0,0,0,.1);">
            <tr><td style="background:linear-gradient(135deg,#1a237e,#3f51b5);
                           padding:30px;text-align:center;">
              <h1 style="color:#fff;margin:0;font-size:24px;">🚛 TMS - GRPO Consulting</h1>
              <p style="color:#90caf9;margin:8px 0 0;">Système de Gestion du Transport</p>
            </td></tr>
            <tr><td style="padding:30px;">
            """.formatted(titre);
    }

    private String htmlFooter() {
        return """
            </td></tr>
            <tr><td style="background:#1a237e;padding:20px;text-align:center;">
              <p style="color:#90caf9;margin:0;font-size:12px;">
                © 2024 GRPO Consulting - TMS<br>
                Email automatique, merci de ne pas répondre.
              </p>
            </td></tr>
            </table></td></tr></table></body></html>
            """;
    }

    // ── Templates des emails ────────────────────────────────────

    private String buildEmailConfirmationLivraison(Commande commande, Tournee tournee, String token) {
        String heurePrevue   = commande.getHeureLivraisonPrevue() != null ? commande.getHeureLivraisonPrevue().format(TIME_FMT) : "--:--";
        String heureLimite   = commande.getHeureLivraisonLimite() != null ? commande.getHeureLivraisonLimite().format(TIME_FMT) : "--:--";
        String dateLivraison = tournee.getDateTournee() != null ? tournee.getDateTournee().format(DATE_FMT) : "–";
        // ✅ Routes HTML backend — retournent une vraie page HTML lisible dans le navigateur
        // Pas besoin du frontend Angular — le backend gère directement l'affichage
        String urlConfirmer = appBaseUrl + "/api/confirmation/confirmer?token=" + token;
        String urlRefuser   = appBaseUrl + "/api/confirmation/refuser?token=" + token;
        String nomClient = (commande.getClient().getRaisonSociale() != null && !commande.getClient().getRaisonSociale().isBlank())
            ? commande.getClient().getRaisonSociale()
            : commande.getClient().getPrenom() + " " + commande.getClient().getNom();
        String adresse = (commande.getAdresseLivraison() != null ? commande.getAdresseLivraison() : "")
            + (commande.getVilleLivraison() != null ? ", " + commande.getVilleLivraison() : "")
            + (commande.getGouvernoratLivraison() != null ? ", " + commande.getGouvernoratLivraison() : "");

        return htmlHeader("Confirmation de livraison") + """
            <h2 style="color:#1a237e;margin-top:0;">📦 Votre livraison est planifiée</h2>
            <p style="color:#555;">Bonjour <strong>%s</strong>,</p>
            <p style="color:#555;">Commande <strong>%s</strong> prévue le <strong>%s</strong>.</p>
            <div style="background:#E3F2FD;border-left:4px solid #1565C0;border-radius:6px;
                        padding:20px;margin:20px 0;text-align:center;">
              <p style="margin:0 0 4px;color:#1565C0;font-size:13px;">⏰ HEURE D'ARRIVÉE ESTIMÉE</p>
              <p style="margin:0;font-size:36px;font-weight:900;color:#0D47A1;">%s</p>
              <p style="margin:6px 0 0;font-size:12px;color:#555;">
                Au plus tard : <strong>%s</strong> (marge de 15 min)
              </p>
            </div>
            <div style="background:#f8f9fa;border:1px solid #e9ecef;border-radius:6px;
                        padding:14px;margin:16px 0;">
              <p style="margin:0 0 4px;font-size:11px;color:#888;">Adresse de livraison</p>
              <p style="margin:0;font-weight:600;color:#333;">%s</p>
            </div>
            <p style="text-align:center;font-size:16px;font-weight:600;color:#333;margin:28px 0 20px;">
              Serez-vous disponible pour réceptionner votre commande ?
            </p>
            <table width="100%%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center" style="padding:0 8px 16px;">
                  <a href="%s" style="display:inline-block;background:#2E7D32;color:#fff;
                     text-decoration:none;padding:16px 40px;border-radius:8px;
                     font-size:16px;font-weight:700;">✅ Oui, je confirme</a>
                </td>
                <td align="center" style="padding:0 8px 16px;">
                  <a href="%s" style="display:inline-block;background:#C62828;color:#fff;
                     text-decoration:none;padding:16px 40px;border-radius:8px;
                     font-size:16px;font-weight:700;">❌ Non, je ne serai pas là</a>
                </td>
              </tr>
            </table>
            <p style="text-align:center;color:#888;font-size:12px;">
              Ce lien est valable 48h.
            </p>
            """.formatted(nomClient, commande.getNumeroCommande(), dateLivraison,
                heurePrevue, heureLimite, adresse, urlConfirmer, urlRefuser)
            + htmlFooter();
    }

    private String buildEmailConfirmationTourneeClient(
            Commande commande, Tournee tournee, ConfirmationLivraison confirmation) {
        // ✅ Routes HTML backend — page HTML directe sans besoin du frontend
        String urlConfirmer = appBaseUrl + "/api/confirmation/confirmer?token=" + confirmation.getToken();
        String urlRefuser   = appBaseUrl + "/api/confirmation/refuser?token=" + confirmation.getToken();

        DateTimeFormatter dtFmt = DateTimeFormatter.ofPattern("dd/MM/yyyy à HH:mm");
        String heureEstimee = confirmation.getHeureArriveeEstimee().format(dtFmt);
        String heureMarge   = confirmation.getHeureArriveeAvecMarge().format(dtFmt);
        String clientNom    = commande.getClient().getRaisonSociale() != null
            ? commande.getClient().getRaisonSociale() : commande.getClient().getEmail();
        String adresse = (commande.getAdresseLivraison() != null ? commande.getAdresseLivraison() : "")
            + (commande.getVilleLivraison() != null ? ", " + commande.getVilleLivraison() : "");

        return htmlHeader("Confirmation de livraison") + """
            <h2 style="color:#1a73e8;margin-top:0;">Votre livraison arrive bientôt !</h2>
            <p style="color:#555;">Bonjour <strong>%s</strong>,</p>
            <p style="color:#555;">Commande <strong>%s</strong> — tournée <strong>%s</strong>
               du <strong>%s</strong>.</p>
            <div style="background:#f0f7ff;border-left:4px solid #1a73e8;
                        border-radius:8px;padding:20px;margin:20px 0;">
              <p style="margin:0 0 6px;font-size:.85rem;color:#666;text-transform:uppercase;">
                HEURE D'ARRIVÉE ESTIMÉE
              </p>
              <p style="margin:0;font-size:1.5rem;font-weight:700;color:#1a73e8;">%s</p>
              <p style="margin:6px 0 0;font-size:.9rem;color:#888;">
                Au plus tard : <strong>%s</strong> (marge de 15 min)
              </p>
            </div>
            <div style="background:#fafafa;border:1px solid #eee;border-radius:8px;
                        padding:16px;margin:16px 0;">
              <p style="margin:0 0 4px;font-size:.85rem;color:#999;">Adresse de livraison</p>
              <p style="margin:0;font-weight:600;color:#333;">%s</p>
            </div>
            <p style="font-weight:600;color:#333;margin:24px 0 16px;">
              Serez-vous disponible pour réceptionner votre commande ?
            </p>
            <table width="100%%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:0 8px 0 0;width:50%%;">
                  <a href="%s" style="display:block;background:#28a745;color:white;
                     text-align:center;padding:16px;border-radius:10px;
                     font-size:1rem;font-weight:700;text-decoration:none;">
                    ✅ Oui, je confirme
                  </a>
                </td>
                <td style="padding:0 0 0 8px;width:50%%;">
                  <a href="%s" style="display:block;background:#dc3545;color:white;
                     text-align:center;padding:16px;border-radius:10px;
                     font-size:1rem;font-weight:700;text-decoration:none;">
                    ❌ Non, je ne serai pas là
                  </a>
                </td>
              </tr>
            </table>
            <p style="color:#aaa;font-size:.82rem;margin:24px 0 0;text-align:center;">
              Ce lien est valable 48h.
            </p>
            """.formatted(clientNom, commande.getNumeroCommande(),
                tournee.getNumeroTournee(),
                tournee.getDateTournee().format(DATE_FMT),
                heureEstimee, heureMarge,
                adresse.isBlank() ? "Adresse non renseignée" : adresse,
                urlConfirmer, urlRefuser)
            + htmlFooter();
    }

    private String buildEmailBienvenue(Client client) {
        return htmlHeader("Bienvenue") + """
            <h2 style="color:#1a237e;margin-top:0;">Bienvenue, %s ! 🎉</h2>
            <p style="color:#555;">Votre compte a été créé avec succès sur TMS GRPO.</p>
            <div style="background:#e8eaf6;border-radius:8px;padding:20px;margin:20px 0;">
              <p><strong>Email :</strong> %s</p>
              <p><strong>Téléphone :</strong> %s</p>
            </div>
            <p style="color:#555;">Cordialement,<br><strong>L'équipe GRPO Consulting</strong></p>
            """.formatted(client.getRaisonSociale(), client.getEmail(), client.getTelephone())
            + htmlFooter();
    }

    private String buildEmailConfirmationCommande(Commande commande) {
        return htmlHeader("Confirmation Commande") + """
            <h2 style="color:#1a237e;margin-top:0;">Confirmation de votre commande ✅</h2>
            <p style="color:#555;">Commande <strong>%s</strong> enregistrée.</p>
            <p style="color:#555;">Livraison prévue : <strong>%s</strong></p>
            <p style="color:#555;">Adresse : %s</p>
            <p style="color:#555;">Cordialement,<br><strong>L'équipe GRPO Consulting</strong></p>
            """.formatted(commande.getNumeroCommande(),
                commande.getDateLivraisonPrevue() != null ? commande.getDateLivraisonPrevue().format(DATE_FMT) : "–",
                commande.getAdresseLivraison() != null ? commande.getAdresseLivraison() : "–")
            + htmlFooter();
    }

    private String buildEmailAssignationTournee(Tournee tournee) {
        return htmlHeader("Assignation Tournée") + """
            <h2 style="color:#1a237e;margin-top:0;">Nouvelle tournée assignée 🚛</h2>
            <p style="color:#555;">Bonjour <strong>%s</strong>,</p>
            <div style="background:#e3f2fd;border-left:4px solid #2196f3;border-radius:4px;padding:20px;margin:20px 0;">
              <p><strong>Date :</strong> %s</p>
              <p><strong>Heure de départ :</strong> %s</p>
              <p><strong>Véhicule :</strong> %s %s (%s)</p>
              <p><strong>Nombre de livraisons :</strong> %d</p>
              <p><strong>Distance estimée :</strong> %s km</p>
            </div>
            <p style="color:#d32f2f;font-weight:bold;">⚠️ Merci d'être à l'heure.</p>
            """.formatted(tournee.getChauffeur().getNomComplet(),
                tournee.getDateTournee().format(DATE_FMT),
                tournee.getHeureDebut().format(TIME_FMT),
                tournee.getVehicule().getMarque(), tournee.getVehicule().getModele(),
                tournee.getVehicule().getImmatriculation(),
                tournee.getCommandes().size(),
                tournee.getDistanceTotale() != null ? tournee.getDistanceTotale() : "N/A")
            + htmlFooter();
    }

    private String buildEmailRefusClient(Commande commande, Tournee tournee) {
        String clientNom = commande.getClient().getRaisonSociale() != null
            ? commande.getClient().getRaisonSociale() : commande.getClient().getEmail();
        return htmlHeader("Refus de livraison") + """
            <h2 style="color:#dc3545;margin-top:0;">⚠️ Un client a refusé sa livraison</h2>
            <p><strong>Client :</strong> %s</p>
            <p><strong>Commande :</strong> %s</p>
            <p><strong>Tournée :</strong> %s du %s</p>
            <div style="background:#fff3cd;border-left:4px solid #ffc107;border-radius:8px;padding:16px;margin:20px 0;">
              <p style="margin:0;color:#856404;">
                La commande <strong>%s</strong> a été retirée de la tournée et
                repassée en <strong>EN_ATTENTE</strong>. Veuillez la réassigner.
              </p>
            </div>
            """.formatted(clientNom, commande.getNumeroCommande(),
                tournee.getNumeroTournee(),
                tournee.getDateTournee().format(DATE_FMT),
                commande.getNumeroCommande())
            + htmlFooter();
    }

    private String buildEmailLivraisonComplete(Commande commande, Tournee tournee) {
        return htmlHeader("Livraison Complète") + """
            <h2 style="color:#1a237e;margin-top:0;">Votre commande a été livrée ! 🎉</h2>
            <p style="color:#555;">Commande <strong>%s</strong> livrée le <strong>%s</strong>.</p>
            <p style="color:#555;">Chauffeur : %s</p>
            <p style="color:#555;">Merci pour votre confiance !</p>
            """.formatted(commande.getNumeroCommande(),
                java.time.LocalDate.now().format(DATE_FMT),
                tournee.getChauffeur().getNomComplet())
            + htmlFooter();
    }

    private String buildEmailRappelTournee(Tournee tournee) {
        return htmlHeader("Rappel Tournée") + """
            <h2 style="color:#1a237e;margin-top:0;">Rappel - Tournée demain ⏰</h2>
            <p style="color:#555;">Bonjour <strong>%s</strong>,</p>
            <div style="background:#fff3e0;border-left:4px solid #ff9800;border-radius:4px;padding:20px;margin:20px 0;">
              <p><strong>Date :</strong> %s</p>
              <p><strong>Heure de départ :</strong> %s</p>
              <p><strong>Véhicule :</strong> %s</p>
              <p><strong>Livraisons :</strong> %d</p>
            </div>
            <p style="color:#d32f2f;font-weight:bold;">🔑 Documents, vérification véhicule, téléphone chargé !</p>
            """.formatted(tournee.getChauffeur().getNomComplet(),
                tournee.getDateTournee().format(DATE_FMT),
                tournee.getHeureDebut().format(TIME_FMT),
                tournee.getVehicule().getImmatriculation(),
                tournee.getCommandes().size())
            + htmlFooter();
    }

    private String buildEmailAlerteRetard(Tournee tournee) {
        return htmlHeader("Alerte Retard") + """
            <h2 style="color:#d32f2f;margin-top:0;">⚠️ ALERTE RETARD</h2>
            <p>Tournée <strong>#%d</strong> | Chauffeur : <strong>%s</strong> (%s)</p>
            <p>Date : <strong>%s</strong> | Heure fin prévue : <strong>%s</strong></p>
            <p>Commandes concernées : <strong>%d</strong></p>
            <p style="color:#d32f2f;font-weight:bold;">Contactez le chauffeur immédiatement.</p>
            """.formatted(tournee.getId(),
                tournee.getChauffeur().getNomComplet(),
                tournee.getChauffeur().getTelephone(),
                tournee.getDateTournee().format(DATE_FMT),
                tournee.getHeureFin() != null ? tournee.getHeureFin().format(TIME_FMT) : "N/A",
                tournee.getCommandes().size())
            + htmlFooter();
    }
}