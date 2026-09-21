// ✅ FRONTEND - RequestRejectedComponent
// Fichier: tms-frontend/tms-frontend/src/app/modules/auth/request-rejected/request-rejected.component.ts

import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-request-rejected',
  templateUrl: './request-rejected.component.html',
  styleUrls: ['./request-rejected.component.scss']
})
export class RequestRejectedComponent implements OnInit {

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
  }

  /**
   * Logout
   */
  logout(): void {
    this.authService.logout();
  }

  /**
   * Retour à l'accueil
   */
  goHome(): void {
    this.router.navigate(['/landing-page']);
  }
}
