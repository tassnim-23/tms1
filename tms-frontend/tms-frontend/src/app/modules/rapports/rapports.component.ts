import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';
import { environment } from '../../../environments/environment';

interface StatGlobale {
  totalClients: number;
  totalCommandes: number;
  commandesLivrees: number;
  commandesAnnulees: number;
  commandesEnCours: number;
  commandesEnAttente: number;
  totalVehicules: number;
  totalChauffeurs: number;
  revenuTotal: number;
  revenuMois: number;
  tauxLivraison: number;
}

interface CommandeRapport {
  id: number;
  reference: string;
  clientNom: string;
  adresseDepart: string;
  adresseArrivee: string;
  statut: string;
  dateCreation: string;
  montant: number;
  chauffeurNom: string;
  vehiculeImmatriculation: string;
}

interface ClientRapport {
  id: number;
  nom: string;
  email: string;
  telephone: string;
  totalCommandes: number;
  revenuTotal: number;
  dateInscription: string;
}

interface ChauffeurRapport {
  id: number;
  nom: string;
  prenom: string;
  telephone: string;
  totalLivraisons: number;
  totalKm: number;
  statut: string;
}

interface VehiculeRapport {
  id: number;
  immatriculation: string;
  marque: string;
  modele: string;
  statut: string;
  totalMissions: number;
  kilometrage: number;
}

