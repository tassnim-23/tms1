package com.grpo.tms.service;

import com.grpo.tms.dto.ChauffeurDTO;
import com.grpo.tms.entity.Chauffeur;
import com.grpo.tms.exception.BadRequestException;
import com.grpo.tms.exception.ResourceNotFoundException;
import com.grpo.tms.repository.ChauffeurRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Service métier pour la gestion des chauffeurs.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class ChauffeurService {

    private final ChauffeurRepository chauffeurRepository;

    @Transactional(readOnly = true)
    public Page<ChauffeurDTO> getAllChauffeurs(Pageable pageable) {
        return chauffeurRepository.findAll(pageable).map(this::toDTO);
    }

    @Transactional(readOnly = true)
    public ChauffeurDTO getChauffeurById(Long id) {
        return toDTO(findChauffeurById(id));
    }

    @Transactional(readOnly = true)
    public List<ChauffeurDTO> getChauffeursDisponibles() {
        return chauffeurRepository.findByDisponibleTrue()
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    public ChauffeurDTO createChauffeur(ChauffeurDTO dto) {
        if (chauffeurRepository.existsByEmail(dto.getEmail())) {
            throw new BadRequestException("Un chauffeur avec cet email existe déjà: " + dto.getEmail());
        }
        if (chauffeurRepository.existsByNumeroPermis(dto.getNumeroPermis())) {
            throw new BadRequestException("Un chauffeur avec ce numéro de permis existe déjà: " + dto.getNumeroPermis());
        }

        Chauffeur chauffeur = Chauffeur.builder()
                .nom(dto.getNom())
                .prenom(dto.getPrenom())
                .email(dto.getEmail())
                .telephone(dto.getTelephone())
                .numeroPermis(dto.getNumeroPermis())
                .dateValiditePermis(dto.getDateValiditePermis())
                .disponible(dto.getDisponible() != null ? dto.getDisponible() : true)
                .build();

        Chauffeur saved = chauffeurRepository.save(chauffeur);
        log.info("Chauffeur créé: {} {} ({})", saved.getNom(), saved.getPrenom(), saved.getId());
        return toDTO(saved);
    }

    public ChauffeurDTO updateChauffeur(Long id, ChauffeurDTO dto) {
        Chauffeur chauffeur = findChauffeurById(id);

        if (!chauffeur.getEmail().equals(dto.getEmail()) &&
                chauffeurRepository.existsByEmail(dto.getEmail())) {
            throw new BadRequestException("Un chauffeur avec cet email existe déjà.");
        }
        if (!chauffeur.getNumeroPermis().equals(dto.getNumeroPermis()) &&
                chauffeurRepository.existsByNumeroPermis(dto.getNumeroPermis())) {
            throw new BadRequestException("Un chauffeur avec ce numéro de permis existe déjà.");
        }

        chauffeur.setNom(dto.getNom());
        chauffeur.setPrenom(dto.getPrenom());
        chauffeur.setEmail(dto.getEmail());
        chauffeur.setTelephone(dto.getTelephone());
        chauffeur.setNumeroPermis(dto.getNumeroPermis());
        chauffeur.setDateValiditePermis(dto.getDateValiditePermis());
        if (dto.getDisponible() != null) chauffeur.setDisponible(dto.getDisponible());

        Chauffeur updated = chauffeurRepository.save(chauffeur);
        log.info("Chauffeur mis à jour: {} ({})", updated.getNomComplet(), updated.getId());
        return toDTO(updated);
    }

    public void deleteChauffeur(Long id) {
        Chauffeur chauffeur = findChauffeurById(id);
        if (!chauffeur.getTournees().isEmpty()) {
            throw new BadRequestException("Impossible de supprimer un chauffeur ayant des tournées.");
        }
        chauffeurRepository.deleteById(id);
        log.info("Chauffeur supprimé: {}", id);
    }

    public ChauffeurDTO updateDisponibilite(Long id, boolean disponible) {
        Chauffeur chauffeur = findChauffeurById(id);
        chauffeur.setDisponible(disponible);
        Chauffeur updated = chauffeurRepository.save(chauffeur);
        log.info("Disponibilité chauffeur {} mise à jour: {}", id, disponible);
        return toDTO(updated);
    }

    public Chauffeur findChauffeurById(Long id) {
        return chauffeurRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Chauffeur non trouvé avec l'ID: " + id));
    }

    public ChauffeurDTO toDTO(Chauffeur c) {
        return ChauffeurDTO.builder()
                .id(c.getId())
                .nom(c.getNom())
                .prenom(c.getPrenom())
                .email(c.getEmail())
                .telephone(c.getTelephone())
                .numeroPermis(c.getNumeroPermis())
                .dateValiditePermis(c.getDateValiditePermis())
                .disponible(c.getDisponible())
                .createdAt(c.getCreatedAt())
                .updatedAt(c.getUpdatedAt())
                .nombreTournees(c.getTournees().size())
                .build();
    }
}
