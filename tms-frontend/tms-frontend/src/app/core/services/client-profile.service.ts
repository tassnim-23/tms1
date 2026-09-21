import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ClientProfile } from '../models/models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ClientProfileService {
  private apiUrl = `${environment.apiUrl}/clients`;

  constructor(private http: HttpClient) {}

  /**
   * Récupérer le profil du client actuellement connecté
   */
  getMyProfile(): Observable<ClientProfile> {
    return this.http.get<ClientProfile>(`${this.apiUrl}/me`);
  }

  /**
   * Mettre à jour le profil du client
   */
  updateProfile(profile: Partial<ClientProfile>): Observable<ClientProfile> {
    return this.http.put<ClientProfile>(`${this.apiUrl}/me`, profile);
  }

  /**
   * Récupérer un client par ID
   */
  getClientById(id: number): Observable<ClientProfile> {
    return this.http.get<ClientProfile>(`${this.apiUrl}/${id}`);
  }
}
