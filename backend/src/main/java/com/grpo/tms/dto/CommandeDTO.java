package com.grpo.tms.dto;

import com.grpo.tms.entity.Commande;
import jakarta.validation.constraints.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class CommandeDTO {

    private Long id;
    private String numeroCommande;

    @NotNull(message = "L'identifiant du client est obligatoire")
    private Long clientId;
    private String clientNom;
    private String clientEmail;

    private LocalDate dateCommande;
    private LocalDate dateLivraisonPrevue;

    @NotBlank(message = "L'adresse de livraison est obligatoire")
    private String adresseLivraison;

    private String gouvernoratLivraison;
    private String quartierLivraison;
    private String rueLivraison;

    private String adresseChargement;
    private String villeLivraison;
    private String codePostalLivraison;
    private String paysLivraison;
    private String contactLivraison;
    private String telephoneContactLivraison;
    private String descriptionMarchandise;

    @Min(value = 0, message = "Le poids doit être positif")
    private Double poids;

    @Min(value = 0, message = "Le volume doit être positif")
    private Double volume;

    @Min(value = 0, message = "La distance doit être positive")
    private Double distance;

    @Min(value = 0, message = "Le coût doit être positif")
    private Double coutEstime;

    private String remarques;
    private Commande.StatutCommande statut;
    private Commande.PrioriteCommande priorite = Commande.PrioriteCommande.NORMALE;

    // ── Coordonnées GPS — stockées à la création, utilisées par la carte tournée ──
    private Double latitudeLivraison;
    private Double longitudeLivraison;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // ── Constructeurs ─────────────────────────────────────────────
    public CommandeDTO() {}

    // ── Getters ───────────────────────────────────────────────────
    public Long getId()                                    { return id; }
    public String getNumeroCommande()                      { return numeroCommande; }
    public Long getClientId()                              { return clientId; }
    public String getClientNom()                           { return clientNom; }
    public String getClientEmail()                         { return clientEmail; }
    public LocalDate getDateCommande()                     { return dateCommande; }
    public LocalDate getDateLivraisonPrevue()              { return dateLivraisonPrevue; }
    public String getAdresseLivraison()                    { return adresseLivraison; }
    public String getGouvernoratLivraison()                { return gouvernoratLivraison; }
    public String getQuartierLivraison()                   { return quartierLivraison; }
    public String getRueLivraison()                        { return rueLivraison; }
    public String getAdresseChargement()                   { return adresseChargement; }
    public String getVilleLivraison()                      { return villeLivraison; }
    public String getCodePostalLivraison()                 { return codePostalLivraison; }
    public String getPaysLivraison()                       { return paysLivraison; }
    public String getContactLivraison()                    { return contactLivraison; }
    public String getTelephoneContactLivraison()           { return telephoneContactLivraison; }
    public String getDescriptionMarchandise()              { return descriptionMarchandise; }
    public Double getPoids()                               { return poids; }
    public Double getVolume()                              { return volume; }
    public Double getDistance()                            { return distance; }
    public Double getCoutEstime()                          { return coutEstime; }
    public String getRemarques()                           { return remarques; }
    public Commande.StatutCommande getStatut()             { return statut; }
    public Commande.PrioriteCommande getPriorite()         { return priorite; }
    public LocalDateTime getCreatedAt()                    { return createdAt; }
    public LocalDateTime getUpdatedAt()                    { return updatedAt; }
    public Double getLatitudeLivraison()                   { return latitudeLivraison; }
    public Double getLongitudeLivraison()                  { return longitudeLivraison; }

    // ── Setters ───────────────────────────────────────────────────
    public void setId(Long v)                              { this.id = v; }
    public void setNumeroCommande(String v)                { this.numeroCommande = v; }
    public void setClientId(Long v)                        { this.clientId = v; }
    public void setClientNom(String v)                     { this.clientNom = v; }
    public void setClientEmail(String v)                   { this.clientEmail = v; }
    public void setDateCommande(LocalDate v)               { this.dateCommande = v; }
    public void setDateLivraisonPrevue(LocalDate v)        { this.dateLivraisonPrevue = v; }
    public void setAdresseLivraison(String v)              { this.adresseLivraison = v; }
    public void setGouvernoratLivraison(String v)          { this.gouvernoratLivraison = v; }
    public void setQuartierLivraison(String v)             { this.quartierLivraison = v; }
    public void setRueLivraison(String v)                  { this.rueLivraison = v; }
    public void setAdresseChargement(String v)             { this.adresseChargement = v; }
    public void setVilleLivraison(String v)                { this.villeLivraison = v; }
    public void setCodePostalLivraison(String v)           { this.codePostalLivraison = v; }
    public void setPaysLivraison(String v)                 { this.paysLivraison = v; }
    public void setContactLivraison(String v)              { this.contactLivraison = v; }
    public void setTelephoneContactLivraison(String v)     { this.telephoneContactLivraison = v; }
    public void setDescriptionMarchandise(String v)        { this.descriptionMarchandise = v; }
    public void setPoids(Double v)                         { this.poids = v; }
    public void setVolume(Double v)                        { this.volume = v; }
    public void setDistance(Double v)                      { this.distance = v; }
    public void setCoutEstime(Double v)                    { this.coutEstime = v; }
    public void setRemarques(String v)                     { this.remarques = v; }
    public void setStatut(Commande.StatutCommande v)       { this.statut = v; }
    public void setPriorite(Commande.PrioriteCommande v)   { this.priorite = v; }
    public void setCreatedAt(LocalDateTime v)              { this.createdAt = v; }
    public void setUpdatedAt(LocalDateTime v)              { this.updatedAt = v; }
    public void setLatitudeLivraison(Double v)             { this.latitudeLivraison = v; }
    public void setLongitudeLivraison(Double v)            { this.longitudeLivraison = v; }
}