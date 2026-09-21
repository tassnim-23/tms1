// ✅ FRONTEND - RequestRejectedModule
// Fichier: tms-frontend/tms-frontend/src/app/modules/auth/request-rejected/request-rejected.module.ts

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

import { RequestRejectedRoutingModule } from './request-rejected-routing.module';
import { RequestRejectedComponent } from './request-rejected.component';

@NgModule({
  declarations: [RequestRejectedComponent],
  imports: [
    CommonModule,
    RequestRejectedRoutingModule,
    MatIconModule,
    MatButtonModule
  ]
})
export class RequestRejectedModule { }
