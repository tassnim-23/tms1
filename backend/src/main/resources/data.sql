-- =============================================
-- TMS - Transport Management System
-- GRPO Consulting - Données de test
-- =============================================

-- Désactiver les contraintes temporairement pour l'insertion
SET session_replication_role = replica;

-- =============================================
-- USERS (mot de passe: admin123 en BCrypt force 12)
-- =============================================
INSERT INTO users (username, email, password, created_at, updated_at)
SELECT 'admin', 'admin@grpo-consulting.com',
       '$2b$12$sOEvZZVug2plFS8lXOOav./1kVFMsrEmunRs0L644VifIVj8QwrrG',
       NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'admin');

INSERT INTO user_roles (user_id, role)
SELECT id, 'ADMIN' FROM users WHERE username = 'admin'
  AND NOT EXISTS (SELECT 1 FROM user_roles ur JOIN users u ON ur.user_id = u.id
                  WHERE u.username = 'admin' AND ur.role = 'ADMIN');

INSERT INTO user_roles (user_id, role)
SELECT id, 'USER' FROM users WHERE username = 'admin'
  AND NOT EXISTS (SELECT 1 FROM user_roles ur JOIN users u ON ur.user_id = u.id
                  WHERE u.username = 'admin' AND ur.role = 'USER');

-- User supplémentaire
INSERT INTO users (username, email, password, created_at, updated_at)
SELECT 'dispatcher', 'dispatcher@grpo-consulting.com',
       '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewfCOFewWxzNOp8S',
       NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'dispatcher');

INSERT INTO user_roles (user_id, role)
SELECT id, 'USER' FROM users WHERE username = 'dispatcher'
  AND NOT EXISTS (SELECT 1 FROM user_roles ur JOIN users u ON ur.user_id = u.id
                  WHERE u.username = 'dispatcher' AND ur.role = 'USER');

-- =============================================
-- CLIENTS
-- =============================================
INSERT INTO clients (raison_sociale, email, telephone, adresse, ville, code_postal, pays, created_at, updated_at)
SELECT 'Transport Express Tunis', 'contact@transport-express.tn', '+21671234567',
       '15 Avenue Habib Bourguiba', 'Tunis', '1000', 'Tunisie', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE email = 'contact@transport-express.tn');

INSERT INTO clients (raison_sociale, email, telephone, adresse, ville, code_postal, pays, created_at, updated_at)
SELECT 'Logistique Sousse SARL', 'info@logistique-sousse.tn', '+21673456789',
       '8 Rue du Commerce', 'Sousse', '4000', 'Tunisie', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE email = 'info@logistique-sousse.tn');

INSERT INTO clients (raison_sociale, email, telephone, adresse, ville, code_postal, pays, created_at, updated_at)
SELECT 'Distribution Sfax SA', 'distribution@sfax-distrib.tn', '+21674567890',
       '22 Rue Farhat Hached', 'Sfax', '3000', 'Tunisie', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE email = 'distribution@sfax-distrib.tn');

INSERT INTO clients (raison_sociale, email, telephone, adresse, ville, code_postal, pays, created_at, updated_at)
SELECT 'Import Export Bizerte', 'contact@ie-bizerte.tn', '+21672345678',
       '5 Route du Port', 'Bizerte', '7000', 'Tunisie', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE email = 'contact@ie-bizerte.tn');

INSERT INTO clients (raison_sociale, email, telephone, adresse, ville, code_postal, pays, created_at, updated_at)
SELECT 'Commerce Nabeul SARL', 'nabeul@commerce-plus.tn', '+21672987654',
       '33 Avenue de la Plage', 'Nabeul', '8000', 'Tunisie', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE email = 'nabeul@commerce-plus.tn');

-- =============================================
-- CHAUFFEURS
-- =============================================
INSERT INTO chauffeurs (nom, prenom, email, telephone, numero_permis, date_validite_permis, disponible, created_at, updated_at)
SELECT 'Ben Ali', 'Mohamed', 'm.benali@grpo-driver.tn', '+21698765432',
       'TN-2024-001234', '2027-12-31', true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM chauffeurs WHERE email = 'm.benali@grpo-driver.tn');

