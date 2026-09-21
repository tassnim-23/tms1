# TMS Frontend Angular

## 🚀 Installation rapide

### Prérequis
- Node.js 18+
- Angular CLI 17+ (`npm install -g @angular/cli`)
- Backend Spring Boot sur http://localhost:8080

### Étapes

```bash
# 1. Extraire le zip dans votre dossier
cd tms-frontend

# 2. Installer les dépendances
npm install

# 3. Lancer l'application
ng serve

# 4. Ouvrir dans le navigateur
http://localhost:4200
```

## 🔐 Connexion par défaut
- Username: **admin**
- Password: **admin123**

## 📁 Structure du projet
```
src/app/
├── core/
│   ├── guards/auth.guard.ts        # Protection des routes
│   ├── interceptors/auth.interceptor.ts  # JWT auto-injection
│   ├── models/models.ts            # Interfaces TypeScript
│   └── services/
│       ├── auth.service.ts         # Authentification
│       └── crud.services.ts        # Services CRUD (Client, Transport, Chauffeur, Vehicule, Dashboard)
├── modules/
│   ├── auth/login/                 # Page de connexion
│   ├── dashboard/                  # Tableau de bord avec stats
│   ├── clients/                    # CRUD Clients
│   ├── transports/                 # CRUD Transports
│   ├── chauffeurs/                 # CRUD Chauffeurs
│   ├── vehicules/                  # CRUD Véhicules
│   └── layout/                     # Header, Sidebar, Footer
└── shared/components/              # ConfirmDialog réutilisable
```

## ⚙️ Configuration API
Modifiez `src/environments/environment.ts` si votre backend est sur un port différent :
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api'  // <- changer ici si besoin
};
```

## ✅ Points importants
- Le backend Spring Boot doit tourner sur **http://localhost:8080**
- Les CORS doivent être configurés côté backend
- L'API doit exposer `/api/auth/login` retournant `{ token, username, role }`
