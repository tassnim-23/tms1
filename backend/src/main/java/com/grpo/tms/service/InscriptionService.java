package com.grpo.tms.service;

import com.grpo.tms.dto.DemandeInscriptionRequest;
import com.grpo.tms.entity.DemandeInscription;
import com.grpo.tms.entity.User;
import com.grpo.tms.exception.DemandeDejaExistanteException;
import com.grpo.tms.exception.DemandeNotFoundException;
import com.grpo.tms.repository.ClientRepository;
import com.grpo.tms.repository.DemandeInscriptionRepository;
import com.grpo.tms.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.grpo.tms.entity.Client;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.Random;

@Slf4j
@Service
@Transactional
public class InscriptionService {

    private final DemandeInscriptionRepository demandeRepo;
    private final UserRepository userRepository;
    private final ClientRepository clientRepository;
    private final EmailService emailService;

    public InscriptionService(DemandeInscriptionRepository demandeRepo,
                               UserRepository userRepository,
                               ClientRepository clientRepository,
                               EmailService emailService) {
        this.demandeRepo      = demandeRepo;
        this.userRepository   = userRepository;
        this.clientRepository = clientRepository;
        this.emailService     = emailService;
    }

    // ── SOUMETTRE UNE DEMANDE ─────────────────────────────────────────────
    public void creerDemande(DemandeInscriptionRequest req) {

        // ── Vérifier uniquement les users ACTIFS (pas les demandes rejetées/expirées) ──
        boolean demandeActiveExiste = demandeRepo.existsByEmailAndStatutIn(
            req.getEmail(),
            List.of(DemandeInscription.StatutDemande.EN_ATTENTE,
                    DemandeInscription.StatutDemande.APPROUVEE)
        );
        if (demandeActiveExiste) {
            throw new DemandeDejaExistanteException(
                "Une demande est déjà en cours ou approuvée pour cet email.");
        }

        String username = req.getUsername();
        if (username == null || username.isBlank()) {
            String base = req.getEmail().split("@")[0]
                            .replaceAll("[^a-zA-Z0-9]", "").toLowerCase();
            username = base + "_" + (System.currentTimeMillis() % 10000);
        }
        if (demandeRepo.existsByUsername(username)) {
            username = username + "_" + (System.currentTimeMillis() % 1000);
        }

        String nom    = req.getNom();
        String prenom = req.getPrenom();
        if ((nom == null || nom.isBlank()) && req.getResponsableEntreprise() != null) {
            String[] parts = req.getResponsableEntreprise().trim().split("\\s+", 2);
            prenom = parts[0];
            nom    = parts.length > 1 ? parts[1] : parts[0];
        }
        if (nom    == null || nom.isBlank())    nom    = "—";
        if (prenom == null || prenom.isBlank()) prenom = "—";

        String passwordHash = org.springframework.security.crypto.bcrypt.BCrypt.hashpw(
            req.getPassword(),
            org.springframework.security.crypto.bcrypt.BCrypt.gensalt()
        );

        DemandeInscription demande = new DemandeInscription();
        demande.setPrenom(prenom);
        demande.setNom(nom);
        demande.setEmail(req.getEmail());
        demande.setTelephone(req.getTelephone());
        demande.setUsername(username);
        demande.setPasswordHash(passwordHash);
        demande.setMatriculeFiscale(req.getMatriculeFiscale());
        demande.setMessageMotivation(req.getMessageMotivation());
        demande.setRaisonSociale(req.getRaisonSociale());
        demande.setActivite(req.getActivite());
        demande.setResponsableEntreprise(req.getResponsableEntreprise());
        demande.setAdresseComplete(req.getAdresseComplete());
        demande.setStatut(DemandeInscription.StatutDemande.EN_ATTENTE);
        demande.setDateCreation(LocalDateTime.now());

        demandeRepo.save(demande);
    }

