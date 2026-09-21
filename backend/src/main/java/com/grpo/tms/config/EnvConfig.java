package com.grpo.tms.config;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.context.annotation.Configuration;

/**
 * Configuration pour charger les variables d'environnement depuis .env
 * Cette classe est exécutée au démarrage de l'application
 */
@Configuration
public class EnvConfig {

    static {
        // Charger les variables d'environnement depuis .env
        try {
            String activeProfile = System.getProperty("spring.profiles.active", 
                                System.getenv("ACTIVE_PROFILE"));
            
            // Charger .env selon le profil
            String envFile = ".env" + (activeProfile != null && !activeProfile.isEmpty() 
                                       ? "." + activeProfile 
                                       : ".local");
            
            Dotenv dotenv = Dotenv.configure()
                    .ignoreIfMissing()
                    .load();
            
            // Définir les variables d'environnement en propriétés système
            dotenv.entries().forEach(entry -> 
                System.setProperty(entry.getKey(), entry.getValue())
            );
            
        } catch (Exception e) {
            System.err.println("Attention: Impossible de charger le fichier .env: " + e.getMessage());
            // Continuer sans charger .env (variables d'env système seront utilisées)
        }
    }
}
