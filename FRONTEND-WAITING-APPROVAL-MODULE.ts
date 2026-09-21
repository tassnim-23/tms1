// ✅ FRONTEND - WaitingApprovalModule
// Fichier: tms-frontend/tms-frontend/src/app/modules/auth/waiting-approval/waiting-approval.module.ts

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

import { WaitingApprovalRoutingModule } from './waiting-approval-routing.module';
import { WaitingApprovalComponent } from './waiting-approval.component';

@NgModule({
  declarations: [WaitingApprovalComponent],
  imports: [
    CommonModule,
    WaitingApprovalRoutingModule,
    MatIconModule,
    MatButtonModule
  ]
})
export class WaitingApprovalModule { }
