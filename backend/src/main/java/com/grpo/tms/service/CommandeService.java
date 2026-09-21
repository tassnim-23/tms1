package com.grpo.tms.service;

import com.grpo.tms.dto.CommandeDTO;
import com.grpo.tms.entity.Commande;
import com.grpo.tms.repository.CommandeRepository;
import com.grpo.tms.repository.ClientRepository;
import com.grpo.tms.entity.Client;
import com.grpo.tms.exception.BadRequestException;
import com.grpo.tms.exception.ResourceNotFoundException;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.logging.Logger;
import java.util.stream.Collectors;

/**
 * CommandeService — dans le package service (accessible par TourneeService et ClientController).
 * NE PAS supprimer ce fichier. Il remplace l'ancien CommandeService.java.
 */
@Service
@Transactional
public class CommandeService {

    private static final Logger log = Logger.getLogger(CommandeService.class.getName());

    private final CommandeRepository commandeRepo;
    private final ClientRepository   clientRepo;
    private final EmailService      emailService;

    public CommandeService(CommandeRepository commandeRepo, ClientRepository clientRepo, EmailService emailService) {
        this.commandeRepo = commandeRepo;
        this.clientRepo   = clientRepo;
        this.emailService = emailService;
    }

    @Transactional(readOnly = true)
    public Page<CommandeDTO> getAllCommandes(Pageable pageable) {
        return commandeRepo.findAll(pageable).map(this::toDTO);
    }

    @Transactional(readOnly = true)
    public CommandeDTO getCommandeById(Long id) {
        return commandeRepo.findById(id)
            .map(this::toDTO)
            .orElseThrow(() -> new ResourceNotFoundException("Commande introuvable : " + id));
    }

    public CommandeDTO createCommande(CommandeDTO dto) {
        Client client = clientRepo.findById(dto.getClientId())
            .orElseThrow(() -> new RuntimeException("Client introuvable : " + dto.getClientId()));

        Commande c = new Commande();
        c.setNumeroCommande(genererNumero());
        c.setClient(client);
        c.setDateCommande(dto.getDateCommande() != null ? dto.getDateCommande() : LocalDate.now());
        c.setDateLivraisonPrevue(dto.getDateLivraisonPrevue());
        c.setAdresseLivraison(dto.getAdresseLivraison());
        c.setGouvernoratLivraison(dto.getGouvernoratLivraison());
        c.setQuartierLivraison(dto.getQuartierLivraison());
        c.setRueLivraison(dto.getRueLivraison());
        c.setVilleLivraison(dto.getVilleLivraison());
        c.setCodePostalLivraison(dto.getCodePostalLivraison());
        c.setPaysLivraison(dto.getPaysLivraison() != null ? dto.getPaysLivraison() : "Tunisie");
        c.setContactLivraison(dto.getContactLivraison());
        c.setTelephoneContactLivraison(dto.getTelephoneContactLivraison());
        c.setDescriptionMarchandise(dto.getDescriptionMarchandise());
        c.setPoids(dto.getPoids());
        c.setVolume(dto.getVolume());
        c.setRemarques(dto.getRemarques());
        c.setAdresseChargement(dto.getAdresseChargement());
        c.setPriorite(dto.getPriorite() != null ? dto.getPriorite() : Commande.PrioriteCommande.NORMALE);
        c.setStatut(Commande.StatutCommande.EN_ATTENTE);

        Commande commande = commandeRepo.save(c);
        
        // Envoyer un email de confirmation de commande au client
        try {
            emailService.envoyerEmailConfirmationCommande(commande);
        } catch (Exception e) {
            log.warning("Erreur lors de l'envoi de l'email de confirmation de commande: " + e.getMessage());
        }

        return toDTO(commande);
    }

    public CommandeDTO updateCommande(Long id, CommandeDTO dto) {
        Commande c = commandeRepo.findById(id)
            .orElseThrow(() -> new RuntimeException("Commande introuvable : " + id));

        if (dto.getClientId() != null)
            c.setClient(clientRepo.findById(dto.getClientId())
                .orElseThrow(() -> new RuntimeException("Client introuvable")));
        if (dto.getDateCommande()        != null) c.setDateCommande(dto.getDateCommande());
        if (dto.getDateLivraisonPrevue() != null) c.setDateLivraisonPrevue(dto.getDateLivraisonPrevue());
        if (dto.getAdresseLivraison()    != null) c.setAdresseLivraison(dto.getAdresseLivraison());
        if (dto.getGouvernoratLivraison()!= null) c.setGouvernoratLivraison(dto.getGouvernoratLivraison());
        if (dto.getQuartierLivraison()   != null) c.setQuartierLivraison(dto.getQuartierLivraison());
        if (dto.getRueLivraison()        != null) c.setRueLivraison(dto.getRueLivraison());
        if (dto.getVilleLivraison()      != null) c.setVilleLivraison(dto.getVilleLivraison());
        if (dto.getCodePostalLivraison() != null) c.setCodePostalLivraison(dto.getCodePostalLivraison());
        if (dto.getPaysLivraison()       != null) c.setPaysLivraison(dto.getPaysLivraison());
        if (dto.getContactLivraison()    != null) c.setContactLivraison(dto.getContactLivraison());
        if (dto.getTelephoneContactLivraison() != null)
            c.setTelephoneContactLivraison(dto.getTelephoneContactLivraison());
        if (dto.getDescriptionMarchandise() != null) c.setDescriptionMarchandise(dto.getDescriptionMarchandise());
        if (dto.getAdresseChargement()   != null) c.setAdresseChargement(dto.getAdresseChargement());
        if (dto.getPriorite()            != null) c.setPriorite(dto.getPriorite());
        if (dto.getPoids()     != null) c.setPoids(dto.getPoids());
        if (dto.getVolume()    != null) c.setVolume(dto.getVolume());
        if (dto.getRemarques() != null) c.setRemarques(dto.getRemarques());

        return toDTO(commandeRepo.save(c));
    }

