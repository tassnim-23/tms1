import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class PublicGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}

  canActivate(): boolean {
    // Utilise getToken() car c'est la méthode disponible dans AuthService
    if (this.auth.getToken()) {
      this.router.navigate(['/dashboard']);
      return false;
    }
    return true;
  }
}