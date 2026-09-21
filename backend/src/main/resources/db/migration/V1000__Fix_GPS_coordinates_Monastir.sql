-- Correction des coordonnées GPS erronées pour les quartiers de Monastir
-- Issue: Adresses (Bembla, Ouardanine, etc.) affichées aux mauvaises places sur la carte
-- Solution: Mettre à jour les coordonnées qui pointaient en mer ou aux mauvais endroits
-- Avec les coordonnées correctes basées sur OpenStreetMap

-- 1. Corriger Bembla : ancienne [35.6844, 10.8968] (en mer) → nouvelle [35.6869, 10.8753]
UPDATE commandes 
SET latitude = 35.6869, longitude = 10.8753
WHERE gouvernorat_livraison = 'Monastir' 
  AND (quartier_livraison = 'Bembla' OR adresse_livraison LIKE '%Bembla%')
  AND (latitude = 35.6844 OR latitude = 35.742 OR latitude = 35.7420)
  AND (longitude = 10.8968 OR longitude = 10.772 OR longitude = 10.7720);

-- 2. Corriger Ouardanine : ancienne [35.6967, 10.7250] → nouvelle [35.7069, 10.6945]
UPDATE commandes
SET latitude = 35.7069, longitude = 10.6945
WHERE gouvernorat_livraison = 'Monastir'
  AND (quartier_livraison = 'Ouardanine' OR quartier_livraison = 'Ouerdanine' OR adresse_livraison LIKE '%Ouard%')
  AND (latitude = 35.6967)
  AND (longitude = 10.725 OR longitude = 10.7250);

-- 3. Corriger Téboulba avec OSM coords si besoin
UPDATE commandes
SET latitude = 35.6633, longitude = 10.8933
WHERE gouvernorat_livraison = 'Monastir'
  AND (quartier_livraison = 'Téboulba' OR quartier_livraison = 'Teboulba' OR adresse_livraison LIKE '%Teboulba%' OR adresse_livraison LIKE '%Téboulba%')
  AND (latitude = 35.6608)
  AND (longitude = 10.8722);

-- 4. Correction générale : supprimer les NULL et les valeurs < 0.001 qui pourraient causer des erreurs
-- (les vraies coordonnées en Tunisie doivent être entre [32, 37] en latitude et [8, 11] en longitude)
UPDATE commandes
SET latitude = NULL, longitude = NULL
WHERE latitude IS NOT NULL AND longitude IS NOT NULL
  AND (latitude < 32 OR latitude > 37 OR longitude < 8 OR longitude > 11)
  AND gouvernorat_livraison IN ('Monastir', 'Sousse', 'Mahdia', 'Sfax', 'Gabès', 'Tataouine', 'Médenine', 'Kébili', 'Tozeur', 'Gafsa', 'Kasserine', 'Sidi Bouzid', 'Kairouan', 'Siliana', 'Jendouba', 'Le Kef', 'Béja', 'Bizerte', 'Nabeul', 'Zaghouan', 'Manouba', 'Ben Arous', 'Ariana', 'Tunis');
