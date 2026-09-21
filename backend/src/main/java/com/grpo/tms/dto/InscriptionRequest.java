package com.grpo.tms.dto;

import lombok.Data;

@Data
public class InscriptionRequest {
    private String raisonSociale;
    private String matriculeFiscale;
    private String activite;
    private String responsableEntreprise;
    private String adresseComplete;
    private String email;
    private String telephone;
    private String password;
}
