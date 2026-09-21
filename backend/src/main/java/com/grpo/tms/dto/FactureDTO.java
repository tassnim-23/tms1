package com.grpo.tms.dto;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * DTO pour les factures
 */
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class FactureDTO {
    private Long id;
    private String numero;
    private LocalDate dateFacture;
    private BigDecimal montant;
    private String statut;  // PAYEE, EN_ATTENTE, RETARD
    private Long clientId;
}
