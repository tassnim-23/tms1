/**
 * Modèles TypeScript — Module Tournées GRPO TMS
 */

export type StatutTournee = 'PLANIFIEE' | 'EN_COURS' | 'TERMINEE';

export interface CommandeResume {
  id: number;
  numeroCommande: string;
  adresseLivraison: string;
  villeLivraison: string;
  clientNom: string;
  statut: string;
}

export interface Tournee {
  id: number;
  numeroTournee: string;
  dateTournee: string;
  heureDebut?: string;
  heureFin?: string;
  chauffeurId: number;
  chauffeurNom: string;
  chauffeurTelephone?: string;
  vehiculeId: number;
  vehiculeLabel: string;
  vehiculeImmatriculation?: string;
  commandeIds: number[];
  commandes: CommandeResume[];
  nombreCommandes: number;
  distanceTotale?: number;
  statut: StatutTournee;
  adresseDepart?: string;
  remarques?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TourneeFormData {
  dateTournee: string;
  heureDebut?: string;
  heureFin?: string;
  chauffeurId: number;
  vehiculeId: number;
  commandeIds: number[];
  distanceTotale?: number;
  adresseDepart?: string;
  remarques?: string;
}

export interface Chauffeur {
  id: number;
  nom: string;
  prenom: string;
  email?: string;
  telephone?: string;
  numeroPermis?: string;
  actif?: boolean;
}

export interface Vehicule {
  id: number;
  marque: string;
  modele: string;
  immatriculation: string;
  capaciteCharge?: number;
  typeCarburant?: string;
  actif?: boolean;
}

export interface CommandeDisponible {
  id: number;
  numeroCommande: string;
  adresseLivraison: string;
  villeLivraison: string;
  gouvernoratLivraison?: string;
  quartierLivraison?: string;
  clientNom?: string;
  dateLivraisonPrevue: string;
  poids?: number;
  priorite?: string;
  // Coordonnées GPS stockées à la création de la commande
  latitudeLivraison?: number | null;
  longitudeLivraison?: number | null;
}

export const STATUT_TOURNEE_CONFIG: Record<StatutTournee, {
  label: string; icon: string; bg: string; color: string; border: string;
}> = {
  PLANIFIEE: { label: 'Planifiée', icon: 'schedule',       bg: '#EBF5FB', color: '#1B4F72', border: '#bee3f8' },
  EN_COURS:  { label: 'En cours',  icon: 'local_shipping', bg: '#FEF3E2', color: '#E67E22', border: '#f5cba7' },
  TERMINEE:  { label: 'Terminée',  icon: 'check_circle',   bg: '#E8F8F5', color: '#27ae60', border: '#a9dfbf' },
};