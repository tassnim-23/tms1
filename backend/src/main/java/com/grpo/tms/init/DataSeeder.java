package com.grpo.tms.init;

import com.grpo.tms.entity.Client;
import com.grpo.tms.entity.Commande;
import com.grpo.tms.entity.User;
import com.grpo.tms.repository.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Random;
import java.util.Set;
import java.util.UUID;

/**
 * DataSeeder — Génère automatiquement des données de test au démarrage.
 * 
 * Configuration :
 * - app.seed.enabled=true  → Active la génération
 * - app.seed.clients=50    → Nombre de clients
 * - app.seed.commandes=150 → Nombre de commandes
 */
@Slf4j
@Component
public class DataSeeder {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private ClientRepository clientRepository;

    @Autowired
    private CommandeRepository commandeRepository;

    @Autowired
    private DemandeInscriptionRepository demandeInscriptionRepository;

    @Autowired
    private SupportMessageRepository supportMessageRepository;

    @Autowired
    private FactureRepository factureRepository;

    @Autowired
    private ConfirmationLivraisonRepository confirmationLivraisonRepository;

    @Autowired
    private TourneeRepository tourneeRepository;

    @Value("${app.seed.enabled:false}")
    private boolean seedEnabled;

    @Value("${app.seed.force:false}")
    private boolean forceReSeed;

    @Value("${app.seed.clients:50}")
    private int numClients;

    @Value("${app.seed.commandes:150}")
    private int numCommandes;

    private final Random random = new Random();

    // ── DONNÉES RÉALISTES POUR LA GÉNÉRATION ──
    private static final String[] SECTEURS = {
        "Informatique", "Électronique", "Pharmaceutique", "Textile", "Alimentaire",
        "Cosmétiques", "Quincaillerie", "Pièces auto", "Livres", "Électroménager",
        "Mobilier", "Construction", "Chimie", "Logistique", "Export-Import"
    };

    private static final String[] VILLES = {
        "Tunis", "Ariana", "Ben Arous", "Manouba", "Sfax", "Sousse", "Kairouan",
        "Gabès", "Gafsa", "Tataouine", "Bizerte", "Nabeul", "Monastir", "Mahdia"
    };

    private static final String[] GOUVERNORATS = {
        "Tunis", "Ariana", "Ben Arous", "Manouba", "Sfax", "Sousse", "Kairouan",
        "Gabès", "Gafsa", "Tataouine", "Bizerte", "Nabeul", "Monastir", "Mahdia"
    };

    private static final String[] QUARTIERS = {
        "Centre", "Nord", "Sud", "Est", "Ouest", "Périphérie", "Banlieue", "Centre-Ville"
    };

    private static final String[] NOMS = {
        "Martin", "Bernard", "Thomas", "Robert", "Richard", "Durand", "Lefevre",
        "Michel", "Garcia", "Lemoine", "Laurent", "Simon", "Michel", "Lefebvre"
    };

    private static final String[] PRENOMS = {
        "Ahmed", "Mohamed", "Ali", "Fatima", "Aïcha", "Jean", "Marie", "Sophie",
        "Paul", "Luc", "Pierre", "Valérie", "Carole", "Nathalie"
    };

    private static final String[] TYPES_MARCHANDISE = {
        "Équipements informatiques", "Pièces électroniques", "Produits pharmaceutiques",
        "Tissus et vêtements", "Produits alimentaires", "Cosmétiques et produits d'hygiène",
        "Outils et quincaillerie", "Pièces automobiles", "Livres et matériel éducatif",
        "Électroménager", "Meubles et décoration", "Matériaux de construction"
    };

    private static final Commande.StatutCommande[] STATUTS = {
        Commande.StatutCommande.EN_ATTENTE,
        Commande.StatutCommande.ASSIGNEE,
        Commande.StatutCommande.EN_COURS,
        Commande.StatutCommande.LIVREE,
        Commande.StatutCommande.ANNULEE
    };

    private static final Commande.PrioriteCommande[] PRIORITES = {
        Commande.PrioriteCommande.URGENT,
        Commande.PrioriteCommande.HAUTE,
        Commande.PrioriteCommande.NORMALE,
        Commande.PrioriteCommande.BASSE
    };

    private static final Commande.ConfirmationClient[] CONFIRMATIONS = {
        Commande.ConfirmationClient.EN_ATTENTE,
        Commande.ConfirmationClient.CONFIRMEE,
        Commande.ConfirmationClient.REFUSEE
    };

    /**
     * S'exécute au démarrage si app.seed.enabled=true
     */
    private void ensureDefaultAdmin() {
        User existing = userRepository.findByUsername("admin").orElse(null);
        if (existing == null) {
            User admin = User.builder()
                    .username("admin")
                    .email("admin@grpo-consulting.com")
                    .password(passwordEncoder.encode("admin123"))
                    .roles(new HashSet<>(Set.of("ADMIN", "USER")))
                    .active(true)
                    .emailVerifie(true)
                    .statutApproval(User.StatutApproval.APPROUVEE)
                    .build();
            userRepository.save(admin);
            log.info("✅ Compte admin par défaut créé avec le mot de passe: admin123");
            return;
        }

        boolean needsUpdate = !passwordEncoder.matches("admin123", existing.getPassword())
                || !existing.getRoles().contains("ADMIN");

        if (needsUpdate) {
            existing.setPassword(passwordEncoder.encode("admin123"));
            existing.getRoles().add("ADMIN");
            existing.getRoles().add("USER");
            existing.setActive(true);
            existing.setEmailVerifie(true);
            existing.setStatutApproval(User.StatutApproval.APPROUVEE);
            userRepository.save(existing);
            log.info("✅ Compte admin corrigé: mot de passe réinitialisé à admin123");
        }
    }

    @EventListener(ApplicationReadyEvent.class)
    public void seedData() {
        ensureDefaultAdmin();

        if (!seedEnabled) {
            log.info("✓ DataSeeder désactivé (app.seed.enabled=false)");
            return;
        }

        log.info("🌱 Démarrage du DataSeeder...");
        long startTime = System.currentTimeMillis();

        // Vérifier s'il y a déjà des données
        if (clientRepository.count() > 0) {
            if (!forceReSeed) {
                log.warn("⚠️  Base de données déjà remplie ({} clients). Seeding annulé.", clientRepository.count());
                log.info("💡 Pour forcer le re-seeding, set app.seed.force=true");
                return;
            }
            // Force re-seed: vider les tables dans le bon ordre (respecter les FK)
            log.warn("🗑️  Force re-seed: suppression des données existantes...");
            try {
                confirmationLivraisonRepository.deleteAll();
                factureRepository.deleteAll();
                tourneeRepository.deleteAll();
                commandeRepository.deleteAll();
                demandeInscriptionRepository.deleteAll();
                supportMessageRepository.deleteAll();
                clientRepository.deleteAll();
                log.info("✅ Tables vidées, re-seeding en cours...");
            } catch (Exception e) {
                log.error("❌ Erreur lors de la suppression des données : {}", e.getMessage());
                throw e;
            }
        }

        try {
            // Générer les clients
            log.info("📌 Génération de {} clients...", numClients);
            List<Client> clients = generateClients(numClients);
            List<Client> savedClients = clientRepository.saveAll(clients);
            log.info("✅ {} clients créés avec succès", savedClients.size());

            // Générer les commandes
            log.info("📋 Génération de {} commandes...", numCommandes);
            List<Commande> commandes = generateCommandes(savedClients, numCommandes);
            List<Commande> savedCommandes = commandeRepository.saveAll(commandes);
            log.info("✅ {} commandes créées avec succès", savedCommandes.size());

            long duration = System.currentTimeMillis() - startTime;
            log.info("🎉 DataSeeding terminé en {}ms", duration);
            printSummary(savedClients, savedCommandes);

        } catch (Exception e) {
            log.error("❌ Erreur lors du seeding : {}", e.getMessage(), e);
        }
    }

