package com.grpo.tms.service.optimisation;

import com.grpo.tms.entity.Commande;
import org.springframework.stereotype.Component;
import java.util.*;

/**
 * NearestNeighborOptimizer — VERSION CORRIGÉE
 * VilleCoordonnees supprimée → remplacée par Map statique intégrée
 * (mêmes coordonnées officielles que OptimisationService)
 */
@Component
public class NearestNeighborOptimizer {

    private final DistanceCalculator calc;

    // ✅ Dépôt = Monastir centre (PAS Tunis)
    private static final double[] DEPOT = {35.7643, 10.8113};

    private static final double CAPACITE_MAX_KG = 1000.0;
    private static final int    MAX_COMMANDES   = 8;

    // ── Coordonnées GPS officielles — 31 municipalités Monastir + Sousse ──
    private static final Map<String, double[]> COORDS = new LinkedHashMap<>();
    static {
        // MONASTIR
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
        // Quartiers Jemmal
        COORDS.put("cite hedi chaker",         new double[]{35.6255, 10.7605});
        COORDS.put("cite hedi chaker jemmal",  new double[]{35.6255, 10.7605});
        COORDS.put("hedi chaker",              new double[]{35.6255, 10.7605});
        COORDS.put("rue hedi chaker",          new double[]{35.6255, 10.7605});
        // SOUSSE
        COORDS.put("sousse",              new double[]{35.8245, 10.6346});
        COORDS.put("hammam sousse",       new double[]{35.8597, 10.5939});
        COORDS.put("akouda",              new double[]{35.8731, 10.5619});
        COORDS.put("kalaa kebira",        new double[]{35.8694, 10.5289});
        COORDS.put("kalaa seghira",       new double[]{35.8528, 10.5442});
        COORDS.put("msaken",              new double[]{35.7306, 10.5775});
        COORDS.put("kantaoui",            new double[]{35.8897, 10.5739});
        COORDS.put("port el kantaoui",    new double[]{35.8897, 10.5739});
        COORDS.put("sidi bou ali",        new double[]{35.9167, 10.4833});
        COORDS.put("sidi el hani",        new double[]{35.7833, 10.4667});
        COORDS.put("kondar",              new double[]{35.6667, 10.5667});
        COORDS.put("enfidha",             new double[]{36.1333, 10.3833});
        COORDS.put("bouficha",            new double[]{36.2167, 10.5167});
        COORDS.put("hergla",              new double[]{36.0447, 10.5303});
        // Autres gouvernorats
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
        COORDS.put("la marsa",            new double[]{36.8778, 10.3247});
        COORDS.put("gafsa",               new double[]{34.4250,  8.7842});
        COORDS.put("tozeur",              new double[]{33.9197,  8.1335});
        COORDS.put("medenine",            new double[]{33.3549, 10.5055});
        COORDS.put("kasserine",           new double[]{35.1671,  8.8309});
        COORDS.put("sidi bouzid",         new double[]{35.0383,  9.4858});
        COORDS.put("beja",                new double[]{36.7333,  9.1833});
        COORDS.put("jendouba",            new double[]{36.5011,  8.7803});
        COORDS.put("le kef",              new double[]{36.1674,  8.7047});
        COORDS.put("siliana",             new double[]{36.0847,  9.3708});
        COORDS.put("zaghouan",            new double[]{36.4028,  9.9797});
    }

    public NearestNeighborOptimizer(DistanceCalculator calc) {
        this.calc = calc;
    }

    // ── API publique ──────────────────────────────────────────────

    public List<List<Commande>> optimiser(List<Commande> commandes) {
        List<List<Commande>> toutes = new ArrayList<>();
        List<Commande> triees = new ArrayList<>(commandes);
        triees.sort(Comparator.comparingInt(this::getOrdrePriorite));

        Map<String, List<Commande>> groupes = new LinkedHashMap<>();
        for (String p : List.of("URGENT","HAUTE","NORMALE","BASSE"))
            groupes.put(p, new ArrayList<>());

        for (Commande c : triees) {
            String p = c.getPriorite() != null ? c.getPriorite().name() : "NORMALE";
            groupes.get(p).add(c);
        }

        for (List<Commande> g : groupes.values())
            if (!g.isEmpty()) toutes.addAll(optimiserGroupe(g));

        return toutes;
    }

