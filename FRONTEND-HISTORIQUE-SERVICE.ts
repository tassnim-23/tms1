// ✅ FRONTEND - HistoriqueService (NOUVEAU)
// Fichier: tms-frontend/tms-frontend/src/app/core/services/historique.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Historique } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class HistoriqueService {

  private apiUrl = '/api/historique';

  constructor(private http: HttpClient) { }

  /**
   * Récupérer l'historique (commandes + factures)
   */
  getHistorique(): Observable<Historique[]> {
    return this.http.get<Historique[]>(`${this.apiUrl}`);
  }

  /**
   * Récupérer l'historique avec pagination
   */
  getHistoriquePagine(page: number = 0, size: number = 10): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}?page=${page}&size=${size}`);
  }

  /**
   * Filtrer l'historique par type
   */
  getHistoriqueByType(type: 'COMMANDE' | 'FACTURE'): Observable<Historique[]> {
    return this.http.get<Historique[]>(`${this.apiUrl}?type=${type}`);
  }

  /**
   * Filtrer l'historique par statut
   */
  getHistoriqueByStatut(statut: string): Observable<Historique[]> {
    return this.http.get<Historique[]>(`${this.apiUrl}?statut=${statut}`);
  }

  /**
   * Télécharger l'historique en PDF
   */
  downloadHistoriquePdf(): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/export/pdf`, {
      responseType: 'blob'
    });
  }

  /**
   * Télécharger l'historique en CSV
   */
  downloadHistoriqueCsv(): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/export/csv`, {
      responseType: 'blob'
    });
  }
}
