// ✅ FRONTEND - App Routing Module (MODIFIER)
// Fichier: tms-frontend/tms-frontend/src/app/app-routing.module.ts

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { PublicGuard } from './core/guards/public.guard';
import { ApprovedClientGuard } from './core/guards/approved-client.guard';  // ← AJOUTER

const routes: Routes = [
  // Routes publiques
  {
    path: 'landing-page',
    loadChildren: () => import('./modules/landing-page/landing-page.module')
      .then(m => m.LandingPageModule),
    canActivate: [PublicGuard]
  },

  // Auth routes
  {
    path: 'login',
    loadChildren: () => import('./modules/auth/login/login.module')
      .then(m => m.LoginModule),
    canActivate: [PublicGuard]
  },

  {
    path: 'inscription',
    loadChildren: () => import('./modules/inscription/inscription.module')
      .then(m => m.InscriptionModule),
    canActivate: [PublicGuard]
  },

  // ✅ AJOUTER: Routes d'attente et rejet
  {
    path: 'attente-approbation',
    loadChildren: () => import('./modules/auth/waiting-approval/waiting-approval.module')
      .then(m => m.WaitingApprovalModule),
    canActivate: [AuthGuard]
  },

  {
    path: 'demande-rejetee',
    loadChildren: () => import('./modules/auth/request-rejected/request-rejected.module')
      .then(m => m.RequestRejectedModule),
    canActivate: [AuthGuard]
  },

  // ✅ AJOUTER: Dashboard client avec guard
  {
    path: 'client-dashboard',
    loadChildren: () => import('./modules/client-dashboard/client-dashboard.module')
      .then(m => m.ClientDashboardModule),
    canActivate: [AuthGuard, ApprovedClientGuard]  // ← Le guard vérifie l'approbation
  },

  // Admin routes
  {
    path: 'admin',
    loadChildren: () => import('./modules/admin/admin.module')
      .then(m => m.AdminModule),
    canActivate: [AuthGuard]
  },

  // Routes existantes protégées
  {
    path: 'chauffeurs',
    loadChildren: () => import('./modules/chauffeurs/chauffeurs.module')
      .then(m => m.ChauffeurModule),
    canActivate: [AuthGuard]
  },

  {
    path: 'clients',
    loadChildren: () => import('./modules/clients/clients.module')
      .then(m => m.ClientsModule),
    canActivate: [AuthGuard]
  },

  {
    path: 'commandes',
    loadChildren: () => import('./modules/commandes/commandes.module')
      .then(m => m.CommandesModule),
    canActivate: [AuthGuard]
  },

  {
    path: 'vehicules',
    loadChildren: () => import('./modules/vehicules/vehicules.module')
      .then(m => m.VehiculesModule),
    canActivate: [AuthGuard]
  },

  // Route par défaut
  {
    path: '',
    redirectTo: '/landing-page',
    pathMatch: 'full'
  },

  // 404
  {
    path: '**',
    redirectTo: '/landing-page'
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {
    preloadAllModules: true,
    useHash: false,
    enableTracing: false
  })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
