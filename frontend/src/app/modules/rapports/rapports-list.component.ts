import { Component } from '@angular/core';
import { Router } from '@angular/router';

interface RapportCard {
  titre: string;
  description: string;
  icon: string;
  couleur: string;
  route: string;
  badge?: string;
}

@Component({
  selector: 'app-rapports-list',
  template: `
    <div class="page-header">
      <h1><mat-icon>assessment</mat-icon> Rapports & Analyses</h1>
      <span class="subtitle">Visualisez et exportez les données de votre activité</span>
    </div>

    <div class="cards-grid">
      <mat-card *ngFor="let r of rapports" class="rapport-card" (click)="naviguer(r.route)">
        <div class="card-top" [style.background]="r.couleur">
          <mat-icon class="card-icon">{{ r.icon }}</mat-icon>
          <span *ngIf="r.badge" class="badge">{{ r.badge }}</span>
        </div>
        <mat-card-content class="card-body">
          <h3>{{ r.titre }}</h3>
          <p>{{ r.description }}</p>
        </mat-card-content>
        <mat-card-actions>
          <button mat-button color="primary">
            <mat-icon>open_in_new</mat-icon> Ouvrir
          </button>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .page-header { margin-bottom: 32px; }
    .page-header h1 { display: flex; align-items: center; gap: 10px; font-size: 26px; color: #1B4F72; margin: 0 0 4px; }
    .subtitle { color: #666; font-size: 14px; }
    .cards-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 24px; }
    .rapport-card { border-radius: 16px; cursor: pointer; transition: transform .2s, box-shadow .2s; overflow: hidden; padding: 0; }
    .rapport-card:hover { transform: translateY(-4px); box-shadow: 0 8px 30px rgba(0,0,0,.15); }
    .card-top { height: 100px; display: flex; align-items: center; justify-content: center; position: relative; }
    .card-icon { font-size: 48px; width: 48px; height: 48px; color: white; }
    .badge { position: absolute; top: 10px; right: 10px; background: rgba(255,255,255,.3);
             color: white; border-radius: 12px; padding: 2px 10px; font-size: 11px; font-weight: 700; }
    .card-body { padding: 16px 16px 0; }
    .card-body h3 { margin: 0 0 6px; font-size: 16px; font-weight: 700; color: #1B4F72; }
    .card-body p { margin: 0; font-size: 13px; color: #666; line-height: 1.5; }
    mat-card-actions { padding: 8px 8px 8px; }
  `]
})
export class RapportsListComponent {
  rapports: RapportCard[] = [
    {
      titre: 'Rapport Livraisons',
      description: 'Suivi des commandes, taux de livraison, revenus et évolution mensuelle.',
      icon: 'local_shipping',
      couleur: 'linear-gradient(135deg, #1B4F72, #2980b9)',
      route: '/rapports/livraisons',
      badge: 'Commandes'
    },
    {
      titre: 'Rapport Chauffeurs',
      description: 'Performance des chauffeurs, tournées effectuées, disponibilité et permis.',
      icon: 'person',
      couleur: 'linear-gradient(135deg, #27AE60, #2ecc71)',
      route: '/rapports/chauffeurs',
      badge: 'RH'
    },
    {
      titre: 'Rapport Véhicules',
      description: 'Utilisation de la flotte, statuts, kilométrage et maintenances.',
      icon: 'directions_car',
      couleur: 'linear-gradient(135deg, #E67E22, #f39c12)',
      route: '/rapports/vehicules',
      badge: 'Flotte'
    },
    {
      titre: 'Rapport Clients',
      description: 'Chiffre d\'affaires par client, commandes et taux de fidélité.',
      icon: 'people',
      couleur: 'linear-gradient(135deg, #8e44ad, #9b59b6)',
      route: '/rapports/clients',
      badge: 'CRM'
    },
    {
      titre: 'Rapport Tournées',
      description: 'Planification et suivi des tournées, distances et efficacité.',
      icon: 'map',
      couleur: 'linear-gradient(135deg, #E74C3C, #c0392b)',
      route: '/rapports/tournees',
      badge: 'Planning'
    },
    {
      titre: 'Rapport Personnalisé',
      description: 'Créez votre propre rapport en combinant métriques et graphiques.',
      icon: 'tune',
      couleur: 'linear-gradient(135deg, #2c3e50, #34495e)',
      route: '/rapports/personnalise',
      badge: '✨ Pro'
    }
  ];

  constructor(private router: Router) {}
  naviguer(route: string): void { this.router.navigate([route]); }
}
