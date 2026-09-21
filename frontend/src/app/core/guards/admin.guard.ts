// src/app/core/guards/admin.guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class AdminGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}

canActivate(): boolean {
  const user = this.auth.getCurrentUser();
  console.log('[AdminGuard] user:', user); // ← log temporaire
  
  if (user?.role === 'ADMIN') return true;
  
  if (user?.statutApproval === 'APPROUVEE') {
    this.router.navigate(['/client-dashboard']);
  } else {
    this.router.navigate(['/login']);
  }
  return false;
}
}