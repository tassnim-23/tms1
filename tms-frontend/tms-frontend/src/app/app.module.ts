import { NgModule, NO_ERRORS_SCHEMA, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

// Angular Material — TOUS LES MODULES
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTabsModule } from '@angular/material/tabs';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatStepperModule } from '@angular/material/stepper';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AuthInterceptor } from './core/interceptors/auth.interceptor';

// Layout
import { HeaderComponent } from './modules/layout/header/header.component';
import { SidebarComponent } from './modules/layout/sidebar/sidebar.component';
import { FooterComponent } from './modules/layout/footer/footer.component';

// Shared
import { ConfirmDialogComponent } from './shared/components/confirm-dialog.component';

// Pages publiques
import { LandingPageComponent } from './modules/landing-page/landing-page.component';
import { LoginComponent } from './modules/auth/login/login.component';
import { InscriptionComponent } from './modules/inscription/inscription.component';

// Pages protégées
import { DashboardComponent } from './modules/dashboard/dashboard.component';
import { ClientListComponent } from './modules/clients/components/client-list.component';
import { ClientFormDialogComponent } from './modules/clients/components/client-form-dialog.component';
import { ClientDetailDialogComponent } from './modules/clients/components/client-detail-dialog.component';
import { TransportListComponent } from './modules/transports/transport-list.component';
import { TransportFormDialogComponent } from './modules/transports/transport-form-dialog.component';
import { TourneeListComponent } from './modules/tournees/tournee-list.component';
import { ChauffeurListComponent } from './modules/chauffeurs/chauffeur-list.component';
import { ChauffeurFormDialogComponent } from './modules/chauffeurs/chauffeur-form-dialog.component';
import { VehiculeListComponent } from './modules/vehicules/vehicule-list.component';
import { VehiculeFormDialogComponent } from './modules/vehicules/vehicule-form-dialog.component';
import { RapportsComponent } from './modules/rapports/rapports.component';

import { ConfirmationLivraisonComponent } from './modules/confirmation/confirmation-livraison.component';
// GPS
import { GpsCarteComponent } from './modules/gps/gps-carte.component';

// Demandes inscription
import { DemandesInscriptionComponent } from './modules/demandes-inscription/demandes-inscription.component';

// ✅ NOUVEAU: Composants d'approbation client
import { WaitingApprovalComponent } from './modules/approval/waiting-approval.component';
import { RequestRejectedComponent } from './modules/approval/request-rejected.component';
import { VerifierEmailComponent } from './modules/auth/verifier-email/verifier-email.component';

@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    SidebarComponent,
    FooterComponent,
    ConfirmDialogComponent,
    LandingPageComponent,
    ConfirmationLivraisonComponent,
    LoginComponent,
    InscriptionComponent,
    DashboardComponent,
    ClientListComponent,
    ClientFormDialogComponent,
    TransportListComponent,
    TransportFormDialogComponent,
    TourneeListComponent,
    ChauffeurListComponent,
    ChauffeurFormDialogComponent,
    VehiculeListComponent,
    VehiculeFormDialogComponent,
    RapportsComponent,
    GpsCarteComponent,
    DemandesInscriptionComponent,
    // ✅ NOUVEAU: Composants d'approbation
    WaitingApprovalComponent,
    RequestRejectedComponent,
    VerifierEmailComponent,
  ],
  imports: [
    BrowserModule,
    CommonModule,
    BrowserAnimationsModule,
    HttpClientModule,
    ReactiveFormsModule,
    ClientDetailDialogComponent,
    
    FormsModule,
    AppRoutingModule,
    MatToolbarModule,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatDialogModule,
    MatSnackBarModule,
    MatSelectModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatTooltipModule,
    MatBadgeModule,
    MatDividerModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatTabsModule,
    MatExpansionModule,
    MatStepperModule,
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }
  ],
  schemas: [NO_ERRORS_SCHEMA, CUSTOM_ELEMENTS_SCHEMA],
  bootstrap: [AppComponent]
})
export class AppModule { }