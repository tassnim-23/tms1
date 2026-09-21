import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, interval, switchMap, BehaviorSubject } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { environment } from '../../../environments/environment';

// ─── INTERFACES ─────────────────────────────────────────────────

export interface PositionGPS {
  id?: number;
  latitude: number;
  longitude: number;
  vitesse?: number;
  precision?: number;
  chauffeurId: number;
  tourneeId?: number;
  chauffeurNom?: string;
  statut?: 'EN_ROUTE' | 'A_LARRET' | 'LIVRAISON' | 'PAUSE';
  timestamp?: string;
  derniereMaj?: string;
}

export interface SimulationRequest {
  chauffeurId: number;
  tourneeId: number;
  latDepart: number;
  lonDepart: number;
  latArrivee: number;
  lonArrivee: number;
  nbPoints?: number;
}

// ─── SERVICE ────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class GpsService {

  private readonly apiUrl = `${environment.apiUrl}/gps`;

  /** Liste des positions mise à jour en temps réel */
  private positionsSubject = new BehaviorSubject<PositionGPS[]>([]);
  public positions$ = this.positionsSubject.asObservable();

  /** Intervalle de polling en millisecondes (5 secondes) */
  private readonly POLLING_INTERVAL = 5000;

  constructor(
    private http: HttpClient,
    private auth: AuthService
  ) {}

  private get headers(): HttpHeaders {
    return new HttpHeaders({
      'Authorization': `Bearer ${this.auth.getToken()}`,
      'Content-Type': 'application/json'
    });
  }

  // ─── ENVOYER UNE POSITION ──────────────────────────────────────

  /**
   * Envoie la position d'un chauffeur au backend.
   * Appelé depuis le composant simulateur ou l'app mobile.
   */
  envoyerPosition(position: PositionGPS): Observable<PositionGPS> {
    return this.http.post<PositionGPS>(
      `${this.apiUrl}/position`,
      position,
      { headers: this.headers }
    );
  }

  // ─── RÉCUPÉRER LES POSITIONS ───────────────────────────────────

  /**
   * Récupère les dernières positions de tous les chauffeurs.
   */
  getDernieresPositions(): Observable<PositionGPS[]> {
    return this.http.get<PositionGPS[]>(
      `${this.apiUrl}/positions`,
      { headers: this.headers }
    );
  }

  /**
   * Récupère la position d'un chauffeur spécifique.
   */
  getPositionChauffeur(chauffeurId: number): Observable<PositionGPS> {
    return this.http.get<PositionGPS>(
      `${this.apiUrl}/chauffeur/${chauffeurId}`,
      { headers: this.headers }
    );
  }

  /**
   * Récupère l'historique complet d'une tournée.
   */
  getHistoriqueTournee(tourneeId: number): Observable<PositionGPS[]> {
    return this.http.get<PositionGPS[]>(
      `${this.apiUrl}/tournee/${tourneeId}`,
      { headers: this.headers }
    );
  }

  /**
   * Récupère les positions live d'une tournée en cours.
   */
  getPositionsLive(tourneeId: number): Observable<PositionGPS[]> {
    return this.http.get<PositionGPS[]>(
      `${this.apiUrl}/tournee/${tourneeId}/live`,
      { headers: this.headers }
    );
  }

  // ─── POLLING AUTOMATIQUE ──────────────────────────────────────

  /**
   * Démarre le polling toutes les 5 secondes.
   * Retourne un Observable qui émet les nouvelles positions automatiquement.
   *
   * Utilisation dans un composant :
   *   this.gpsService.demarrerPolling().subscribe(positions => {
   *     this.mettreAJourCarte(positions);
   *   });
   */
  demarrerPolling(): Observable<PositionGPS[]> {
    return interval(this.POLLING_INTERVAL).pipe(
      switchMap(() => this.getDernieresPositions())
    );
  }

  /**
   * Démarre le polling pour une tournée spécifique.
   */
  demarrerPollingTournee(tourneeId: number): Observable<PositionGPS[]> {
    return interval(this.POLLING_INTERVAL).pipe(
      switchMap(() => this.getPositionsLive(tourneeId))
    );
  }

  // ─── SIMULATION ───────────────────────────────────────────────

  /**
   * Lance la simulation d'un trajet sur le backend.
   */
  simulerTrajet(req: SimulationRequest): Observable<any> {
    return this.http.post<any>(
      `${this.apiUrl}/simuler`,
      req,
      { headers: this.headers }
    );
  }

  // ─── UTILITAIRES ──────────────────────────────────────────────

  /** Retourne la couleur selon le statut du camion */
  getCouleurStatut(statut?: string): string {
    switch (statut) {
      case 'EN_ROUTE':  return '#27ae60';  // vert
      case 'A_LARRET':  return '#e67e22';  // orange
      case 'LIVRAISON': return '#3498db';  // bleu
      case 'PAUSE':     return '#95a5a6';  // gris
      default:          return '#7f8c8d';
    }
  }

  /** Retourne le label lisible du statut */
  getLabelStatut(statut?: string): string {
    switch (statut) {
      case 'EN_ROUTE':  return '🚛 En route';
      case 'A_LARRET':  return '🅿️ À l\'arrêt';
      case 'LIVRAISON': return '📦 En livraison';
      case 'PAUSE':     return '☕ En pause';
      default:          return '❓ Inconnu';
    }
  }

  /** Calcule la distance entre deux points GPS (formule Haversine) en km */
  calculerDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Rayon Terre en km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 10) / 10;
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}