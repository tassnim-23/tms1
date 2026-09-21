import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Facture } from '../models/models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class FacturesService {
  private apiUrl = `${environment.apiUrl}/factures`;

  constructor(private http: HttpClient) {}

  /**
   * Récupérer toutes mes factures
   */
  getMesFactures(): Observable<Facture[]> {
    return this.http.get<Facture[]>(`${this.apiUrl}/mes-factures`);
  }

  /**
   * Récupérer une facture par ID
   */
  getFacture(id: number): Observable<Facture> {
    return this.http.get<Facture>(`${this.apiUrl}/${id}`);
  }

  /**
   * Télécharger le PDF d'une facture
   */
  telechargerFacture(id: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${id}/download`, { responseType: 'blob' });
  }

  /**
   * Marquer une facture comme payée
   */
  marquerCommePayee(id: number): Observable<Facture> {
    return this.http.put<Facture>(`${this.apiUrl}/${id}/marquer-payee`, {});
  }

  /**
   * Export les factures en PDF
   */
  exportPDF(facture: Facture): void {
    const link = document.createElement('a');
    link.target = '_blank';
    link.href = `${this.apiUrl}/${facture.id}/download`;
    link.click();
  }
}
