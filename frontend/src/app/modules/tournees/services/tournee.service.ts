import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, Subject, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Tournee, TourneeFormData, Chauffeur, Vehicule, CommandeDisponible } from '../models/tournee.model';

@Injectable({ providedIn: 'root' })
export class TourneeService {

  private readonly base = `${environment.apiUrl}/tournees`;
  private readonly commandeBase = `${environment.apiUrl}/commandes`;

  /** Émet quand les données changent (refresh liste) */
  readonly refresh$ = new Subject<void>();

  constructor(private http: HttpClient) {}

  // ── Tournées ──────────────────────────────────────────────────

  getTournees(): Observable<Tournee[]> {
    return this.http.get<Tournee[]>(this.base);
  }

  getTourneesByStatut(statut: string): Observable<Tournee[]> {
    return this.http.get<Tournee[]>(this.base, { params: { statut } });
  }

  getTournee(id: number): Observable<Tournee> {
    return this.http.get<Tournee>(`${this.base}/${id}`);
  }

  createTournee(data: TourneeFormData): Observable<Tournee> {
    return this.http.post<Tournee>(this.base, data)
      .pipe(tap(() => this.refresh$.next()));
  }

  updateTournee(id: number, data: TourneeFormData): Observable<Tournee> {
    return this.http.put<Tournee>(`${this.base}/${id}`, data)
      .pipe(tap(() => this.refresh$.next()));
  }

  deleteTournee(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`)
      .pipe(tap(() => this.refresh$.next()));
  }

  changerStatut(id: number, statut: string): Observable<Tournee> {
    return this.http.patch<Tournee>(`${this.base}/${id}/statut`, { statut })
      .pipe(tap(() => this.refresh$.next()));
  }

  // ── Disponibilités ────────────────────────────────────────────

  getChauffeursDisponibles(date: string, tourneeId?: number): Observable<Chauffeur[]> {
    let params = new HttpParams().set('date', date);
    if (tourneeId) params = params.set('tourneeId', tourneeId.toString());
    return this.http.get<Chauffeur[]>(`${this.base}/chauffeurs-disponibles`, { params });
  }

  getVehiculesDisponibles(date: string, tourneeId?: number): Observable<Vehicule[]> {
    let params = new HttpParams().set('date', date);
    if (tourneeId) params = params.set('tourneeId', tourneeId.toString());
    return this.http.get<Vehicule[]>(`${this.base}/vehicules-disponibles`, { params });
  }

  // ── Commandes EN_ATTENTE (pour sélection dans le form) ────────

  getCommandesEnAttente(): Observable<CommandeDisponible[]> {
    return this.http.get<CommandeDisponible[]>(`${this.commandeBase}/en-attente`);
  }

  // ── Utilitaires ───────────────────────────────────────────────

  formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }
}
