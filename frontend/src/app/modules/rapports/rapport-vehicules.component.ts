import { Component, OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RapportService } from '../../core/services/rapport.service';
import { ExcelExportService } from '../../core/services/excel-export.service';
import { PdfExportService } from '../../core/services/pdf-export.service';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

@Component({
  selector: 'app-rapport-vehicules',
  template: `
    <div class="rapport-header">
      <div class="back-title">
        <button mat-icon-button (click)="router.navigate(['/rapports'])"><mat-icon>arrow_back</mat-icon></button>
        <div>
          <h1><mat-icon>directions_car</mat-icon> Rapport des Véhicules</h1>
          <p>Utilisation de la flotte, statuts et kilométrage</p>
        </div>
      </div>
      <div class="actions">
        <button mat-raised-button (click)="load()"><mat-icon>refresh</mat-icon> Actualiser</button>
        <button mat-raised-button color="primary" [matMenuTriggerFor]="exportMenu"><mat-icon>download</mat-icon> Exporter</button>
        <mat-menu #exportMenu="matMenu">
          <button mat-menu-item (click)="exportExcel()"><mat-icon>table_view</mat-icon> Excel</button>
          <button mat-menu-item (click)="exportPdf()"><mat-icon>picture_as_pdf</mat-icon> PDF</button>
          <button mat-menu-item (click)="exportCsv()"><mat-icon>description</mat-icon> CSV</button>
          <button mat-menu-item (click)="imprimer()"><mat-icon>print</mat-icon> Imprimer</button>
        </mat-menu>
      </div>
    </div>

    <div *ngIf="loading" class="loading-overlay"><mat-spinner diameter="60"></mat-spinner><p>Chargement...</p></div>

    <div *ngIf="!loading && data">
      <div class="stats-grid">
        <div class="stat-card primary"><mat-icon>directions_car</mat-icon><div class="val">{{data.total}}</div><div class="lbl">Total véhicules</div></div>
        <div class="stat-card success"><mat-icon>check_circle</mat-icon><div class="val">{{data.dispos}}</div><div class="lbl">Disponibles</div></div>
        <div class="stat-card warning"><mat-icon>drive_eta</mat-icon><div class="val">{{data.service}}</div><div class="lbl">En service</div></div>
        <div class="stat-card error"><mat-icon>build</mat-icon><div class="val">{{data.maint}}</div><div class="lbl">En maintenance</div></div>
        <div class="stat-card info"><mat-icon>speed</mat-icon><div class="val">{{data.kmTotal | number:'1.0-0'}} km</div><div class="lbl">Km total flotte</div></div>
      </div>

      <div class="charts-grid">
        <div class="tms-card chart-card">
          <h3><mat-icon>pie_chart</mat-icon> Répartition par statut</h3>
          <canvas #pieChart width="300" height="200"></canvas>
        </div>
        <div class="tms-card chart-card">
          <h3><mat-icon>bar_chart</mat-icon> Kilométrage par véhicule</h3>
          <canvas #barChart width="400" height="200"></canvas>
        </div>
      </div>

      <div class="tms-card">
        <div class="table-toolbar">
          <h3><mat-icon>table_chart</mat-icon> Détail de la flotte</h3>
          <mat-form-field appearance="outline" style="width:220px">
            <mat-label>Rechercher</mat-label>
            <input matInput [(ngModel)]="search"><mat-icon matSuffix>search</mat-icon>
          </mat-form-field>
        </div>
        <div class="table-container">
          <table mat-table [dataSource]="filteredRows" class="tms-table">
            <ng-container matColumnDef="immat"><th mat-header-cell *matHeaderCellDef>Immatriculation</th><td mat-cell *matCellDef="let r"><strong>{{r.immat}}</strong></td></ng-container>
            <ng-container matColumnDef="marque"><th mat-header-cell *matHeaderCellDef>Marque / Modèle</th><td mat-cell *matCellDef="let r">{{r.marque}}</td></ng-container>
            <ng-container matColumnDef="capacite"><th mat-header-cell *matHeaderCellDef>Capacité</th><td mat-cell *matCellDef="let r">{{r.capacite}}</td></ng-container>
            <ng-container matColumnDef="km"><th mat-header-cell *matHeaderCellDef>Kilométrage</th><td mat-cell *matCellDef="let r">{{r.km}}</td></ng-container>
            <ng-container matColumnDef="tournees"><th mat-header-cell *matHeaderCellDef>Tournées</th><td mat-cell *matCellDef="let r">{{r.tournees}}</td></ng-container>
            <ng-container matColumnDef="miseEnService"><th mat-header-cell *matHeaderCellDef>Mise en service</th><td mat-cell *matCellDef="let r">{{r.miseEnService}}</td></ng-container>
            <ng-container matColumnDef="statut">
              <th mat-header-cell *matHeaderCellDef>Statut</th>
              <td mat-cell *matCellDef="let r">
                <span class="badge" [ngClass]="getStatutClass(r.statut)">{{getStatutLabel(r.statut)}}</span>
              </td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="cols"></tr>
            <tr mat-row *matRowDef="let row; columns: cols;" class="table-row"></tr>
            <tr class="mat-row" *matNoDataRow><td class="mat-cell no-data" colspan="7"><mat-icon>directions_car</mat-icon><p>Aucun véhicule</p></td></tr>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .rapport-header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:28px; flex-wrap:wrap; gap:16px; }
    .back-title { display:flex; align-items:center; gap:8px; }
    .back-title h1 { display:flex; align-items:center; gap:8px; font-size:22px; color:#1B4F72; margin:0; }
    .back-title p { margin:4px 0 0; color:#666; font-size:13px; }
    .actions { display:flex; gap:10px; }
    .loading-overlay { text-align:center; padding:80px; }
    .stats-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(160px,1fr)); gap:16px; margin-bottom:24px; }
    .stat-card { border-radius:12px; padding:20px 16px; text-align:center; color:white; }
    .stat-card mat-icon { font-size:32px; width:32px; height:32px; opacity:.85; }
    .stat-card .val { font-size:24px; font-weight:700; margin:8px 0 4px; }
    .stat-card .lbl { font-size:12px; opacity:.9; }
    .stat-card.primary { background:linear-gradient(135deg,#1B4F72,#2980b9); }
    .stat-card.success { background:linear-gradient(135deg,#27AE60,#2ecc71); }
    .stat-card.warning { background:linear-gradient(135deg,#E67E22,#f39c12); }
    .stat-card.error   { background:linear-gradient(135deg,#E74C3C,#c0392b); }
    .stat-card.info    { background:linear-gradient(135deg,#16a085,#1abc9c); }
    .charts-grid { display:grid; grid-template-columns:1fr 1fr; gap:20px; margin-bottom:24px; }
    .chart-card { padding:20px; }
    .chart-card h3 { display:flex; align-items:center; gap:6px; margin:0 0 16px; color:#1B4F72; font-size:15px; }
    .table-toolbar { display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; }
    .table-toolbar h3 { display:flex; align-items:center; gap:6px; margin:0; color:#1B4F72; }
    .table-container { overflow-x:auto; }
    .tms-table { width:100%; } .tms-table th { background:#1B4F72; color:white; font-weight:600; }
    .table-row:hover { background:#f5f9fc; }
    .no-data { text-align:center; padding:30px !important; color:#999; }
    .badge { padding:3px 8px; border-radius:12px; font-size:11px; font-weight:700; }
    .badge-dispo { background:#e8f5e9; color:#2E7D32; }
    .badge-service { background:#fff8e1; color:#E65100; }
    .badge-maint { background:#ffebee; color:#C62828; }
    @media (max-width:768px) { .charts-grid { grid-template-columns:1fr; } }
    @media print { .actions, .back-title button { display:none !important; } }
  `]
})
export class RapportVehiculesComponent implements OnInit, OnDestroy {
  @ViewChild('pieChart') pieRef!: ElementRef;
  @ViewChild('barChart') barRef!: ElementRef;
  data: any = null; loading = false; search = '';
  cols = ['immat','marque','capacite','km','tournees','miseEnService','statut'];
  private charts: Chart[] = [];