    /**
     * Génère une liste de clients réalistes
     * Utilise les données réelles des 50 clients du système
     */
    private List<Client> generateClients(int count) {
        List<Client> clients = new ArrayList<>();
        
        // Données réelles des 50 clients
        String[][] clientsData = {
            {"Société Tasnim SARL", "Bouneb", "Tasnim", "tessabouneb123@gmail.com", "22345678", "Rue Principale, Bembla", "Monastir", "5061", "1234567A", "Commerce"},
            {"GRPO Consulting", "Bouneb", "Tassnim", "bounebtassnim217@gmail.com", "23456789", "Avenue Habib Bourguiba", "Monastir", "5000", "2345678B", "Consulting"},
            {"AMR Logistics", "Bouneb", "Amr", "amrbouneb1@gmail.com", "24567890", "Rue Centrale, Ouerdanine", "Monastir", "5070", "3456789C", "Logistique"},
            {"Monastir Transport", "Ben Ali", "Sami", "sami.benali@gmail.com", "25678901", "Avenue de la République", "Monastir", "5000", "4567890D", "Transport"},
            {"Ksar Hellal Textiles", "Trabelsi", "Leila", "leila.trabelsi@gmail.com", "26789012", "Avenue Habib Bourguiba", "Ksar Hellal", "5050", "5678901E", "Textile"},
            {"Bembla Distribution", "Mansouri", "Karim", "karim.mansouri@gmail.com", "27890123", "Route de Bembla", "Bembla", "5061", "6789012F", "Distribution"},
            {"Moknine Commerce", "Gharbi", "Fatma", "fatma.gharbi@gmail.com", "28901234", "Rue de la Mer", "Moknine", "5090", "7890123G", "Commerce"},
            {"Jemmal Services", "Hamdi", "Nabil", "nabil.hamdi@gmail.com", "29012345", "Avenue Principale", "Jemmal", "5085", "8901234H", "Services"},
            {"Téboulba Pêche", "Ayari", "Houssem", "houssem.ayari@gmail.com", "20123456", "Port de Téboulba", "Téboulba", "5095", "9012345I", "Pêche"},
            {"Sahline Agro", "Boughanmi", "Rim", "rim.boughanmi@gmail.com", "22234567", "Route de Sahline", "Sahline", "5080", "0123456J", "Agriculture"},
            {"Zeramdine Import", "Chaari", "Walid", "walid.chaari@gmail.com", "23345678", "Rue Centrale", "Zeramdine", "5075", "1234560K", "Import/Export"},
            {"Bekalta Foods", "Dridi", "Ines", "ines.dridi@gmail.com", "24456789", "Avenue de la Mer", "Bekalta", "5065", "2345671L", "Agroalimentaire"},
            {"Ksibet Médiouni SARL", "Elloumi", "Fares", "fares.elloumi@gmail.com", "25567890", "Rue Principale", "Ksibet el Mediouni", "5055", "3456782M", "Commerce"},
            {"Ouerdanine Tech", "Ferchichi", "Sonia", "sonia.ferchichi@gmail.com", "26678901", "Rue Centrale", "Ouerdanine", "5070", "4567893N", "Technologie"},
            {"Corniche Events", "Guesmi", "Tarek", "tarek.guesmi@gmail.com", "27789012", "Quartier Corniche", "Monastir", "5000", "5678904O", "Événementiel"},
            {"Sousse Capital", "Hamza", "Mehdi", "mehdi.hamza@gmail.com", "28890123", "Avenue Habib Bourguiba", "Sousse", "4000", "6789015P", "Finance"},
            {"Hammam Sousse Resort", "Jomni", "Salma", "salma.jomni@gmail.com", "29901234", "Avenue de la Plage", "Hammam Sousse", "4060", "7890126Q", "Tourisme"},
            {"Kantaoui Invest", "Karoui", "Zied", "zied.karoui@gmail.com", "20012345", "Port El Kantaoui", "Sousse", "4000", "8901237R", "Investissement"},
            {"Msaken Agriculture", "Lahmar", "Dorra", "dorra.lahmar@gmail.com", "22123456", "Route de Msaken", "Msaken", "4150", "9012348S", "Agriculture"},
            {"Akouda Distribution", "Mzabi", "Rami", "rami.mzabi@gmail.com", "23234567", "Avenue Principale", "Akouda", "4120", "0123459T", "Distribution"},
            {"Sahloul Pharma", "Nasr", "Hajer", "hajer.nasr@gmail.com", "24345678", "Cité Sahloul", "Sousse", "4054", "1234560U", "Pharmacie"},
            {"Kalaa Kebira SARL", "Omri", "Bassem", "bassem.omri@gmail.com", "25456789", "Avenue de la République", "Kalaa Kebira", "4010", "2345671V", "Commerce"},
            {"Khezama Immobilier", "Pouri", "Asma", "asma.pouri@gmail.com", "26567890", "Cité Khezama", "Sousse", "4050", "3456782W", "Immobilier"},
            {"Zaouia Services", "Rjeb", "Yassine", "yassine.rjeb@gmail.com", "27678901", "Zaouia Sousse", "Sousse", "4000", "4567893X", "Services"},
            {"Sousse Nord Logistics", "Saidi", "Manel", "manel.saidi@gmail.com", "28789012", "Zone Industrielle Nord", "Sousse", "4000", "5678904Y", "Logistique"},
            {"Mahdia Pêche", "Turki", "Adel", "adel.turki@gmail.com", "29890123", "Port de Mahdia", "Mahdia", "5100", "6789015Z", "Pêche"},
            {"El Jem Tourisme", "Uosta", "Sirine", "sirine.uosta@gmail.com", "20901234", "Avenue de l Amphithéâtre", "El Jem", "5130", "7890126A", "Tourisme"},
            {"Chebba Commerce", "Vali", "Oussama", "oussama.vali@gmail.com", "22012345", "Rue de la Mer", "Chebba", "5180", "8901237B", "Commerce"},
            {"Ksour Essef SARL", "Wafi", "Nadia", "nadia.wafi@gmail.com", "23123456", "Avenue Principale", "Ksour Essef", "5140", "9012348C", "Commerce"},
            {"Mahdia Textile", "Xara", "Bilel", "bilel.xara@gmail.com", "24234567", "Zone Industrielle", "Mahdia", "5100", "0123459D", "Textile"},
            {"Sidi Alouane Agro", "Yara", "Ghada", "ghada.yara@gmail.com", "25345678", "Route Principale", "Sidi Alouane", "5160", "1234560E", "Agriculture"},
            {"Ouled Chamekh Import", "Zarga", "Amine", "amine.zarga@gmail.com", "26456789", "Avenue Centrale", "Ouled Chamekh", "5170", "2345671F", "Import/Export"},
            {"Ben Hassan Transport", "Achouri", "Lina", "lina.achouri@gmail.com", "27567890", "Beni Hassen", "Monastir", "5062", "3456782G", "Transport"},
            {"Lamta Services", "Bahroun", "Slim", "slim.bahroun@gmail.com", "28678901", "Rue Principale", "Lamta", "5072", "4567893H", "Services"},
            {"Sayada Beach Resort", "Chaabane", "Olfa", "olfa.chaabane@gmail.com", "29789012", "Rue de la Plage", "Sayada", "5082", "5678904I", "Tourisme"},
            {"Menzel Kamel SARL", "Dali", "Khaled", "khaled.dali@gmail.com", "20890123", "Route Principale", "Menzel Kamel", "5060", "6789015J", "Commerce"},
            {"Hammam El Ghezaz", "Ebdelli", "Sara", "sara.ebdelli@gmail.com", "22901234", "Avenue de la Mer", "Hammam El Ghezaz", "5150", "7890126K", "Tourisme"},
            {"Salakta Pêche", "Farhat", "Aymen", "aymen.farhat@gmail.com", "23012345", "Port de Salakta", "Salakta", "5120", "8901237L", "Pêche"},
            {"Boumerdes Commerce", "Ghariani", "Wafa", "wafa.ghariani@gmail.com", "24123456", "Rue Centrale", "Boumerdes", "5125", "9012348M", "Commerce"},
            {"Kerker Distribution", "Hajri", "Rafik", "rafik.hajri@gmail.com", "25234567", "Route de Kerker", "Kerker", "5135", "0123459N", "Distribution"},
            {"Monastir Med Tech", "Idriss", "Hana", "hana.idriss@gmail.com", "26345678", "Zone Médicale", "Monastir", "5000", "1234560O", "Médical"},
            {"Sousse IT Solutions", "Jarray", "Maher", "maher.jarray@gmail.com", "27456789", "Cité Sahloul 3", "Sousse", "4054", "2345671P", "Informatique"},
            {"Mahdia Solar Energy", "Khalil", "Rania", "rania.khalil@gmail.com", "28567890", "Zone Industrielle", "Mahdia", "5100", "3456782Q", "Énergie"},
            {"Ksar Hellal Fashion", "Landoulsi", "Fathi", "fathi.landoulsi@gmail.com", "29678901", "Marché Central", "Ksar Hellal", "5050", "4567893R", "Mode"},
            {"Moknine Plastique", "Meddeb", "Alia", "alia.meddeb@gmail.com", "20789012", "Zone Industrielle", "Moknine", "5090", "5678904S", "Industrie"},
            {"Jemmal Electronics", "Nefzi", "Saber", "saber.nefzi@gmail.com", "22890123", "Avenue Principale", "Jemmal", "5085", "6789015T", "Électronique"},
            {"Téboulba Marine", "Ouali", "Cyrine", "cyrine.ouali@gmail.com", "23901234", "Zone Portuaire", "Téboulba", "5095", "7890126U", "Maritime"},
            {"Zeramdine Céréales", "Poussi", "Lotfi", "lotfi.poussi@gmail.com", "24012345", "Plaine de Zeramdine", "Zeramdine", "5075", "8901237V", "Agriculture"},
            {"Bekalta Conserves", "Quasmi", "Imen", "imen.quasmi@gmail.com", "25123456", "Zone Industrielle", "Bekalta", "5065", "9012348W", "Agroalimentaire"},
            {"Sahline Oliviers", "Rabhi", "Jamel", "jamel.rabhi@gmail.com", "26234567", "Domaine Agricole", "Sahline", "5080", "0123459X", "Agriculture"}
        };

        for (int i = 0; i < Math.min(count, clientsData.length); i++) {
            String[] data = clientsData[i];
            Client client = Client.builder()
                .raisonSociale(data[0])
                .nom(data[1])
                .prenom(data[2])
                .email(data[3])
                .telephone(data[4])
                .adresse(data[5])
                .ville(data[6])
                .codePostal(data[7])
                .matriculeFiscale(data[8])
                .activite(data[9])
                .responsableEntreprise(data[1] + " " + data[2])
                .adresseComplete(data[5])
                .pays("Tunisie")
                .actif(true)
                .build();

            clients.add(client);
        }

        // Si count > 50, générer des clients aléatoires supplémentaires
        if (count > clientsData.length) {
            int matriculeCounter = 1000000 + clientsData.length;
            for (int i = clientsData.length; i < count; i++) {
                Client client = Client.builder()
                    .raisonSociale(generateCompanyName())
                    .matriculeFiscale(String.format("%d-MF", matriculeCounter++))
                    .responsableEntreprise(generatePersonName())
                    .email(generateEmail())
                    .telephone(generatePhoneNumber())
                    .adresseComplete(generateAddress())
                    .adresse(generateAddress())
                    .ville(randomElement(VILLES))
                    .codePostal(String.format("%04d", random.nextInt(10000)))
                    .pays("Tunisie")
                    .activite(randomElement(SECTEURS))
                    .actif(random.nextBoolean() || i < 40)
                    .build();

                clients.add(client);
            }
        }

        return clients;
    }

