import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../../core/services/auth.service';

const TITRES_PAGES: Record<string, { titre: string; icone: string }> = {
  '/dashboard':  { titre: 'Tableau de bord',          icone: 'dashboard' },
  '/clients':    { titre: 'Gestion des clients',       icone: 'corporate_fare' },
  '/transports': { titre: 'Commandes de transport',    icone: 'inventory_2' },
  '/chauffeurs': { titre: 'Gestion des chauffeurs',    icone: 'badge' },
  '/vehicules':  { titre: 'Parc de véhicules',         icone: 'local_shipping' },
  '/tournees':   { titre: 'Planification des tournées',icone: 'route' },
  '/rapports':   { titre: 'Rapports et exports',       icone: 'bar_chart' },
};

@Component({
  selector: 'app-header',
  template: `
    <header class="header">

      <!-- TITRE PAGE -->
      <div class="header-titre">
        <mat-icon class="header-icone">{{ pageCourante.icone }}</mat-icon>
        <h1 class="header-h1">{{ pageCourante.titre }}</h1>
      </div>

      <!-- DROITE : NOTIFS + PROFIL -->
      <div class="header-droite">

        <!-- Date -->
        <span class="header-date">{{ dateAujourdhui }}</span>

        <!-- Notifications -->
        <button class="btn-notif" [matMenuTriggerFor]="menuNotifs" matTooltip="Notifications">
          <mat-icon>notifications_none</mat-icon>
          <span class="notif-point" *ngIf="nbNotifs > 0">{{ nbNotifs }}</span>
        </button>

        <mat-menu #menuNotifs="matMenu" xPosition="before">
          <div class="menu-notifs-titre">Notifications ({{ nbNotifs }})</div>
          <div class="menu-notif-item" *ngFor="let n of notifications">
            <div class="notif-icone" [ngClass]="'notif-icone-' + n.type">
              <mat-icon>{{ n.icone }}</mat-icon>
            </div>
            <div class="notif-corps">
              <div class="notif-message">{{ n.message }}</div>
              <div class="notif-temps">{{ n.temps }}</div>
            </div>
          </div>
          <div class="menu-notifs-pied">
            <button mat-button (click)="nbNotifs = 0">Tout marquer comme lu</button>
          </div>
        </mat-menu>

        <!-- Profil -->
        <button class="btn-profil" [matMenuTriggerFor]="menuProfil">
          <div class="avatar">{{ initialesUtilisateur }}</div>
          <div class="profil-info">
            <span class="profil-nom">{{ nomUtilisateur }}</span>
            <span class="profil-role">Administrateur</span>
          </div>
          <mat-icon class="profil-fleche">keyboard_arrow_down</mat-icon>
        </button>

        <mat-menu #menuProfil="matMenu" xPosition="before">
          <div class="menu-profil-entete">
            <div class="avatar avatar-lg">{{ initialesUtilisateur }}</div>
            <div>
              <div class="menu-profil-nom">{{ nomUtilisateur }}</div>
              <div class="menu-profil-email">admin&#64;grpo.tn</div>
            </div>
          </div>
          <mat-divider></mat-divider>
          <button mat-menu-item>
            <mat-icon>person_outline</mat-icon> Mon profil
          </button>
          <button mat-menu-item>
            <mat-icon>settings</mat-icon> Paramètres
          </button>
          <mat-divider></mat-divider>
          <button mat-menu-item (click)="deconnexion()" class="btn-deconnexion">
            <mat-icon>logout</mat-icon> Se déconnecter
          </button>
        </mat-menu>

      </div>
    </header>
  `,
  styles: [`
    :host { display:block; position:sticky; top:0; z-index:100; }

    .header {
      display: flex; align-items: center; justify-content: space-between;
      height: 62px; padding: 0 28px;
      background: white;
      border-bottom: 1px solid #e2e8f0;
      box-shadow: 0 1px 3px rgba(0,0,0,.05);
    }

    /* Titre */
    .header-titre { display:flex; align-items:center; gap:10px; }
    .header-icone { font-size:22px; width:22px; height:22px; color:#1B4F72; }
    .header-h1 { font-size:17px; font-weight:700; color:#0f172a; margin:0; }

    /* Droite */
    .header-droite { display:flex; align-items:center; gap:12px; }
    .header-date { font-size:12.5px; color:#94a3b8; white-space:nowrap; }

    /* Notifs */
    .btn-notif {
      position:relative; width:38px; height:38px;
      display:flex; align-items:center; justify-content:center;
      background:none; border:1px solid #e2e8f0; border-radius:10px;
      cursor:pointer; color:#475569; transition:all .15s ease;
    }
    .btn-notif:hover { background:#f1f5f9; border-color:#cbd5e1; }
    .btn-notif mat-icon { font-size:20px; width:20px; height:20px; }
    .notif-point {
      position:absolute; top:-4px; right:-4px;
      min-width:18px; height:18px; padding:0 4px;
      background:#dc2626; color:white;
      font-size:10px; font-weight:700;
      border-radius:10px; display:flex; align-items:center; justify-content:center;
      border:2px solid white;
    }

    /* Menu notifs */
    .menu-notifs-titre { font-size:13px; font-weight:700; color:#0f172a; padding:12px 16px 8px; border-bottom:1px solid #e2e8f0; }
    .menu-notif-item { display:flex; gap:10px; padding:10px 16px; border-bottom:1px solid #f1f5f9; }
    .notif-icone { width:32px; height:32px; border-radius:8px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
    .notif-icone mat-icon { font-size:16px; width:16px; height:16px; }
    .notif-icone-succes { background:#ECFDF5; color:#065f46; }
    .notif-icone-alerte { background:#FFFBEB; color:#92400e; }
    .notif-icone-info   { background:#EBF5FB; color:#1e40af; }
    .notif-message { font-size:12.5px; color:#1e293b; line-height:1.4; }
    .notif-temps   { font-size:11.5px; color:#94a3b8; margin-top:2px; }
    .menu-notifs-pied { padding:8px 12px; border-top:1px solid #e2e8f0; text-align:center; }

    /* Profil */
    .btn-profil {
      display:flex; align-items:center; gap:8px;
      background:none; border:none; cursor:pointer;
      padding:6px 8px; border-radius:10px; transition:all .15s ease;
    }
    .btn-profil:hover { background:#f1f5f9; }
    .avatar {
      width:32px; height:32px; border-radius:50%;
      background:linear-gradient(135deg,#1B4F72,#2980b9);
      display:flex; align-items:center; justify-content:center;
      font-size:12px; font-weight:700; color:white; flex-shrink:0;
    }
    .avatar.avatar-lg { width:42px; height:42px; font-size:16px; }
    .profil-info { display:flex; flex-direction:column; text-align:left; }
    .profil-nom  { font-size:13px; font-weight:600; color:#0f172a; }
    .profil-role { font-size:11px; color:#94a3b8; }
    .profil-fleche { font-size:18px; width:18px; height:18px; color:#94a3b8; }

    /* Menu profil */
    .menu-profil-entete { display:flex; align-items:center; gap:10px; padding:14px 16px 10px; border-bottom:1px solid #e2e8f0; }
    .menu-profil-nom   { font-size:14px; font-weight:600; color:#0f172a; }
    .menu-profil-email { font-size:12px; color:#94a3b8; }
    .btn-deconnexion   { color:#dc2626 !important; }
    .btn-deconnexion mat-icon { color:#dc2626 !important; }

    @media (max-width:640px) { .header-date, .profil-info { display:none; } }
  `]
})
export class HeaderComponent implements OnInit {
  pageCourante = { titre: 'Tableau de bord', icone: 'dashboard' };
  nomUtilisateur = 'Admin';
  initialesUtilisateur = 'AD';
  nbNotifs = 3;
  dateAujourdhui = '';

