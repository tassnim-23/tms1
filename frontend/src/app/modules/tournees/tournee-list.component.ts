import { Component } from '@angular/core';

@Component({
  selector: 'app-tournee-list',
  template: `
    <div class="page-header">
      <div class="page-header-left">
        <h1 class="page-titre"><mat-icon>route</mat-icon> Planification des tournées</h1>
        <p class="page-sous-titre">Organisez et planifiez vos itinéraires de livraison</p>
      </div>
    </div>
    <div class="tms-card" style="text-align:center;padding:60px 40px;">
      <div style="width:80px;height:80px;border-radius:50%;background:#EBF5FB;display:flex;align-items:center;justify-content:center;margin:0 auto 24px;">
        <mat-icon style="font-size:40px;width:40px;height:40px;color:#1B4F72">route</mat-icon>
      </div>
      <h2 style="font-size:22px;font-weight:700;color:#1e293b;margin-bottom:12px">Module Tournées</h2>
      <p style="color:#64748b;font-size:15px;max-width:480px;margin:0 auto;line-height:1.6">
        Ce module est en cours de développement.<br>Il permettra de planifier et optimiser les itinéraires de vos chauffeurs.
      </p>
    </div>
  `
})
export class TourneeListComponent {}
