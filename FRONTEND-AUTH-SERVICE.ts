// ✅ FRONTEND - AuthService (MODIFIER)
// Fichier: tms-frontend/tms-frontend/src/app/core/services/auth.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { LoginRequest, LoginResponse, User } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private apiUrl = '/api/auth';
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  private statutApprovalSubject = new BehaviorSubject<string | null>(null);  // ← AJOUTER

  public currentUser$ = this.currentUserSubject.asObservable();
  public statutApproval$ = this.statutApprovalSubject.asObservable();  // ← AJOUTER

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.loadUserFromStorage();
  }

  /**
   * Charger user depuis localStorage au démarrage
   */
  private loadUserFromStorage(): void {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    
    if (storedUser && storedToken) {
      try {
        const user = JSON.parse(storedUser);
        this.currentUserSubject.next(user);
        this.statutApprovalSubject.next(user.statutApproval || null);  // ← AJOUTER
      } catch (e) {
        console.error('Erreur parsing user:', e);
        this.logout();
      }
    }
  }

  /**
   * Login
   */
  login(request: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(
      `${this.apiUrl}/login`,
      request
    ).pipe(
      tap(response => {
        // Stocker token
        localStorage.setItem('token', response.token);

        // Stocker user
        const user: User = {
          id: undefined,
          username: response.username,
          email: response.email,
          role: response.role,
          token: response.token,
          statutApproval: response.statutApproval,  // ← AJOUTER
          demandeInscriptionId: response.demandeInscriptionId,  // ← AJOUTER
          clientId: response.clientId  // ← AJOUTER
        };
        localStorage.setItem('user', JSON.stringify(user));

        // Mettre à jour subjects
        this.currentUserSubject.next(user);
        this.statutApprovalSubject.next(response.statutApproval);  // ← AJOUTER
      })
    );
  }

  /**
   * Logout
   */
  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.currentUserSubject.next(null);
    this.statutApprovalSubject.next(null);  // ← AJOUTER
    this.router.navigate(['/login']);
  }

  /**
   * Get current user
   */
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Get current token
   */
  getToken(): string | null {
    return localStorage.getItem('token');
  }

  /**
   * Check if logged in
   */
  isLoggedIn(): boolean {
    return this.getToken() !== null;
  }

  /**
   * Get statut approval (EN_ATTENTE, APPROUVEE, REJETEE)  ← AJOUTER
   */
  getStatutApproval(): string | null {
    return this.statutApprovalSubject.value;
  }

  /**
   * Check if CLIENT is APPROUVEE  ← AJOUTER
   */
  isClientApproved(): boolean {
    return this.getStatutApproval() === 'APPROUVEE';
  }

  /**
   * Check if CLIENT is EN_ATTENTE  ← AJOUTER
   */
  isClientWaiting(): boolean {
    return this.getStatutApproval() === 'EN_ATTENTE';
  }

  /**
   * Check if CLIENT is REJETEE  ← AJOUTER
   */
  isClientRejected(): boolean {
    return this.getStatutApproval() === 'REJETEE';
  }

  /**
   * Get role
   */
  getRole(): string | null {
    const user = this.getCurrentUser();
    return user ? user.role || null : null;
  }

  /**
   * Check if has role
   */
  hasRole(role: string): boolean {
    return this.getRole() === role;
  }
}