@Component({
  selector: 'app-rapports',
  template: `
<div class="page-wrapper">

  <!-- HEADER -->
  <div class="page-header">
    <div class="header-left">
      <div class="header-icon">📊</div>
      <div>
        <h1>Rapports &amp; Statistiques</h1>
        <p class="subtitle">Analysez vos données et exportez vos rapports</p>
      </div>
    </div>
    <div class="header-actions">
      <span class="last-update">Dernière mise à jour : {{ heureActualisation }}</span>
      <button class="btn-refresh" (click)="chargerTout()" [disabled]="loading">
        <span [class.spin]="loading">↻</span> Actualiser
      </button>
    </div>
  </div>

  <!-- LOADING -->
  <div *ngIf="loading" class="loading-box">
    <div class="spinner"></div><span>Chargement des statistiques...</span>
  </div>

  <!-- CONTENU -->
  <div *ngIf="!loading">

    <!-- ── KPI GLOBAUX ── -->
    <div class="section-title">
      <span class="section-icon">📈</span>
      <h2>Indicateurs clés de performance</h2>
    </div>
    <div class="kpi-grid">
      <div class="kpi-card kpi-clients">
        <div class="kpi-top">
          <div class="kpi-icon">👥</div>
          <div class="kpi-trend up">▲ actif</div>
        </div>
        <div class="kpi-val">{{ stats.totalClients }}</div>
        <div class="kpi-lbl">Clients enregistrés</div>
        <div class="kpi-bar" style="background:rgba(99,102,241,.15)">
          <div class="kpi-bar-fill" style="background:#6366f1;width:{{ Math.min((stats.totalClients/10)*100,100) }}%"></div>
        </div>
      </div>
      <div class="kpi-card kpi-commandes">
        <div class="kpi-top">
          <div class="kpi-icon">📦</div>
          <div class="kpi-trend" [class.up]="stats.totalCommandes>0">{{ stats.totalCommandes > 0 ? '▲' : '—' }}</div>
        </div>
        <div class="kpi-val">{{ stats.totalCommandes }}</div>
        <div class="kpi-lbl">Total commandes</div>
        <div class="kpi-bar" style="background:rgba(37,99,235,.12)">
          <div class="kpi-bar-fill" style="background:#2563eb;width:100%"></div>
        </div>
      </div>
      <div class="kpi-card kpi-livrees">
        <div class="kpi-top">
          <div class="kpi-icon">✅</div>
          <div class="kpi-trend up">{{ stats.tauxLivraison | number:'1.0-0' }}%</div>
        </div>
        <div class="kpi-val">{{ stats.commandesLivrees }}</div>
        <div class="kpi-lbl">Livrées avec succès</div>
        <div class="kpi-bar" style="background:rgba(22,163,74,.12)">
          <div class="kpi-bar-fill" style="background:#16a34a;width:{{ stats.tauxLivraison }}%"></div>
        </div>
      </div>
      <div class="kpi-card kpi-annulees">
        <div class="kpi-top">
          <div class="kpi-icon">❌</div>
          <div class="kpi-trend down" *ngIf="stats.commandesAnnulees>0">▼</div>
        </div>
        <div class="kpi-val">{{ stats.commandesAnnulees }}</div>
        <div class="kpi-lbl">Annulées</div>
        <div class="kpi-bar" style="background:rgba(220,38,38,.1)">
          <div class="kpi-bar-fill" style="background:#dc2626;width:{{ stats.totalCommandes>0 ? (stats.commandesAnnulees/stats.totalCommandes)*100 : 0 }}%"></div>
        </div>
      </div>
      <div class="kpi-card kpi-vehicules">
        <div class="kpi-top">
          <div class="kpi-icon">🚛</div>
          <div class="kpi-trend">flotte</div>
        </div>
        <div class="kpi-val">{{ stats.totalVehicules }}</div>
        <div class="kpi-lbl">Véhicules</div>
        <div class="kpi-bar" style="background:rgba(234,179,8,.12)">
          <div class="kpi-bar-fill" style="background:#eab308;width:{{ Math.min((stats.totalVehicules/20)*100,100) }}%"></div>
        </div>
      </div>
      <div class="kpi-card kpi-revenu">
        <div class="kpi-top">
          <div class="kpi-icon">💰</div>
          <div class="kpi-trend up" *ngIf="stats.revenuTotal>0">▲</div>
        </div>
        <div class="kpi-val">{{ stats.revenuTotal | number:'1.0-0' }} <small>DT</small></div>
        <div class="kpi-lbl">Revenu total</div>
        <div class="kpi-bar" style="background:rgba(20,184,166,.12)">
          <div class="kpi-bar-fill" style="background:#14b8a6;width:{{ Math.min((stats.revenuTotal/10000)*100,100) }}%"></div>
        </div>
      </div>
    </div>

    <!-- ── MODULE COMMANDES ── -->
    <div class="module-card">
      <div class="module-header">
        <div class="module-left">
          <div class="module-icon ico-commandes">📦</div>
          <div>
            <h3>Rapport des Commandes</h3>
            <p>{{ commandes.length }} commande(s) au total</p>
          </div>
        </div>
        <div class="export-btns">
          <button class="btn-export btn-pdf" (click)="exporterPDF('commandes')" title="Exporter en PDF">
            📄 PDF
          </button>
          <button class="btn-export btn-excel" (click)="exporterExcel('commandes')" title="Exporter en Excel">
            📊 Excel
          </button>
          <button class="btn-export btn-csv" (click)="exporterCSV('commandes')" title="Exporter en CSV">
            📋 CSV
          </button>
        </div>
      </div>
      <div class="module-stats">
        <div class="ms-item"><span class="ms-val text-blue">{{ stats.commandesEnAttente }}</span><span class="ms-lbl">En attente</span></div>
        <div class="ms-item"><span class="ms-val text-orange">{{ stats.commandesEnCours }}</span><span class="ms-lbl">En cours</span></div>
        <div class="ms-item"><span class="ms-val text-green">{{ stats.commandesLivrees }}</span><span class="ms-lbl">Livrées</span></div>
        <div class="ms-item"><span class="ms-val text-red">{{ stats.commandesAnnulees }}</span><span class="ms-lbl">Annulées</span></div>
        <div class="ms-item"><span class="ms-val text-teal">{{ stats.revenuTotal | number:'1.0-0' }} DT</span><span class="ms-lbl">Revenu</span></div>
      </div>
      <div class="mini-table-wrap" *ngIf="commandes.length > 0">
        <table class="mini-table">
          <thead><tr><th>Référence</th><th>Client</th><th>Trajet</th><th>Date</th><th>Montant</th><th>Statut</th></tr></thead>
          <tbody>
            <tr *ngFor="let c of commandes.slice(0,5)">
              <td><span class="ref">{{ c.reference || '#'+c.id }}</span></td>
              <td>{{ c.clientNom || '—' }}</td>
              <td class="small">{{ c.adresseDepart }} → {{ c.adresseArrivee }}</td>
              <td class="small">{{ fmtDate(c.dateCreation) }}</td>
              <td><b>{{ c.montant ? (c.montant | number:'1.2-2') + ' DT' : '—' }}</b></td>
              <td><span class="badge" [ngClass]="badgeClass(c.statut)">{{ labelStatut(c.statut) }}</span></td>
            </tr>
          </tbody>
        </table>
        <div *ngIf="commandes.length > 5" class="see-more">
          + {{ commandes.length - 5 }} autres commandes — exportez pour voir tout
        </div>
      </div>
    </div>

    <!-- ── MODULE CLIENTS ── -->
    <div class="module-card">
      <div class="module-header">
        <div class="module-left">
          <div class="module-icon ico-clients">👥</div>
          <div>
            <h3>Rapport des Clients</h3>
            <p>{{ stats.totalClients }} client(s) enregistré(s)</p>
          </div>
        </div>
        <div class="export-btns">
          <button class="btn-export btn-pdf" (click)="exporterPDF('clients')">📄 PDF</button>
          <button class="btn-export btn-excel" (click)="exporterExcel('clients')">📊 Excel</button>
          <button class="btn-export btn-csv" (click)="exporterCSV('clients')">📋 CSV</button>
        </div>
      </div>
      <div class="module-stats">
        <div class="ms-item"><span class="ms-val text-indigo">{{ stats.totalClients }}</span><span class="ms-lbl">Total clients</span></div>
        <div class="ms-item"><span class="ms-val text-green">{{ stats.totalCommandes }}</span><span class="ms-lbl">Commandes passées</span></div>
        <div class="ms-item"><span class="ms-val text-teal">{{ stats.totalCommandes > 0 ? (stats.totalCommandes / (stats.totalClients || 1) | number:'1.1-1') : 0 }}</span><span class="ms-lbl">Moy. cmd/client</span></div>
      </div>
      <div class="mini-table-wrap" *ngIf="clients.length > 0">
        <table class="mini-table">
          <thead><tr><th>Nom</th><th>Email</th><th>Téléphone</th><th>Commandes</th><th>Revenu</th><th>Inscription</th></tr></thead>
          <tbody>
            <tr *ngFor="let c of clients.slice(0,5)">
              <td><b>{{ c.nom }}</b></td>
              <td class="small">{{ c.email }}</td>
              <td class="small">{{ c.telephone || '—' }}</td>
              <td>{{ c.totalCommandes || 0 }}</td>
              <td><b class="text-green">{{ c.revenuTotal ? (c.revenuTotal | number:'1.2-2') + ' DT' : '—' }}</b></td>
              <td class="small">{{ fmtDate(c.dateInscription) }}</td>
            </tr>
          </tbody>
        </table>
        <div *ngIf="clients.length > 5" class="see-more">+ {{ clients.length - 5 }} autres clients</div>
      </div>
    </div>

    <!-- ── MODULE CHAUFFEURS ── -->
    <div class="module-card">
      <div class="module-header">
        <div class="module-left">
          <div class="module-icon ico-chauffeurs">🧑‍✈️</div>
          <div>
            <h3>Rapport des Chauffeurs</h3>
            <p>{{ stats.totalChauffeurs }} chauffeur(s) actif(s)</p>
          </div>
        </div>
        <div class="export-btns">
          <button class="btn-export btn-pdf" (click)="exporterPDF('chauffeurs')">📄 PDF</button>
          <button class="btn-export btn-excel" (click)="exporterExcel('chauffeurs')">📊 Excel</button>
          <button class="btn-export btn-csv" (click)="exporterCSV('chauffeurs')">📋 CSV</button>
        </div>
      </div>
      <div class="module-stats">
        <div class="ms-item"><span class="ms-val text-blue">{{ stats.totalChauffeurs }}</span><span class="ms-lbl">Total chauffeurs</span></div>
      </div>
      <div class="mini-table-wrap" *ngIf="chauffeurs.length > 0">
        <table class="mini-table">
          <thead><tr><th>Nom complet</th><th>Téléphone</th><th>Livraisons</th><th>Km total</th><th>Statut</th></tr></thead>
          <tbody>
            <tr *ngFor="let c of chauffeurs.slice(0,5)">
              <td><b>{{ c.prenom }} {{ c.nom }}</b></td>
              <td class="small">{{ c.telephone || '—' }}</td>
              <td>{{ c.totalLivraisons || 0 }}</td>
              <td>{{ c.totalKm ? (c.totalKm | number:'1.0-0') + ' km' : '—' }}</td>
              <td><span class="badge" [class.badge-livree]="c.statut==='ACTIF'" [class.badge-annulee]="c.statut==='INACTIF'">{{ c.statut || '—' }}</span></td>
            </tr>
          </tbody>
        </table>
        <div *ngIf="chauffeurs.length > 5" class="see-more">+ {{ chauffeurs.length - 5 }} autres chauffeurs</div>
      </div>
    </div>

    <!-- ── MODULE VÉHICULES ── -->
    <div class="module-card">
      <div class="module-header">
        <div class="module-left">
          <div class="module-icon ico-vehicules">🚛</div>
          <div>
            <h3>Rapport des Véhicules</h3>
            <p>{{ stats.totalVehicules }} véhicule(s) dans la flotte</p>
          </div>
        </div>
        <div class="export-btns">
          <button class="btn-export btn-pdf" (click)="exporterPDF('vehicules')">📄 PDF</button>
          <button class="btn-export btn-excel" (click)="exporterExcel('vehicules')">📊 Excel</button>
          <button class="btn-export btn-csv" (click)="exporterCSV('vehicules')">📋 CSV</button>
        </div>
      </div>
      <div class="module-stats">
        <div class="ms-item"><span class="ms-val text-yellow">{{ stats.totalVehicules }}</span><span class="ms-lbl">Total véhicules</span></div>
      </div>
      <div class="mini-table-wrap" *ngIf="vehicules.length > 0">
        <table class="mini-table">
          <thead><tr><th>Immatriculation</th><th>Marque / Modèle</th><th>Missions</th><th>Kilométrage</th><th>Statut</th></tr></thead>
          <tbody>
            <tr *ngFor="let v of vehicules.slice(0,5)">
              <td><span class="ref">{{ v.immatriculation }}</span></td>
              <td>{{ v.marque }} {{ v.modele }}</td>
              <td>{{ v.totalMissions || 0 }}</td>
              <td>{{ v.kilometrage ? (v.kilometrage | number:'1.0-0') + ' km' : '—' }}</td>
              <td><span class="badge" [class.badge-livree]="v.statut==='DISPONIBLE'" [class.badge-en-cours]="v.statut==='EN_SERVICE'" [class.badge-annulee]="v.statut==='EN_PANNE'">{{ v.statut || '—' }}</span></td>
            </tr>
          </tbody>
        </table>
        <div *ngIf="vehicules.length > 5" class="see-more">+ {{ vehicules.length - 5 }} autres véhicules</div>
      </div>
    </div>

    <!-- ── MODULE TOURNÉES ── -->
    <div class="module-card">
      <div class="module-header">
        <div class="module-left">
          <div class="module-icon ico-tournees">🗺️</div>
          <div>
            <h3>Rapport des Tournées</h3>
            <p>Synthèse des tournées effectuées</p>
          </div>
        </div>
        <div class="export-btns">
          <button class="btn-export btn-pdf" (click)="exporterPDF('tournees')">📄 PDF</button>
          <button class="btn-export btn-excel" (click)="exporterExcel('tournees')">📊 Excel</button>
          <button class="btn-export btn-csv" (click)="exporterCSV('tournees')">📋 CSV</button>
        </div>
      </div>
      <div class="module-stats">
        <div class="ms-item"><span class="ms-val text-purple">{{ stats.commandesLivrees }}</span><span class="ms-lbl">Tournées terminées</span></div>
        <div class="ms-item"><span class="ms-val text-orange">{{ stats.commandesEnCours }}</span><span class="ms-lbl">En cours</span></div>
      </div>
    </div>

    <!-- ── RAPPORT GLOBAL ── -->
    <div class="module-card global-card">
      <div class="module-header">
        <div class="module-left">
          <div class="module-icon ico-global">📊</div>
          <div>
            <h3>Rapport Global Complet</h3>
            <p>Export consolidé de toutes les données</p>
          </div>
        </div>
        <div class="export-btns">
          <button class="btn-export btn-pdf btn-lg" (click)="exporterPDF('global')">📄 Rapport PDF complet</button>
          <button class="btn-export btn-excel btn-lg" (click)="exporterExcel('global')">📊 Excel complet</button>
          <button class="btn-export btn-csv btn-lg" (click)="exporterCSV('global')">📋 CSV complet</button>
        </div>
      </div>
    </div>

  </div><!-- /!loading -->

  <!-- TOAST -->
  <div *ngIf="toastVisible" class="toast" [class.tok]="toastType==='ok'" [class.tko]="toastType==='ko'">
    {{ toastMsg }}
  </div>

</div>
  `,
  styles: [`
    *{box-sizing:border-box;margin:0;padding:0}
    .page-wrapper{padding:28px 32px;background:#f4f6f9;min-height:100vh;font-family:'Inter','Segoe UI',sans-serif}

    /* HEADER */
    .page-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:26px}
    .header-left{display:flex;align-items:center;gap:14px}
    .header-icon{font-size:34px}
    h1{font-size:22px;font-weight:700;color:#1a2233}
    .subtitle{font-size:13px;color:#7a8799;margin-top:2px}
    .header-actions{display:flex;align-items:center;gap:12px}
    .last-update{font-size:12px;color:#94a3b8}
    .btn-refresh{display:flex;align-items:center;gap:6px;padding:10px 16px;background:white;border:1.5px solid #e2e8f0;border-radius:10px;font-size:13px;cursor:pointer;font-weight:600;transition:all .2s}
    .btn-refresh:hover{background:#f1f5f9}
    .spin{display:inline-block;animation:rot 1s linear infinite}
    @keyframes rot{to{transform:rotate(360deg)}}

    /* LOADING */
    .loading-box{display:flex;align-items:center;justify-content:center;gap:14px;padding:60px;background:white;border-radius:14px}
    .spinner{width:30px;height:30px;border:3px solid #e2e8f0;border-top-color:#2563eb;border-radius:50%;animation:rot .8s linear infinite}

    /* SECTION TITLE */
    .section-title{display:flex;align-items:center;gap:10px;margin:0 0 16px}
    .section-icon{font-size:22px}
    .section-title h2{font-size:16px;font-weight:700;color:#1a2233}

    /* KPI GRID */
    .kpi-grid{display:grid;grid-template-columns:repeat(6,1fr);gap:14px;margin-bottom:28px}
    .kpi-card{background:white;border-radius:14px;padding:18px 20px;box-shadow:0 2px 10px rgba(0,0,0,.06);transition:all .2s}
    .kpi-card:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(0,0,0,.1)}
    .kpi-top{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px}
    .kpi-icon{font-size:24px}
    .kpi-trend{font-size:11px;font-weight:700;padding:3px 8px;border-radius:20px}
    .kpi-trend.up{background:#dcfce7;color:#15803d}
    .kpi-trend.down{background:#fee2e2;color:#b91c1c}
    .kpi-val{font-size:26px;font-weight:800;color:#1a2233;margin-bottom:4px}
    .kpi-val small{font-size:14px;font-weight:600;color:#64748b}
    .kpi-lbl{font-size:12px;color:#7a8799;margin-bottom:12px;font-weight:500}
    .kpi-bar{height:4px;border-radius:2px;overflow:hidden}
    .kpi-bar-fill{height:100%;border-radius:2px;transition:width .6s ease}

    /* MODULE CARDS */
    .module-card{background:white;border-radius:16px;padding:0;box-shadow:0 2px 10px rgba(0,0,0,.06);margin-bottom:20px;overflow:hidden;transition:all .2s}
    .module-card:hover{box-shadow:0 8px 28px rgba(0,0,0,.1)}
    .global-card{border:2px solid #2563eb}

    .module-header{display:flex;justify-content:space-between;align-items:center;padding:20px 24px;border-bottom:1px solid #f1f5f9}
    .module-left{display:flex;align-items:center;gap:14px}
    .module-icon{width:48px;height:48px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:22px}
    .ico-commandes{background:#eff6ff}
    .ico-clients{background:#f0fdf4}
    .ico-chauffeurs{background:#fef3c7}
    .ico-vehicules{background:#fdf4ff}
    .ico-tournees{background:#fff7ed}
    .ico-global{background:#eff6ff}
    .module-header h3{font-size:16px;font-weight:700;color:#1a2233}
    .module-header p{font-size:12.5px;color:#7a8799;margin-top:2px}

    /* EXPORT BUTTONS */
    .export-btns{display:flex;gap:8px}
    .btn-export{padding:8px 14px;border:none;border-radius:8px;cursor:pointer;font-size:13px;font-weight:600;transition:all .2s;display:flex;align-items:center;gap:5px}
    .btn-export:hover{transform:translateY(-1px);box-shadow:0 4px 12px rgba(0,0,0,.15)}
    .btn-pdf{background:#fee2e2;color:#b91c1c}
    .btn-pdf:hover{background:#fecaca}
    .btn-excel{background:#dcfce7;color:#15803d}
    .btn-excel:hover{background:#bbf7d0}
    .btn-csv{background:#dbeafe;color:#1d4ed8}
    .btn-csv:hover{background:#bfdbfe}
    .btn-lg{padding:10px 18px;font-size:14px}

    /* MODULE STATS */
    .module-stats{display:flex;gap:0;border-bottom:1px solid #f8fafc}
    .ms-item{flex:1;padding:14px 20px;text-align:center;border-right:1px solid #f1f5f9}
    .ms-item:last-child{border-right:none}
    .ms-val{font-size:22px;font-weight:800;display:block}
    .ms-lbl{font-size:11.5px;color:#94a3b8;margin-top:2px;display:block}

    /* COULEURS */
    .text-blue{color:#2563eb}.text-orange{color:#d97706}.text-green{color:#16a34a}
    .text-red{color:#dc2626}.text-teal{color:#0d9488}.text-indigo{color:#4f46e5}
    .text-yellow{color:#ca8a04}.text-purple{color:#9333ea}

    /* MINI TABLE */
    .mini-table-wrap{overflow-x:auto;padding:16px 20px}
    .mini-table{width:100%;border-collapse:collapse;font-size:13px}
    .mini-table th{padding:10px 12px;text-align:left;font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.4px;background:#f8fafc;border-bottom:1px solid #e2e8f0}
    .mini-table td{padding:10px 12px;border-bottom:1px solid #f8fafc;color:#334155;vertical-align:middle}
    .mini-table tr:hover td{background:#f8fafc}
    .mini-table .small{font-size:12px;color:#64748b;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .ref{background:#eff6ff;color:#1d4ed8;border-radius:5px;padding:3px 8px;font-size:11.5px;font-weight:700}

    /* BADGES */
    .badge{display:inline-flex;align-items:center;padding:3px 9px;border-radius:20px;font-size:11.5px;font-weight:600}
    .badge-en-attente{background:#fef3c7;color:#b45309}
    .badge-en-cours{background:#dbeafe;color:#1d4ed8}
    .badge-livree{background:#dcfce7;color:#15803d}
    .badge-annulee{background:#fee2e2;color:#b91c1c}

    .see-more{text-align:center;padding:10px;font-size:12px;color:#94a3b8;font-style:italic}

    /* TOAST */
    .toast{position:fixed;bottom:28px;right:28px;z-index:9999;padding:14px 22px;border-radius:10px;font-weight:600;font-size:14px;box-shadow:0 6px 24px rgba(0,0,0,.2);animation:ti .3s ease;max-width:380px}
    @keyframes ti{from{transform:translateY(16px);opacity:0}}
    .tok{background:#2e7d32;color:white}
    .tko{background:#c62828;color:white}

    @media(max-width:1200px){.kpi-grid{grid-template-columns:repeat(3,1fr)}}
    @media(max-width:768px){
      .kpi-grid{grid-template-columns:repeat(2,1fr)}
      .page-wrapper{padding:16px}
      .export-btns{flex-wrap:wrap}
      .module-header{flex-direction:column;align-items:flex-start;gap:12px}
    }
  `]
})
export class RapportsComponent implements OnInit {

