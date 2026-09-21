package com.grpo.tms.controller;

import com.grpo.tms.entity.Commande;
import com.grpo.tms.entity.Facture;
import com.grpo.tms.repository.CommandeRepository;
import com.grpo.tms.repository.FactureRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/historique")
public class HistoriqueController {

    private final CommandeRepository commandeRepository;
    private final FactureRepository factureRepository;
    private final com.grpo.tms.repository.UserRepository userRepository;

    public HistoriqueController(CommandeRepository commandeRepository,
                                  FactureRepository factureRepository,
                                  com.grpo.tms.repository.UserRepository userRepository) {
        this.commandeRepository = commandeRepository;
        this.factureRepository = factureRepository;
        this.userRepository = userRepository;
    }

    @GetMapping("/mes-historiques")
    public ResponseEntity<List<Map<String, Object>>> getMesHistoriques(Authentication authentication) {
        String username = authentication.getName();
        Long clientId = userRepository.findByUsername(username)
                .map(user -> user.getClientId())
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));

        List<Map<String, Object>> historique = new ArrayList<>();

        List<Commande> commandes = commandeRepository.findByClientId(clientId);
        for (Commande c : commandes) {
            Map<String, Object> item = new HashMap<>();
            item.put("id", c.getId());
            item.put("reference", c.getNumeroCommande());
            item.put("dateCreation", c.getCreatedAt());
            item.put("statut", c.getStatut());
            item.put("type", "COMMANDE");
            historique.add(item);
        }

        List<Facture> factures = factureRepository.findByClientId(clientId);
        for (Facture f : factures) {
            Map<String, Object> item = new HashMap<>();
            item.put("id", f.getId());
            item.put("reference", f.getNumero());
            item.put("dateCreation", f.getCreatedAt());
            item.put("statut", f.getStatut());
            item.put("montant", f.getMontant());
            item.put("type", "FACTURE");
            historique.add(item);
        }

        return ResponseEntity.ok(historique);
    }

    @GetMapping("/export-csv")
    public ResponseEntity<byte[]> exportCSV() {
        return ResponseEntity.ok("id,reference,type,statut\n".getBytes());
    }

    @GetMapping("/export-pdf")
    public ResponseEntity<byte[]> exportPDF() {
        return ResponseEntity.ok(new byte[0]);
    }
}