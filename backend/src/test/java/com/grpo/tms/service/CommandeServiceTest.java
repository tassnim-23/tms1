package com.grpo.tms.service;

import com.grpo.tms.dto.CommandeDTO;
import com.grpo.tms.entity.*;
import com.grpo.tms.exception.BadRequestException;
import com.grpo.tms.exception.ResourceNotFoundException;
import com.grpo.tms.repository.CommandeRepository;
import com.grpo.tms.repository.ClientRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CommandeServiceTest {

    @Mock
    private CommandeRepository commandeRepository;

    @Mock
    private ClientRepository clientRepository;

    @InjectMocks
    private CommandeService commandeService;

    private Client clientTest;
    private Commande commandeTest;
    private CommandeDTO commandeDTOTest;

    @BeforeEach
    void setUp() {
        clientTest = Client.builder()
                .id(1L)
                .raisonSociale("Client Test")
                .email("test@test.tn")
                .telephone("+21698765432")
                .build();

        commandeTest = Commande.builder()
                .id(1L)
                .numeroCommande("CMD-20240101-1001")
                .adresseChargement("Adresse Chargement Test")
                .adresseLivraison("Adresse Livraison Test")
                .dateSouhaitee(LocalDate.now().plusDays(3))
                .statut(Commande.StatutCommande.EN_ATTENTE)
                .client(clientTest)
                .build();

        // ← Remplace builder() par new + setters
        commandeDTOTest = new CommandeDTO();
        commandeDTOTest.setAdresseChargement("Adresse Chargement Test");
        commandeDTOTest.setAdresseLivraison("Adresse Livraison Test");
        commandeDTOTest.setDateLivraisonPrevue(LocalDate.now().plusDays(3));
        commandeDTOTest.setClientId(1L);
    }

    @Test
    void getCommandeById_shouldReturnDTO_whenFound() {
        when(commandeRepository.findById(1L)).thenReturn(Optional.of(commandeTest));
        CommandeDTO result = commandeService.getCommandeById(1L);
        assertNotNull(result);
        assertEquals("CMD-20240101-1001", result.getNumeroCommande());
        assertEquals(Commande.StatutCommande.EN_ATTENTE, result.getStatut());
        verify(commandeRepository, times(1)).findById(1L);
    }

    @Test
    void getCommandeById_shouldThrow_whenNotFound() {
        when(commandeRepository.findById(999L)).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class,
                () -> commandeService.getCommandeById(999L));
    }

    @Test
    void createCommande_shouldSaveAndNotify() {
        when(clientRepository.findById(1L)).thenReturn(Optional.of(clientTest));
        when(commandeRepository.save(any(Commande.class))).thenReturn(commandeTest);
        CommandeDTO result = commandeService.createCommande(commandeDTOTest);
        assertNotNull(result);
        verify(commandeRepository, times(1)).save(any(Commande.class));
    }

    @Test
    void updateStatut_shouldSucceed_whenValidTransition() {
        when(commandeRepository.findById(1L)).thenReturn(Optional.of(commandeTest));
        when(commandeRepository.save(any(Commande.class))).thenReturn(commandeTest);
        CommandeDTO result = commandeService.updateStatut(1L, Commande.StatutCommande.ASSIGNEE);
        assertNotNull(result);
        verify(commandeRepository, times(1)).save(any(Commande.class));
    }

    @Test
    void updateStatut_shouldThrow_whenInvalidTransition() {
        commandeTest.setStatut(Commande.StatutCommande.LIVREE);
        when(commandeRepository.findById(1L)).thenReturn(Optional.of(commandeTest));
        assertThrows(BadRequestException.class,
                () -> commandeService.updateStatut(1L, Commande.StatutCommande.EN_ATTENTE));
    }

    @Test
    void updateStatut_shouldThrow_whenLivreeToAssignee() {
        commandeTest.setStatut(Commande.StatutCommande.LIVREE);
        when(commandeRepository.findById(1L)).thenReturn(Optional.of(commandeTest));
        assertThrows(BadRequestException.class,
                () -> commandeService.updateStatut(1L, Commande.StatutCommande.ASSIGNEE));
    }

    @Test
    void deleteCommande_shouldThrow_whenEnCours() {
        commandeTest.setStatut(Commande.StatutCommande.EN_COURS);
        when(commandeRepository.findById(1L)).thenReturn(Optional.of(commandeTest));
        assertThrows(BadRequestException.class,
                () -> commandeService.deleteCommande(1L));
        verify(commandeRepository, never()).deleteById(anyLong());
    }

    @Test
    void deleteCommande_shouldSucceed_whenEnAttente() {
        when(commandeRepository.findById(1L)).thenReturn(Optional.of(commandeTest));
        doNothing().when(commandeRepository).deleteById(1L);
        assertDoesNotThrow(() -> commandeService.deleteCommande(1L));
        verify(commandeRepository, times(1)).deleteById(1L);
    }
}