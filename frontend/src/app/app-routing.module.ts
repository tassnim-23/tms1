import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { PublicGuard } from './core/guards/public.guard';
import { ApprovedClientGuard } from './core/guards/approved-client.guard';
import { AdminGuard } from './core/guards/admin.guard';
import { GpsCarteComponent } from './modules/gps/gps-carte.component';
import { LandingPageComponent } from './modules/landing-page/landing-page.component';
import { LoginComponent } from './modules/auth/login/login.component';
import { InscriptionComponent } from './modules/inscription/inscription.component';
import { DashboardComponent } from './modules/dashboard/dashboard.component';
import { ClientListComponent } from './modules/clients/components/client-list.component';
import { ChauffeurListComponent } from './modules/chauffeurs/chauffeur-list.component';
import { VehiculeListComponent } from './modules/vehicules/vehicule-list.component';
import { RapportsComponent } from './modules/rapports/rapports.component';
import { DemandesInscriptionComponent } from './modules/demandes-inscription/demandes-inscription.component';
import { WaitingApprovalComponent } from './modules/approval/waiting-approval.component';
import { RequestRejectedComponent } from './modules/approval/request-rejected.component';
import { VerifierEmailComponent } from './modules/auth/verifier-email/verifier-email.component';
import { ConfirmationLivraisonComponent } from './modules/confirmation/confirmation-livraison.component';

const routes: Routes = [
  // ── PAGES PUBLIQUES ──────────────────────────────────────────
  { path: '', canActivate: [PublicGuard], component: LandingPageComponent },
  { path: 'login', canActivate: [PublicGuard], component: LoginComponent },
  { path: 'inscription', component: InscriptionComponent },
  { path: 'gps', component: GpsCarteComponent },
  { path: 'verifier-email', component: VerifierEmailComponent },

  // ── PAGES ADMINISTRATEUR ─────────────────────────────────────
  { path: 'dashboard', canActivate: [AuthGuard, AdminGuard], component: DashboardComponent },
  { path: 'clients', canActivate: [AuthGuard, AdminGuard], component: ClientListComponent },
  { path: 'chauffeurs', canActivate: [AuthGuard, AdminGuard], component: ChauffeurListComponent },
  { path: 'vehicules', canActivate: [AuthGuard, AdminGuard], component: VehiculeListComponent },
  { path: 'demandes', canActivate: [AuthGuard, AdminGuard], component: DemandesInscriptionComponent },
  { path: 'rapports', canActivate: [AuthGuard, AdminGuard], component: RapportsComponent },
  {
    path: 'commandes',
    canActivate: [AuthGuard, AdminGuard],
    loadChildren: () => import('./modules/commandes/commandes.module').then(m => m.CommandesModule)
  },
  {
    path: 'tournees',
    canActivate: [AuthGuard, AdminGuard],
    loadChildren: () => import('./modules/tournees/tournees.module').then(m => m.TourneesModule)
  },

  // ── PAGES D'APPROBATION ──────────────────────────────────────
  { path: 'attente-approbation', canActivate: [AuthGuard], component: WaitingApprovalComponent },
  { path: 'demande-rejetee', canActivate: [AuthGuard], component: RequestRejectedComponent },

  // ── MODULE CLIENT DASHBOARD ──────────────────────────────────
  {
    path: 'client-dashboard',
    canActivate: [AuthGuard, ApprovedClientGuard],
    loadChildren: () => import('./modules/client-dashboard/client-dashboard.module').then(m => m.ClientDashboardModule)
  },
  { path: 'confirmation', component: ConfirmationLivraisonComponent },

  // ── FALLBACK ─────────────────────────────────────────────────
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }