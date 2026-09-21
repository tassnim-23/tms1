package com.grpo.tms.controller;
import com.grpo.tms.entity.DemandeInscription;
import com.grpo.tms.service.InscriptionService;
import com.grpo.tms.exception.DemandeDejaExistanteException;
import com.grpo.tms.exception.DemandeNotFoundException;
import com.grpo.tms.dto.DemandeInscriptionRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Contrôleur pour la gestion des demandes d'inscription.
 *
 * CORRECTIF : Le endpoint principal est POST /api/inscription/demande
 * (sans 'r' à la fin — le frontend appelait /inscription/demander → corrigé côté frontend aussi)
 */
@RestController
@RequestMapping("/inscription")
@CrossOrigin(origins = "*")
public class InscriptionController {

    private final InscriptionService inscriptionService;

    public InscriptionController(InscriptionService inscriptionService) {
        this.inscriptionService = inscriptionService;
    }

    /**
     * POST /api/inscription/demande
     * Soumission d'une nouvelle demande d'inscription (public, sans auth).
     */
    @PostMapping("/demande")
    public ResponseEntity<Map<String, Object>> soumettreDemande(
            @RequestBody DemandeInscriptionRequest request) {

        Map<String, Object> response = new HashMap<>();
        try {
            inscriptionService.creerDemande(request);
            response.put("success", true);
            response.put("message", "Votre demande a été soumise avec succès. Un administrateur va la traiter.");
            return ResponseEntity.ok(response);
        } catch (DemandeDejaExistanteException e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Une erreur interne est survenue. Veuillez réessayer.");
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * GET /api/inscription/demandes
     * Liste toutes les demandes (admin uniquement).
     */
    @GetMapping("/demandes")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    
    public ResponseEntity<List<Map<String, Object>>> listerDemandes() {
        List<DemandeInscription> demandes = inscriptionService.listerToutes();
        List<Map<String, Object>> result = demandes.stream().map(d -> {
            Map<String, Object> map = new java.util.HashMap<>();
            map.put("id", d.getId());
            map.put("nom", d.getNom());
            map.put("prenom", d.getPrenom());
            map.put("email", d.getEmail());
            map.put("telephone", d.getTelephone());
            map.put("username", d.getUsername());
            map.put("matriculeFiscale", d.getMatriculeFiscale());
            map.put("raisonSociale", d.getRaisonSociale());
            map.put("activite", d.getActivite());
            map.put("responsableEntreprise", d.getResponsableEntreprise());
            map.put("adresseComplete", d.getAdresseComplete());
            map.put("statut", d.getStatut());
            map.put("dateCreation", d.getDateCreation());
            map.put("dateTraitement", d.getDateTraitement());
            map.put("commentaireAdmin", d.getCommentaireAdmin());
             return map;
        }).collect(java.util.stream.Collectors.toList());
        return ResponseEntity.ok(result);
    }

    /**
     * POST /api/inscription/verifier-code
     * Vérifie le code envoyé par email après approbation (public).
     */
    @PostMapping("/verifier-code")
    public ResponseEntity<Map<String, Object>> verifierCode(
            @RequestBody Map<String, String> body) {
        Map<String, Object> response = new HashMap<>();
        try {
            String email = body.get("email");
            String code  = body.get("code");
            if (email == null || code == null) {
                response.put("success", false);
                response.put("message", "Email et code sont requis.");
                return ResponseEntity.badRequest().body(response);
            }
            inscriptionService.verifierCode(email, code);
            response.put("success", true);
            response.put("message", "Email vérifié avec succès. Vous pouvez maintenant vous connecter.");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    /**
     * POST /api/inscription/demandes/{id}/approuver
     * Approuve une demande et crée le compte utilisateur (admin uniquement).
     */
    @PostMapping("/demandes/{id}/approuver")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<Map<String, Object>> approuver(@PathVariable Long id) {
        Map<String, Object> response = new HashMap<>();
        try {
            inscriptionService.approuver(id);
            response.put("success", true);
            response.put("message", "Demande approuvée et compte créé.");
            return ResponseEntity.ok(response);
        } catch (DemandeNotFoundException e) {
            response.put("erreur", e.getMessage());
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            response.put("erreur", "Erreur lors de l'approbation : " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * POST /api/inscription/demandes/{id}/rejeter
     * Rejette une demande (admin uniquement).
     */
    @PostMapping("/demandes/{id}/rejeter")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<Map<String, Object>> rejeter(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body) {

        Map<String, Object> response = new HashMap<>();
        String commentaire = (body != null) ? body.getOrDefault("commentaire", "") : "";
        try {
            inscriptionService.rejeter(id, commentaire);
            response.put("success", true);
            response.put("message", "Demande rejetée.");
            return ResponseEntity.ok(response);
        } catch (DemandeNotFoundException e) {
            response.put("erreur", e.getMessage());
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            response.put("erreur", "Erreur lors du rejet : " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }
}