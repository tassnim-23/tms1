// ✅ FRONTEND - ClientDashboardRoutingModule
// Fichier: tms-frontend/tms-frontend/src/app/modules/client-dashboard/client-dashboard-routing.module.ts

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ClientDashboardComponent } from './client-dashboard.component';
import { FacturesComponent } from './components/factures/factures.component';
import { MonProfilComponent } from './components/mon-profil/mon-profil.component';
import { CommandesComponent } from './components/commandes/commandes.component';
import { HistoriqueComponent } from './components/historique/historique.component';

const routes: Routes = [
  {
    path: '',
    component: ClientDashboardComponent,
    children: [
      {
        path: 'factures',
        component: FacturesComponent
      },
      {
        path: 'profil',
        component: MonProfilComponent
      },
      {
        path: 'commandes',
        component: CommandesComponent
      },
      {
        path: 'historique',
        component: HistoriqueComponent
      },
      {
        path: '',
        redirectTo: 'factures',
        pathMatch: 'full'
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ClientDashboardRoutingModule { }