  notifications = [
    { type: 'succes', icone: 'check_circle', message: 'Commande CMD-047 livrée avec succès', temps: 'Il y a 5 minutes' },
    { type: 'alerte', icone: 'schedule',      message: 'Tournée T-089 : départ dans 30 minutes', temps: 'Il y a 20 minutes' },
    { type: 'info',   icone: 'person_add',    message: 'Nouveau client ajouté : Aziz & Fils', temps: 'Il y a 1 heure' },
  ];

  constructor(private router: Router, private authService: AuthService) {}

  ngOnInit(): void {
    // Date lisible
    this.dateAujourdhui = new Date().toLocaleDateString('fr-FR', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    }).replace(/^\w/, c => c.toUpperCase());

    // Utilisateur
    const u = this.authService.getCurrentUser?.();
    if (u?.username) {
      this.nomUtilisateur = u.username;
      this.initialesUtilisateur = u.username.substring(0, 2).toUpperCase();
    }

    // Page courante
    this.mettreAJourTitre(this.router.url);
    this.router.events.pipe(filter(e => e instanceof NavigationEnd))
      .subscribe((e: any) => this.mettreAJourTitre(e.url));
  }

  private mettreAJourTitre(url: string): void {
    const cle = Object.keys(TITRES_PAGES).find(k => url.startsWith(k));
    this.pageCourante = cle ? TITRES_PAGES[cle] : { titre: 'TMS GRPO', icone: 'home' };
  }

  deconnexion(): void { this.authService.logout(); }
}
