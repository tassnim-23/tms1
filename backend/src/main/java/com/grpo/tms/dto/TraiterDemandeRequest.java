package com.grpo.tms.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class TraiterDemandeRequest {

    @NotNull(message = "ID demande obligatoire")
    private Long demandeId;

    @NotNull(message = "Action obligatoire")
    private Action action;

    private String raisonRejet;

    private String role = "ROLE_USER";

    public enum Action {
        APPROUVER, REJETER
    }
}