INSERT INTO chauffeurs (nom, prenom, email, telephone, numero_permis, date_validite_permis, disponible, created_at, updated_at)
SELECT 'Trabelsi', 'Sami', 's.trabelsi@grpo-driver.tn', '+21697654321',
       'TN-2024-005678', '2026-06-30', true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM chauffeurs WHERE email = 's.trabelsi@grpo-driver.tn');

INSERT INTO chauffeurs (nom, prenom, email, telephone, numero_permis, date_validite_permis, disponible, created_at, updated_at)
SELECT 'Mansouri', 'Khaled', 'k.mansouri@grpo-driver.tn', '+21695432109',
       'TN-2023-009012', '2025-09-15', false, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM chauffeurs WHERE email = 'k.mansouri@grpo-driver.tn');

-- =============================================
-- VEHICULES
-- =============================================
INSERT INTO vehicules (immatriculation, marque, modele, capacite_charge, statut, kilometrage, date_mise_en_service, created_at, updated_at)
SELECT '123TU4567', 'Mercedes-Benz', 'Actros 2545', 24000.0, 'DISPONIBLE', 45000, '2021-03-15', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM vehicules WHERE immatriculation = '123TU4567');

INSERT INTO vehicules (immatriculation, marque, modele, capacite_charge, statut, kilometrage, date_mise_en_service, created_at, updated_at)
SELECT '456TU7890', 'Volvo', 'FH 460', 22000.0, 'DISPONIBLE', 78500, '2020-07-20', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM vehicules WHERE immatriculation = '456TU7890');

INSERT INTO vehicules (immatriculation, marque, modele, capacite_charge, statut, kilometrage, date_mise_en_service, created_at, updated_at)
SELECT '789TU1234', 'Renault', 'Master L3H2', 1500.0, 'EN_SERVICE', 32000, '2022-01-10', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM vehicules WHERE immatriculation = '789TU1234');

INSERT INTO vehicules (immatriculation, marque, modele, capacite_charge, statut, kilometrage, date_mise_en_service, created_at, updated_at)
SELECT '321TU6540', 'Scania', 'R 500', 26000.0, 'EN_MAINTENANCE', 120000, '2019-05-01', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM vehicules WHERE immatriculation = '321TU6540');

-- =============================================
-- COMMANDES
-- =============================================
INSERT INTO commandes (numero_commande, adresse_chargement, adresse_livraison, date_souhaitee,
                       description_marchandise, poids, volume, distance, cout_estime, statut,
                       client_id, created_at, updated_at)
SELECT 'CMD-20240115-1001',
       '15 Avenue Habib Bourguiba, Tunis',
       '8 Rue du Commerce, Sousse',
       CURRENT_DATE + 2,
       'Matériel informatique - Fragile',
       250.0, 2.5, 142.0, 850.0, 'EN_ATTENTE',
       (SELECT id FROM clients WHERE email = 'contact@transport-express.tn'),
       NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM commandes WHERE numero_commande = 'CMD-20240115-1001');

INSERT INTO commandes (numero_commande, adresse_chargement, adresse_livraison, date_souhaitee,
                       description_marchandise, poids, volume, distance, cout_estime, statut,
                       client_id, created_at, updated_at)
SELECT 'CMD-20240115-1002',
       '22 Rue Farhat Hached, Sfax',
       '33 Avenue de la Plage, Nabeul',
       CURRENT_DATE + 3,
       'Produits alimentaires - Température contrôlée',
       1800.0, 12.0, 320.0, 1500.0, 'EN_ATTENTE',
       (SELECT id FROM clients WHERE email = 'distribution@sfax-distrib.tn'),
       NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM commandes WHERE numero_commande = 'CMD-20240115-1002');

INSERT INTO commandes (numero_commande, adresse_chargement, adresse_livraison, date_souhaitee,
                       description_marchandise, poids, volume, distance, cout_estime, statut,
                       client_id, created_at, updated_at)
SELECT 'CMD-20240114-1003',
       '5 Route du Port, Bizerte',
       '15 Avenue Habib Bourguiba, Tunis',
       CURRENT_DATE + 1,
       'Pièces détachées automobiles',
       550.0, 4.0, 65.0, 420.0, 'ASSIGNEE',
       (SELECT id FROM clients WHERE email = 'contact@ie-bizerte.tn'),
       NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM commandes WHERE numero_commande = 'CMD-20240114-1003');