    /**
     * Génère une liste de commandes variées
     * Utilise les données réelles des 150 commandes du système
     */
    private List<Commande> generateCommandes(List<Client> clients, int count) {
        List<Commande> commandes = new ArrayList<>();
        
        // Données réelles des 150 commandes
        Object[][] commandesData = {
            {1, "CMD-2026-0001", 1, "Rue Principale, Bembla, Monastir", "Rue Principale 2, Bembla, Monastir", "2026-05-20", "Livraison colis électronique", 2.5, 0.5},
            {2, "CMD-2026-0002", 1, "Cité El Wafa, Bembla, Monastir", "Cité El Wafa 2, Bembla, Monastir", "2026-05-18", "Documents urgents", 1.2, 0.1},
            {3, "CMD-2026-0003", 6, "Route de Bembla, Bembla, Monastir", "Rue Centrale, Bembla, Monastir", "2026-05-21", "Matériel informatique", 5.0, 1.5},
            {4, "CMD-2026-0004", 6, "Rue de l École, Bembla, Monastir", "Avenue Principale, Bembla, Monastir", "2026-05-25", "Fournitures scolaires", 0.8, 0.2},
            {5, "CMD-2026-0005", 3, "Rue Centrale, Ouerdanine, Monastir", "Avenue Nouvelle, Ouerdanine, Monastir", "2026-05-19", "Pièces automobiles", 3.0, 0.8},
            {6, "CMD-2026-0006", 14, "Route d Ouerdanine, Monastir", "Centre-Ville, Ouerdanine, Monastir", "2026-05-17", "Équipement médical", 1.5, 0.3},
            {7, "CMD-2026-0007", 3, "Avenue de la Liberté, Ouerdanine, Monastir", "Rue Principale, Ouerdanine, Monastir", "2026-05-22", "Vêtements professionnels", 2.2, 0.6},
            {8, "CMD-2026-0008", 5, "Avenue Habib Bourguiba, Ksar Hellal, Monastir", "Marché Central, Ksar Hellal, Monastir", "2026-05-20", "Tissu industriel", 8.0, 2.5},
            {9, "CMD-2026-0009", 5, "Rue de la Mode, Ksar Hellal, Monastir", "Avenue Principale, Ksar Hellal, Monastir", "2026-05-18", "Commande textile urgente", 4.5, 1.2},
            {10, "CMD-2026-0010", 44, "Rue de la Mode 2, Ksar Hellal, Monastir", "Zone Commerciale, Ksar Hellal, Monastir", "2026-05-26", "Échantillons textile", 2.0, 0.4},
            {11, "CMD-2026-0011", 7, "Rue de la Mer, Moknine, Monastir", "Centre Ville, Moknine, Monastir", "2026-05-21", "Produits alimentaires", 3.5, 0.9},
            {12, "CMD-2026-0012", 7, "Avenue Principale, Moknine, Monastir", "Rue Centrale, Moknine, Monastir", "2026-05-23", "Épices et condiments", 1.8, 0.3},
            {13, "CMD-2026-0013", 45, "Zone Industrielle, Moknine, Monastir", "Rue Nouvelle, Moknine, Monastir", "2026-05-24", "Granulés plastique", 12.0, 4.0},
            {14, "CMD-2026-0014", 8, "Avenue Principale, Jemmal, Monastir", "Rue Centrale, Jemmal, Monastir", "2026-05-20", "Équipement bureau", 2.8, 0.7},
            {15, "CMD-2026-0015", 8, "Rue Centrale, Jemmal, Monastir", "Avenue Nouvelle, Jemmal, Monastir", "2026-05-17", "Médicaments urgents", 0.5, 0.1},
            {16, "CMD-2026-0016", 46, "Souk El Ahad, Jemmal, Monastir", "Zone Commerciale, Jemmal, Monastir", "2026-05-22", "Appareils électroniques", 6.0, 1.8},
            {17, "CMD-2026-0017", 9, "Port de Téboulba, Monastir", "Zone Portuaire, Téboulba, Monastir", "2026-05-21", "Matériel de pêche", 15.0, 5.0},
            {18, "CMD-2026-0018", 47, "Zone Portuaire, Téboulba, Monastir", "Port Est, Téboulba, Monastir", "2026-05-24", "Équipement maritime", 7.5, 2.2},
            {19, "CMD-2026-0019", 10, "Route de Sahline, Monastir", "Centre Agricole, Sahline, Monastir", "2026-05-20", "Produits agricoles", 4.0, 1.2},
            {20, "CMD-2026-0020", 50, "Domaine Agricole, Sahline, Monastir", "Ferme Principale, Sahline, Monastir", "2026-05-28", "Huile d olive en vrac", 20.0, 8.0},
            {21, "CMD-2026-0021", 11, "Rue Centrale, Zeramdine, Monastir", "Avenue Nouvelle, Zeramdine, Monastir", "2026-05-21", "Céréales importées", 3.2, 0.8},
            {22, "CMD-2026-0022", 48, "Plaine de Zeramdine, Monastir", "Silo Principal, Zeramdine, Monastir", "2026-05-27", "Semences agricoles", 25.0, 6.0},
            {23, "CMD-2026-0023", 12, "Avenue de la Mer, Bekalta, Monastir", "Zone Industrielle, Bekalta, Monastir", "2026-05-22", "Conserves alimentaires", 5.5, 1.5},
            {24, "CMD-2026-0024", 49, "Zone Industrielle, Bekalta, Monastir", "Rue Principale, Bekalta, Monastir", "2026-05-23", "Boîtes de conserve vides", 10.0, 3.0},
            {25, "CMD-2026-0025", 13, "Rue Principale, Ksibet el Mediouni, Monastir", "Centre Ville, Ksibet el Mediouni, Monastir", "2026-05-20", "Articles ménagers", 2.0, 0.5},
            {26, "CMD-2026-0026", 15, "Quartier Corniche, Monastir", "Avenue Bord de Mer, Monastir", "2026-05-18", "Décoration événement", 1.0, 0.2},
            {27, "CMD-2026-0027", 2, "Avenue Habib Bourguiba, Monastir", "Rue de la Médina, Monastir", "2026-05-21", "Documents administratifs", 0.8, 0.1},
            {28, "CMD-2026-0028", 4, "Zone Industrielle, Monastir", "Route Principale, Monastir", "2026-05-23", "Pièces de rechange", 18.0, 4.5},
            {29, "CMD-2026-0029", 41, "Zone Médicale, Monastir", "Clinique Centrale, Monastir", "2026-05-17", "Matériel médical", 3.0, 0.6},
            {30, "CMD-2026-0030", 33, "Beni Hassen, Monastir", "Centre Beni Hassen, Monastir", "2026-05-22", "Matériaux construction", 4.5, 1.2},
            {31, "CMD-2026-0031", 34, "Rue Principale, Lamta, Monastir", "Centre Ville Lamta, Monastir", "2026-05-21", "Produits artisanaux", 2.5, 0.6},
            {32, "CMD-2026-0032", 35, "Rue de la Plage, Sayada, Monastir", "Hôtel Sayada, Monastir", "2026-05-26", "Équipement hôtelier", 1.5, 0.3},
            {33, "CMD-2026-0033", 36, "Route Principale, Menzel Kamel, Monastir", "Centre Menzel Kamel, Monastir", "2026-05-22", "Produits agricoles", 3.0, 0.8},
            {34, "CMD-2026-0034", 16, "Avenue Habib Bourguiba, Sousse", "Centre-Ville Sousse", "2026-05-20", "Documents financiers", 5.0, 1.2},
            {35, "CMD-2026-0035", 16, "Rue de la Kasbah, Sousse", "Médina Sousse", "2026-05-18", "Bijoux et accessoires", 2.0, 0.3},
            {36, "CMD-2026-0036", 17, "Avenue de la Plage, Hammam Sousse", "Resort Hammam, Sousse", "2026-05-21", "Produits spa et bien-être", 3.5, 1.0},
            {37, "CMD-2026-0037", 18, "Port El Kantaoui, Sousse", "Marina Kantaoui, Sousse", "2026-05-22", "Équipement nautique", 1.5, 0.4},
            {38, "CMD-2026-0038", 19, "Route de Msaken, Sousse", "Centre Msaken, Sousse", "2026-05-23", "Engrais agricoles", 8.0, 2.0},
            {39, "CMD-2026-0039", 20, "Avenue Principale, Akouda, Sousse", "Marché Akouda, Sousse", "2026-05-20", "Fruits et légumes", 4.0, 1.2},
            {40, "CMD-2026-0040", 21, "Cité Sahloul, Sousse", "Clinique Sahloul, Sousse", "2026-05-17", "Médicaments spécialisés", 0.5, 0.1},
            {41, "CMD-2026-0041", 22, "Avenue de la République, Kalaa Kebira, Sousse", "Centre Kalaa, Sousse", "2026-05-22", "Mobilier de bureau", 6.0, 1.8},
            {42, "CMD-2026-0042", 23, "Cité Khezama, Sousse", "Khezama Centre, Sousse", "2026-05-23", "Appareils électroménagers", 2.5, 0.6},
            {43, "CMD-2026-0043", 24, "Zaouia Sousse", "Zaouia Centre, Sousse", "2026-05-27", "Livres et fournitures", 1.0, 0.2},
            {44, "CMD-2026-0044", 25, "Zone Industrielle Nord, Sousse", "Entrepôt Nord, Sousse", "2026-05-24", "Palettes de marchandises", 30.0, 8.0},
            {45, "CMD-2026-0045", 42, "Cité Sahloul 3, Sousse", "Tech Park, Sousse", "2026-05-21", "Serveurs informatiques", 1.5, 0.3},
            {46, "CMD-2026-0046", 26, "Port de Mahdia", "Zone Portuaire, Mahdia", "2026-05-21", "Filets de pêche", 20.0, 5.0},
            {47, "CMD-2026-0047", 27, "Avenue de l Amphithéâtre, El Jem", "Musée El Jem", "2026-05-22", "Souvenirs touristiques", 2.0, 0.4},
            {48, "CMD-2026-0048", 28, "Rue de la Mer, Chebba", "Port Chebba, Mahdia", "2026-05-23", "Produits de la mer", 5.0, 1.5},
            {49, "CMD-2026-0049", 29, "Avenue Principale, Ksour Essef", "Centre Ksour, Mahdia", "2026-05-24", "Marchandises diverses", 3.0, 0.7},
            {50, "CMD-2026-0050", 30, "Zone Industrielle, Mahdia", "Usine Textile, Mahdia", "2026-05-25", "Rouleaux de tissu", 10.0, 3.0},
            {51, "CMD-2026-0051", 31, "Route Principale, Sidi Alouane", "Centre Sidi Alouane, Mahdia", "2026-05-28", "Produits agricoles", 6.0, 1.5},
            {52, "CMD-2026-0052", 32, "Avenue Centrale, Ouled Chamekh", "Centre Ouled Chamekh, Mahdia", "2026-05-22", "Marchandises importées", 4.0, 1.0},
            {53, "CMD-2026-0053", 43, "Zone Industrielle, Mahdia", "Centrale Solaire, Mahdia", "2026-05-23", "Panneaux solaires", 8.0, 2.5},
            {54, "CMD-2026-0054", 37, "Avenue de la Mer, Hammam El Ghezaz", "Complexe El Ghezaz, Mahdia", "2026-05-24", "Équipement touristique", 3.5, 0.8},
            {55, "CMD-2026-0055", 38, "Port de Salakta", "Coopérative Salakta, Mahdia", "2026-05-21", "Matériel de pêche", 12.0, 3.5},
            {56, "CMD-2026-0056", 1, "Impasse des Figuiers, Bembla, Monastir", "Rue Centre Bembla", "2026-05-22", "Colis personnel", 1.5, 0.3},
            {57, "CMD-2026-0057", 2, "Rue de la Medina, Monastir", "Centre Admin Monastir", "2026-05-17", "Documents légaux", 0.8, 0.1},
            {58, "CMD-2026-0058", 3, "Cité Principale, Ouerdanine, Monastir", "Rue Principale Ouerdanine", "2026-05-23", "Équipement technique", 4.0, 1.0},
            {59, "CMD-2026-0059", 4, "Avenue du 7 Novembre, Monastir", "Zone Industrielle Monastir", "2026-05-24", "Pièces mécaniques", 7.0, 2.0},
            {60, "CMD-2026-0060", 5, "Rue des Tisserands, Ksar Hellal, Monastir", "Rue Centre Ksar Hellal", "2026-05-29", "Fils et bobines", 5.5, 1.2},
            {61, "CMD-2026-0061", 6, "Cité El Wafa 2, Bembla, Monastir", "Rue Commerce Bembla", "2026-05-21", "Produits informatiques", 2.2, 0.5},
            {62, "CMD-2026-0062", 7, "Souk Central, Moknine, Monastir", "Rue Principale Moknine", "2026-05-22", "Articles bazaar", 3.0, 0.7},
            {63, "CMD-2026-0063", 8, "Cité Ouvriers, Jemmal, Monastir", "Centre Jemmal", "2026-05-25", "Vêtements de travail", 1.8, 0.4},
            {64, "CMD-2026-0064", 9, "Rue des Pêcheurs, Téboulba, Monastir", "Port Téboulba", "2026-05-23", "Appâts et équipements", 8.0, 2.2},
            {65, "CMD-2026-0065", 10, "Ferme Boughanmi, Sahline, Monastir", "Centre Sahline", "2026-05-30", "Engrais naturels", 15.0, 4.5},
            {66, "CMD-2026-0066", 11, "Silo Zeramdine, Monastir", "Centre Zeramdine", "2026-05-25", "Blé importé", 40.0, 10.0},
            {67, "CMD-2026-0067", 12, "Usine Bekalta, Monastir", "Centre Bekalta", "2026-05-24", "Produits transformés", 18.0, 4.5},
            {68, "CMD-2026-0068", 13, "Résidence Les Pins, Ksibet el Mediouni, Monastir", "Centre Ksibet", "2026-05-21", "Articles maison", 2.8, 0.6},
            {69, "CMD-2026-0069", 14, "Cité Techno, Ouerdanine, Monastir", "Clinique Ouerdanine", "2026-05-18", "Matériel médical high-tech", 3.5, 0.8},
            {70, "CMD-2026-0070", 15, "Marina Monastir", "Quartier Corniche Monastir", "2026-05-22", "Décoration maritime", 5.0, 1.5},
            {71, "CMD-2026-0071", 16, "Rue Hedi Chaker, Sousse", "Centre Bureau Sousse", "2026-05-21", "Matériel de bureau", 4.5, 1.0},
            {72, "CMD-2026-0072", 17, "Rue des Hôtels, Hammam Sousse", "Resort Hammam", "2026-05-23", "Linge hôtelier", 6.0, 1.8},
            {73, "CMD-2026-0073", 18, "Résidence Kantaoui, Sousse", "Marina Kantaoui", "2026-05-22", "Matériaux de construction", 2.5, 0.6},
            {74, "CMD-2026-0074", 19, "Ferme Msaken, Sousse", "Centre Msaken", "2026-05-28", "Olives en vrac", 12.0, 3.5},
            {75, "CMD-2026-0075", 20, "Marché Akouda, Sousse", "Centre Akouda", "2026-05-21", "Légumes frais", 5.0, 1.5},
            {76, "CMD-2026-0076", 21, "Clinique Sahloul, Sousse", "Hôpital Sahloul", "2026-05-17", "Consommables médicaux", 1.0, 0.2},
            {77, "CMD-2026-0077", 22, "Zone Artisanale, Kalaa Kebira, Sousse", "Centre Kalaa", "2026-05-24", "Produits artisanaux", 3.0, 0.7},
            {78, "CMD-2026-0078", 23, "Tour Khezama, Sousse", "Centre Khezama", "2026-05-25", "Documents immobiliers", 0.8, 0.1},
            {79, "CMD-2026-0079", 24, "Mosquée Zaouia, Sousse", "Centre Zaouia", "2026-05-23", "Fournitures religieuses", 2.0, 0.3},
            {80, "CMD-2026-0080", 25, "Entrepôt Nord, Sousse", "Dépôt Nord Sousse", "2026-05-26", "Stockage marchandises", 50.0, 12.0},
            {81, "CMD-2026-0081", 42, "Parc Technologique, Sousse", "Tech Park Sousse", "2026-05-22", "Équipements IT", 2.0, 0.4},
            {82, "CMD-2026-0082", 26, "Médina de Mahdia", "Centre Mahdia", "2026-05-23", "Artisanat local", 3.0, 0.7},
            {83, "CMD-2026-0083", 27, "Musée El Jem", "Site El Jem", "2026-05-24", "Articles muséographiques", 1.5, 0.3},
            {84, "CMD-2026-0084", 28, "Port Chebba", "Zone Portuaire Chebba", "2026-05-25", "Équipement naval", 10.0, 3.0},
            {85, "CMD-2026-0085", 29, "Marché Ksour Essef, Mahdia", "Centre Ksour", "2026-05-29", "Produits locaux", 4.5, 1.0},
            {86, "CMD-2026-0086", 30, "Usine Textile Mahdia", "Centre Textile", "2026-05-23", "Tissu synthétique", 15.0, 4.5},
            {87, "CMD-2026-0087", 43, "Centrale Solaire, Mahdia", "Centre Énergie", "2026-05-24", "Onduleurs solaires", 20.0, 6.0},
            {88, "CMD-2026-0088", 39, "Rue Centrale, Boumerdes", "Centre Boumerdes", "2026-05-22", "Produits divers", 3.0, 0.7},
            {89, "CMD-2026-0089", 40, "Route de Kerker, Monastir", "Centre Kerker", "2026-05-23", "Marchandises en gros", 6.0, 1.5},
            {90, "CMD-2026-0090", 41, "Polyclinique, Monastir", "Hôpital Monastir", "2026-05-18", "Matériel chirurgical", 2.0, 0.4},
            {91, "CMD-2026-0091", 44, "Rue de la Soie, Ksar Hellal, Monastir", "Centre Mode", "2026-05-22", "Soie et tissus fins", 4.0, 1.0},
            {92, "CMD-2026-0092", 45, "Entrepôt Plastique, Moknine, Monastir", "Usine Moknine", "2026-05-25", "Matière première plastique", 25.0, 8.0},
            {93, "CMD-2026-0093", 46, "Centre Commercial, Jemmal, Monastir", "Zone Commerce", "2026-05-23", "Électronique grand public", 8.0, 2.0},
            {94, "CMD-2026-0094", 47, "Chantier Naval, Téboulba, Monastir", "Port Téboulba", "2026-05-26", "Matériaux navires", 30.0, 8.0},
            {95, "CMD-2026-0095", 48, "Coopérative, Zeramdine, Monastir", "Centre Agricole", "2026-05-24", "Orge et blé", 10.0, 2.5},
            {96, "CMD-2026-0096", 49, "Conserverie, Bekalta, Monastir", "Usine Bekalta", "2026-05-23", "Thon en boîte", 12.0, 3.0},
            {97, "CMD-2026-0097", 50, "Huilerie, Sahline, Monastir", "Centre Sahline", "2026-05-22", "Huile d olive premium", 8.0, 2.0},
            {98, "CMD-2026-0098", 33, "Garage Ben Hassan, Monastir", "Garage Centre", "2026-05-24", "Pièces auto importées", 5.0, 1.2},
            {99, "CMD-2026-0099", 34, "Atelier Lamta, Monastir", "Atelier Centre", "2026-05-23", "Outillage professionnel", 3.0, 0.7},
            {100, "CMD-2026-0100", 35, "Hôtel Sayada Beach, Monastir", "Resort Sayada", "2026-05-25", "Linge de plage", 4.0, 1.0},
            {101, "CMD-2026-0101", 36, "Ferme Menzel Kamel, Monastir", "Centre Agricole", "2026-05-29", "Fruits de saison", 7.0, 2.0},
            {102, "CMD-2026-0102", 37, "Complexe El Ghezaz, Mahdia", "Resort El Ghezaz", "2026-05-22", "Articles de piscine", 2.0, 0.5},
            {103, "CMD-2026-0103", 38, "Coopérative Salakta, Mahdia", "Centre Salakta", "2026-05-23", "Poisson congelé", 8.0, 2.5},
            {104, "CMD-2026-0104", 31, "Sidi Alouane Olive, Mahdia", "Centre Sidi Alouane", "2026-05-30", "Huile d argan", 10.0, 2.5},
            {105, "CMD-2026-0105", 32, "Marché Ouled Chamekh, Mahdia", "Centre Ouled Chamekh", "2026-05-24", "Épices et herbes", 3.5, 0.8},
            {106, "CMD-2026-0106", 1, "Rue de l École 2, Bembla, Monastir", "Rue Commerce", "2026-05-22", "Matériel scolaire", 2.0, 0.5},
            {107, "CMD-2026-0107", 2, "Cité Résidentielle, Monastir", "Centre Monastir", "2026-05-23", "Livraison résidentielle", 1.5, 0.3},
            {108, "CMD-2026-0108", 3, "Lotissement Ouerdanine, Monastir", "Rue Principale", "2026-05-24", "Matériaux bâtiment", 3.0, 0.8},
            {109, "CMD-2026-0109", 4, "Garage Central, Monastir", "Zone Industrielle", "2026-05-25", "Pneus et jantes", 9.0, 2.5},
            {110, "CMD-2026-0110", 5, "Fabrique Ksar Hellal, Monastir", "Rue Centre", "2026-05-23", "Rouleaux tissu coton", 18.0, 5.0},
            {111, "CMD-2026-0111", 16, "Centre-Ville, Sousse", "Bureau Centre", "2026-05-22", "Produits financiers", 2.5, 0.6},
            {112, "CMD-2026-0112", 17, "Complexe Hôtelier, Hammam Sousse", "Resort Hammam", "2026-05-24", "Produits nettoyage", 5.0, 1.2},
            {113, "CMD-2026-0113", 18, "Marina Port, Sousse", "Marina Centre", "2026-05-23", "Accessoires nautiques", 3.0, 0.7},
            {114, "CMD-2026-0114", 19, "Coopérative Agricole, Msaken", "Centre Msaken", "2026-05-28", "Olives noires", 20.0, 5.0},
            {115, "CMD-2026-0115", 20, "Entrepôt Akouda, Akouda", "Centre Akouda", "2026-05-22", "Caisses de légumes", 8.0, 2.0},
            {116, "CMD-2026-0116", 21, "Hôpital Sahloul, Sousse", "Hôpital Centre", "2026-05-18", "Urgence médicale", 0.8, 0.1},
            {117, "CMD-2026-0117", 22, "Souk Kalaa, Kalaa Kebira", "Centre Kalaa", "2026-05-25", "Articles souk", 4.0, 1.0},
            {118, "CMD-2026-0118", 23, "Bureaux Khezama, Sousse", "Centre Bureau", "2026-05-26", "Fournitures bureau", 1.5, 0.3},
            {119, "CMD-2026-0119", 24, "Bibliothèque Zaouia, Sousse", "Bibliothèque Centre", "2026-05-24", "Livres et revues", 3.0, 0.7},
            {120, "CMD-2026-0120", 25, "Dépôt Logistique, Sousse", "Dépôt Centre", "2026-05-27", "Stock complet", 45.0, 10.0},
            {121, "CMD-2026-0121", 42, "Tech Hub Sousse, Sousse", "Tech Centre", "2026-05-23", "Ordinateurs portables", 3.5, 0.8},
            {122, "CMD-2026-0122", 26, "Phare Mahdia", "Centre Mahdia", "2026-05-24", "Matériel de signalisation", 5.0, 1.2},
            {123, "CMD-2026-0123", 27, "Site Archéo El Jem", "Musée El Jem", "2026-05-30", "Brochures touristiques", 1.0, 0.2},
            {124, "CMD-2026-0124", 28, "Marché Chebba", "Port Chebba", "2026-05-25", "Produits de la pêche", 6.0, 1.5},
            {125, "CMD-2026-0125", 29, "Zone Franche, Ksour Essef", "Centre Ksour", "2026-05-23", "Produits importés", 7.0, 1.8},
            {126, "CMD-2026-0126", 30, "Showroom Textile, Mahdia", "Centre Textile", "2026-05-24", "Tapis et moquettes", 8.0, 2.2},
            {127, "CMD-2026-0127", 31, "Serre Sidi Alouane, Mahdia", "Centre Sidi Alouane", "2026-05-29", "Plants et semis", 5.0, 1.2},
            {128, "CMD-2026-0128", 32, "Entrepôt Import, Ouled Chamekh", "Centre Import", "2026-05-25", "Conteneur marchandises", 9.0, 2.5},
            {129, "CMD-2026-0129", 43, "Ferme Solaire, Mahdia", "Centre Énergie", "2026-05-25", "Batteries solaires", 15.0, 4.0},
            {130, "CMD-2026-0130", 6, "Résidence Bembla 3, Bembla, Monastir", "Centre Résidence", "2026-05-23", "Mobilier résidentiel", 2.5, 0.6},
            {131, "CMD-2026-0131", 7, "Boucherie Centrale, Moknine, Monastir", "Centre Boucherie", "2026-05-19", "Viandes réfrigérées", 4.0, 1.0},
            {132, "CMD-2026-0132", 8, "Lycée Jemmal, Jemmal, Monastir", "Lycée Centre", "2026-05-26", "Matériel pédagogique", 2.0, 0.5},
            {133, "CMD-2026-0133", 9, "Armement Téboulba, Téboulba, Monastir", "Port Téboulba", "2026-05-27", "Moteurs hors-bord", 20.0, 6.0},
            {134, "CMD-2026-0134", 10, "Distillerie Sahline, Sahline, Monastir", "Centre Distillerie", "2026-05-24", "Eau de fleur d oranger", 6.0, 1.5},
            {135, "CMD-2026-0135", 14, "Clinique Ouerdanine, Ouerdanine, Monastir", "Clinique Centre", "2026-05-19", "Équipement diagnostique", 1.5, 0.3},
            {136, "CMD-2026-0136", 15, "Yacht Club, Monastir", "Club Corniche", "2026-05-26", "Équipement plaisance", 8.0, 2.0},
            {137, "CMD-2026-0137", 37, "Piscine El Ghezaz, Mahdia", "Piscine Centre", "2026-05-26", "Produits chimiques piscine", 4.0, 1.0},
            {138, "CMD-2026-0138", 38, "Filet Salakta, Mahdia", "Port Filets", "2026-05-27", "Filets de pêche professionnels", 7.0, 2.0},
            {139, "CMD-2026-0139", 39, "Fondouk Mahdia", "Centre Fondouk", "2026-05-25", "Marchandises en transit", 2.0, 0.4},
            {140, "CMD-2026-0140", 40, "Centre Distribution, Monastir", "Dépôt Centre", "2026-05-26", "Produits grande consommation", 14.0, 3.5},
            {141, "CMD-2026-0141", 41, "Imagerie Médicale, Monastir", "Hôpital Imagerie", "2026-05-19", "Scanner portable", 3.5, 0.8},
            {142, "CMD-2026-0142", 44, "Atelier Couture, Ksar Hellal, Monastir", "Atelier Centre", "2026-05-27", "Machines à coudre", 3.0, 0.8},
            {143, "CMD-2026-0143", 45, "Recyclage Plastique, Moknine, Monastir", "Usine Recyclage", "2026-05-26", "Plastique recyclé", 30.0, 8.0},
            {144, "CMD-2026-0144", 46, "Showroom Auto, Jemmal, Monastir", "Showroom Centre", "2026-05-24", "Accessoires automobiles", 5.0, 1.2},
            {145, "CMD-2026-0145", 47, "Drague Téboulba, Téboulba, Monastir", "Port Drague", "2026-05-28", "Pièces drague maritime", 25.0, 7.0},
            {146, "CMD-2026-0146", 48, "Minoterie Zeramdine, Zeramdine, Monastir", "Minoterie Centre", "2026-05-25", "Farine et semoule", 35.0, 8.0},
            {147, "CMD-2026-0147", 49, "Laboratoire Bekalta, Bekalta, Monastir", "Laboratoire Centre", "2026-05-24", "Réactifs alimentaires", 2.0, 0.4},
            {148, "CMD-2026-0148", 50, "Cave Sahline, Sahline, Monastir", "Cave Centre", "2026-05-31", "Vins et spiritueux", 10.0, 2.5},
            {149, "CMD-2026-0149", 33, "Route Nationale 1, Monastir", "Route Centre", "2026-05-25", "Marchandises transit", 6.0, 1.5},
            {150, "CMD-2026-0150", 34, "Port Artisanal Lamta, Lamta, Monastir", "Port Centre", "2026-05-26", "Artisanat maritime", 4.5, 1.0}
        };

        for (int i = 0; i < Math.min(count, commandesData.length); i++) {
            Object[] data = commandesData[i];
            int clientId = ((Number) data[2]).intValue();
            
            // Trouver le client correspondant
            Client client = clients.stream()
                .filter(c -> c.getRaisonSociale().charAt(0) == 'S' && clients.indexOf(c) == clientId - 1)
                .findFirst()
                .orElse(randomElement(clients));

            Commande commande = new Commande();
            commande.setNumeroCommande((String) data[1]);
            commande.setClient(client);
            commande.setAdresseChargement((String) data[3]);
            commande.setAdresseLivraison((String) data[4]);
            commande.setDateSouhaitee(java.time.LocalDate.parse((String) data[5]));
            commande.setDateLivraisonPrevue(java.time.LocalDate.parse((String) data[5]));
            commande.setDescriptionMarchandise((String) data[6]);
            commande.setPoids(((Number) data[7]).doubleValue());
            commande.setVolume(((Number) data[8]).doubleValue());
            
            // Adresse de livraison (extraction)
            commande.setVilleLivraison(extractVille((String) data[4]));
            commande.setGouvernoratLivraison(extractGouvernorat((String) data[4]));
            commande.setQuartierLivraison(randomElement(QUARTIERS));
            commande.setCodePostalLivraison(randomElement(VILLES).equals("Monastir") ? "5000" : "4000");
            commande.setPaysLivraison("Tunisie");
            commande.setContactLivraison(generatePersonName());
            commande.setTelephoneContactLivraison(generatePhoneNumber());
            
            // Statut et priorité
            commande.setStatut(Commande.StatutCommande.EN_ATTENTE);
            commande.setPriorite(randomElement(PRIORITES));
            commande.setConfirmationClient(randomElement(CONFIRMATIONS));
            commande.setTokenConfirmation(java.util.UUID.randomUUID().toString());
            commande.setRemarques("Commande réelle");
            
            commandes.add(commande);
        }

        // Si count > 150, générer des commandes aléatoires supplémentaires
        if (count > commandesData.length) {
            int numeroCounter = 10151;
            for (int i = commandesData.length; i < count; i++) {
                Client client = randomElement(clients);
                LocalDate dateCommande = LocalDate.now().minusDays(random.nextInt(90));
                LocalDate dateLivraison = dateCommande.plusDays(random.nextInt(1, 14));

                Commande commande = new Commande();
                commande.setNumeroCommande(String.format("CMD-%06d", numeroCounter++));
                commande.setClient(client);
                commande.setDateCommande(dateCommande);
                commande.setDateLivraisonPrevue(dateLivraison);
                
                commande.setAdresseLivraison(generateAddress());
                commande.setVilleLivraison(randomElement(VILLES));
                commande.setGouvernoratLivraison(randomElement(GOUVERNORATS));
                commande.setQuartierLivraison(randomElement(QUARTIERS));
                commande.setCodePostalLivraison(String.format("%04d", random.nextInt(10000)));
                commande.setPaysLivraison("Tunisie");
                commande.setContactLivraison(generatePersonName());
                commande.setTelephoneContactLivraison(generatePhoneNumber());
                
                commande.setAdresseChargement(generateAddress());
                commande.setDateSouhaitee(dateLivraison);
                
                commande.setDescriptionMarchandise(randomElement(TYPES_MARCHANDISE));
                commande.setPoids(random.nextDouble() * 100 + 0.5);
                commande.setVolume(random.nextDouble() * 10 + 0.1);
                commande.setCoutEstime(random.nextDouble() * 500 + 50);
                
                commande.setStatut(randomElement(STATUTS));
                commande.setPriorite(randomElement(PRIORITES));
                commande.setConfirmationClient(randomElement(CONFIRMATIONS));
                
                commande.setTokenConfirmation(java.util.UUID.randomUUID().toString());
                commande.setRemarques("Commande de test générée automatiquement");
                
                commandes.add(commande);
            }
        }

        return commandes;
    }

