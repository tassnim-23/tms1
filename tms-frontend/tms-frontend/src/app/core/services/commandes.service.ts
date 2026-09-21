import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Commande } from '../models/models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class CommandesService {
  private apiUrl = `${environment.apiUrl}/commandes`;

  constructor(private http: HttpClient) {}

  /**
   * Récupérer toutes mes commandes
   */
  getMesCommandes(): Observable<Commande[]> {
    return this.http.get<Commande[]>(`${this.apiUrl}/mes-commandes`);
  }

  /**
   * Récupérer une commande par ID
   */
  getCommande(id: number): Observable<Commande> {
    return this.http.get<Commande>(`${this.apiUrl}/${id}`);
  }

  /**
   * Créer une nouvelle commande
   */
  creerCommande(commande: Partial<Commande>): Observable<Commande> {
    return this.http.post<Commande>(`${this.apiUrl}/mes-commandes`, commande);
  }

  /**
   * Mettre à jour une commande
   */
  updateCommande(id: number, commande: Partial<Commande>): Observable<Commande> {
    return this.http.put<Commande>(`${this.apiUrl}/${id}`, commande);
  }

  /**
   * Annuler une commande
   */
  annulerCommande(id: number): Observable<Commande> {
    return this.http.put<Commande>(`${this.apiUrl}/${id}/annuler`, {});
  }

  /**
   * Supprimer une commande
   */
  supprimerCommande(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}