INSERT INTO commandes (numero_commande, adresse_chargement, adresse_livraison, date_souhaitee,
                       description_marchandise, poids, volume, distance, cout_estime, statut,
                       client_id, created_at, updated_at)
SELECT 'CMD-20240114-1004',
       '8 Rue du Commerce, Sousse',
       '22 Rue Farhat Hached, Sfax',
       CURRENT_DATE,
       'Textiles - Vêtements',
       320.0, 8.0, 128.0, 680.0, 'EN_COURS',
       (SELECT id FROM clients WHERE email = 'info@logistique-sousse.tn'),
       NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM commandes WHERE numero_commande = 'CMD-20240114-1004');

INSERT INTO commandes (numero_commande, adresse_chargement, adresse_livraison, date_souhaitee,
                       description_marchandise, poids, volume, distance, cout_estime, statut,
                       client_id, created_at, updated_at)
SELECT 'CMD-20240110-1005',
       '15 Avenue Habib Bourguiba, Tunis',
       '33 Avenue de la Plage, Nabeul',
       CURRENT_DATE - 3,
       'Appareils électroménagers',
       2100.0, 15.0, 98.0, 780.0, 'LIVREE',
       (SELECT id FROM clients WHERE email = 'contact@transport-express.tn'),
       NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM commandes WHERE numero_commande = 'CMD-20240110-1005');

INSERT INTO commandes (numero_commande, adresse_chargement, adresse_livraison, date_souhaitee,
                       description_marchandise, poids, volume, distance, cout_estime, statut,
                       client_id, created_at, updated_at)
SELECT 'CMD-20240112-1006',
       '33 Avenue de la Plage, Nabeul',
       '5 Route du Port, Bizerte',
       CURRENT_DATE + 5,
       'Produits chimiques - Classe 3',
       900.0, 6.0, 180.0, 950.0, 'EN_ATTENTE',
       (SELECT id FROM clients WHERE email = 'nabeul@commerce-plus.tn'),
       NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM commandes WHERE numero_commande = 'CMD-20240112-1006');

INSERT INTO commandes (numero_commande, adresse_chargement, adresse_livraison, date_souhaitee,
                       description_marchandise, poids, volume, distance, cout_estime, statut,
                       client_id, created_at, updated_at)
SELECT 'CMD-20240113-1007',
       '5 Route du Port, Bizerte',
       '8 Rue du Commerce, Sousse',
       CURRENT_DATE + 4,
       'Matériaux de construction - Carrelage',
       5000.0, 20.0, 210.0, 1800.0, 'EN_ATTENTE',
       (SELECT id FROM clients WHERE email = 'contact@ie-bizerte.tn'),
       NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM commandes WHERE numero_commande = 'CMD-20240113-1007');

INSERT INTO commandes (numero_commande, adresse_chargement, adresse_livraison, date_souhaitee,
                       description_marchandise, poids, volume, distance, cout_estime, statut,
                       client_id, created_at, updated_at)
SELECT 'CMD-20240108-1008',
       '22 Rue Farhat Hached, Sfax',
       '15 Avenue Habib Bourguiba, Tunis',
       CURRENT_DATE - 5,
       'Huile d''olive - Export',
       3200.0, 18.0, 270.0, 1650.0, 'LIVREE',
       (SELECT id FROM clients WHERE email = 'distribution@sfax-distrib.tn'),
       NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM commandes WHERE numero_commande = 'CMD-20240108-1008');

INSERT INTO commandes (numero_commande, adresse_chargement, adresse_livraison, date_souhaitee,
                       description_marchandise, poids, volume, distance, cout_estime, statut,
                       client_id, created_at, updated_at)
SELECT 'CMD-20240109-1009',
       '15 Avenue Habib Bourguiba, Tunis',
       '5 Route du Port, Bizerte',
       CURRENT_DATE - 2,
       'Équipements sportifs',
       450.0, 10.0, 65.0, 380.0, 'ANNULEE',
       (SELECT id FROM clients WHERE email = 'contact@transport-express.tn'),
       NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM commandes WHERE numero_commande = 'CMD-20240109-1009');

