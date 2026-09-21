package com.grpo.tms.dto;

/**
 * DTO reçu depuis le formulaire Angular d'inscription.
 * Compatible avec les deux versions du formulaire :
 *  - Formulaire 3 étapes (register.component) : prenom, nom, username, email, telephone, password, matriculeFiscale
 *  - Formulaire 2 étapes (autre composant)    : raisonSociale, matriculeFiscale, activite, responsableEntreprise, email, telephone, password
 */
public class DemandeInscriptionRequest {

    // ── Champs formulaire 3 étapes ────────────────────────────────────────
    private String prenom;
    private String nom;
    private String username;
    private String confirmPassword;
    private String messageMotivation;

    // ── Champs communs aux deux formulaires ───────────────────────────────
    private String email;
    private String telephone;
    private String password;
    private String matriculeFiscale;

    // ── Champs formulaire 2 étapes (entreprise) ───────────────────────────
    private String raisonSociale;
    private String activite;
    private String responsableEntreprise;
    private String adresseComplete;

    // ── Getters & Setters ─────────────────────────────────────────────────

    public String getPrenom() { return prenom; }
    public void setPrenom(String prenom) { this.prenom = prenom; }

    public String getNom() { return nom; }
    public void setNom(String nom) { this.nom = nom; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getTelephone() { return telephone; }
    public void setTelephone(String telephone) { this.telephone = telephone; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getConfirmPassword() { return confirmPassword; }
    public void setConfirmPassword(String confirmPassword) { this.confirmPassword = confirmPassword; }

    public String getMatriculeFiscale() { return matriculeFiscale; }
    public void setMatriculeFiscale(String matriculeFiscale) { this.matriculeFiscale = matriculeFiscale; }

    public String getMessageMotivation() { return messageMotivation; }
    public void setMessageMotivation(String messageMotivation) { this.messageMotivation = messageMotivation; }

    public String getRaisonSociale() { return raisonSociale; }
    public void setRaisonSociale(String raisonSociale) { this.raisonSociale = raisonSociale; }

    public String getActivite() { return activite; }
    public void setActivite(String activite) { this.activite = activite; }

    public String getResponsableEntreprise() { return responsableEntreprise; }
    public void setResponsableEntreprise(String responsableEntreprise) { this.responsableEntreprise = responsableEntreprise; }

    public String getAdresseComplete() { return adresseComplete; }
    public void setAdresseComplete(String adresseComplete) { this.adresseComplete = adresseComplete; }
}