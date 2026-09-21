import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError, tap } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { LoginRequest, LoginResponse, User } from '../models/models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  private statutApprovalSubject = new BehaviorSubject<string | null>(null);  // ✅ NOUVEAU
  public currentUser$ = this.currentUserSubject.asObservable();
  public statutApproval$ = this.statutApprovalSubject.asObservable();  // ✅ NOUVEAU

  constructor(private http: HttpClient, private router: Router) {
    const stored = localStorage.getItem('tms_user');
    if (stored) {
      try {
        const user = JSON.parse(stored);
        this.currentUserSubject.next(user);
        this.statutApprovalSubject.next(user.statutApproval || null);  // ✅ NOUVEAU
      } catch {
        localStorage.removeItem('tms_user');
      }
    }
  }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap((response: LoginResponse) => {
        // Ne sauvegarder que si on a un vrai token (pas un 403)
        if (!response.token) return;
        const user: User = {
         id: response.token ? 1 : undefined,
         username: response.username,
         email: response.email,
         token: response.token,
         role: response.roles?.includes('ADMIN') ? 'ADMIN' : (response.role || 'CLIENT'),
         statutApproval: response.statutApproval || 'EN_ATTENTE',
         clientId: response.clientId,
        };
        localStorage.setItem('tms_user', JSON.stringify(user));
        localStorage.setItem('tms_token', response.token);
        this.currentUserSubject.next(user);
        this.statutApprovalSubject.next(user.statutApproval || null);
      }),
      catchError((error: HttpErrorResponse) => {
        // Laisser passer l'erreur telle quelle pour que le composant la gère
        return throwError(() => error);
      })
    );
  }

  logout(): void {
    localStorage.removeItem('tms_user');
    localStorage.removeItem('tms_token');
    this.currentUserSubject.next(null);
    this.statutApprovalSubject.next(null);  // ✅ NOUVEAU
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem('tms_token');
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  // ✅ NOUVEAU: Méthode pour vérifier l'approbation du client
  isClientApproved(): boolean {
    const user = this.getCurrentUser();
    return user?.statutApproval === 'APPROUVEE';
  }

  // ✅ NOUVEAU: Méthode pour obtenir le statut d'approbation
  getStatutApproval(): string | null {
    return this.statutApprovalSubject.value;
  }

  hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    return user?.role === role;
  }
}