    /**
     * Extrait la ville d'une adresse
     */
    private String extractVille(String adresse) {
        if (adresse == null) return "Tunis";
        for (String ville : VILLES) {
            if (adresse.contains(ville)) {
                return ville;
            }
        }
        return "Tunis";
    }

    /**
     * Extrait le gouvernorat d'une adresse
     */
    private String extractGouvernorat(String adresse) {
        if (adresse == null) return "Tunis";
        for (String gouv : GOUVERNORATS) {
            if (adresse.contains(gouv)) {
                return gouv;
            }
        }
        return "Tunis";
    }

    // ── GÉNÉRATEURS D'ÉLÉMENTS ALÉATOIRES ──

    private String generateCompanyName() {
        String[] prefixes = {"SARL", "EURL", "SA", "SNC"};
        String prefix = randomElement(prefixes);
        String sector = randomElement(SECTEURS);
        int suffix = random.nextInt(999);
        return String.format("%s %s %d", prefix, sector, suffix);
    }

    private String generatePersonName() {
        return randomElement(PRENOMS) + " " + randomElement(NOMS);
    }

    private String generateEmail() {
        String[] domains = {"gmail.com", "yahoo.com", "outlook.com", "company.tn", "business.tn"};
        String name = randomElement(PRENOMS).toLowerCase() + randomElement(NOMS).toLowerCase();
        return name + random.nextInt(9999) + "@" + randomElement(domains);
    }

