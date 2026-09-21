package com.grpo.tms.config;

import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.concurrent.ConcurrentMapCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Configuration du cache Spring.
 * Requis par JwtAuthenticationFilter qui injecte CacheManager.
 *
 * Cache "userDetails" : évite de recharger l'utilisateur depuis la DB
 * à chaque requête JWT — améliore les performances.
 */
@Configuration
@EnableCaching
public class CacheConfig {

    @Bean
    public CacheManager cacheManager() {
        // ConcurrentMapCacheManager = cache en mémoire simple
        // Noms des caches utilisés dans l'application
        return new ConcurrentMapCacheManager(
            "userDetails",    // Cache utilisateurs pour JWT filter
            "coordonnees",    // Cache coordonnées GPS (LocaliteGpsService)
            "tournees",       // Cache tournées
            "commandes"       // Cache commandes
        );
    }
}