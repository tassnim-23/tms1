package com.grpo.tms.service;

import com.grpo.tms.dto.VehiculeDTO;
import com.grpo.tms.entity.Vehicule;
import com.grpo.tms.exception.BadRequestException;
import com.grpo.tms.exception.ResourceNotFoundException;
import com.grpo.tms.repository.VehiculeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Service métier pour la gestion des véhicules.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class VehiculeService {

    private final VehiculeRepository vehiculeRepository;

    @Transactional(readOnly = true)
    public Page<VehiculeDTO> getAllVehicules(Pageable pageable) {
        return vehiculeRepository.findAll(pageable).map(this::toDTO);
    }

    @Transactional(readOnly = true)
    public VehiculeDTO getVehiculeById(Long id) {
        return toDTO(findVehiculeById(id));
    }

    @Transactional(readOnly = true)
    public List<VehiculeDTO> getVehiculesDisponibles() {
        return vehiculeRepository.findByStatut(Vehicule.StatutVehicule.DISPONIBLE)
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    public VehiculeDTO createVehicule(VehiculeDTO dto) {
        if (vehiculeRepository.existsByImmatriculation(dto.getImmatriculation())) {
            throw new BadRequestException("Un véhicule avec cette immatriculation existe déjà: " + dto.getImmatriculation());
        }

        Vehicule vehicule = Vehicule.builder()
                .immatriculation(dto.getImmatriculation().toUpperCase())
                .marque(dto.getMarque())
                .modele(dto.getModele())
                .capaciteCharge(dto.getCapaciteCharge())
                .statut(dto.getStatut() != null ? dto.getStatut() : Vehicule.StatutVehicule.DISPONIBLE)
                .kilometrage(dto.getKilometrage() != null ? dto.getKilometrage() : 0)
                .dateMiseEnService(dto.getDateMiseEnService())
                .build();

        Vehicule saved = vehiculeRepository.save(vehicule);
        log.info("Véhicule créé: {} ({})", saved.getImmatriculation(), saved.getId());
        return toDTO(saved);
    }

    public VehiculeDTO updateVehicule(Long id, VehiculeDTO dto) {
        Vehicule vehicule = findVehiculeById(id);

        if (!vehicule.getImmatriculation().equals(dto.getImmatriculation()) &&
                vehiculeRepository.existsByImmatriculation(dto.getImmatriculation())) {
            throw new BadRequestException("Un véhicule avec cette immatriculation existe déjà.");
        }

        vehicule.setImmatriculation(dto.getImmatriculation().toUpperCase());
        vehicule.setMarque(dto.getMarque());
        vehicule.setModele(dto.getModele());
        vehicule.setCapaciteCharge(dto.getCapaciteCharge());
        if (dto.getStatut() != null) vehicule.setStatut(dto.getStatut());
        if (dto.getKilometrage() != null) vehicule.setKilometrage(dto.getKilometrage());
        vehicule.setDateMiseEnService(dto.getDateMiseEnService());

        Vehicule updated = vehiculeRepository.save(vehicule);
        log.info("Véhicule mis à jour: {} ({})", updated.getImmatriculation(), updated.getId());
        return toDTO(updated);
    }

    public void deleteVehicule(Long id) {
        Vehicule vehicule = findVehiculeById(id);
        if (!vehicule.getTournees().isEmpty()) {
            throw new BadRequestException("Impossible de supprimer un véhicule ayant des tournées.");
        }
        vehiculeRepository.deleteById(id);
        log.info("Véhicule supprimé: {}", id);
    }

    public VehiculeDTO updateStatut(Long id, Vehicule.StatutVehicule statut) {
        Vehicule vehicule = findVehiculeById(id);
        vehicule.setStatut(statut);
        Vehicule updated = vehiculeRepository.save(vehicule);
        log.info("Statut véhicule {} mis à jour: {}", id, statut);
        return toDTO(updated);
    }

    public VehiculeDTO updateKilometrage(Long id, Integer kilometrage) {
        Vehicule vehicule = findVehiculeById(id);
        if (kilometrage < vehicule.getKilometrage()) {
            throw new BadRequestException("Le kilométrage ne peut pas être inférieur au kilométrage actuel.");
        }
        vehicule.setKilometrage(kilometrage);
        Vehicule updated = vehiculeRepository.save(vehicule);
        log.info("Kilométrage véhicule {} mis à jour: {} km", id, kilometrage);
        return toDTO(updated);
    }

    public Vehicule findVehiculeById(Long id) {
        return vehiculeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Véhicule non trouvé avec l'ID: " + id));
    }

    public VehiculeDTO toDTO(Vehicule v) {
        return VehiculeDTO.builder()
                .id(v.getId())
                .immatriculation(v.getImmatriculation())
                .marque(v.getMarque())
                .modele(v.getModele())
                .capaciteCharge(v.getCapaciteCharge())
                .statut(v.getStatut())
                .kilometrage(v.getKilometrage())
                .dateMiseEnService(v.getDateMiseEnService())
                .createdAt(v.getCreatedAt())
                .updatedAt(v.getUpdatedAt())
                .build();
    }
}
