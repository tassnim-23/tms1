package com.grpo.tms.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Commande.java — tous les champs :
 *  - Frontend : adresseLivraison, villeLivraison, dateLivraisonPrevue, etc.
 *  - Anciens services : adresseChargement, dateSouhaitee, coutEstime
 *    (gardés pour EmailService, SmsService, DashboardController)
 *  - Confirmation client : token, heurePrevue, statutConfirmation (V1.0.2)
 */
@Entity
@Table(name = "commandes")
public class Commande {

    public enum StatutCommande {
        EN_ATTENTE, ASSIGNEE, EN_COURS, LIVREE, ANNULEE
    }
    
    public enum PrioriteCommande {
        URGENT,   // 🔴 Livraison dans 24h
        HAUTE,    // 🟠 Livraison dans 48h
        NORMALE,  // 🟡 Livraison dans la semaine
        BASSE     // 🟢 Livraison flexible
    }

    /** Statut de la confirmation client pour cette livraison */
    public enum ConfirmationClient {
        EN_ATTENTE,   // Email envoyé, client n'a pas encore répondu
        CONFIRMEE,    // Client a accepté la livraison
        REFUSEE       // Client a refusé → commande retirée de la tournée
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "numero_commande", unique = true, length = 30)
    private String numeroCommande;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id", nullable = false)
    private Client client;

    @Column(name = "date_commande")
    private LocalDate dateCommande;

    // ── Champs FRONTEND ───────────────────────────────────────────
    @Column(name = "date_livraison_prevue")
    private LocalDate dateLivraisonPrevue;

    @Column(name = "adresse_livraison", length = 500)
    private String adresseLivraison;
    private String gouvernoratLivraison;
    private String quartierLivraison;
    private String rueLivraison;

    @Column(name = "ville_livraison", length = 100)
    private String villeLivraison;

    @Column(name = "code_postal_livraison", length = 10)
    private String codePostalLivraison;

    @Column(name = "pays_livraison", length = 50)
    private String paysLivraison = "Tunisie";

    @Column(name = "contact_livraison", length = 150)
    private String contactLivraison;

    @Column(name = "telephone_contact_livraison", length = 20)
    private String telephoneContactLivraison;

    // ── Champs ANCIENS SERVICES (EmailService, SmsService, Dashboard) ──
    @Column(name = "adresse_chargement", nullable = true, length = 500)
    private String adresseChargement;

    @Column(name = "date_souhaitee")
    private LocalDate dateSouhaitee;

    @Column(name = "cout_estime")
    private Double coutEstime;

    // ── Marchandise ───────────────────────────────────────────────
    @Column(name = "description_marchandise", columnDefinition = "TEXT")
    private String descriptionMarchandise;

    @Column
    private Double poids;

    @Column
    private Double volume;

    @Column(name = "latitude")
    private Double latitude;

    @Column(name = "longitude")  
    private Double longitude;

    @Column(columnDefinition = "TEXT")
    private String remarques;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private StatutCommande statut = StatutCommande.EN_ATTENTE;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private PrioriteCommande priorite = PrioriteCommande.NORMALE;

    @ManyToMany(mappedBy = "commandes", fetch = FetchType.LAZY)
    private List<Tournee> tournees = new ArrayList<>();

    // ════════════════════════════════════════════════════════════
    // CONFIRMATION CLIENT (V1.0.2) - AJOUTÉ
    // ════════════════════════════════════════════════════════════

    /**
     * Heure de livraison prévue calculée lors de la création de la tournée
     * (basée sur heureDebut + temps de trajet estimé jusqu'à ce client).
     */
    @Column(name = "heure_livraison_prevue")
    private LocalTime heureLivraisonPrevue;

    /**
     * Heure limite = heureLivraisonPrevue + 15 minutes (marge de retard).
     * Affichée dans l'email envoyé au client.
     */
    @Column(name = "heure_livraison_limite")
    private LocalTime heureLivraisonLimite;

    /**
     * Token UUID unique envoyé dans le lien email pour identifier
     * la confirmation sans authentification.
     */
    @Column(name = "token_confirmation", unique = true, length = 100)
    private String tokenConfirmation;

    /**
     * Date d'expiration du token (généralement 48h après envoi).
     */
    @Column(name = "token_expiration")
    private LocalDateTime tokenExpiration;

