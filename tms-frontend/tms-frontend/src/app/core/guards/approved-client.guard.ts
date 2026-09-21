import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Observable, of } from 'rxjs';

/**
 * Guard pour vérifier que le client est approuvé.
 * Ne s'applique qu'à la route parente /client-dashboard,
 * pas aux routes enfants (commandes, factures, etc.)
 */
@Injectable({ providedIn: 'root' })
export class ApprovedClientGuard implements CanActivate {

  constructor(private authService: AuthService, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {

    // Relit depuis localStorage à chaque fois pour éviter problème BehaviorSubject
    const stored = localStorage.getItem('tms_user');
    let statut: string | null = null;

    if (stored) {
      try {
        const user = JSON.parse(stored);
        statut = user?.statutApproval || null;
      } catch {
        statut = null;
      }
    }

    if (statut === 'APPROUVEE') {
      return of(true);
    } else if (statut === 'REJETEE') {
      this.router.navigate(['/demande-rejetee']);
      return of(false);
    } else {
      this.router.navigate(['/attente-approbation']);
      return of(false);
    }
  }
}