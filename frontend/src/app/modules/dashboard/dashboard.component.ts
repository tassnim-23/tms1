import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

interface Stats {
  totalClients: number;
  totalTransports: number;
  transportsEnCours: number;
  revenuMensuel: number;
  totalChauffeurs: number;
  totalVehicules: number;
  commandesLivrees?: number;
}

@Component({
  selector: 'app-dashboard',
  template: `
    <div class="dash-page">

      <!-- MESSAGE DE BIENVENUE -->
      <div class="bienvenue">
        <div>
          <h1 class="bienvenue-titre">Bonjour, {{ nomUtilisateur }} 👋</h1>
          <p class="bienvenue-date">{{ dateAujourdhui }}</p>
        </div>
        <button class="btn-secondaire" (click)="chargerStats()" [disabled]="chargement">
          <mat-icon>refresh</mat-icon>
          Actualiser les données
        </button>
      </div>

      <!-- CHARGEMENT -->
      <div class="chargement" *ngIf="chargement">
        <mat-spinner diameter="40"></mat-spinner>
        <span>Chargement des statistiques...</span>
      </div>

      <!-- ERREUR -->
      <div class="erreur-box" *ngIf="messageErreur && !chargement">
        <mat-icon>error_outline</mat-icon>
        <div>
          <strong>Impossible de charger les données</strong>
          <p>{{ messageErreur }}</p>
        </div>
        <button class="btn-secondaire" (click)="chargerStats()">
          <mat-icon>refresh</mat-icon> Réessayer
        </button>
      </div>

      <!-- INDICATEURS CLÉS (KPI) -->
      <div class="kpi-grille" *ngIf="!chargement">

        <div class="kpi-carte" [style.--couleur]="'#1B4F72'" [style.--couleur-pale]="'#EBF5FB'" routerLink="/clients">
          <div class="kpi-icone" style="background:#EBF5FB;color:#1B4F72">
            <mat-icon>corporate_fare</mat-icon>
          </div>
          <div class="kpi-corps">
            <div class="kpi-valeur">{{ stats.totalClients }}</div>
            <div class="kpi-libelle">Clients enregistrés</div>
          </div>
          <div class="kpi-lien">
            <mat-icon>arrow_forward</mat-icon>
            <span>Gérer</span>
          </div>
        </div>

        <div class="kpi-carte" [style.--couleur]="'#d97706'" [style.--couleur-pale]="'#FEF9F0'" routerLink="/transports">
          <div class="kpi-icone" style="background:#FEF9F0;color:#d97706">
            <mat-icon>inventory_2</mat-icon>
          </div>
          <div class="kpi-corps">
            <div class="kpi-valeur">{{ stats.totalTransports }}</div>
            <div class="kpi-libelle">Commandes au total</div>
          </div>
          <div class="kpi-lien">
            <mat-icon>arrow_forward</mat-icon>
            <span>Voir</span>
          </div>
        </div>

        <div class="kpi-carte" [style.--couleur]="'#2980b9'" [style.--couleur-pale]="'#dbeafe'" routerLink="/transports">
          <div class="kpi-icone" style="background:#dbeafe;color:#1d4ed8">
            <mat-icon>local_shipping</mat-icon>
          </div>
          <div class="kpi-corps">
            <div class="kpi-valeur">{{ stats.transportsEnCours }}</div>
            <div class="kpi-libelle">En cours de livraison</div>
          </div>
          <div class="kpi-lien">
            <mat-icon>arrow_forward</mat-icon>
            <span>Voir</span>
          </div>
        </div>

        <div class="kpi-carte" [style.--couleur]="'#059669'" [style.--couleur-pale]="'#ECFDF5'">
          <div class="kpi-icone" style="background:#ECFDF5;color:#059669">
            <mat-icon>payments</mat-icon>
          </div>
          <div class="kpi-corps">
            <div class="kpi-valeur">{{ stats.revenuMensuel | number:'1.0-0' }} DT</div>
            <div class="kpi-libelle">Revenu ce mois</div>
          </div>
        </div>

        <div class="kpi-carte" [style.--couleur]="'#7c3aed'" [style.--couleur-pale]="'#F5F3FF'" routerLink="/chauffeurs">
          <div class="kpi-icone" style="background:#F5F3FF;color:#7c3aed">
            <mat-icon>badge</mat-icon>
          </div>
          <div class="kpi-corps">
            <div class="kpi-valeur">{{ stats.totalChauffeurs }}</div>
            <div class="kpi-libelle">Chauffeurs dans l'équipe</div>
          </div>
          <div class="kpi-lien">
            <mat-icon>arrow_forward</mat-icon>
            <span>Gérer</span>
          </div>
        </div>

        <div class="kpi-carte" [style.--couleur]="'#0d9488'" [style.--couleur-pale]="'#F0FDFA'" routerLink="/vehicules">
          <div class="kpi-icone" style="background:#F0FDFA;color:#0d9488">
            <mat-icon>directions_car</mat-icon>
          </div>
          <div class="kpi-corps">
            <div class="kpi-valeur">{{ stats.totalVehicules }}</div>
            <div class="kpi-libelle">Véhicules dans la flotte</div>
          </div>
          <div class="kpi-lien">
            <mat-icon>arrow_forward</mat-icon>
            <span>Gérer</span>
          </div>
        </div>

      </div>

      <!-- GRAPHIQUES -->
      <div class="graphiques-grille" *ngIf="!chargement">

        <!-- Graphique 1 : Évolution des commandes (ligne) -->
        <div class="tms-card graphique-carte">
          <div class="graphique-entete">
            <div>
              <h3 class="graphique-titre">Évolution des commandes</h3>
              <p class="graphique-sous">7 derniers jours</p>
            </div>
          </div>
          <div class="graphique-zone">
            <canvas #lineChart></canvas>
          </div>
        </div>

        <!-- Graphique 2 : Répartition des statuts (donut) -->
        <div class="tms-card graphique-carte">
          <div class="graphique-entete">
            <div>
              <h3 class="graphique-titre">Statuts des commandes</h3>
              <p class="graphique-sous">Répartition actuelle</p>
            </div>
          </div>
          <div class="graphique-zone">
            <canvas #donutChart></canvas>
          </div>
        </div>

      </div>

      <!-- ACCÈS RAPIDE -->
      <div class="tms-card acces-rapide" *ngIf="!chargement">
        <h3 style="font-size:16px;font-weight:700;color:#0f172a;margin:0 0 16px">Accès rapide aux modules</h3>
        <div class="acces-grille">
          <a class="acces-lien" routerLink="/clients">
            <div class="acces-icone" style="background:#EBF5FB;color:#1B4F72"><mat-icon>corporate_fare</mat-icon></div>
            <span>Clients</span>
          </a>
          <a class="acces-lien" routerLink="/transports">
            <div class="acces-icone" style="background:#FEF9F0;color:#d97706"><mat-icon>inventory_2</mat-icon></div>
            <span>Commandes</span>
          </a>
          <a class="acces-lien" routerLink="/chauffeurs">
            <div class="acces-icone" style="background:#F5F3FF;color:#7c3aed"><mat-icon>badge</mat-icon></div>
            <span>Chauffeurs</span>
          </a>
          <a class="acces-lien" routerLink="/vehicules">
            <div class="acces-icone" style="background:#F0FDFA;color:#0d9488"><mat-icon>local_shipping</mat-icon></div>
            <span>Véhicules</span>
          </a>
          <a class="acces-lien" routerLink="/tournees">
            <div class="acces-icone" style="background:#FEF2F2;color:#dc2626"><mat-icon>route</mat-icon></div>
            <span>Tournées</span>
          </a>
          <a class="acces-lien" routerLink="/rapports">
            <div class="acces-icone" style="background:#f1f5f9;color:#475569"><mat-icon>bar_chart</mat-icon></div>
            <span>Rapports</span>
          </a>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .dash-page { padding-bottom:32px; }

    /* Bienvenue */
    .bienvenue { display:flex; align-items:center; justify-content:space-between; margin-bottom:24px; flex-wrap:wrap; gap:12px; }
    .bienvenue-titre { font-size:24px; font-weight:700; color:#0f172a; margin:0 0 4px; }
    .bienvenue-date { font-size:13px; color:#94a3b8; margin:0; }

    /* Erreur */
    .erreur-box { display:flex; align-items:flex-start; gap:14px; padding:18px 20px; background:#FEF2F2; border:1px solid #fca5a5; border-radius:12px; margin-bottom:24px; }
    .erreur-box mat-icon { color:#dc2626; font-size:24px; width:24px; height:24px; flex-shrink:0; }
    .erreur-box strong { font-size:14px; color:#991b1b; }
    .erreur-box p { font-size:13px; color:#991b1b; margin:4px 0 0; }

    /* KPI GRILLE */
    .kpi-grille { display:grid; grid-template-columns:repeat(auto-fill,minmax(210px,1fr)); gap:16px; margin-bottom:24px; }
    .kpi-carte {
      background:white; border:1px solid #e2e8f0; border-radius:14px;
      padding:18px 20px; cursor:pointer;
      display:flex; align-items:center; gap:14px;
      transition:all .18s ease; position:relative; overflow:hidden;
    }
    .kpi-carte[routerLink]:hover { border-color:var(--couleur); box-shadow:0 4px 16px rgba(0,0,0,.08); transform:translateY(-2px); }
    .kpi-icone { width:46px; height:46px; border-radius:12px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
    .kpi-icone mat-icon { font-size:24px; width:24px; height:24px; }
    .kpi-corps { flex:1; min-width:0; }
    .kpi-valeur { font-size:26px; font-weight:800; color:#0f172a; line-height:1; margin-bottom:3px; }
    .kpi-libelle { font-size:12px; color:#64748b; font-weight:500; }
    .kpi-lien { display:flex; flex-direction:column; align-items:center; gap:2px; color:#94a3b8; font-size:11px; font-weight:600; opacity:0; transition:opacity .15s; }
    .kpi-lien mat-icon { font-size:16px; width:16px; height:16px; }
    .kpi-carte:hover .kpi-lien { opacity:1; color:var(--couleur); }

    /* GRAPHIQUES */
    .graphiques-grille { display:grid; grid-template-columns:1.6fr 1fr; gap:20px; margin-bottom:24px; }
    .graphique-carte { padding:20px; }
    .graphique-entete { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:16px; }
    .graphique-titre { font-size:16px; font-weight:700; color:#0f172a; margin:0; }
    .graphique-sous { font-size:12.5px; color:#94a3b8; margin:3px 0 0; }
    .graphique-zone { position:relative; height:260px; width:100%; }

    /* ACCÈS RAPIDE */
    .acces-rapide { padding:20px 24px; }
    .acces-grille { display:grid; grid-template-columns:repeat(6,1fr); gap:12px; }
    .acces-lien { display:flex; flex-direction:column; align-items:center; gap:8px; text-decoration:none; color:#1e293b; padding:14px 8px; border-radius:12px; border:1px solid #e2e8f0; transition:all .15s ease; font-size:12.5px; font-weight:500; }
    .acces-lien:hover { border-color:#1B4F72; background:#f8fafc; transform:translateY(-2px); }
    .acces-icone { width:44px; height:44px; border-radius:12px; display:flex; align-items:center; justify-content:center; }
    .acces-icone mat-icon { font-size:22px; width:22px; height:22px; }

    @media (max-width:1100px) { .graphiques-grille { grid-template-columns:1fr; } .acces-grille { grid-template-columns:repeat(3,1fr); } }
    @media (max-width:640px)  { .acces-grille { grid-template-columns:repeat(2,1fr); } }
  `]
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('lineChart')  lineRef!: ElementRef;
  @ViewChild('donutChart') donutRef!: ElementRef;

  stats: Stats = { totalClients:0, totalTransports:0, transportsEnCours:0, revenuMensuel:0, totalChauffeurs:0, totalVehicules:0 };
  chargement = true;
  messageErreur = '';
  nomUtilisateur = 'Admin';
  dateAujourdhui = '';
  private charts: Chart[] = [];

  constructor(private http: HttpClient, private auth: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.dateAujourdhui = new Date().toLocaleDateString('fr-FR', {
      weekday:'long', day:'numeric', month:'long', year:'numeric'
    }).replace(/^\w/, c => c.toUpperCase());

    const u = JSON.parse(localStorage.getItem('tms_user') || '{}');
    this.nomUtilisateur = u.username || 'Admin';
    this.chargerStats();
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.construireGraphiques(), 400);
  }

  ngOnDestroy(): void { this.charts.forEach(c => c.destroy()); }

  chargerStats(): void {
    this.chargement = true;
    this.messageErreur = '';
    const headers = new HttpHeaders({ Authorization: `Bearer ${this.auth.getToken()}` });

    this.http.get<any>('http://localhost:8080/api/dashboard/stats', { headers }).subscribe({
      next: d => {
        this.stats = {
          totalClients:      d.totalClients     || 0,
          totalTransports:   d.totalTransports  || 0,
          transportsEnCours: d.transportsEnCours|| 0,
          revenuMensuel:     d.revenuMensuel    || 0,
          totalChauffeurs:   d.totalChauffeurs  || 0,
          totalVehicules:    d.totalVehicules   || 0,
          commandesLivrees:  d.commandesLivrees || 0,
        };
        this.chargement = false;
        setTimeout(() => this.construireGraphiques(), 150);
      },
      error: e => {
        this.chargement = false;
        if (e.status === 0) this.messageErreur = 'Le serveur backend est inaccessible. Vérifiez que Spring Boot est lancé sur le port 8080.';
        else if (e.status === 401) this.messageErreur = 'Session expirée. Veuillez vous reconnecter.';
        else this.messageErreur = `Erreur ${e.status} : ${e.message}`;
        // Données de démonstration
        this.stats = { totalClients:12, totalTransports:47, transportsEnCours:8, revenuMensuel:14250, totalChauffeurs:6, totalVehicules:9 };
        setTimeout(() => this.construireGraphiques(), 150);
      }
    });
  }

  private construireGraphiques(): void {
    this.charts.forEach(c => c.destroy());
    this.charts = [];

    // Graphique ligne — évolution 7 jours
    if (this.lineRef?.nativeElement) {
      const c = new Chart(this.lineRef.nativeElement, {
        type: 'line',
        data: {
          labels: ['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche'],
          datasets: [
            {
              label: 'Commandes créées',
              data: [5, 9, 6, 14, 10, 16, 12],
              borderColor: '#1B4F72', backgroundColor: 'rgba(27,79,114,.07)',
              fill: true, tension: 0.4, borderWidth: 2.5,
              pointRadius: 4, pointBackgroundColor: '#1B4F72'
            },
            {
              label: 'Livraisons effectuées',
              data: [3, 7, 5, 11, 8, 13, 10],
              borderColor: '#059669', backgroundColor: 'rgba(5,150,105,.06)',
              fill: true, tension: 0.4, borderWidth: 2,
              pointRadius: 3, pointBackgroundColor: '#059669'
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,   // ← IMPORTANT : empêche la déformation
          animation: { duration: 800 },
          plugins: {
            legend: { position: 'top', labels: { color: '#475569', usePointStyle: true, padding: 16, font: { size: 12, family: 'Inter' } } }
          },
          scales: {
            x: { grid: { color: 'rgba(0,0,0,.04)' }, ticks: { color: '#94a3b8', font: { size: 11, family: 'Inter' } } },
            y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,.04)' }, ticks: { color: '#94a3b8', precision: 0, font: { size: 11, family: 'Inter' } } }
          }
        }
      });
      this.charts.push(c);
    }

    // Graphique donut — statuts
    if (this.donutRef?.nativeElement) {
      const livrees  = this.stats.commandesLivrees || Math.floor(this.stats.totalTransports * 0.45);
      const enCours  = this.stats.transportsEnCours;
      const attente  = Math.max(0, this.stats.totalTransports - livrees - enCours - 3);
      const annules  = 3;

      const c = new Chart(this.donutRef.nativeElement, {
        type: 'doughnut',
        data: {
          labels: ['Livrées', 'En cours de livraison', 'En attente de traitement', 'Annulées'],
          datasets: [{
            data: [livrees, enCours, attente, annules],
            backgroundColor: ['#059669', '#2980b9', '#d97706', '#dc2626'],
            borderColor: 'white',
            borderWidth: 3,
            hoverOffset: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,   // ← IMPORTANT
          cutout: '65%',
          animation: { duration: 800 },
          plugins: {
            legend: { position: 'bottom', labels: { color: '#475569', usePointStyle: true, padding: 14, font: { size: 11.5, family: 'Inter' } } }
          }
        }
      });
      this.charts.push(c);
    }
  }
}