    // ── LISTER TOUTES ─────────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public List<DemandeInscription> listerToutes() {
        return demandeRepo.findAllByOrderByDateCreationDesc();
    }

    // ── APPROUVER ─────────────────────────────────────────────────────────
    public void approuver(Long id) {
        DemandeInscription demande = demandeRepo.findById(id)
            .orElseThrow(() -> new DemandeNotFoundException("Demande introuvable : " + id));

        if (userRepository.existsByUsername(demande.getUsername())) {
            throw new RuntimeException("Un utilisateur avec ce username existe déjà.");
        }
        if (userRepository.existsByEmail(demande.getEmail())) {
            throw new RuntimeException("Un utilisateur avec cet email existe déjà.");
        }

        // ── Étape 1 : Créer le Client ─────────────────────────────────
        Client client = new Client();
        client.setRaisonSociale(demande.getRaisonSociale());
        client.setMatriculeFiscale(demande.getMatriculeFiscale());
        client.setResponsableEntreprise(demande.getResponsableEntreprise());
        client.setAdresseComplete(demande.getAdresseComplete());
        client.setActivite(demande.getActivite());
        client.setEmail(demande.getEmail());
        client.setTelephone(demande.getTelephone());
        client.setNom(demande.getNom());
        client.setPrenom(demande.getPrenom());
        client.setActif(true);
        Client savedClient = clientRepository.save(client);

        // ── Étape 2 : Créer le User ───────────────────────────────────
        String code = String.format("%06d", new Random().nextInt(1000000));
        log.info("Code de vérification généré pour {} : {}", demande.getEmail(), code);

        User user = User.builder()
            .username(demande.getUsername())
            .email(demande.getEmail())
            .password(demande.getPasswordHash())
            .roles(Set.of("CLIENT"))
            .active(true)
            .statutApproval(User.StatutApproval.APPROUVEE)
            .clientId(savedClient.getId())
            .build();

        user.setEmailVerifie(false);
        user.setCodeVerification(code);
        user.setCodeVerifExpire(LocalDateTime.now().plusHours(24));
        userRepository.save(user);

        // ── Étape 3 : Mettre à jour la demande ───────────────────────
        demande.setStatut(DemandeInscription.StatutDemande.APPROUVEE);
        demande.setDateTraitement(LocalDateTime.now());
        demande.setClient(savedClient);
        demandeRepo.save(demande);

        // ── Étape 4 : Envoyer le code par email ──────────────────────
        log.info("Tentative d'envoi email code vérification → {}", demande.getEmail());
        try {
            emailService.envoyerEmailCodeVerification(demande, code);
            log.info("✅ Email code vérification envoyé → {}", demande.getEmail());
        } catch (Exception e) {
            // L'approbation réussit même si l'email échoue
            // Le code est visible dans les logs pour récupération manuelle
            log.error("❌ ÉCHEC envoi email code vérification → {} | Erreur : {}",
                demande.getEmail(), e.getMessage(), e);
            log.warn("⚠️  Code de secours pour {} : {}", demande.getEmail(), code);
        }
    }

    // ── VÉRIFIER LE CODE EMAIL ────────────────────────────────────────────
    public void verifierCode(String email, String code) {
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("Utilisateur introuvable."));

        if (Boolean.TRUE.equals(user.getEmailVerifie())) {
            return;
        }
        if (user.getCodeVerification() == null || !user.getCodeVerification().equals(code)) {
            throw new RuntimeException("Code incorrect.");
        }
        if (user.getCodeVerifExpire() == null || LocalDateTime.now().isAfter(user.getCodeVerifExpire())) {
            throw new RuntimeException("Code expiré. Contactez l'administrateur pour en obtenir un nouveau.");
        }

        user.setEmailVerifie(true);
        user.setCodeVerification(null);
        user.setCodeVerifExpire(null);
        userRepository.save(user);
    }

    // ── REJETER ───────────────────────────────────────────────────────────
    public void rejeter(Long id, String commentaire) {
        DemandeInscription demande = demandeRepo.findById(id)
            .orElseThrow(() -> new DemandeNotFoundException("Demande introuvable : " + id));

        demande.setStatut(DemandeInscription.StatutDemande.REJETEE);
        demande.setDateTraitement(LocalDateTime.now());
        demande.setCommentaireAdmin(commentaire);
        demande.setRaisonRejet(commentaire);
        demandeRepo.save(demande);
    }
}