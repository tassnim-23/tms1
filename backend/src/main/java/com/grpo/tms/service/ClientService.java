package com.grpo.tms.service;

import com.grpo.tms.dto.ClientDTO;
import com.grpo.tms.entity.Client;
import com.grpo.tms.repository.ClientRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional
public class ClientService {

    private final ClientRepository clientRepository;

    @Transactional(readOnly = true)
    public Page<ClientDTO> getAllClients(String search, Pageable pageable) {
        Page<Client> page;
        if (search != null && !search.isBlank()) {
            // On passe le pattern avec % et en minuscules directement
            String pattern = "%" + search.trim().toLowerCase() + "%";
            page = clientRepository.search(pattern, pageable);
        } else {
            page = clientRepository.findAll(pageable);
        }
        return page.map(this::toDTO);
    }

    @Transactional(readOnly = true)
    public ClientDTO getClientById(Long id) {
        return toDTO(getClientByIdEntity(id));
    }

    @Transactional(readOnly = true)
    public Client getClientByIdEntity(Long id) {
        return clientRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Client introuvable : " + id));
    }

    @Transactional(readOnly = true)
    public Client findClientById(Long id) {
        return getClientByIdEntity(id);
    }

    @Transactional(readOnly = true)
    public Optional<Client> getById(Long id) {
        return clientRepository.findById(id);
    }

    public ClientDTO createClient(ClientDTO dto) {
        Client client = new Client();
        appliquerDTO(client, dto);
        return toDTO(clientRepository.save(client));
    }

    public ClientDTO updateClient(Long id, ClientDTO dto) {
        Client client = getClientByIdEntity(id);
        appliquerDTO(client, dto);
        return toDTO(clientRepository.save(client));
    }

    public void deleteClient(Long id) {
        if (!clientRepository.existsById(id))
            throw new RuntimeException("Client introuvable : " + id);
        clientRepository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public long count() { return clientRepository.count(); }

    @Transactional(readOnly = true)
    public long countActifs() { return clientRepository.countByActifTrue(); }

    public ClientDTO toDTO(Client c) {
        ClientDTO dto = new ClientDTO();
        dto.setId(c.getId());
        dto.setRaisonSociale(c.getRaisonSociale());
        dto.setMatriculeFiscale(c.getMatriculeFiscale());
        dto.setResponsableEntreprise(c.getResponsableEntreprise());
        dto.setAdresseComplete(c.getAdresseComplete());
        dto.setActivite(c.getActivite());
        dto.setNom(c.getNom());
        dto.setPrenom(c.getPrenom());
        dto.setEmail(c.getEmail());
        dto.setTelephone(c.getTelephone());
        dto.setAdresse(c.getAdresse());
        dto.setVille(c.getVille());
        dto.setCodePostal(c.getCodePostal());
        dto.setPays(c.getPays());
        dto.setActif(c.getActif());
        dto.setCreatedAt(c.getCreatedAt() != null ? c.getCreatedAt().toString() : null);
        dto.setUpdatedAt(c.getUpdatedAt() != null ? c.getUpdatedAt().toString() : null);
        return dto;
    }

    private void appliquerDTO(Client client, ClientDTO dto) {
        if (dto.getRaisonSociale() != null)         client.setRaisonSociale(dto.getRaisonSociale());
        if (dto.getMatriculeFiscale() != null)      client.setMatriculeFiscale(dto.getMatriculeFiscale());
        if (dto.getResponsableEntreprise() != null) client.setResponsableEntreprise(dto.getResponsableEntreprise());
        if (dto.getAdresseComplete() != null)       client.setAdresseComplete(dto.getAdresseComplete());
        if (dto.getActivite() != null)              client.setActivite(dto.getActivite());
        if (dto.getEmail() != null)                 client.setEmail(dto.getEmail());
        if (dto.getTelephone() != null)             client.setTelephone(dto.getTelephone());
        if (dto.getActif() != null)                 client.setActif(dto.getActif());
        if (dto.getNom() != null)                   client.setNom(dto.getNom());
        if (dto.getPrenom() != null)                client.setPrenom(dto.getPrenom());
        if (dto.getAdresse() != null)               client.setAdresse(dto.getAdresse());
        if (dto.getVille() != null)                 client.setVille(dto.getVille());
        if (dto.getCodePostal() != null)            client.setCodePostal(dto.getCodePostal());
        if (dto.getPays() != null)                  client.setPays(dto.getPays());
        if (dto.getAdresseComplete() != null && client.getVille() == null)
            client.setVille(extraireVille(dto.getAdresseComplete()));
    }

    private String extraireVille(String adresse) {
        if (adresse == null) return null;
        String[] p = adresse.split(",");
        if (p.length >= 2) return p[p.length - 2].trim().replaceAll("^[0-9]+ ", "").trim();
        return null;
    }
}