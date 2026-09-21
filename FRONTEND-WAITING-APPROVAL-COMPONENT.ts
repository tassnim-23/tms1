// ✅ FRONTEND - WaitingApprovalComponent
// Fichier: tms-frontend/tms-frontend/src/app/modules/auth/waiting-approval/waiting-approval.component.ts

import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-waiting-approval',
  templateUrl: './waiting-approval.component.html',
  styleUrls: ['./waiting-approval.component.scss']
})
export class WaitingApprovalComponent implements OnInit {

  username: string = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    if (user && user.username) {
      this.username = user.username;
    }

    // Si l'utilisateur est approuvé, le rediriger
    if (this.authService.isClientApproved()) {
      this.router.navigate(['/client-dashboard']);
    }
  }

  /**
   * Logout
   */
  logout(): void {
    this.authService.logout();
  }

  /**
   * Actualiser le statut
   */
  refreshStatus(): void {
    // En pratique, faire une requête API pour vérifier le statut
    // Pour la démo, on peut recharger la page
    window.location.reload();
  }
}