    /**
     * Statut de la réponse du client.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "confirmation_client", length = 20)
    private ConfirmationClient confirmationClient = ConfirmationClient.EN_ATTENTE;

    /**
     * Date/heure de la réponse du client.
     */
    @Column(name = "date_confirmation")
    private LocalDateTime dateConfirmation;

    /**
     * Motif de refus saisi par le client (optionnel).
     */
    @Column(name = "motif_refus", columnDefinition = "TEXT")
    private String motifRefus;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // ── Constructeur ──────────────────────────────────────────────
    public Commande() {}

    // ── Builder statique ──────────────────────────────────────────
    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private final Commande b = new Commande();
        
        public Builder id(Long v)                                 { b.id = v;                        return this; }
        public Builder numeroCommande(String v)                   { b.numeroCommande = v;            return this; }
        public Builder client(Client v)                           { b.client = v;                    return this; }
        public Builder dateCommande(java.time.LocalDate v)        { b.dateCommande = v;              return this; }
        public Builder dateLivraisonPrevue(java.time.LocalDate v) { b.dateLivraisonPrevue = v;       return this; }
        public Builder adresseLivraison(String v)                 { b.adresseLivraison = v;          return this; }
        public Builder gouvernoratLivraison(String v)             { b.gouvernoratLivraison = v;      return this; }
        public Builder quartierLivraison(String v)                { b.quartierLivraison = v;         return this; }
        public Builder rueLivraison(String v)                     { b.rueLivraison = v;              return this; }
        public Builder villeLivraison(String v)                   { b.villeLivraison = v;            return this; }
        public Builder codePostalLivraison(String v)              { b.codePostalLivraison = v;       return this; }
        public Builder paysLivraison(String v)                    { b.paysLivraison = v;             return this; }
        public Builder contactLivraison(String v)                 { b.contactLivraison = v;          return this; }
        public Builder telephoneContactLivraison(String v)        { b.telephoneContactLivraison = v; return this; }
        public Builder adresseChargement(String v)                { b.adresseChargement = v;         return this; }
        public Builder dateSouhaitee(java.time.LocalDate v)       { b.dateSouhaitee = v;             return this; }
        public Builder coutEstime(Double v)                       { b.coutEstime = v;                return this; }
        public Builder descriptionMarchandise(String v)           { b.descriptionMarchandise = v;    return this; }
        public Builder poids(Double v)                            { b.poids = v;                     return this; }
        public Builder volume(Double v)                           { b.volume = v;                    return this; }
        public Builder remarques(String v)                        { b.remarques = v;                 return this; }
        public Builder statut(StatutCommande v)                   { b.statut = v;                    return this; }
        public Builder latitude(Double v)                         { b.latitude = v;                  return this; }
        public Builder longitude(Double v)                        { b.longitude = v;                 return this; }
        public Builder priorite(PrioriteCommande v)               { b.priorite = v;                  return this; }
        
        // ── Builder pour champs confirmation ──────────────────────
        public Builder heureLivraisonPrevue(LocalTime v)          { b.heureLivraisonPrevue = v;      return this; }
        public Builder heureLivraisonLimite(LocalTime v)          { b.heureLivraisonLimite = v;      return this; }
        public Builder tokenConfirmation(String v)                { b.tokenConfirmation = v;         return this; }
        public Builder tokenExpiration(LocalDateTime v)           { b.tokenExpiration = v;           return this; }
        public Builder confirmationClient(ConfirmationClient v)   { b.confirmationClient = v;        return this; }
        public Builder dateConfirmation(LocalDateTime v)          { b.dateConfirmation = v;          return this; }
        public Builder motifRefus(String v)                       { b.motifRefus = v;                return this; }
        
