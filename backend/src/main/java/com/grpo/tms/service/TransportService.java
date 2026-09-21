package com.grpo.tms.service;

import com.grpo.tms.entity.Transport;
import com.grpo.tms.repository.TransportRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * TransportService — Gestion des commandes de transport.
 *
 * NOTE : Si votre entité s'appelle "Commande" et non "Transport",
 * remplacez Transport par Commande et TransportRepository par CommandeRepository.
 */
@Service
@RequiredArgsConstructor
@Transactional
public class TransportService {

    private final TransportRepository transportRepository;

    @Transactional(readOnly = true)
    public Page<Transport> getAll(String statut, String search, Pageable pageable) {
        if (statut != null && !statut.isBlank()) {
            return transportRepository.findByStatut(statut, pageable);
        }
        if (search != null && !search.isBlank()) {
            return transportRepository.search(search.trim(), pageable);
        }
        return transportRepository.findAll(pageable);
    }

    @Transactional(readOnly = true)
    public Transport getById(Long id) {
        return transportRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Transport introuvable : " + id));
    }

    public Transport create(Transport dto) {
        if (dto.getStatut() == null) dto.setStatut("EN_ATTENTE");
        if (dto.getReference() == null) {
            dto.setReference("CMD-" + System.currentTimeMillis());
        }
        return transportRepository.save(dto);
    }

    public Transport update(Long id, Transport dto) {
        Transport t = transportRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Transport introuvable : " + id));
        if (dto.getOrigine() != null)      t.setOrigine(dto.getOrigine());
        if (dto.getDestination() != null)  t.setDestination(dto.getDestination());
        if (dto.getStatut() != null)       t.setStatut(dto.getStatut());
        if (dto.getType() != null)         t.setType(dto.getType());
        if (dto.getPoids() != null)        t.setPoids(dto.getPoids());
        if (dto.getCout() != null)         t.setCout(dto.getCout());
        if (dto.getDescription() != null)  t.setDescription(dto.getDescription());
        if (dto.getDateDepart() != null)   t.setDateDepart(dto.getDateDepart());
        if (dto.getDateLivraison() != null) t.setDateLivraison(dto.getDateLivraison());
        if (dto.getClientId() != null)     t.setClientId(dto.getClientId());
        return transportRepository.save(t);
    }

    public Transport updateStatut(Long id, String statut) {
        Transport t = transportRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Transport introuvable : " + id));
        t.setStatut(statut);
        return transportRepository.save(t);
    }

    public void delete(Long id) {
        if (!transportRepository.existsById(id))
            throw new RuntimeException("Transport introuvable : " + id);
        transportRepository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public long count() { return transportRepository.count(); }

    @Transactional(readOnly = true)
    public long countByStatut(String statut) { return transportRepository.countByStatut(statut); }
}
