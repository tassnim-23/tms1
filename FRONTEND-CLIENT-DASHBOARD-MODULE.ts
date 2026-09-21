// ✅ FRONTEND - ClientDashboardModule (NOUVEAU MODULE)
// Fichier: tms-frontend/tms-frontend/src/app/modules/client-dashboard/client-dashboard.module.ts

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule } from '@angular/material/snack-bar';

import { ClientDashboardRoutingModule } from './client-dashboard-routing.module';
import { ClientDashboardComponent } from './client-dashboard.component';
import { FacturesComponent } from './components/factures/factures.component';
import { MonProfilComponent } from './components/mon-profil/mon-profil.component';
import { CommandesComponent } from './components/commandes/commandes.component';
import { HistoriqueComponent } from './components/historique/historique.component';

@NgModule({
  declarations: [
    ClientDashboardComponent,
    FacturesComponent,
    MonProfilComponent,
    CommandesComponent,
    HistoriqueComponent
  ],
  imports: [
    CommonModule,
    HttpClientModule,
    ReactiveFormsModule,
    FormsModule,
    ClientDashboardRoutingModule,
    MatTabsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatToolbarModule,
    MatSidenavModule,
    MatListModule,
    MatTableModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ]
})
export class ClientDashboardModule { }
