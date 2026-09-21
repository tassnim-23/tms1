import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SupportMessage } from '../models/models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SupportService {
  private apiUrl = `${environment.apiUrl}/support`;

  constructor(private http: HttpClient) {}

  /**
   * Envoyer un message de support
   */
  envoyerMessage(sujet: string, contenu: string): Observable<SupportMessage> {
    return this.http.post<SupportMessage>(`${this.apiUrl}/messages`, { sujet, contenu });
  }

  /**
   * Récupérer tous mes messages de support
   */
  getMesMessages(): Observable<SupportMessage[]> {
    return this.http.get<SupportMessage[]>(`${this.apiUrl}/mes-messages`);
  }

  /**
   * Récupérer un message de support par ID
   */
  getMessage(id: number): Observable<SupportMessage> {
    return this.http.get<SupportMessage>(`${this.apiUrl}/${id}`);
  }

  /**
   * Mettre à jour le statut d'un message
   */
  updateStatut(id: number, statut: string): Observable<SupportMessage> {
    return this.http.put<SupportMessage>(`${this.apiUrl}/${id}/statut?statut=${statut}`, {});
  }

  /**
   * Supprimer un message
   */
  supprimerMessage(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
