// ✅ FRONTEND - ClientProfileService (NOUVEAU)
// Fichier: tms-frontend/tms-frontend/src/app/core/services/client-profile.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ClientProfile } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class ClientProfileService {

  private apiUrl = '/api/clients';

  constructor(private http: HttpClient) { }

  /**
   * Récupérer le profil client courant
   */
  getMyProfile(): Observable<ClientProfile> {
    return this.http.get<ClientProfile>(`${this.apiUrl}/me`);
  }

  /**
   * Mettre à jour le profil client courant
   */
  updateMyProfile(profile: Partial<ClientProfile>): Observable<ClientProfile> {
    return this.http.put<ClientProfile>(`${this.apiUrl}/me`, profile);
  }
}
