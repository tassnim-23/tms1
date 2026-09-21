import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Historique } from '../models/models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class HistoriqueService {
  private apiUrl = `${environment.apiUrl}/historique`;

  constructor(private http: HttpClient) {}

  /**
   * Récupérer mon historique (commandes et factures)
   */
  getMonHistorique(): Observable<Historique[]> {
    return this.http.get<Historique[]>(`${this.apiUrl}/mes-historiques`);
  }

  /**
   * Récupérer un élément d'historique par ID
   */
  getHistorique(id: number): Observable<Historique> {
    return this.http.get<Historique>(`${this.apiUrl}/${id}`);
  }

  /**
   * Exporter l'historique en CSV
   */
  exportCSV(): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/export-csv`, { responseType: 'blob' });
  }

  /**
   * Exporter l'historique en PDF
   */
  exportPDF(): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/export-pdf`, { responseType: 'blob' });
  }
}