        public Commande build() { return b; }
    }

    // ── GETTERS ───────────────────────────────────────────────────
    public Long getId()                          { return id; }
    public String getNumeroCommande()            { return numeroCommande; }
    public Client getClient()                    { return client; }
    public LocalDate getDateCommande()           { return dateCommande; }
    public LocalDate getDateLivraisonPrevue()    { return dateLivraisonPrevue; }
    public String getAdresseLivraison()          { return adresseLivraison; }
    public String getGouvernoratLivraison()      { return gouvernoratLivraison; }
    public String getQuartierLivraison()         { return quartierLivraison; }
    public String getRueLivraison()              { return rueLivraison; }
    public String getVilleLivraison()            { return villeLivraison; }
    public String getCodePostalLivraison()       { return codePostalLivraison; }
    public String getPaysLivraison()             { return paysLivraison; }
    public String getContactLivraison()          { return contactLivraison; }
    public String getTelephoneContactLivraison() { return telephoneContactLivraison; }
    public String getAdresseChargement()         { return adresseChargement; }
    public LocalDate getDateSouhaitee()          { return dateSouhaitee; }
    public Double getCoutEstime()                { return coutEstime; }
    public String getDescriptionMarchandise()    { return descriptionMarchandise; }
    public Double getPoids()                     { return poids; }
    public Double getVolume()                    { return volume; }
    public String getRemarques()                 { return remarques; }
    public StatutCommande getStatut()            { return statut; }
    public List<Tournee> getTournees()           { return tournees; }
    public LocalDateTime getCreatedAt()          { return createdAt; }
    public LocalDateTime getUpdatedAt()          { return updatedAt; }
    public Double getLatitude()                  { return latitude; }
    public Double getLongitude()                 { return longitude; }
    public PrioriteCommande getPriorite()        { return priorite; }
    
    // ── GETTERS Confirmation (AJOUTÉS) ─────────────────────────────
    public LocalTime getHeureLivraisonPrevue()   { return heureLivraisonPrevue; }
    public LocalTime getHeureLivraisonLimite()   { return heureLivraisonLimite; }
    public String getTokenConfirmation()          { return tokenConfirmation; }
    public LocalDateTime getTokenExpiration()     { return tokenExpiration; }
    public ConfirmationClient getConfirmationClient() { return confirmationClient; }
    public LocalDateTime getDateConfirmation()    { return dateConfirmation; }
    public String getMotifRefus()                 { return motifRefus; }

    // ── SETTERS ───────────────────────────────────────────────────
    public void setId(Long v)                              { this.id = v; }
    public void setNumeroCommande(String v)                { this.numeroCommande = v; }
    public void setClient(Client v)                        { this.client = v; }
    public void setDateCommande(LocalDate v)               { this.dateCommande = v; }
    public void setDateLivraisonPrevue(LocalDate v)        { this.dateLivraisonPrevue = v; }
    public void setAdresseLivraison(String v)              { this.adresseLivraison = v; }
    public void setGouvernoratLivraison(String v)          { this.gouvernoratLivraison = v; }
    public void setQuartierLivraison(String v)             { this.quartierLivraison = v; }
    public void setRueLivraison(String v)                  { this.rueLivraison = v; }
    public void setVilleLivraison(String v)                { this.villeLivraison = v; }
    public void setCodePostalLivraison(String v)           { this.codePostalLivraison = v; }
    public void setPaysLivraison(String v)                 { this.paysLivraison = v; }
    public void setContactLivraison(String v)              { this.contactLivraison = v; }
    public void setTelephoneContactLivraison(String v)     { this.telephoneContactLivraison = v; }
    public void setAdresseChargement(String v)             { this.adresseChargement = v; }
    public void setDateSouhaitee(LocalDate v)              { this.dateSouhaitee = v; }
    public void setCoutEstime(Double v)                    { this.coutEstime = v; }
    public void setDescriptionMarchandise(String v)        { this.descriptionMarchandise = v; }
    public void setPoids(Double v)                         { this.poids = v; }
    public void setVolume(Double v)                        { this.volume = v; }
    public void setRemarques(String v)                     { this.remarques = v; }
    public void setStatut(StatutCommande v)                { this.statut = v; }
    public void setTournees(List<Tournee> v)               { this.tournees = v; }
    public void setCreatedAt(LocalDateTime v)              { this.createdAt = v; }
    public void setUpdatedAt(LocalDateTime v)              { this.updatedAt = v; }
    public void setLatitude(Double v)                      { this.latitude = v; }
    public void setLongitude(Double v)                     { this.longitude = v; }
    public void setPriorite(PrioriteCommande v)            { this.priorite = v; }
    
    // ── SETTERS Confirmation (AJOUTÉS) ────────────────────────────
    public void setHeureLivraisonPrevue(LocalTime v)       { this.heureLivraisonPrevue = v; }
    public void setHeureLivraisonLimite(LocalTime v)       { this.heureLivraisonLimite = v; }
    public void setTokenConfirmation(String v)             { this.tokenConfirmation = v; }
    public void setTokenExpiration(LocalDateTime v)        { this.tokenExpiration = v; }
    public void setConfirmationClient(ConfirmationClient v){ this.confirmationClient = v; }
    public void setDateConfirmation(LocalDateTime v)       { this.dateConfirmation = v; }
    public void setMotifRefus(String v)                    { this.motifRefus = v; }
}