// ✅ FRONTEND - CommandesService (NOUVEAU)
// Fichier: tms-frontend/tms-frontend/src/app/core/services/commandes.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Commande } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class CommandesService {

  private apiUrl = '/api/commandes';

  constructor(private http: HttpClient) { }

  /**
   * Récupérer mes commandes
   */
  getMesCommandes(): Observable<Commande[]> {
    return this.http.get<Commande[]>(`${this.apiUrl}/mes-commandes`);
  }

  /**
   * Récupérer détail d'une commande
   */
  getDetailCommande(id: number): Observable<Commande> {
    return this.http.get<Commande>(`${this.apiUrl}/${id}`);
  }

  /**
   * Créer une nouvelle commande
   */
  creerCommande(commande: Commande): Observable<Commande> {
    return this.http.post<Commande>(`${this.apiUrl}`, commande);
  }

  /**
   * Récupérer les données de validation (origins, destinations, types)
   */
  getValidationData(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/validation-data`);
  }

  /**
   * Types de transport disponibles
   */
  getTransportTypes(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/types`);
  }
}
