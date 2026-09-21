import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { ClientDashboardRoutingModule } from './client-dashboard-routing.module';
import { ClientDashboardComponent } from './client-dashboard.component';
import { FacturesComponent } from './components/factures/factures.component';
import { MonProfilComponent } from './components/mon-profil/mon-profil.component';
import { CommandesComponent } from './components/commandes/commandes.component';
import { HistoriqueComponent } from './components/historique/historique.component';
import { SupportComponent } from './components/support/support.component';

@NgModule({
  declarations: [
    ClientDashboardComponent,
    FacturesComponent,
    MonProfilComponent,
    CommandesComponent,
    HistoriqueComponent,
    SupportComponent
  ],
  imports: [
    CommonModule,
    ClientDashboardRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule
  ]
})
export class ClientDashboardModule { }
