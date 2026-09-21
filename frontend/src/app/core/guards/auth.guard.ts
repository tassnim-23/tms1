import { Injectable } from '@angular/core';
import {
  CanActivate, ActivatedRouteSnapshot,
  RouterStateSnapshot, Router
} from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {

  constructor(private auth: AuthService, private router: Router) {}

  canActivate(_route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    const token = this.auth.getToken();
    const user  = this.auth.getCurrentUser();

    // ✅ Vérifie token ET user tous les deux
    if (token && user) {
      return true;
    }

    // Si token présent mais user absent (refresh page) — reconstruire depuis localStorage
    if (token && !user) {
      // AuthService reconstruit l'user depuis tms_user au démarrage,
      // si on arrive ici c'est que tms_user est corrompu — nettoyer et reconnecter
      console.warn('[AuthGuard] Token présent mais user null — nettoyage');
      this.auth.logout();
      return false;
    }

    console.warn('[AuthGuard] Non authentifié — redirection login depuis:', state.url);
    this.router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }
}