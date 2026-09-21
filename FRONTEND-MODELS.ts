// ✅ FRONTEND - ETAPE 3: TypeScript Models
// Fichier: tms-frontend/tms-frontend/src/app/core/models/models.ts

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  username: string;
  email: string;
  role: string;
  statutApproval: 'EN_ATTENTE' | 'APPROUVEE' | 'REJETEE';  // ← AJOUTER
  demandeInscriptionId?: number;
  clientId?: number;
}

export interface User {
  id?: number;
  username: string;
  email?: string;
  role?: string;
  token?: string;
  statutApproval?: 'EN_ATTENTE' | 'APPROUVEE' | 'REJETEE';  // ← AJOUTER
  demandeInscriptionId?: number;
  clientId?: number;
}

// ✅ NOUVEAU
export interface ClientProfile {
  id: number;
  raisonSociale: string;
  email: string;
  telephone: string;
  matriculeFiscale: string;
  adresseComplete: string;
  activite: string;
}

// ✅ NOUVEAU
export interface Commande {
  id?: number;
  reference: string;
  origine: string;
  destination: string;
  dateCommande?: Date;
  dateDepart: Date;
  type: 'ROUTIER' | 'MARITIME' | 'AERIEN' | 'EXPRESS';
  poids?: number;
  description?: string;
  statut?: string;
  cout?: number;
}

// ✅ NOUVEAU
export interface Facture {
  id: number;
  numero: string;
  date: Date;
  montant: number;
  statut: string;
}

// ✅ NOUVEAU
export interface Historique {
  id: number;
  reference: string;
  dateCreation: Date;
  statut: string;
  montant?: number;
  type: string;  // COMMANDE ou FACTURE
}

export interface Client {
  id?: number;
  raisonSociale: string;
  email?: string;
  contact?: string;
  adresse?: string;
}

export interface Transport {
  id?: number;
  type: string;
  origine: string;
  destination: string;
  date?: Date;
  prix?: number;
  statut?: string;
}

export interface Chauffeur {
  id?: number;
  prenom: string;
  nom: string;
  email?: string;
  telephone?: string;
  permis?: string;
}

export interface Vehicule {
  id?: number;
  marque: string;
  modele: string;
  plaque: string;
  immatriculation?: string;
}

export interface DashboardStats {
  totalClients?: number;
  totalCommandes?: number;
  totalFactures?: number;
}

export interface Page<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  currentPage: number;
  pageSize: number;
}
