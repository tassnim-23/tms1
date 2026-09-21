// ✅ FRONTEND - ApprovedClientGuard (NOUVEAU)
// Fichier: tms-frontend/tms-frontend/src/app/core/guards/approved-client.guard.ts

import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class ApprovedClientGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {

    const user = this.authService.getCurrentUser();
    const statutApproval = this.authService.getStatutApproval();

    // ❌ Non authentifié
    if (!this.authService.isLoggedIn() || !user) {
      this.router.navigate(['/login']);
      return false;
    }

    // ✅ Client approuvé
    if (this.authService.isClientApproved()) {
      return true;
    }

    // ⏳ En attente d'approbation
    if (this.authService.isClientWaiting()) {
      this.router.navigate(['/attente-approbation']);
      return false;
    }

    // ❌ Demande rejetée
    if (this.authService.isClientRejected()) {
      this.router.navigate(['/demande-rejetee']);
      return false;
    }

    // Cas par défaut: rediriger vers attente
    this.router.navigate(['/attente-approbation']);
    return false;
  }
}
