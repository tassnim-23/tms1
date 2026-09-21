// ✅ FRONTEND - FacturesService (NOUVEAU)
// Fichier: tms-frontend/tms-frontend/src/app/core/services/factures.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Facture } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class FacturesService {

  private apiUrl = '/api/factures';

  constructor(private http: HttpClient) { }

  /**
   * Récupérer mes factures
   */
  getMesFactures(): Observable<Facture[]> {
    return this.http.get<Facture[]>(`${this.apiUrl}/mes-factures`);
  }

  /**
   * Télécharger une facture PDF
   */
  downloadFacture(id: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${id}/download`, {
      responseType: 'blob'
    });
  }

  /**
   * Télécharger et ouvrir une facture
   */
  telechargerFacture(id: number, filename: string = `facture-${id}.pdf`): void {
    this.downloadFacture(id).subscribe(
      (blob: Blob) => {
        // Créer un URL blob
        const url = window.URL.createObjectURL(blob);
        
        // Créer un lien et simuler le click
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        
        // Nettoyer
        window.URL.revokeObjectURL(url);
        a.remove();
      },
      (error) => {
        console.error('Erreur téléchargement facture:', error);
      }
    );
  }
}
