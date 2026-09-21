package com.grpo.tms.entity;

import jakarta.persistence.*;

/**
 * Entite JPA representant une localite avec ses coordonnees GPS officielles.
 * Alimentee par la migration V1_0_3__Create_Localite_GPS.sql
 */
@Entity
@Table(name = "localite_gps", indexes = {
    @Index(name = "idx_localite_nom",         columnList = "nom"),
    @Index(name = "idx_localite_gouvernorat", columnList = "gouvernorat")
})
public class LocaliteGps {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false, length = 10)
    private String code;

    @Column(nullable = false, length = 100)
    private String nom;

    @Column(nullable = false, length = 50)
    private String gouvernorat;

    @Column(nullable = false)
    private Double latitude;

    @Column(nullable = false)
    private Double longitude;

    @Column(length = 255)
    private String remarque;

    @Column(nullable = false)
    private Boolean actif = true;

    // Getters
    public Long getId()           { return id; }
    public String getCode()       { return code; }
    public String getNom()        { return nom; }
    public String getGouvernorat(){ return gouvernorat; }
    public Double getLatitude()   { return latitude; }
    public Double getLongitude()  { return longitude; }
    public String getRemarque()   { return remarque; }
    public Boolean getActif()     { return actif; }

    // Setters
    public void setId(Long id)                  { this.id = id; }
    public void setCode(String code)            { this.code = code; }
    public void setNom(String nom)              { this.nom = nom; }
    public void setGouvernorat(String g)        { this.gouvernorat = g; }
    public void setLatitude(Double lat)         { this.latitude = lat; }
    public void setLongitude(Double lon)        { this.longitude = lon; }
    public void setRemarque(String r)           { this.remarque = r; }
    public void setActif(Boolean actif)         { this.actif = actif; }
}