    private String generatePhoneNumber() {
        // Format tunisien: +216 9X XXX XXX ou +216 5X XXX XXX
        String prefix = random.nextBoolean() ? "92" : "52";
        int part1 = random.nextInt(1000);
        int part2 = random.nextInt(1000);
        return String.format("+216%s%03d%03d", prefix, part1, part2);
    }

    private String generateAddress() {
        String[] rue_types = {"Rue", "Avenue", "Boulevard", "Place", "Chemin"};
        String rue_type = randomElement(rue_types);
        String rue_name = randomElement(NOMS) + (random.nextBoolean() ? "" : " " + randomElement(NOMS));
        int numero = random.nextInt(1, 500);
        return String.format("%d %s %s", numero, rue_type, rue_name);
    }

    private <T> T randomElement(T[] array) {
        return array[random.nextInt(array.length)];
    }

    private <T> T randomElement(List<T> list) {
        return list.get(random.nextInt(list.size()));
    }

    /**
     * Affiche un résumé des données générées
     */
    private void printSummary(List<Client> clients, List<Commande> commandes) {
        log.info("""
            
            ╔════════════════════════════════════════════════════════╗
            ║             📊 RÉSUMÉ DU SEEDING                        ║
            ╠════════════════════════════════════════════════════════╣
            ║ 👥 Clients générés:        {}
            ║ 📦 Commandes générées:     {}
            ║ 📈 Ratio commandes/client: {:.2f}
            ╠════════════════════════════════════════════════════════╣
            ║ Statuts des commandes:
            """, clients.size(), commandes.size(), (double) commandes.size() / clients.size());

        // Compter par statut
        for (Commande.StatutCommande statut : Commande.StatutCommande.values()) {
            long count = commandes.stream()
                .filter(c -> c.getStatut() == statut)
                .count();
            if (count > 0) {
                log.info("║   • {} : {}", statut, count);
            }
        }

        log.info("""
            ║
            ║ Priorités des commandes:
            """);

        // Compter par priorité
        for (Commande.PrioriteCommande priorite : Commande.PrioriteCommande.values()) {
            long count = commandes.stream()
                .filter(c -> c.getPriorite() == priorite)
                .count();
            if (count > 0) {
                log.info("║   • {} : {}", priorite, count);
            }
        }

        log.info("╚════════════════════════════════════════════════════════╝\n");
    }
}