  get filteredRows(): any[] {
    if (!this.data?.rows) return [];
    const s = this.search.toLowerCase();
    return this.data.rows.filter((r: any) => !s || Object.values(r).some(v => String(v).toLowerCase().includes(s)));
  }

  constructor(public router: Router, private rapportSvc: RapportService, private excelSvc: ExcelExportService, private pdfSvc: PdfExportService, private snack: MatSnackBar) {}
  ngOnInit(): void { this.load(); }
  ngOnDestroy(): void { this.charts.forEach(c => c.destroy()); }

  load(): void {
    this.loading = true;
    this.rapportSvc.getRapportVehicules().subscribe({
      next: d => { this.data = d; this.loading = false; setTimeout(() => this.buildCharts(), 100); },
      error: () => { this.loading = false; this.snack.open('Erreur', 'OK', { duration: 3000 }); }
    });
  }

  private buildCharts(): void {
    this.charts.forEach(c => c.destroy()); this.charts = [];
    if (this.pieRef) {
      this.charts.push(new Chart(this.pieRef.nativeElement, {
        type: 'doughnut',
        data: {
          labels: ['Disponibles','En service','Maintenance'],
          datasets: [{ data: [this.data.dispos, this.data.service, this.data.maint],
            backgroundColor: ['#27AE60','#E67E22','#E74C3C'], hoverOffset: 4 }]
        },
        options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
      }));
    }
    if (this.barRef && this.data.rows.length > 0) {
      const rows = this.data.rows.slice(0, 10);
      this.charts.push(new Chart(this.barRef.nativeElement, {
        type: 'bar',
        data: {
          labels: rows.map((r: any) => r.immat),
          datasets: [{ label: 'Kilométrage (km)', data: rows.map((r: any) => parseInt(r.km) || 0), backgroundColor: '#1B4F72', borderRadius: 4 }]
        },
        options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
      }));
    }
  }