    public void deleteCommande(Long id) {
        Commande c = commandeRepo.findById(id)
            .orElseThrow(() -> new RuntimeException("Commande introuvable : " + id));
        
        if (c.getStatut() == Commande.StatutCommande.EN_COURS) {
            throw new BadRequestException("Impossible de supprimer une commande en cours");
        }
        
        commandeRepo.deleteById(id);
    }

    public CommandeDTO updateStatut(Long id, Commande.StatutCommande statut) {
        Commande c = commandeRepo.findById(id)
            .orElseThrow(() -> new RuntimeException("Commande introuvable : " + id));
        
        // Validation des transitions de statut
        if (c.getStatut() == Commande.StatutCommande.LIVREE) {
            throw new BadRequestException("Impossible de modifier le statut d'une commande livrée");
        }
        
        if (c.getStatut() == Commande.StatutCommande.ANNULEE) {
            throw new BadRequestException("Impossible de modifier le statut d'une commande annulée");
        }
        
        c.setStatut(statut);
        return toDTO(commandeRepo.save(c));
    }

    @Transactional(readOnly = true)
    public List<CommandeDTO> getCommandesByClientId(Long clientId) {
        return commandeRepo.findByClientId(clientId).stream()
            .map(this::toDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<CommandeDTO> getCommandesEnAttente() {
        return commandeRepo.findByStatut(Commande.StatutCommande.EN_ATTENTE).stream()
            .map(this::toDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getStatistiques() {
        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("total",     commandeRepo.count());
        stats.put("enAttente", commandeRepo.countByStatut(Commande.StatutCommande.EN_ATTENTE));
        stats.put("assignee",  commandeRepo.countByStatut(Commande.StatutCommande.ASSIGNEE));
        stats.put("enCours",   commandeRepo.countByStatut(Commande.StatutCommande.EN_COURS));
        stats.put("livree",    commandeRepo.countByStatut(Commande.StatutCommande.LIVREE));
        stats.put("annulee",   commandeRepo.countByStatut(Commande.StatutCommande.ANNULEE));
        return stats;
    }

    // Méthode utilisée par TourneeService
    @Transactional(readOnly = true)
    public Commande findCommandeById(Long id) {
        return commandeRepo.findById(id)
            .orElseThrow(() -> new RuntimeException("Commande introuvable : " + id));
    }

    private CommandeDTO toDTO(Commande c) {
        CommandeDTO dto = new CommandeDTO();
        dto.setId(c.getId());
        dto.setNumeroCommande(c.getNumeroCommande());
        dto.setDateCommande(c.getDateCommande());
        dto.setDateLivraisonPrevue(c.getDateLivraisonPrevue());
        dto.setAdresseLivraison(c.getAdresseLivraison());
        dto.setGouvernoratLivraison(c.getGouvernoratLivraison());
        dto.setQuartierLivraison(c.getQuartierLivraison());
        dto.setRueLivraison(c.getRueLivraison());
        dto.setVilleLivraison(c.getVilleLivraison());
        dto.setCodePostalLivraison(c.getCodePostalLivraison());
        dto.setPaysLivraison(c.getPaysLivraison());
        dto.setContactLivraison(c.getContactLivraison());
        dto.setTelephoneContactLivraison(c.getTelephoneContactLivraison());
        dto.setDescriptionMarchandise(c.getDescriptionMarchandise());
        dto.setPoids(c.getPoids());
        dto.setVolume(c.getVolume());
        dto.setRemarques(c.getRemarques());
        dto.setAdresseChargement(c.getAdresseChargement());
        dto.setStatut(c.getStatut());
        dto.setPriorite(c.getPriorite());
        dto.setCreatedAt(c.getCreatedAt());
        dto.setUpdatedAt(c.getUpdatedAt());
        // ── Coordonnées GPS (essentielles pour la carte tournée) ──
        dto.setLatitudeLivraison(c.getLatitude());
        dto.setLongitudeLivraison(c.getLongitude());
        if (c.getClient() != null) {
            dto.setClientId(c.getClient().getId());
            dto.setClientNom(c.getClient().getRaisonSociale());
            dto.setClientEmail(c.getClient().getEmail());
        }
        return dto;
    }

    private String genererNumero() {
        String date  = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        long   count = commandeRepo.count() + 1;
        return String.format("CMD-%s-%04d", date, count);
    }
}