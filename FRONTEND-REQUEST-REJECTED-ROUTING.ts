// ✅ FRONTEND - RequestRejectedRoutingModule
// Fichier: tms-frontend/tms-frontend/src/app/modules/auth/request-rejected/request-rejected-routing.module.ts

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RequestRejectedComponent } from './request-rejected.component';

const routes: Routes = [
  {
    path: '',
    component: RequestRejectedComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class RequestRejectedRoutingModule { }
