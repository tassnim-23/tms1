package com.grpo.tms;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Point d'entrée principal de l'application TMS
 * GRPO Consulting — Version 2.0
 */
@SpringBootApplication
@EnableScheduling
@EnableCaching
@EnableAsync   // ✅ REQUIS pour que @Async fonctionne dans EmailService
public class TmsApplication {

    public static void main(String[] args) {
        SpringApplication.run(TmsApplication.class, args);
    }
}