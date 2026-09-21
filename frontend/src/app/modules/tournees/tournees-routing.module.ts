import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TourneeListComponent }   from './components/tournee-list/tournee-list.component';
import { TourneeFormComponent }   from './components/tournee-form/tournee-form.component';
import { TourneeDetailComponent } from './components/tournee-detail/tournee-detail.component';
import { OptimisationComponent }  from './components/optimisation/optimisation.component';
const routes: Routes = [
  { path: '',         component: TourneeListComponent,   title: 'Tournées' },
  { path: 'optimiser',   component: OptimisationComponent,  title: 'Optimisation' }, // ← AJOUTE avant :id
  { path: 'new',      component: TourneeFormComponent,   title: 'Nouvelle tournée' },
  { path: ':id',      component: TourneeDetailComponent, title: 'Détail tournée' },
  { path: ':id/edit', component: TourneeFormComponent,   title: 'Modifier tournée' },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TourneesRoutingModule {}
