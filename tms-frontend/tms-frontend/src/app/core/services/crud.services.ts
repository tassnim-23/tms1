import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Client, Transport, Chauffeur, Vehicule, DashboardStats, Page } from '../models/models';
import { environment } from '../../../environments/environment';

// ── CLIENT ──────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class ClientService {
  private url = `${environment.apiUrl}/clients`;
  constructor(private http: HttpClient) {}

  getAll(page = 0, size = 10, search = ''): Observable<Page<Client>> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (search) params = params.set('search', search);
    return this.http.get<Page<Client>>(this.url, { params });
  }

  getById(id: number): Observable<Client> {
    return this.http.get<Client>(`${this.url}/${id}`);
  }

  create(client: Partial<Client>): Observable<Client> {
    return this.http.post<Client>(this.url, client);
  }

  update(id: number, client: Partial<Client>): Observable<Client> {
    return this.http.put<Client>(`${this.url}/${id}`, client);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}

// ── COMMANDE ──────────────────────────────────────────── ✅ AJOUTÉ
@Injectable({ providedIn: 'root' })
export class CommandeService {
  private url = `${environment.apiUrl}/commandes`;
  constructor(private http: HttpClient) {}

  getAll(page = 0, size = 100, statut = ''): Observable<any> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (statut) params = params.set('statut', statut);
    return this.http.get<any>(this.url, { params });
  }

  getById(id: number): Observable<any> {
    return this.http.get<any>(`${this.url}/${id}`);
  }

  create(commande: any): Observable<any> {
    return this.http.post<any>(this.url, commande);
  }

  update(id: number, commande: any): Observable<any> {
    return this.http.put<any>(`${this.url}/${id}`, commande);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }

  updateStatut(id: number, statut: string): Observable<any> {
    return this.http.patch<any>(`${this.url}/${id}/statut`, { statut });
  }
}

// ── TRANSPORT ────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class TransportService {
  private url = `${environment.apiUrl}/transports`;
  constructor(private http: HttpClient) {}

  getAll(page = 0, size = 10, statut = ''): Observable<Page<Transport>> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (statut) params = params.set('statut', statut);
    return this.http.get<Page<Transport>>(this.url, { params });
  }

  getById(id: number): Observable<Transport> {
    return this.http.get<Transport>(`${this.url}/${id}`);
  }

  create(transport: Partial<Transport>): Observable<Transport> {
    return this.http.post<Transport>(this.url, transport);
  }

  update(id: number, transport: Partial<Transport>): Observable<Transport> {
    return this.http.put<Transport>(`${this.url}/${id}`, transport);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }

  updateStatut(id: number, statut: string): Observable<Transport> {
    return this.http.patch<Transport>(`${this.url}/${id}/statut`, { statut });
  }
}

// ── CHAUFFEUR ────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class ChauffeurService {
  private url = `${environment.apiUrl}/chauffeurs`;
  constructor(private http: HttpClient) {}

  getAll(page = 0, size = 10): Observable<Page<Chauffeur>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<Page<Chauffeur>>(this.url, { params });
  }

  getById(id: number): Observable<Chauffeur> {
    return this.http.get<Chauffeur>(`${this.url}/${id}`);
  }

  create(chauffeur: Partial<Chauffeur>): Observable<Chauffeur> {
    return this.http.post<Chauffeur>(this.url, chauffeur);
  }

  update(id: number, chauffeur: Partial<Chauffeur>): Observable<Chauffeur> {
    return this.http.put<Chauffeur>(`${this.url}/${id}`, chauffeur);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}

// ── VÉHICULE ─────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class VehiculeService {
  private url = `${environment.apiUrl}/vehicules`;
  constructor(private http: HttpClient) {}

  getAll(page = 0, size = 10): Observable<Page<Vehicule>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<Page<Vehicule>>(this.url, { params });
  }

  getById(id: number): Observable<Vehicule> {
    return this.http.get<Vehicule>(`${this.url}/${id}`);
  }

  create(vehicule: Partial<Vehicule>): Observable<Vehicule> {
    return this.http.post<Vehicule>(this.url, vehicule);
  }

  update(id: number, vehicule: Partial<Vehicule>): Observable<Vehicule> {
    return this.http.put<Vehicule>(`${this.url}/${id}`, vehicule);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}

// ── TABLEAU DE BORD ──────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class DashboardService {
  private url = `${environment.apiUrl}/dashboard`;
  constructor(private http: HttpClient) {}

  getStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.url}/stats`);
  }
}