INSERT INTO commandes (numero_commande, adresse_chargement, adresse_livraison, date_souhaitee,
                       description_marchandise, poids, volume, distance, cout_estime, statut,
                       client_id, created_at, updated_at)
SELECT 'CMD-20240116-1010',
       '8 Rue du Commerce, Sousse',
       '33 Avenue de la Plage, Nabeul',
       CURRENT_DATE + 7,
       'Mobilier de bureau',
       780.0, 14.0, 72.0, 520.0, 'EN_ATTENTE',
       (SELECT id FROM clients WHERE email = 'info@logistique-sousse.tn'),
       NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM commandes WHERE numero_commande = 'CMD-20240116-1010');

-- =============================================
-- TOURNEES
-- =============================================
INSERT INTO tournees (date_tournee, heure_debut, heure_fin, distance_totale, statut,
                      chauffeur_id, vehicule_id, created_at, updated_at)
SELECT CURRENT_DATE + 1, '07:00', '14:00', 207.0, 'PLANIFIEE',
       (SELECT id FROM chauffeurs WHERE email = 'm.benali@grpo-driver.tn'),
       (SELECT id FROM vehicules WHERE immatriculation = '123TU4567'),
       NOW(), NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM tournees
    WHERE date_tournee = CURRENT_DATE + 1
      AND chauffeur_id = (SELECT id FROM chauffeurs WHERE email = 'm.benali@grpo-driver.tn')
);

INSERT INTO tournees (date_tournee, heure_debut, heure_fin, distance_totale, statut,
                      chauffeur_id, vehicule_id, created_at, updated_at)
SELECT CURRENT_DATE, '06:30', '15:30', 128.0, 'EN_COURS',
       (SELECT id FROM chauffeurs WHERE email = 's.trabelsi@grpo-driver.tn'),
       (SELECT id FROM vehicules WHERE immatriculation = '789TU1234'),
       NOW(), NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM tournees
    WHERE date_tournee = CURRENT_DATE
      AND chauffeur_id = (SELECT id FROM chauffeurs WHERE email = 's.trabelsi@grpo-driver.tn')
);

INSERT INTO tournees (date_tournee, heure_debut, heure_fin, distance_totale, statut,
                      chauffeur_id, vehicule_id, created_at, updated_at)
SELECT CURRENT_DATE - 3, '07:00', '16:00', 270.0, 'TERMINEE',
       (SELECT id FROM chauffeurs WHERE email = 'm.benali@grpo-driver.tn'),
       (SELECT id FROM vehicules WHERE immatriculation = '456TU7890'),
       NOW(), NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM tournees
    WHERE date_tournee = CURRENT_DATE - 3
      AND chauffeur_id = (SELECT id FROM chauffeurs WHERE email = 'm.benali@grpo-driver.tn')
);

-- Lier les commandes aux tournées (tournée EN_COURS)
INSERT INTO tournee_commandes (tournee_id, commande_id)
SELECT
    (SELECT t.id FROM tournees t
     JOIN chauffeurs c ON t.chauffeur_id = c.id
     WHERE c.email = 's.trabelsi@grpo-driver.tn'
       AND t.date_tournee = CURRENT_DATE
     LIMIT 1),
    (SELECT id FROM commandes WHERE numero_commande = 'CMD-20240114-1004')
WHERE NOT EXISTS (
    SELECT 1 FROM tournee_commandes tc
    JOIN commandes cmd ON tc.commande_id = cmd.id
    WHERE cmd.numero_commande = 'CMD-20240114-1004'
);

-- Lier commandes à la tournée PLANIFIÉE
INSERT INTO tournee_commandes (tournee_id, commande_id)
SELECT
    (SELECT t.id FROM tournees t
     JOIN chauffeurs c ON t.chauffeur_id = c.id
     WHERE c.email = 'm.benali@grpo-driver.tn'
       AND t.date_tournee = CURRENT_DATE + 1
     LIMIT 1),
    (SELECT id FROM commandes WHERE numero_commande = 'CMD-20240114-1003')
WHERE NOT EXISTS (
    SELECT 1 FROM tournee_commandes tc
    JOIN commandes cmd ON tc.commande_id = cmd.id
    WHERE cmd.numero_commande = 'CMD-20240114-1003'
);

-- Réactiver les contraintes
SET session_replication_role = DEFAULT;
