import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { map, tap, takeUntil } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import {
  Commande, CommandeFormData, CommandePage, CommandeStats, StatutCommande, Client
} from '../models/commande.model';

@Injectable({ providedIn: 'root' })
export class CommandeService implements OnDestroy {

  private readonly base = `${environment.apiUrl}/commandes`;
  private readonly clientBase = `${environment.apiUrl}/clients`;
  private destroy$ = new Subject<void>();

  /** Signal de rechargement global */
  readonly refresh$ = new BehaviorSubject<void>(undefined);

  constructor(private http: HttpClient) {}

  private get headers(): HttpHeaders {
    const token = localStorage.getItem('tms_token') || '';
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  // ── LISTE ────────────────────────────────────────────────────
  getAll(params?: {
    page?: number;
    size?: number;
    sort?: string;
    statut?: string;
    search?: string;
    clientId?: number;
    dateDebut?: string;
    dateFin?: string;
  }): Observable<Commande[] | CommandePage> {
    let p = new HttpParams();
    if (params?.page    !== undefined) p = p.set('page', params.page);
    if (params?.size    !== undefined) p = p.set('size', params.size);
    if (params?.sort)    p = p.set('sort', params.sort);
    if (params?.statut)  p = p.set('statut', params.statut);
    if (params?.search)  p = p.set('search', params.search);
    if (params?.clientId) p = p.set('clientId', params.clientId);
    if (params?.dateDebut) p = p.set('dateDebut', params.dateDebut);
    if (params?.dateFin)   p = p.set('dateFin', params.dateFin);

    return this.http.get<any>(this.base, { headers: this.headers, params: p });
  }

  getStats(): Observable<CommandeStats> {
    return this.getAll().pipe(
      map((res: any) => {
        const list: Commande[] = Array.isArray(res) ? res : (res.content || []);
        return {
          total:     list.length,
          enAttente: list.filter(c => c.statut === 'EN_ATTENTE').length,
          assignee:  list.filter(c => c.statut === 'ASSIGNEE').length,
          enCours:   list.filter(c => c.statut === 'EN_COURS').length,
          livree:    list.filter(c => c.statut === 'LIVREE').length,
          annulee:   list.filter(c => c.statut === 'ANNULEE').length,
        };
      })
    );
  }

  getById(id: number): Observable<Commande> {
    return this.http.get<Commande>(`${this.base}/${id}`, { headers: this.headers });
  }

  // ── CRUD ─────────────────────────────────────────────────────
  create(data: CommandeFormData): Observable<Commande> {
    return this.http.post<Commande>(this.base, data, { headers: this.headers })
      .pipe(tap(() => this.refresh$.next()));
  }

  update(id: number, data: Partial<CommandeFormData>): Observable<Commande> {
    return this.http.put<Commande>(`${this.base}/${id}`, data, { headers: this.headers })
      .pipe(tap(() => this.refresh$.next()));
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`, { headers: this.headers })
      .pipe(tap(() => this.refresh$.next()));
  }

  updateStatut(id: number, statut: StatutCommande): Observable<Commande> {
    return this.http.patch<Commande>(
      `${this.base}/${id}/statut`,
      { statut },
      { headers: this.headers }
    ).pipe(tap(() => this.refresh$.next()));
  }

  // ── CLIENTS ──────────────────────────────────────────────────
  getClients(search?: string): Observable<Client[]> {
    const p = search ? new HttpParams().set('search', search) : new HttpParams();
    return this.http.get<any>(this.clientBase, { headers: this.headers, params: p }).pipe(
      map(res => Array.isArray(res) ? res : (res.content || []))
    );
  }

  // ── NUMÉRO AUTO ───────────────────────────────────────────────
  generateNumero(): string {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const rand = String(Math.floor(Math.random() * 9000) + 1000);
    return `CMD-${y}${m}${day}-${rand}`;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}