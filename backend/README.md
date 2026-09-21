# 🚛 TMS - Transport Management System
## GRPO Consulting - Backend Spring Boot

[![Java](https://img.shields.io/badge/Java-17-orange)](https://www.oracle.com/java/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.2.0-green)](https://spring.io/projects/spring-boot)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-blue)](https://www.postgresql.org/)

---

## 📋 Prérequis

- **Java 17+** : `java -version`
- **Maven 3.8+** : `mvn -version`
- **PostgreSQL 14+** : [Télécharger](https://www.postgresql.org/download/)
- **Compte Gmail** avec App Password activé
- **Compte Twilio** (optionnel, pour SMS)

---

## 🗄️ Installation Base de Données

```sql
-- Connexion à PostgreSQL en tant que postgres
psql -U postgres

-- Créer la base de données
CREATE DATABASE tms_db;
CREATE USER tms_user WITH ENCRYPTED PASSWORD 'votre_mot_de_passe';
GRANT ALL PRIVILEGES ON DATABASE tms_db TO tms_user;
\q
```

---

## ⚙️ Configuration

### 1. Modifier `application.properties`

```properties
# Base de données
spring.datasource.url=jdbc:postgresql://localhost:5432/tms_db
spring.datasource.username=postgres
spring.datasource.password=VOTRE_MOT_DE_PASSE

# JWT (changer la clé secrète !)
jwt.secret=VotreCleSecreteTresLongueEtSecurisee123456789GRPO2024TMS

# Email Gmail
spring.mail.username=votre.email@gmail.com
spring.mail.password=xxxx xxxx xxxx xxxx  # App Password Gmail
app.email.from=TMS GRPO <votre.email@gmail.com>
app.email.enabled=true

# Twilio (optionnel)
twilio.enabled=false
twilio.account.sid=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
twilio.auth.token=votre_auth_token
twilio.phone.number=+1234567890
```

### 2. Gmail - Obtenir un App Password

1. Aller sur [myaccount.google.com](https://myaccount.google.com)
2. Sécurité → Vérification en 2 étapes → **Activer**
3. Sécurité → **Mots de passe des applications**
4. Sélectionner "Mail" et "Autre" (taper "TMS")
5. Copier le mot de passe généré dans `spring.mail.password`

### 3. Twilio (optionnel)

1. Créer un compte sur [twilio.com](https://www.twilio.com)
2. Récupérer Account SID et Auth Token depuis le Dashboard
3. Acheter un numéro de téléphone
4. Configurer dans `application.properties` et mettre `twilio.enabled=true`

---

## 🚀 Démarrage

```bash
# Cloner le projet
git clone <repository-url>
cd tms-backend

# Compiler et installer les dépendances
mvn clean install -DskipTests

# Lancer l'application
mvn spring-boot:run

# OU lancer le JAR
java -jar target/tms-1.0.0.jar
```

L'application démarre sur **http://localhost:8080**

---

## 🔐 Authentification

### Connexion (obtenir le token JWT)

```http
POST http://localhost:8080/api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}
```

**Réponse :**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "type": "Bearer",
  "id": 1,
  "username": "admin",
  "email": "admin@grpo-consulting.com",
  "roles": ["ADMIN", "USER"]
}
```

### Utilisation du token

Ajouter le header à **toutes les autres requêtes** :
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 🌐 Endpoints API

### 👤 AUTH - `/api/auth`

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/login` | Connexion → retourne JWT |
| POST | `/register` | Créer un utilisateur |
| POST | `/refresh` | Rafraîchir le token |
| POST | `/logout` | Déconnexion |

### 👥 CLIENTS - `/api/clients`

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/` | Liste clients (pagination + recherche) |
| GET | `/{id}` | Détails client |
| POST | `/` | Créer client (+ email bienvenue) |
| PUT | `/{id}` | Modifier client |
| DELETE | `/{id}` | Supprimer client |
| GET | `/{id}/commandes` | Commandes du client |

**Exemple création client :**
```http
POST /api/clients
Authorization: Bearer <token>
Content-Type: application/json

{
  "raisonSociale": "Ma Société SARL",
  "email": "contact@masociete.tn",
  "telephone": "+21698765432",
  "adresse": "15 Rue Example",
  "ville": "Tunis",
  "codePostal": "1000",
  "pays": "Tunisie"
}
```

**Pagination :**
```
GET /api/clients?page=0&size=10&sortBy=raisonSociale&sortDir=asc&search=tunis
```

### 🧑‍💼 CHAUFFEURS - `/api/chauffeurs`

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/` | Liste chauffeurs |
| GET | `/{id}` | Détails chauffeur |
| GET | `/disponibles` | Chauffeurs disponibles |
| POST | `/` | Créer chauffeur |
| PUT | `/{id}` | Modifier chauffeur |
| DELETE | `/{id}` | Supprimer chauffeur |
| GET | `/{id}/tournees` | Tournées du chauffeur |
| PUT | `/{id}/disponibilite?disponible=true` | Changer disponibilité |

### 🚛 VÉHICULES - `/api/vehicules`

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/` | Liste véhicules |
| GET | `/{id}` | Détails véhicule |
| GET | `/disponibles` | Véhicules disponibles |
| POST | `/` | Créer véhicule |
| PUT | `/{id}` | Modifier véhicule |
| DELETE | `/{id}` | Supprimer véhicule |
| PUT | `/{id}/statut?statut=DISPONIBLE` | Changer statut |
| PUT | `/{id}/kilometrage?kilometrage=50000` | Mettre à jour km |

### 📦 COMMANDES - `/api/commandes`

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/` | Liste commandes |
| GET | `/{id}` | Détails commande |
| POST | `/` | Créer commande (+ email + SMS) |
| PUT | `/{id}` | Modifier commande |
| DELETE | `/{id}` | Supprimer commande |
| PUT | `/{id}/statut?statut=EN_COURS` | Changer statut |
| GET | `/client/{clientId}` | Commandes d'un client |
| GET | `/en-attente` | Commandes en attente |
| GET | `/statistiques` | Statistiques commandes |

**Statuts commande :** `EN_ATTENTE` → `ASSIGNEE` → `EN_COURS` → `LIVREE` ou `ANNULEE`

### 🗺️ TOURNÉES - `/api/tournees`

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/` | Liste tournées |
| GET | `/{id}` | Détails tournée |
| POST | `/` | Créer tournée (+ email + SMS chauffeur) |
| PUT | `/{id}` | Modifier tournée |
| DELETE | `/{id}` | Supprimer tournée |
| POST | `/{id}/commandes/{commandeId}` | Ajouter commande |
| DELETE | `/{id}/commandes/{commandeId}` | Retirer commande |
| PUT | `/{id}/statut?statut=EN_COURS` | Changer statut |
| GET | `/chauffeur/{chauffeurId}` | Tournées d'un chauffeur |
| GET | `/date/2024-01-15` | Tournées d'une date |
| PUT | `/{id}/terminer` | Terminer tournée (+ emails clients) |

**Exemple création tournée :**
```http
POST /api/tournees
Authorization: Bearer <token>
Content-Type: application/json

{
  "dateTournee": "2024-01-20",
  "heureDebut": "07:00",
  "heureFin": "16:00",
  "distanceTotale": 250.0,
  "chauffeurId": 1,
  "vehiculeId": 1,
  "commandeIds": [1, 2, 3]
}
```

---

## 📊 Format des Réponses d'Erreur

```json
{
  "timestamp": "2024-01-15T10:30:00",
  "status": 404,
  "error": "Not Found",
  "message": "Client non trouvé avec l'ID: 999",
  "path": "/api/clients/999"
}
```

**Codes d'erreur :**
- `400` Bad Request - Données invalides
- `401` Unauthorized - Token manquant/expiré
- `403` Forbidden - Accès refusé
- `404` Not Found - Ressource introuvable
- `409` Conflict - Données dupliquées
- `500` Internal Server Error - Erreur serveur

---

## ⏰ Tâches Planifiées

| Tâche | Cron | Description |
|-------|------|-------------|
| Rappel tournées | `0 0 18 * * ?` | Chaque jour à 18h - Email + SMS chauffeurs |
| Alerte retard | `0 0/30 8-18 * * ?` | Toutes les 30 min (8h-18h) |
| Rapport hebdo | `0 0 8 * * MON` | Lundi à 8h - Email stats semaine |

---

## 🧪 Tests

```bash
# Lancer les tests unitaires
mvn test

# Lancer un test spécifique
mvn test -Dtest=CommandeServiceTest
```

---

## 📁 Structure du Projet

```
src/main/java/com/grpo/tms/
├── TmsApplication.java
├── config/
│   ├── SecurityConfig.java
│   └── JwtAuthenticationFilter.java
├── controller/       → AuthController, ClientController, ChauffeurController,
│                        VehiculeController, CommandeController, TourneeController
├── dto/              → LoginRequest, JwtResponse, ClientDTO, CommandeDTO, TourneeDTO...
├── entity/           → User, Client, Chauffeur, Vehicule, Commande, Tournee
├── exception/        → GlobalExceptionHandler, ResourceNotFoundException, BadRequestException
├── repository/       → Tous les JPA Repositories
├── scheduler/        → ScheduledTasks
├── service/          → Tous les Services métier + EmailService + SmsService
└── util/             → JwtUtil, DateUtil
```

---

## 🔑 Identifiants de Test

| Utilisateur | Mot de passe | Rôles |
|-------------|--------------|-------|
| admin | admin123 | ADMIN, USER |
| dispatcher | admin123 | USER |

---

## 🔧 Variables d'Environnement (Production)

```bash
export DB_PASSWORD=votre_mot_de_passe_db
export JWT_SECRET=votre_cle_secrete_jwt
export MAIL_USERNAME=votre@gmail.com
export MAIL_PASSWORD=xxxx_xxxx_xxxx_xxxx
export TWILIO_SID=ACxxxxxxxxxx
export TWILIO_TOKEN=votre_token
```

---

## 🌐 CORS

L'API accepte les requêtes depuis :
- `http://localhost:4200` (Angular dev)
- `http://localhost:3000` (React dev)

---

## 📞 Support

GRPO Consulting - [admin@grpo-consulting.com](mailto:admin@grpo-consulting.com)