  getStatutLabel(s: string): string { const m: any = { 'DISPONIBLE':'Disponible','EN_SERVICE':'En service','EN_MAINTENANCE':'Maintenance' }; return m[s] || s; }
  getStatutClass(s: string): string { const m: any = { 'DISPONIBLE':'badge-dispo','EN_SERVICE':'badge-service','EN_MAINTENANCE':'badge-maint' }; return m[s] || ''; }

  exportExcel(): void {
    const cols = [{ key:'immat',label:'Immatriculation' },{ key:'marque',label:'Marque/Modèle' },{ key:'capacite',label:'Capacité' },{ key:'km',label:'Kilométrage' },{ key:'tournees',label:'Tournées' },{ key:'statut',label:'Statut' },{ key:'miseEnService',label:'Mise en service' }];
    this.excelSvc.exportToExcelStyled(this.data.rows, cols, 'rapport_vehicules', 'Rapport Véhicules');
  }
  exportPdf(): void {
    const cols = [{ key:'immat',label:'Immatriculation',width:30 },{ key:'marque',label:'Marque',width:35 },{ key:'capacite',label:'Capacité',width:22 },{ key:'km',label:'Km',width:25 },{ key:'statut',label:'Statut',width:25 }];
    const stats = [{ label:'Total',value:String(this.data.total) },{ label:'Disponibles',value:String(this.data.dispos) },{ label:'En service',value:String(this.data.service) },{ label:'Maintenance',value:String(this.data.maint) },{ label:'Km total',value:this.data.kmTotal.toLocaleString('fr-FR')+' km' }];
    this.pdfSvc.exportRapportPdf('Rapport des Véhicules','',stats,this.data.rows,cols,'rapport_vehicules');
  }
  exportCsv(): void { this.excelSvc.exportCsv(this.data.rows,'rapport_vehicules'); }
  imprimer(): void { window.print(); }
}