  loading = false;
  heureActualisation = '—';

  stats: StatGlobale = {
    totalClients: 0, totalCommandes: 0, commandesLivrees: 0,
    commandesAnnulees: 0, commandesEnCours: 0, commandesEnAttente: 0,
    totalVehicules: 0, totalChauffeurs: 0, revenuTotal: 0,
    revenuMois: 0, tauxLivraison: 0
  };

  commandes: CommandeRapport[] = [];
  clients: ClientRapport[] = [];
  chauffeurs: ChauffeurRapport[] = [];
  vehicules: VehiculeRapport[] = [];

  toastVisible = false;
  toastMsg = '';
  toastType: 'ok' | 'ko' = 'ok';
  private toastTimer: any;

  Math = Math;

  constructor(private http: HttpClient, private auth: AuthService) {}

  ngOnInit(): void { this.chargerTout(); }

  private get hdrs(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${this.auth.getToken()}` });
  }

  chargerTout(): void {
    this.loading = true;
    const appels = [
      this.http.get<any>(`${environment.apiUrl}/commandes`, { headers: this.hdrs }),
      this.http.get<any>(`${environment.apiUrl}/clients`, { headers: this.hdrs }),
      this.http.get<any>(`${environment.apiUrl}/chauffeurs`, { headers: this.hdrs }),
      this.http.get<any>(`${environment.apiUrl}/vehicules`, { headers: this.hdrs })
    ];

    // Chargement indépendant pour robustesse
    this.http.get<any>(`${environment.apiUrl}/commandes`, { headers: this.hdrs }).subscribe({
      next: (data) => {
        const list: CommandeRapport[] = Array.isArray(data) ? data : (data?.content || data?.data || []);
        this.commandes = list;
        this.calculerStats();
      },
      error: () => {}
    });

    this.http.get<any>(`${environment.apiUrl}/clients`, { headers: this.hdrs }).subscribe({
      next: (data) => {
        this.clients = Array.isArray(data) ? data : (data?.content || data?.data || []);
        this.calculerStats();
      },
      error: () => {}
    });

    this.http.get<any>(`${environment.apiUrl}/chauffeurs`, { headers: this.hdrs }).subscribe({
      next: (data) => {
        this.chauffeurs = Array.isArray(data) ? data : (data?.content || data?.data || []);
        this.calculerStats();
      },
      error: () => {}
    });

    this.http.get<any>(`${environment.apiUrl}/vehicules`, { headers: this.hdrs }).subscribe({
      next: (data) => {
        this.vehicules = Array.isArray(data) ? data : (data?.content || data?.data || []);
        this.calculerStats();
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });

    this.heureActualisation = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }

  private calculerStats(): void {
    const cmds = this.commandes;
    this.stats.totalCommandes = cmds.length;
    this.stats.commandesLivrees = cmds.filter(c => c.statut === 'LIVREE').length;
    this.stats.commandesAnnulees = cmds.filter(c => c.statut === 'ANNULEE').length;
    this.stats.commandesEnCours = cmds.filter(c => c.statut === 'EN_COURS').length;
    this.stats.commandesEnAttente = cmds.filter(c => c.statut === 'EN_ATTENTE').length;
    this.stats.revenuTotal = cmds.reduce((s, c) => s + (c.montant || 0), 0);
    this.stats.tauxLivraison = cmds.length > 0
      ? Math.round((this.stats.commandesLivrees / cmds.length) * 100) : 0;
    this.stats.totalClients = this.clients.length || this.stats.totalClients;
    this.stats.totalChauffeurs = this.chauffeurs.length;
    this.stats.totalVehicules = this.vehicules.length;
  }

  /* ══════════════ EXPORTS ══════════════ */

  exporterCSV(module: string): void {
    let contenu = '';
    let nomFichier = '';

    if (module === 'commandes' || module === 'global') {
      const entetes = ['ID', 'Référence', 'Client', 'Départ', 'Arrivée', 'Statut', 'Date création', 'Montant (DT)', 'Chauffeur', 'Véhicule'];
      const lignes = this.commandes.map(c => [
        c.id, c.reference || '', c.clientNom || '', c.adresseDepart || '',
        c.adresseArrivee || '', c.statut || '', this.fmtDate(c.dateCreation),
        c.montant || 0, c.chauffeurNom || '', c.vehiculeImmatriculation || ''
      ]);
      contenu += 'RAPPORT COMMANDES\n' + this.versCSV(entetes, lignes) + '\n\n';
    }

    if (module === 'clients' || module === 'global') {
      const entetes = ['ID', 'Nom', 'Email', 'Téléphone', 'Total Commandes', 'Revenu (DT)', 'Date inscription'];
      const lignes = this.clients.map(c => [
        c.id, c.nom, c.email, c.telephone || '', c.totalCommandes || 0,
        c.revenuTotal || 0, this.fmtDate(c.dateInscription)
      ]);
      contenu += 'RAPPORT CLIENTS\n' + this.versCSV(entetes, lignes) + '\n\n';
    }

    if (module === 'chauffeurs' || module === 'global') {
      const entetes = ['ID', 'Prénom', 'Nom', 'Téléphone', 'Livraisons', 'Km total', 'Statut'];
      const lignes = this.chauffeurs.map(c => [
        c.id, c.prenom, c.nom, c.telephone || '', c.totalLivraisons || 0, c.totalKm || 0, c.statut || ''
      ]);
      contenu += 'RAPPORT CHAUFFEURS\n' + this.versCSV(entetes, lignes) + '\n\n';
    }

    if (module === 'vehicules' || module === 'global') {
      const entetes = ['ID', 'Immatriculation', 'Marque', 'Modèle', 'Missions', 'Kilométrage', 'Statut'];
      const lignes = this.vehicules.map(v => [
        v.id, v.immatriculation, v.marque || '', v.modele || '',
        v.totalMissions || 0, v.kilometrage || 0, v.statut || ''
      ]);
      contenu += 'RAPPORT VEHICULES\n' + this.versCSV(entetes, lignes);
    }

    if (module === 'tournees') {
      contenu = 'RAPPORT TOURNEES\nDate,Statut,Commandes\n';
      contenu += this.commandes.filter(c => c.statut === 'LIVREE' || c.statut === 'EN_COURS')
        .map(c => `${this.fmtDate(c.dateCreation)},${c.statut},${c.reference}`).join('\n');
    }

    nomFichier = `TMS_${module.toUpperCase()}_${this.dateExport()}.csv`;
    this.telechargerFichier(contenu, nomFichier, 'text/csv;charset=utf-8;');
    this.showToast(`✅ Export CSV ${module} téléchargé`, 'ok');
  }

  exporterExcel(module: string): void {
    // Export Excel au format XML (compatible Excel)
    let rows = '';
    const style = `<Style ss:ID="h"><Font ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#1a3a5c" ss:Pattern="Solid"/></Style>
                   <Style ss:ID="n"><NumberFormat ss:Format="#,##0.00"/></Style>`;

    const addSheet = (nom: string, entetes: string[], lignes: any[][]) => {
      rows += `<Worksheet ss:Name="${nom}"><Table>`;
      rows += `<Row>` + entetes.map(h => `<Cell ss:StyleID="h"><Data ss:Type="String">${h}</Data></Cell>`).join('') + `</Row>`;
      lignes.forEach(l => {
        rows += `<Row>` + l.map(v => `<Cell><Data ss:Type="${typeof v === 'number' ? 'Number' : 'String'}">${this.escapeXml(String(v || ''))}</Data></Cell>`).join('') + `</Row>`;
      });
      rows += `</Table></Worksheet>`;
    };

    if (module === 'commandes' || module === 'global') {
      addSheet('Commandes',
        ['ID', 'Référence', 'Client', 'Départ', 'Arrivée', 'Statut', 'Date', 'Montant DT', 'Chauffeur', 'Véhicule'],
        this.commandes.map(c => [c.id, c.reference||'', c.clientNom||'', c.adresseDepart||'', c.adresseArrivee||'', c.statut||'', this.fmtDate(c.dateCreation), c.montant||0, c.chauffeurNom||'', c.vehiculeImmatriculation||'']));
    }
    if (module === 'clients' || module === 'global') {
      addSheet('Clients',
        ['ID', 'Nom', 'Email', 'Téléphone', 'Commandes', 'Revenu DT', 'Inscription'],
        this.clients.map(c => [c.id, c.nom, c.email, c.telephone||'', c.totalCommandes||0, c.revenuTotal||0, this.fmtDate(c.dateInscription)]));
    }
    if (module === 'chauffeurs' || module === 'global') {
      addSheet('Chauffeurs',
        ['ID', 'Prénom', 'Nom', 'Téléphone', 'Livraisons', 'Km total', 'Statut'],
        this.chauffeurs.map(c => [c.id, c.prenom, c.nom, c.telephone||'', c.totalLivraisons||0, c.totalKm||0, c.statut||'']));
    }
    if (module === 'vehicules' || module === 'global') {
      addSheet('Véhicules',
        ['ID', 'Immatriculation', 'Marque', 'Modèle', 'Missions', 'Km', 'Statut'],
        this.vehicules.map(v => [v.id, v.immatriculation, v.marque||'', v.modele||'', v.totalMissions||0, v.kilometrage||0, v.statut||'']));
    }

    const xml = `<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
<Styles>${style}</Styles>${rows}</Workbook>`;

    this.telechargerFichier(xml, `TMS_${module.toUpperCase()}_${this.dateExport()}.xls`, 'application/vnd.ms-excel');
    this.showToast(`✅ Export Excel ${module} téléchargé`, 'ok');
  }

  exporterPDF(module: string): void {
    // Génération HTML → impression PDF via fenêtre navigateur
    const titre = {
      commandes: 'Rapport des Commandes', clients: 'Rapport des Clients',
      chauffeurs: 'Rapport des Chauffeurs', vehicules: 'Rapport des Véhicules',
      tournees: 'Rapport des Tournées', global: 'Rapport Global Complet'
    }[module] || 'Rapport TMS';

    let corps = '';

    const tableHtml = (entetes: string[], lignes: any[][]): string => {
      let t = `<table><thead><tr>${entetes.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>`;
      lignes.forEach(l => { t += `<tr>${l.map(v => `<td>${v ?? '—'}</td>`).join('')}</tr>`; });
      return t + '</tbody></table>';
    };

    if (module === 'commandes' || module === 'global') {
      corps += `<h2>📦 Commandes (${this.commandes.length})</h2>`;
      corps += tableHtml(
        ['Réf', 'Client', 'Départ', 'Arrivée', 'Statut', 'Date', 'Montant'],
        this.commandes.map(c => [c.reference||'#'+c.id, c.clientNom||'—', c.adresseDepart, c.adresseArrivee, this.labelStatut(c.statut), this.fmtDate(c.dateCreation), c.montant ? c.montant.toFixed(2)+' DT' : '—'])
      );
    }
    if (module === 'clients' || module === 'global') {
      corps += `<h2>👥 Clients (${this.clients.length})</h2>`;
      corps += tableHtml(
        ['Nom', 'Email', 'Téléphone', 'Commandes', 'Revenu'],
        this.clients.map(c => [c.nom, c.email, c.telephone||'—', c.totalCommandes||0, c.revenuTotal ? c.revenuTotal.toFixed(2)+' DT':'—'])
      );
    }
    if (module === 'chauffeurs' || module === 'global') {
      corps += `<h2>🧑‍✈️ Chauffeurs (${this.chauffeurs.length})</h2>`;
      corps += tableHtml(
        ['Prénom', 'Nom', 'Téléphone', 'Livraisons', 'Km total', 'Statut'],
        this.chauffeurs.map(c => [c.prenom, c.nom, c.telephone||'—', c.totalLivraisons||0, c.totalKm ? c.totalKm.toLocaleString()+' km':'—', c.statut||'—'])
      );
    }
    if (module === 'vehicules' || module === 'global') {
      corps += `<h2>🚛 Véhicules (${this.vehicules.length})</h2>`;
      corps += tableHtml(
        ['Immatriculation', 'Marque', 'Modèle', 'Missions', 'Kilométrage', 'Statut'],
        this.vehicules.map(v => [v.immatriculation, v.marque||'—', v.modele||'—', v.totalMissions||0, v.kilometrage ? v.kilometrage.toLocaleString()+' km':'—', v.statut||'—'])
      );
    }

    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
<title>${titre}</title>
<style>
  body{font-family:'Segoe UI',sans-serif;color:#1a2233;padding:32px;font-size:12px}
  .cover{text-align:center;margin-bottom:40px;padding:30px;background:linear-gradient(135deg,#1a3a5c,#2563eb);color:white;border-radius:12px}
  .cover h1{font-size:26px;margin-bottom:8px}
  .cover p{opacity:.85;font-size:13px}
  .kpi-row{display:flex;gap:16px;margin:24px 0;flex-wrap:wrap}
  .kpi{flex:1;min-width:100px;background:#f8fafc;border-radius:8px;padding:14px;text-align:center;border-left:4px solid #2563eb}
  .kpi-v{font-size:22px;font-weight:800;color:#1a3a5c}
  .kpi-l{font-size:11px;color:#64748b;margin-top:2px}
  h2{font-size:15px;font-weight:700;color:#1a3a5c;margin:24px 0 10px;padding-bottom:6px;border-bottom:2px solid #e2e8f0}
  table{width:100%;border-collapse:collapse;margin-bottom:20px;font-size:11px}
  th{background:#1a3a5c;color:white;padding:8px 10px;text-align:left;font-size:10.5px}
  td{padding:7px 10px;border-bottom:1px solid #f1f5f9;color:#334155}
  tr:nth-child(even) td{background:#f8fafc}
  .footer{margin-top:40px;text-align:center;font-size:11px;color:#94a3b8;border-top:1px solid #e2e8f0;padding-top:16px}
  @media print{body{padding:16px}.cover{border-radius:0}}
</style></head><body>
<div class="cover">
  <h1>🚛 GRPO — Transport Management System</h1>
  <p>${titre} • Généré le ${new Date().toLocaleDateString('fr-FR', { weekday:'long', year:'numeric', month:'long', day:'numeric' })} à ${new Date().toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit' })}</p>
</div>
<div class="kpi-row">
  <div class="kpi"><div class="kpi-v">${this.stats.totalClients}</div><div class="kpi-l">Clients</div></div>
  <div class="kpi"><div class="kpi-v">${this.stats.totalCommandes}</div><div class="kpi-l">Commandes</div></div>
  <div class="kpi"><div class="kpi-v">${this.stats.commandesLivrees}</div><div class="kpi-l">Livrées</div></div>
  <div class="kpi"><div class="kpi-v">${this.stats.commandesAnnulees}</div><div class="kpi-l">Annulées</div></div>
  <div class="kpi"><div class="kpi-v">${this.stats.totalVehicules}</div><div class="kpi-l">Véhicules</div></div>
  <div class="kpi"><div class="kpi-v">${this.stats.revenuTotal.toFixed(0)} DT</div><div class="kpi-l">Revenu total</div></div>
  <div class="kpi"><div class="kpi-v">${this.stats.tauxLivraison}%</div><div class="kpi-l">Taux livraison</div></div>
</div>
${corps}
<div class="footer">GRPO Transport Management System • Rapport généré automatiquement</div>
</body></html>`;

    const win = window.open('', '_blank');
    if (win) {
      win.document.write(html);
      win.document.close();
      win.focus();
      setTimeout(() => { win.print(); }, 600);
    }
    this.showToast(`✅ Rapport PDF ${module} ouvert pour impression`, 'ok');
  }

  /* ══ UTILITAIRES ══ */

  private versCSV(entetes: string[], lignes: any[][]): string {
    const sep = ';';
    const esc = (v: any) => `"${String(v || '').replace(/"/g, '""')}"`;
    return [entetes.map(esc).join(sep), ...lignes.map(l => l.map(esc).join(sep))].join('\n');
  }

  private escapeXml(s: string): string {
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  private telechargerFichier(contenu: string, nom: string, type: string): void {
    const bom = type.includes('csv') ? '\uFEFF' : '';
    const blob = new Blob([bom + contenu], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nom;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  private dateExport(): string {
    const d = new Date();
    return `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`;
  }

  labelStatut(s: string): string {
    return { EN_ATTENTE:'En attente', EN_COURS:'En cours', LIVREE:'Livrée', ANNULEE:'Annulée' }[s] || s;
  }

  badgeClass(s: string): string {
    return { EN_ATTENTE:'badge-en-attente', EN_COURS:'badge-en-cours', LIVREE:'badge-livree', ANNULEE:'badge-annulee' }[s] || '';
  }

  fmtDate(d: string): string {
    if (!d) return '—';
    try {
      const dt = new Date(d);
      return dt.toLocaleDateString('fr-FR', { day:'2-digit', month:'2-digit', year:'numeric' })
           + ' ' + dt.toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit' });
    } catch { return d; }
  }

  private showToast(msg: string, type: 'ok' | 'ko'): void {
    clearTimeout(this.toastTimer);
    this.toastMsg = msg; this.toastType = type; this.toastVisible = true;
    this.toastTimer = setTimeout(() => this.toastVisible = false, 4000);
  }
}
