import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../core/services/auth.service';

export interface CommandeOptimisee {
  id: number;
  numeroCommande: string;
  villeLivraison: string;
  adresseLivraison: string;
  poids: number;
  client: string;
  priorite: string;       // URGENT | HAUTE | NORMALE | BASSE
  latitude?: number;      // GPS exact de la commande
  longitude?: number;     // GPS exact de la commande
}

export interface TourneeOptimisee {
  numero: string;
  nbCommandes: number;
  distanceKm: number;
  tempsEstimeMinutes: number;
  coutEstimeDT: number;
  priorite?: string;
  commandes: CommandeOptimisee[];
  tempsML?: number;
  coutML?: number;
}

export interface OptimisationTourneeRequest {
  commandeIds: number[];
  date?: string;
  zone?: string;
}

export interface OptimisationTourneeResult {
  ordreOptimise: number[];
  distanceTotale: number;
  tempsEstime?: number;
  cout?: number;
}

@Injectable({ providedIn: 'root' })
export class OptimisationService {

  private apiUrl = `${environment.apiUrl}/tournees`;
  private mlUrl = 'http://localhost:5000';

  constructor(private http: HttpClient, private auth: AuthService) {}

  private get hdrs(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${this.auth.getToken()}` });
  }

  optimiser(): Observable<TourneeOptimisee[]> {
    return this.http.get<TourneeOptimisee[]>(`${this.apiUrl}/optimiser`, { headers: this.hdrs });
  }

  predireML(distanceKm: number, nbCommandes: number, heureDepart: number = 8): Observable<any> {
    return this.http.post<any>(`${this.mlUrl}/predict`, {
      distance_km: distanceKm,
      nb_commandes: nbCommandes,
      heure_depart: heureDepart,
      poids_total_kg: nbCommandes * 100,
      zone_urbaine: 1
    });
  }

  optimiserTournee(request: OptimisationTourneeRequest): Observable<OptimisationTourneeResult> {
    return this.http.post<OptimisationTourneeResult>(
      `${this.apiUrl}/optimiser-selection`, request, { headers: this.hdrs }
    );
  }

  appliquer(tournees: TourneeOptimisee[]): Observable<{message: string, nombre: number}> {
    return this.http.post<{message: string, nombre: number}>(
      `${this.apiUrl}/appliquer-optimisation`, tournees, { headers: this.hdrs }
    );
  }
}