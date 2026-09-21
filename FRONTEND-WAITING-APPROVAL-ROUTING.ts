// ✅ FRONTEND - WaitingApprovalRoutingModule
// Fichier: tms-frontend/tms-frontend/src/app/modules/auth/waiting-approval/waiting-approval-routing.module.ts

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { WaitingApprovalComponent } from './waiting-approval.component';

const routes: Routes = [
  {
    path: '',
    component: WaitingApprovalComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class WaitingApprovalRoutingModule { }
