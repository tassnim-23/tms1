package com.grpo.tms.service.optimisation;

import com.grpo.tms.entity.Commande;
import com.grpo.tms.repository.CommandeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class OptimisationService {

    private final CommandeRepository       commandeRepository;
    private final NearestNeighborOptimizer optimizer;
    private final TimeAndCostEstimator     estimator;

    // ✅ Coordonnées GPS officielles des 31 municipalités de Monastir + Sousse
    // Vérifiées sur OpenStreetMap — source données tunisiennes officielles
    private static final Map<String, double[]> COORDS = new LinkedHashMap<>();
    static {
        // ── MONASTIR — 31 municipalités officielles ──────────────────────
        COORDS.put("monastir",            new double[]{35.7643, 10.8113});
        COORDS.put("khniss",              new double[]{35.7351, 10.8230});
        COORDS.put("ouerdanin",           new double[]{35.7069, 10.6945});
        COORDS.put("ouardanine",          new double[]{35.7069, 10.6945});
        COORDS.put("wardanine",           new double[]{35.7069, 10.6945});
        COORDS.put("sahline",             new double[]{35.7497, 10.7420});
        COORDS.put("sahline mootmar",     new double[]{35.7622, 10.7134});
        COORDS.put("sidi ameur",          new double[]{35.7541, 10.8714});
        COORDS.put("zeramdine",           new double[]{35.5924, 10.7269});
        COORDS.put("zaramdine",           new double[]{35.5924, 10.7269});
        COORDS.put("beni hassen",         new double[]{35.5679, 10.7992});
        COORDS.put("ghenada",             new double[]{35.6279, 10.9004});
        COORDS.put("jemmal",              new double[]{35.6251, 10.7599});
        COORDS.put("jammel",              new double[]{35.6251, 10.7599});
        COORDS.put("djemmal",             new double[]{35.6251, 10.7599});
        COORDS.put("menzel kamel",        new double[]{35.6271, 10.6589});
        COORDS.put("zaouiet kontoch",     new double[]{35.6021, 10.8304});
        COORDS.put("bembla",              new double[]{35.6869, 10.8753});
        COORDS.put("bembla-mnara",        new double[]{35.6869, 10.8753});
        COORDS.put("bembla mnara",        new double[]{35.6869, 10.8753});
        COORDS.put("mnara",               new double[]{35.6869, 10.8753});
        COORDS.put("menzel ennour",       new double[]{35.6119, 10.9008});
        COORDS.put("el masdour",          new double[]{35.5151, 11.0362});
        COORDS.put("moknine",             new double[]{35.6307, 10.9043});
        COORDS.put("sidi bennour",        new double[]{35.5304, 10.9630});
        COORDS.put("menzel farsi",        new double[]{35.5552, 10.8695});
        COORDS.put("amiret el fhoul",     new double[]{35.5313, 10.8570});
        COORDS.put("amiret touazra",      new double[]{35.5387, 10.8081});
        COORDS.put("amiret el hojjaj",    new double[]{35.5227, 10.8781});
        COORDS.put("cherahil",            new double[]{35.5916, 10.8557});
        COORDS.put("bekalta",             new double[]{35.6173, 10.9961});
        COORDS.put("teboulba",            new double[]{35.6320, 11.0903});
        COORDS.put("ksar hellal",         new double[]{35.6495, 10.8920});
        COORDS.put("ksar-hellal",         new double[]{35.6495, 10.8920});
        COORDS.put("ksibet el mediouni",  new double[]{35.6633, 10.8487});
        COORDS.put("ksibet mediouni",     new double[]{35.6633, 10.8487});
        COORDS.put("ksibet",              new double[]{35.6633, 10.8487});
        COORDS.put("benen bodher",        new double[]{35.6697, 10.9383});
        COORDS.put("touza",               new double[]{35.5882, 10.8729});
        COORDS.put("sayada",              new double[]{35.6702, 10.9043});
        COORDS.put("lemta",               new double[]{35.6751, 10.8817});
        COORDS.put("lamta",               new double[]{35.6751, 10.8817});
        COORDS.put("bouhjar",             new double[]{35.6024, 10.9858});
        COORDS.put("menzel hayet",        new double[]{35.7313, 10.7484});
        COORDS.put("skanes",              new double[]{35.7586, 10.7620});

        // Quartiers Monastir ville
        COORDS.put("monastir medina",     new double[]{35.7660, 10.8290});
        COORDS.put("cite omrane",         new double[]{35.7730, 10.7980});
        COORDS.put("cite riadh",          new double[]{35.7580, 10.8230});
        COORDS.put("cite el wafa",        new double[]{35.7695, 10.8170});
        COORDS.put("cite ennour",         new double[]{35.7540, 10.8310});
        COORDS.put("cite fattouma bourguiba", new double[]{35.7710, 10.8060});
        COORDS.put("corniche monastir",   new double[]{35.7510, 10.8380});
        COORDS.put("zone industrielle monastir", new double[]{35.7560, 10.7900});

        // Quartiers Jemmal
        COORDS.put("cite hedi chaker",          new double[]{35.6255, 10.7605});
        COORDS.put("cite hedi chaker jemmal",   new double[]{35.6255, 10.7605});
        COORDS.put("hedi chaker",               new double[]{35.6255, 10.7605});
        COORDS.put("rue hedi chaker",           new double[]{35.6255, 10.7605});
        COORDS.put("cite el bassatine jemmal",  new double[]{35.6220, 10.7570});
        COORDS.put("cite ennasr jemmal",        new double[]{35.6270, 10.7630});

        // ── SOUSSE ────────────────────────────────────────────────────────
        COORDS.put("sousse",              new double[]{35.8245, 10.6346});
        COORDS.put("hammam sousse",       new double[]{35.8597, 10.5939});
        COORDS.put("hammam-sousse",       new double[]{35.8597, 10.5939});
        COORDS.put("kantaoui",            new double[]{35.8897, 10.5739});
        COORDS.put("port el kantaoui",    new double[]{35.8897, 10.5739});
        COORDS.put("akouda",              new double[]{35.8731, 10.5619});
        COORDS.put("kalaa kebira",        new double[]{35.8694, 10.5289});
        COORDS.put("kalaa seghira",       new double[]{35.8528, 10.5442});
        COORDS.put("msaken",              new double[]{35.7306, 10.5775});
        COORDS.put("m saken",             new double[]{35.7306, 10.5775});
        COORDS.put("sidi bou ali",        new double[]{35.9167, 10.4833});
        COORDS.put("sidi el hani",        new double[]{35.7833, 10.4667});
        COORDS.put("kondar",              new double[]{35.6667, 10.5667});
        COORDS.put("enfidha",             new double[]{36.1333, 10.3833});
        COORDS.put("bouficha",            new double[]{36.2167, 10.5167});
        COORDS.put("hergla",              new double[]{36.0447, 10.5303});

        // ── AUTRES GOUVERNORATS ───────────────────────────────────────────
        COORDS.put("tunis",               new double[]{36.8065, 10.1815});
        COORDS.put("sfax",                new double[]{34.7406, 10.7603});
        COORDS.put("kairouan",            new double[]{35.6781, 10.0963});
        COORDS.put("mahdia",              new double[]{35.5047, 11.0622});
        COORDS.put("nabeul",              new double[]{36.4561, 10.7376});
        COORDS.put("hammamet",            new double[]{36.4000, 10.6167});
        COORDS.put("bizerte",             new double[]{37.2744,  9.8739});
        COORDS.put("gabes",               new double[]{33.8881, 10.0975});
        COORDS.put("ariana",              new double[]{36.8625, 10.1956});
        COORDS.put("ben arous",           new double[]{36.7531, 10.2184});
        COORDS.put("la manouba",          new double[]{36.8094, 10.0967});
        COORDS.put("la marsa",            new double[]{36.8778, 10.3247});
        COORDS.put("hammam lif",          new double[]{36.7167, 10.3333});
        COORDS.put("rades",               new double[]{36.7700, 10.2800});
        COORDS.put("gafsa",               new double[]{34.4250,  8.7842});
        COORDS.put("tozeur",              new double[]{33.9197,  8.1335});
        COORDS.put("kebili",              new double[]{33.7042,  8.9689});
        COORDS.put("tataouine",           new double[]{32.9211, 10.4508});
        COORDS.put("medenine",            new double[]{33.3549, 10.5055});
        COORDS.put("kasserine",           new double[]{35.1671,  8.8309});
        COORDS.put("sidi bouzid",         new double[]{35.0383,  9.4858});
        COORDS.put("siliana",             new double[]{36.0847,  9.3708});
        COORDS.put("le kef",              new double[]{36.1674,  8.7047});
        COORDS.put("beja",                new double[]{36.7333,  9.1833});
        COORDS.put("jendouba",            new double[]{36.5011,  8.7803});
        COORDS.put("zaghouan",            new double[]{36.4028,  9.9797});
        COORDS.put("djerba",              new double[]{33.8667, 10.9000});
    }

    /**
     * Résolution GPS multi-niveaux :
     * 1. Correspondance exacte
     * 2. La clé contient un nom connu
     * 3. Un nom connu contient la clé (>= 4 chars)
     */
    private static double[] resoudreCoords(String... termes) {
        for (String terme : termes) {
            if (terme == null || terme.isBlank()) continue;
            String k = normaliser(terme);
            // Exact
            if (COORDS.containsKey(k)) return COORDS.get(k);
            // La clé contient un nom connu
            for (Map.Entry<String, double[]> e : COORDS.entrySet())
                if (k.contains(e.getKey())) return e.getValue();
            // Un nom connu contient la clé
            if (k.length() >= 4)
                for (Map.Entry<String, double[]> e : COORDS.entrySet())
                    if (e.getKey().contains(k)) return e.getValue();
        }
        return null;
    }

    private static String normaliser(String s) {
        return s.toLowerCase()
                .replace("\u00e0","a").replace("\u00e2","a").replace("\u00e4","a")
                .replace("\u00e9","e").replace("\u00e8","e").replace("\u00ea","e").replace("\u00eb","e")
                .replace("\u00ee","i").replace("\u00ef","i")
                .replace("\u00f4","o").replace("\u00f6","o")
                .replace("\u00f9","u").replace("\u00fb","u").replace("\u00fc","u")
                .replace("\u00e7","c")
                .replace("-"," ").replace("'"," ")
                .replaceAll("\\s+"," ").trim();
    }

    public List<Map<String, Object>> optimiser() {
        List<Commande> commandes = commandeRepository
                .findByStatut(Commande.StatutCommande.EN_ATTENTE);

        log.info("Optimisation: {} commandes EN_ATTENTE", commandes.size());
        if (commandes.isEmpty()) return new ArrayList<>();

        List<List<Commande>> groupes = optimizer.optimiser(commandes);
        List<Map<String, Object>> resultats = new ArrayList<>();
        int numero = 1;

        for (List<Commande> groupe : groupes) {
            double distance = optimizer.calculerDistanceTotale(groupe);
            int    temps    = estimator.estimerTempsMinutes(distance, groupe.size());
            double cout     = estimator.estimerCoutDT(distance, temps);

            String priorite = groupe.isEmpty() ? "NORMALE" :
                (groupe.get(0).getPriorite() != null
                    ? groupe.get(0).getPriorite().name() : "NORMALE");

            Map<String, Object> tournee = new HashMap<>();
            tournee.put("numero",             "OPT-" + String.format("%03d", numero++));
            tournee.put("nbCommandes",        groupe.size());
            tournee.put("distanceKm",         distance);
            tournee.put("tempsEstimeMinutes", temps);
            tournee.put("coutEstimeDT",       cout);
            tournee.put("priorite",           priorite);

            tournee.put("commandes", groupe.stream().map(c -> {
                Map<String, Object> cmd = new LinkedHashMap<>();
                cmd.put("id",              c.getId());
                cmd.put("numeroCommande",  c.getNumeroCommande());
                cmd.put("villeLivraison",  c.getVilleLivraison());
                cmd.put("quartierLivraison", c.getQuartierLivraison());
                cmd.put("adresseLivraison",c.getAdresseLivraison());
                cmd.put("poids",           c.getPoids());
                cmd.put("priorite",        c.getPriorite() != null ? c.getPriorite().name() : "NORMALE");
                cmd.put("client",          c.getClient() != null ? c.getClient().getRaisonSociale() : "-");

                // ── Résolution GPS ────────────────────────────────────────
                // Priorité 1 : coords exactes sur la commande (saisie manuelle)
                Double lat = c.getLatitude();
                Double lon = c.getLongitude();

                // Priorité 2 : résolution par ville/quartier/adresse depuis la MAP
                if (lat == null || lon == null || lat == 0.0 || lon == 0.0) {
                    double[] found = resoudreCoords(
                        c.getVilleLivraison(),
                        c.getQuartierLivraison(),
                        c.getAdresseLivraison()
                    );
                    if (found != null) {
                        // Jitter 200m max pour éviter superposition
                        lat = found[0] + (Math.random() - 0.5) * 0.004;
                        lon = found[1] + (Math.random() - 0.5) * 0.004;
                    }
                }

                cmd.put("latitude",  lat);
                cmd.put("longitude", lon);
                return cmd;
            }).collect(Collectors.toList()));

            resultats.add(tournee);
        }

        return resultats;
    }
}