package com.grpo.tms.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Client.java — tous les champs utilisés dans ClientService, EmailService, DataInitializer.
 */
@Entity
@Table(name = "clients")
public class Client {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ── Champs entreprise (frontend + ClientService) ──────────────
    @Column(name = "raison_sociale", length = 200)
    private String raisonSociale;

    @Column(name = "matricule_fiscale", unique = true, length = 50)
    private String matriculeFiscale;

    @Column(name = "responsable_entreprise", length = 150)
    private String responsableEntreprise;

    @Column(name = "adresse_complete", length = 500)
    private String adresseComplete;

    @Column(name = "activite", length = 200)
    private String activite;

    // ── Champs personne (ClientService utilise nom/prenom) ─────────
    @Column(name = "nom", length = 100)
    private String nom;

    @Column(name = "prenom", length = 100)
    private String prenom;

    // ── Contact ───────────────────────────────────────────────────
    @Column(name = "email", length = 150)
    private String email;

    @Column(name = "emails_additionnels", length = 500)
    private String emailsAdditionnels;  // Format: email1,email2,email3

    @Column(name = "telephone", length = 20)
    private String telephone;

    // ── Adresse détaillée (ClientService / EmailService) ──────────
    @Column(name = "adresse", length = 300)
    private String adresse;

    @Column(name = "ville", length = 100)
    private String ville;

    @Column(name = "code_postal", length = 10)
    private String codePostal;

    @Column(name = "pays", length = 50)
    private String pays;

    @Column(name = "actif")
    private Boolean actif = true;

    @OneToMany(mappedBy = "client", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Commande> commandes = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // ── Constructeur ──────────────────────────────────────────────
    public Client() {}

    // ── GETTERS ───────────────────────────────────────────────────
    public Long getId()                      { return id; }
    public String getRaisonSociale()         { return raisonSociale; }
    public String getMatriculeFiscale()      { return matriculeFiscale; }
    public String getResponsableEntreprise() { return responsableEntreprise; }
    public String getAdresseComplete()       { return adresseComplete; }
    public String getActivite()              { return activite; }
    public String getNom()                   { return nom; }
    public String getPrenom()                { return prenom; }
    public String getEmail()                 { return email; }
    public String getEmailsAdditionnels()    { return emailsAdditionnels; }
    public String getTelephone()             { return telephone; }
    public String getAdresse()               { return adresse; }
    public String getVille()                 { return ville; }
    public String getCodePostal()            { return codePostal; }
    public String getPays()                  { return pays; }
    public Boolean getActif()                { return actif; }
    public List<Commande> getCommandes()     { return commandes; }
    public LocalDateTime getCreatedAt()      { return createdAt; }
    public LocalDateTime getUpdatedAt()      { return updatedAt; }

    // ── SETTERS ───────────────────────────────────────────────────
    public void setId(Long v)                        { this.id = v; }
    public void setRaisonSociale(String v)           { this.raisonSociale = v; }
    public void setMatriculeFiscale(String v)        { this.matriculeFiscale = v; }
    public void setResponsableEntreprise(String v)   { this.responsableEntreprise = v; }
    public void setAdresseComplete(String v)         { this.adresseComplete = v; }
    public void setActivite(String v)                { this.activite = v; }
    public void setNom(String v)                     { this.nom = v; }
    public void setPrenom(String v)                  { this.prenom = v; }
    public void setEmail(String v)                   { this.email = v; }
    public void setEmailsAdditionnels(String v)      { this.emailsAdditionnels = v; }
    public void setTelephone(String v)               { this.telephone = v; }
    public void setAdresse(String v)                 { this.adresse = v; }
    public void setVille(String v)                   { this.ville = v; }
    public void setCodePostal(String v)              { this.codePostal = v; }
    public void setPays(String v)                    { this.pays = v; }
    public void setActif(Boolean v)                  { this.actif = v; }
    public void setCommandes(List<Commande> v)       { this.commandes = v; }
    public void setCreatedAt(LocalDateTime v)        { this.createdAt = v; }
    public void setUpdatedAt(LocalDateTime v)        { this.updatedAt = v; }

    // ── BUILDER (DataInitializer utilise .adresse()) ───────────────
    public static Builder builder() { return new Builder(); }

    /**
     * Retourne tous les emails (principal + additionnels)
     * Format attendu pour emailsAdditionnels: email1,email2,email3
     */
    public List<String> getTousLesEmails() {
        List<String> emails = new ArrayList<>();
        if (this.email != null && !this.email.isBlank()) {
            emails.add(this.email.trim());
        }
        if (this.emailsAdditionnels != null && !this.emailsAdditionnels.isBlank()) {
            String[] additional = this.emailsAdditionnels.split(",");
            for (String e : additional) {
                String trimmed = e.trim();
                if (!trimmed.isBlank() && !emails.contains(trimmed)) {
                    emails.add(trimmed);
                }
            }
        }
        return emails;
    }

    public static class Builder {
        private final Client c = new Client();
        public Builder id(Long v)                   { c.id = v;                   return this; }
        public Builder raisonSociale(String v)         { c.raisonSociale = v;         return this; }
        public Builder matriculeFiscale(String v)      { c.matriculeFiscale = v;      return this; }
        public Builder responsableEntreprise(String v) { c.responsableEntreprise = v; return this; }
        public Builder adresseComplete(String v)       { c.adresseComplete = v;       return this; }
        public Builder activite(String v)              { c.activite = v;              return this; }
        public Builder nom(String v)                   { c.nom = v;                   return this; }
        public Builder prenom(String v)                { c.prenom = v;                return this; }
        public Builder email(String v)                 { c.email = v;                 return this; }
        public Builder emailsAdditionnels(String v)    { c.emailsAdditionnels = v;    return this; }
        public Builder telephone(String v)             { c.telephone = v;             return this; }
        public Builder adresse(String v)               { c.adresse = v;               return this; }
        public Builder ville(String v)                 { c.ville = v;                 return this; }
        public Builder codePostal(String v)            { c.codePostal = v;            return this; }
        public Builder pays(String v)                  { c.pays = v;                  return this; }
        public Builder actif(Boolean v)                { c.actif = v;                 return this; }
        public Client build()                          { return c; }
    }
}