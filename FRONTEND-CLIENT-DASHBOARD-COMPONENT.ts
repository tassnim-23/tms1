// ✅ FRONTEND - ClientDashboardComponent
// Fichier: tms-frontend/tms-frontend/src/app/modules/client-dashboard/client-dashboard.component.ts

import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { User } from '../../core/models/models';

@Component({
  selector: 'app-client-dashboard',
  templateUrl: './client-dashboard.component.html',
  styleUrls: ['./client-dashboard.component.scss']
})
export class ClientDashboardComponent implements OnInit {

  currentUser: User | null = null;
  sidenavOpen = true;

  constructor(
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    
    // Vérifier si l'utilisateur est approuvé
    if (!this.authService.isClientApproved()) {
      this.router.navigate(['/attente-approbation']);
    }
  }

  /**
   * Naviguer vers une section du dashboard
   */
  navigateTo(path: string): void {
    this.router.navigate(['/client-dashboard', path]);
  }

  /**
   * Toggle sidenav
   */
  toggleSidenav(): void {
    this.sidenavOpen = !this.sidenavOpen;
  }

  /**
   * Logout
   */
  logout(): void {
    this.authService.logout();
  }
}
