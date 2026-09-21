package com.grpo.tms.service.optimisation;

import com.grpo.tms.entity.LocaliteGps;
import com.grpo.tms.repository.LocaliteGpsRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

/**
 * Service de resolution GPS base sur la table localite_gps.
 *
 * REMPLACE VilleCoordonnees.java (HashMap statique en memoire).
 * Les coordonnees viennent desormais de la base de donnees,
 * editables sans recompilation.
 *
 * Strategie de recherche (dans l'ordre) :
 *   1. Correspondance exacte insensible a la casse
 *   2. Recherche partielle (LIKE)
 *   3. Normalisation avancee (suppression accents, tirets, apostrophes)
 *   4. Fallback -> null (la commande sera ignoree de l'optimisation)
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class LocaliteGpsService {

    private final LocaliteGpsRepository localiteRepo;

    // Depot par defaut si aucune localite trouvee : Monastir centre
    private static final double[] DEPOT_DEFAUT = {35.7775, 10.8331};

    // ─────────────────────────────────────────────────────────────
    // METHODE PRINCIPALE
    // ─────────────────────────────────────────────────────────────

    /**
     * Resout les coordonnees GPS d'une ville ou d'un quartier.
     * Appel mis en cache (Spring Cache) pour eviter les requetes repetees.
     *
     * @param nomVille Nom de la ville tel que saisi dans la commande
     * @return [latitude, longitude] ou null si introuvable
     */
    @Cacheable(value = "coordonnees", key = "#nomVille?.toLowerCase()")
    public double[] getCoordonnees(String nomVille) {
        if (nomVille == null || nomVille.isBlank()) return null;

        // 1. Recherche exacte
        Optional<LocaliteGps> exact = localiteRepo
                .findByNomIgnoreCaseAndActifTrue(nomVille.trim());
        if (exact.isPresent()) {
            return toArray(exact.get());
        }

        // 2. Recherche avec normalisation (suppression accents)
        String normalise = normaliser(nomVille);
        Optional<LocaliteGps> parNom = localiteRepo
                .findByNomIgnoreCaseAndActifTrue(normalise);
        if (parNom.isPresent()) {
            return toArray(parNom.get());
        }

        // 3. Recherche partielle (LIKE %terme%)
        List<LocaliteGps> partiel = localiteRepo
                .rechercherParNomPartiel(normalise);
        if (!partiel.isEmpty()) {
            // Prendre la correspondance la plus courte (la plus precise)
            LocaliteGps meilleur = partiel.stream()
                    .min((a, b) -> Integer.compare(a.getNom().length(), b.getNom().length()))
                    .get();
            log.debug("GPS partiel: '{}' -> '{}' ({}, {})",
                    nomVille, meilleur.getNom(),
                    meilleur.getLatitude(), meilleur.getLongitude());
            return toArray(meilleur);
        }

        // 4. Recherche par mots-cles (splitter le nom et chercher chaque mot)
        String[] mots = normalise.split("\\s+");
        for (String mot : mots) {
            if (mot.length() < 4) continue; // ignorer les mots trop courts
            List<LocaliteGps> parMot = localiteRepo.rechercherParNomPartiel(mot);
            if (!parMot.isEmpty()) {
                LocaliteGps meilleur = parMot.get(0);
                log.debug("GPS par mot-cle '{}': '{}' -> '{}' ({}, {})",
                        mot, nomVille, meilleur.getNom(),
                        meilleur.getLatitude(), meilleur.getLongitude());
                return toArray(meilleur);
            }
        }

        log.warn("GPS introuvable pour la ville: '{}'", nomVille);
        return null;
    }

    /**
     * Retourne le depot principal (Monastir centre par defaut).
     * Cherche "Monastir" en base, sinon utilise les coords fixes.
     */
    public double[] getDepot() {
        return localiteRepo.findByNomIgnoreCaseAndActifTrue("Monastir")
                .map(this::toArray)
                .orElse(DEPOT_DEFAUT);
    }

    /**
     * Liste toutes les localites d'un gouvernorat.
     * Utilisee pour l'autocomplete frontend.
     */
    public List<LocaliteGps> getParGouvernorat(String gouvernorat) {
        return localiteRepo.findByGouvernoratIgnoreCaseAndActifTrue(gouvernorat);
    }

    /**
     * Autocomplete pour le champ adresse du frontend.
     */
    public List<LocaliteGps> autocomplete(String debut) {
        if (debut == null || debut.length() < 2) return List.of();
        return localiteRepo.autocomplete(normaliser(debut));
    }

    // ─────────────────────────────────────────────────────────────
    // UTILITAIRES
    // ─────────────────────────────────────────────────────────────

    private double[] toArray(LocaliteGps l) {
        return new double[]{l.getLatitude(), l.getLongitude()};
    }

    private String normaliser(String s) {
        return s.toLowerCase()
                .replace("\u00e0", "a").replace("\u00e2", "a").replace("\u00e4", "a")
                .replace("\u00e9", "e").replace("\u00e8", "e")
                .replace("\u00ea", "e").replace("\u00eb", "e")
                .replace("\u00ee", "i").replace("\u00ef", "i")
                .replace("\u00f4", "o").replace("\u00f6", "o")
                .replace("\u00f9", "u").replace("\u00fb", "u").replace("\u00fc", "u")
                .replace("\u00e7", "c")
                .replace("-", " ")
                .replace("'", " ")
                .replaceAll("\\s+", " ")
                .trim();
    }
}