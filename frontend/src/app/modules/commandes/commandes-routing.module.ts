import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CommandeListComponent }   from './components/commande-list/commande-list.component';
import { CommandeFormComponent }   from './components/commande-form/commande-form.component';
import { CommandeDetailComponent } from './components/commande-detail/commande-detail.component';

const routes: Routes = [
  { path: '',          component: CommandeListComponent   },
  { path: 'new',       component: CommandeFormComponent   },
  { path: ':id/edit',  component: CommandeFormComponent   },  // ← AVANT :id
  { path: ':id',       component: CommandeDetailComponent },  // ← APRÈS
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CommandesRoutingModule {}