    public double calculerDistanceTotale(List<Commande> commandes) {
        double total = 0;
        double lat = DEPOT[0], lon = DEPOT[1];
        for (Commande c : commandes) {
            double[] coords = getCoords(c);
            if (coords == null) continue;
            total += calc.calculer(lat, lon, coords[0], coords[1]);
            lat = coords[0]; lon = coords[1];
        }
        total += calc.calculer(lat, lon, DEPOT[0], DEPOT[1]);
        return Math.round(total * 10.0) / 10.0;
    }

    // ── Privé ─────────────────────────────────────────────────────

    private List<List<Commande>> optimiserGroupe(List<Commande> commandes) {
        List<List<Commande>> tournees = new ArrayList<>();
        List<Commande> restantes = new ArrayList<>(commandes);

        while (!restantes.isEmpty()) {
            List<Commande> tournee = new ArrayList<>();
            double poids = 0, lat = DEPOT[0], lon = DEPOT[1];

            while (!restantes.isEmpty()
                   && tournee.size() < MAX_COMMANDES
                   && poids < CAPACITE_MAX_KG) {

                Commande plusProche = null;
                double distMin = Double.MAX_VALUE;

                for (Commande c : restantes) {
                    double[] coords = getCoords(c);
                    if (coords == null) continue;
                    double d = calc.calculer(lat, lon, coords[0], coords[1]);
                    double p = c.getPoids() != null ? c.getPoids() : 50.0;
                    if (d < distMin && poids + p <= CAPACITE_MAX_KG) {
                        distMin = d; plusProche = c;
                    }
                }
                if (plusProche == null) break;

                double[] coords = getCoords(plusProche);
                lat = coords[0]; lon = coords[1];
                poids += plusProche.getPoids() != null ? plusProche.getPoids() : 50.0;
                tournee.add(plusProche);
                restantes.remove(plusProche);
            }
            if (!tournee.isEmpty()) tournees.add(tournee);
        }
        return tournees;
    }

    private int getOrdrePriorite(Commande c) {
        if (c.getPriorite() == null) return 3;
        return switch (c.getPriorite()) {
            case URGENT -> 1; case HAUTE -> 2;
            case NORMALE -> 3; case BASSE -> 4;
        };
    }

    /**
     * Résolution GPS multi-niveaux :
     * 1. Coords exactes sur la commande
     * 2. villeLivraison → exact → partiel → mot-clé
     * 3. quartierLivraison idem
     * 4. adresseLivraison idem
     */
    private double[] getCoords(Commande c) {
        if (c.getLatitude() != null && c.getLongitude() != null
                && c.getLatitude() != 0.0 && c.getLongitude() != 0.0)
            return new double[]{c.getLatitude(), c.getLongitude()};

        double[] r = resolve(c.getVilleLivraison());
        if (r != null) return r;
        r = resolve(c.getQuartierLivraison());
        if (r != null) return r;
        return resolve(c.getAdresseLivraison());
    }

    private static double[] resolve(String terme) {
        if (terme == null || terme.isBlank()) return null;
        String k = norm(terme);
        // 1. Exact
        if (COORDS.containsKey(k)) return COORDS.get(k);
        // 2. k contient une clé connue
        for (Map.Entry<String, double[]> e : COORDS.entrySet())
            if (k.contains(e.getKey())) return e.getValue();
        // 3. Une clé connue contient k (min 4 chars)
        if (k.length() >= 4)
            for (Map.Entry<String, double[]> e : COORDS.entrySet())
                if (e.getKey().contains(k)) return e.getValue();
        return null;
    }

    private static String norm(String s) {
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
}