package com.grpo.tms.config;

import com.grpo.tms.entity.Client;
import com.grpo.tms.entity.Chauffeur;
import com.grpo.tms.entity.Vehicule;
import com.grpo.tms.entity.Tournee;
import com.grpo.tms.repository.ClientRepository;
import com.grpo.tms.repository.ChauffeurRepository;
import com.grpo.tms.repository.VehiculeRepository;
import com.grpo.tms.repository.TourneeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Configuration
@RequiredArgsConstructor
@Slf4j
public class DataInitializer {

    private final ClientRepository     clientRepository;
    private final ChauffeurRepository  chauffeurRepository;
    private final VehiculeRepository   vehiculeRepository;
    private final TourneeRepository    tourneeRepository;

    @Bean
    public CommandLineRunner initDemoData() {
        return args -> {
            if (clientRepository.count() > 0) {
                log.info("DataInitializer : données existantes, initialisation ignorée.");
                return;
            }

            log.info("DataInitializer : création des données de démonstration...");

            // ══ 1. CLIENTS ════════════════════════════════════════════
            clientRepository.save(Client.builder()
                .raisonSociale("GRPO Consulting SARL")
                .matriculeFiscale("1234567ABC")
                .responsableEntreprise("Ahmed Ben Ali")
                .email("contact@grpo.tn")
                .telephone("+21671234567")
                .adresseComplete("12 Rue de la Liberté, 1002 Tunis, Tunisie")
                .adresse("12 Rue de la Liberté")
                .ville("Tunis")
                .codePostal("1002")
                .pays("Tunisie")
                .activite("Transport")
                .actif(true)
                .build());

            clientRepository.save(Client.builder()
                .raisonSociale("Logistique Nord SARL")
                .matriculeFiscale("7654321DEF")
                .responsableEntreprise("Mohamed Trabelsi")
                .email("info@logistiquenord.tn")
                .telephone("+21672345678")
                .adresseComplete("45 Avenue Habib Bourguiba, 7000 Bizerte, Tunisie")
                .adresse("45 Avenue Habib Bourguiba")
                .ville("Bizerte")
                .codePostal("7000")
                .pays("Tunisie")
                .activite("Logistique")
                .actif(true)
                .build());

            clientRepository.save(Client.builder()
                .raisonSociale("Distribution Sfax")
                .matriculeFiscale("9876543GHI")
                .responsableEntreprise("Fatma Mansouri")
                .email("contact@distribsfax.tn")
                .telephone("+21674567890")
                .adresseComplete("8 Rue Ibn Khaldoun, 3000 Sfax, Tunisie")
                .adresse("8 Rue Ibn Khaldoun")
                .ville("Sfax")
                .codePostal("3000")
                .pays("Tunisie")
                .activite("Distribution")
                .actif(true)
                .build());

            log.info("DataInitializer : {} clients créés.", clientRepository.count());

            // ══ 2. CHAUFFEURS ══════════════════════════════════════════
            // Chauffeur entity :
            //   nom, prenom, email, telephone, numeroPermis
            //   dateValiditePermis (@Future — doit être dans le futur !)
            //   disponible (Boolean, défaut true)
            // SUPPRIMÉ : typePermis, dateObtentionPermis, actif
            if (chauffeurRepository.count() == 0) {
                chauffeurRepository.save(Chauffeur.builder()
                    .nom("Ben Ali")
                    .prenom("Mohamed")
                    .email("mohamed.benali@grpo.tn")
                    .telephone("+21650123456")
                    .numeroPermis("TN123456")
                    .dateValiditePermis(LocalDate.now().plusYears(3))
                    .disponible(true)
                    .build());

                chauffeurRepository.save(Chauffeur.builder()
                    .nom("Trabelsi")
                    .prenom("Fatma")
                    .email("fatma.trabelsi@grpo.tn")
                    .telephone("+21698765432")
                    .numeroPermis("TN654321")
                    .dateValiditePermis(LocalDate.now().plusYears(4))
                    .disponible(true)
                    .build());

                chauffeurRepository.save(Chauffeur.builder()
                    .nom("Mansouri")
                    .prenom("Karim")
                    .email("karim.mansouri@grpo.tn")
                    .telephone("+21622334455")
                    .numeroPermis("TN789012")
                    .dateValiditePermis(LocalDate.now().plusYears(2))
                    .disponible(true)
                    .build());

                log.info("DataInitializer : {} chauffeurs créés.", chauffeurRepository.count());
            }

            // ══ 3. VÉHICULES ═══════════════════════════════════════════
            // Vehicule entity :
            //   immatriculation, marque, modele, capaciteCharge
            //   statut (DISPONIBLE/EN_SERVICE/EN_MAINTENANCE, défaut DISPONIBLE)
            //   kilometrage (Integer, défaut 0)
            //   dateMiseEnService (LocalDate, optionnel)
            // SUPPRIMÉ : annee, typeCarburant, actif, disponible
            if (vehiculeRepository.count() == 0) {
                vehiculeRepository.save(Vehicule.builder()
                    .marque("Renault")
                    .modele("Master")
                    .immatriculation("TU-1234-56")
                    .capaciteCharge(3500.0)
                    .dateMiseEnService(LocalDate.of(2020, 3, 1))
                    .statut(Vehicule.StatutVehicule.DISPONIBLE)
                    .kilometrage(45000)
                    .build());

                vehiculeRepository.save(Vehicule.builder()
                    .marque("Peugeot")
                    .modele("Partner")
                    .immatriculation("TU-5678-90")
                    .capaciteCharge(1000.0)
                    .dateMiseEnService(LocalDate.of(2021, 6, 15))
                    .statut(Vehicule.StatutVehicule.DISPONIBLE)
                    .kilometrage(32000)
                    .build());

                vehiculeRepository.save(Vehicule.builder()
                    .marque("Mercedes")
                    .modele("Sprinter")
                    .immatriculation("TU-9876-54")
                    .capaciteCharge(5000.0)
                    .dateMiseEnService(LocalDate.of(2022, 1, 10))
                    .statut(Vehicule.StatutVehicule.DISPONIBLE)
                    .kilometrage(18000)
                    .build());

                log.info("DataInitializer : {} véhicules créés.", vehiculeRepository.count());
            }

            // ══ 4. TOURNÉES ════════════════════════════════════════════
            if (tourneeRepository.count() == 0) {
                List<Chauffeur> chauffeurs = chauffeurRepository.findAll();
                List<Vehicule>  vehicules  = vehiculeRepository.findAll();

                if (chauffeurs.size() >= 2 && vehicules.size() >= 2) {
                    Chauffeur c1 = chauffeurs.get(0);
                    Chauffeur c2 = chauffeurs.get(1);
                    Vehicule  v1 = vehicules.get(0);
                    Vehicule  v2 = vehicules.get(1);

                    tourneeRepository.save(Tournee.builder()
                        .numeroTournee("TRN-20260310-0001")
                        .dateTournee(LocalDate.now().minusDays(5))
                        .heureDebut(LocalTime.of(8, 0))
                        .heureFin(LocalTime.of(17, 0))
                        .chauffeur(c1).vehicule(v1)
                        .distanceTotale(145.0)
                        .statut(Tournee.StatutTournee.TERMINEE)
                        .remarques("Tournée nord — Bizerte + Tunis")
                        .build());

                    tourneeRepository.save(Tournee.builder()
                        .numeroTournee("TRN-20260312-0002")
                        .dateTournee(LocalDate.now().minusDays(3))
                        .heureDebut(LocalTime.of(7, 30))
                        .heureFin(LocalTime.of(16, 30))
                        .chauffeur(c2).vehicule(v2)
                        .distanceTotale(230.0)
                        .statut(Tournee.StatutTournee.TERMINEE)
                        .remarques("Tournée centre — Sousse + Kairouan")
                        .build());

                    tourneeRepository.save(Tournee.builder()
                        .numeroTournee("TRN-20260315-0003")
                        .dateTournee(LocalDate.now())
                        .heureDebut(LocalTime.of(8, 0))
                        .heureFin(LocalTime.of(18, 0))
                        .chauffeur(c1).vehicule(v1)
                        .distanceTotale(180.0)
                        .statut(Tournee.StatutTournee.EN_COURS)
                        .remarques("Tournée Sfax")
                        .build());

                    tourneeRepository.save(Tournee.builder()
                        .numeroTournee("TRN-20260318-0004")
                        .dateTournee(LocalDate.now().plusDays(3))
                        .heureDebut(LocalTime.of(7, 0))
                        .chauffeur(c2).vehicule(v2)
                        .distanceTotale(90.0)
                        .statut(Tournee.StatutTournee.PLANIFIEE)
                        .remarques("Livraisons grand Tunis")
                        .build());

                    tourneeRepository.save(Tournee.builder()
                        .numeroTournee("TRN-20260320-0005")
                        .dateTournee(LocalDate.now().plusDays(5))
                        .heureDebut(LocalTime.of(8, 0))
                        .chauffeur(c1).vehicule(v2)
                        .statut(Tournee.StatutTournee.PLANIFIEE)
                        .remarques("Tournée sud — Gabès + Médenine")
                        .build());

                    log.info("DataInitializer : {} tournées créées.", tourneeRepository.count());
                }
            }

            log.info("DataInitializer : initialisation terminée !");
        };
    }
}