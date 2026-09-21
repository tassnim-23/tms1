// ════════════════════════════════════════
// MODÈLES DE DONNÉES - TMS GRPO
// ════════════════════════════════════════

export interface User {
  id?: number;
  username: string;
  email?: string;
  role?: string;
  token?: string;
  // ✅ NOUVEAU: Champs pour l'approbation client
  statutApproval?: 'EN_ATTENTE' | 'APPROUVEE' | 'REJETEE' | 'EMAIL_NON_VERIFIE';
  clientId?: number;
  demandeInscriptionId?: number;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  username: string;
  role: string;
  // ✅ NOUVEAU: Champs pour l'approbation client
  statutApproval?: 'EN_ATTENTE' | 'APPROUVEE' | 'REJETEE' | 'EMAIL_NON_VERIFIE';
  clientId?: number;
  email?: string;
  roles?: string[];
}

// ── CLIENT (champs enrichis) ─────────────────────────────
export interface Client {
  id?: number;
  raisonSociale: string;          // Nom de l'entreprise cliente
  matriculeFiscale: string;       // Identifiant fiscal (7 chiffres + 3 lettres)
  responsableEntreprise: string;  // Nom du contact principal
  email: string;
  telephone: string;              // Format +216XXXXXXXX
  adresseComplete: string;        // Adresse + code postal + ville + pays
  activite: string;               // Secteur d'activité
  createdAt?: string;
  updatedAt?: string;
}

// ── TRANSPORT ────────────────────────────────────────────
export interface Transport {
  id?: number;
  reference?: string;
  clientId?: number;
  clientNom?: string;
  origine: string;
  destination: string;
  dateDepart?: string;
  dateLivraison?: string;
  statut?: 'EN_ATTENTE' | 'EN_COURS' | 'LIVRE' | 'ANNULE' | string;
  type?: 'ROUTIER' | 'MARITIME' | 'AERIEN' | string;
  poids?: number;
  cout?: number;
  chauffeurId?: number;
  vehiculeId?: number;
  description?: string;
}

// ── CHAUFFEUR ────────────────────────────────────────────
export interface Chauffeur {
  id?: number;
  nom: string;
  prenom: string;
  email?: string;
  telephone?: string;
  numeroPerm?: string;
  dateExpirationPerm?: string;
  disponible?: boolean;
  vehiculeId?: number;
}

// ── VÉHICULE ─────────────────────────────────────────────
export interface Vehicule {
  id?: number;
  immatriculation: string;
  marque?: string;
  modele?: string;
  annee?: number;
  type?: 'CAMION' | 'FOURGON' | 'VOITURE' | 'MOTO' | string;
  capacite?: number;       // en kg
  disponible?: boolean;
  etat?: 'BON' | 'MAINTENANCE' | 'HORS_SERVICE' | string;
  chauffeurId?: number;
}

// ── STATISTIQUES TABLEAU DE BORD ─────────────────────────
export interface DashboardStats {
  totalClients: number;
  totalTransports: number;
  transportsEnCours: number;
  revenuMensuel: number;
  totalChauffeurs: number;
  totalVehicules: number;
  commandesLivrees?: number;
  commandesEnAttente?: number;
}

// ── PAGINATION ───────────────────────────────────────────
export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

// ✅ NOUVEAU: PROFIL CLIENT ────────────────────────────────
export interface ClientProfile {
  id: number;
  raisonSociale: string;
  email: string;
  telephone: string;
  matriculeFiscale: string;
  adresseComplete: string;
  activite: string;
}

// ✅ NOUVEAU: FACTURES ─────────────────────────────────────
export interface Facture {
  id: number;
  numero: string;
  dateFacture: string;
  montant: number;
  statut: 'PAYEE' | 'EN_ATTENTE' | 'RETARD';
  clientId: number;
}

// ✅ NOUVEAU: COMMANDES CLIENT ─────────────────────────────
export interface Commande {
  id?: number;
  numeroCommande?: string;
  dateCommande?: string;
  dateLivraisonPrevue?: string;
  adresseLivraison: string;
  villeLivraison: string;
  descriptionMarchandise?: string;
  poids?: number;
  volume?: number;
  statut?: 'EN_ATTENTE' | 'ASSIGNEE' | 'EN_COURS' | 'LIVREE' | 'ANNULEE';
  clientId?: number;
}

// ✅ NOUVEAU: MESSAGES DE SUPPORT ──────────────────────────
export interface SupportMessage {
  id: number;
  sujet: string;
  contenu: string;
  dateEnvoi: string;
  statut: 'NOUVEAU' | 'EN_COURS' | 'RESOLU';
  clientId: number;
}

// ✅ NOUVEAU: HISTORIQUE ───────────────────────────────────
export interface Historique {
  id: number;
  reference: string;
  dateCreation: string;
  statut: string;
  montant?: number;
  type: 'COMMANDE' | 'FACTURE';
}