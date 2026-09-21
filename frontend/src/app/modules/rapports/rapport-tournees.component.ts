import { Component, OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RapportService } from '../../core/services/rapport.service';
import { ExcelExportService } from '../../core/services/excel-export.service';
import { PdfExportService } from '../../core/services/pdf-export.service';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

@Component({
  selector: 'app-rapport-tournees',
  template: `
    <div class="rapport-header">
      <div class="back-title">
        <button mat-icon-button (click)="router.navigate(['/rapports'])"><mat-icon>arrow_back</mat-icon></button>
        <div>
          <h1><mat-icon>map</mat-icon> Rapport des Tournées</h1>
          <p>Planification, statuts et distances des tournées</p>
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
        <div class="stat-card primary"><mat-icon>map</mat-icon><div class="val">{{data.total}}</div><div class="lbl">Total tournées</div></div>
        <div class="stat-card info"><mat-icon>event</mat-icon><div class="val">{{data.planifiees}}</div><div class="lbl">Planifiées</div></div>
        <div class="stat-card warning"><mat-icon>local_shipping</mat-icon><div class="val">{{data.enCours}}</div><div class="lbl">En cours</div></div>
        <div class="stat-card success"><mat-icon>check_circle</mat-icon><div class="val">{{data.terminees}}</div><div class="lbl">Terminées</div></div>
        <div class="stat-card accent"><mat-icon>speed</mat-icon><div class="val">{{data.kmTotal | number:'1.0-0'}} km</div><div class="lbl">Distance totale</div></div>
      </div>

      <div class="charts-grid">
        <div class="tms-card chart-card">
          <h3><mat-icon>pie_chart</mat-icon> Répartition par statut</h3>
          <canvas #pieChart width="280" height="200"></canvas>
        </div>
        <div class="tms-card chart-card">
          <h3><mat-icon>bar_chart</mat-icon> Livraisons par tournée (Top 8)</h3>
          <canvas #barChart width="400" height="200"></canvas>
        </div>
      </div>

      <div class="tms-card">
        <div class="table-toolbar">
          <h3><mat-icon>table_chart</mat-icon> Détail des tournées ({{data.rows.length}})</h3>
          <mat-form-field appearance="outline" style="width:220px">
            <mat-label>Rechercher</mat-label>
            <input matInput [(ngModel)]="search"><mat-icon matSuffix>search</mat-icon>
          </mat-form-field>
        </div>
        <div class="table-container">
          <table mat-table [dataSource]="filteredRows" class="tms-table">
            <ng-container matColumnDef="date"><th mat-header-cell *matHeaderCellDef>Date</th><td mat-cell *matCellDef="let r"><strong>{{r.date}}</strong></td></ng-container>
            <ng-container matColumnDef="chauffeur"><th mat-header-cell *matHeaderCellDef>Chauffeur</th><td mat-cell *matCellDef="let r">{{r.chauffeur}}</td></ng-container>
            <ng-container matColumnDef="vehicule"><th mat-header-cell *matHeaderCellDef>Véhicule</th><td mat-cell *matCellDef="let r">{{r.vehicule}}</td></ng-container>
            <ng-container matColumnDef="horaires"><th mat-header-cell *matHeaderCellDef>Horaires</th><td mat-cell *matCellDef="let r">{{r.horaires}}</td></ng-container>
            <ng-container matColumnDef="distance"><th mat-header-cell *matHeaderCellDef>Distance</th><td mat-cell *matCellDef="let r">{{r.distance}}</td></ng-container>
            <ng-container matColumnDef="livraisons"><th mat-header-cell *matHeaderCellDef>Livraisons</th><td mat-cell *matCellDef="let r"><span class="count-chip">{{r.livraisons}}</span></td></ng-container>
            <ng-container matColumnDef="statut">
              <th mat-header-cell *matHeaderCellDef>Statut</th>
              <td mat-cell *matCellDef="let r">
                <span class="badge" [ngClass]="getStatutClass(r.statut)">{{r.statut}}</span>
              </td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="cols"></tr>
            <tr mat-row *matRowDef="let row; columns: cols;" class="table-row"></tr>
            <tr class="mat-row" *matNoDataRow><td class="mat-cell no-data" colspan="7"><mat-icon>map</mat-icon><p>Aucune tournée</p></td></tr>
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
    .stat-card.info    { background:linear-gradient(135deg,#2c3e50,#34495e); }
    .stat-card.warning { background:linear-gradient(135deg,#E67E22,#f39c12); }
    .stat-card.success { background:linear-gradient(135deg,#27AE60,#2ecc71); }
    .stat-card.accent  { background:linear-gradient(135deg,#16a085,#1abc9c); }
    .charts-grid { display:grid; grid-template-columns:1fr 2fr; gap:20px; margin-bottom:24px; }
    .chart-card { padding:20px; }
    .chart-card h3 { display:flex; align-items:center; gap:6px; margin:0 0 16px; color:#1B4F72; font-size:15px; }
    .table-toolbar { display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; }
    .table-toolbar h3 { display:flex; align-items:center; gap:6px; margin:0; color:#1B4F72; }
    .table-container { overflow-x:auto; }
    .tms-table { width:100%; } .tms-table th { background:#1B4F72; color:white; font-weight:600; }
    .table-row:hover { background:#f5f9fc; }
    .no-data { text-align:center; padding:30px !important; color:#999; }
    .count-chip { background:#e3f2fd; color:#1B4F72; border-radius:12px; padding:2px 10px; font-weight:700; font-size:12px; }
    .badge { padding:3px 8px; border-radius:12px; font-size:11px; font-weight:700; }
    .badge-plan { background:#e3f2fd; color:#1565C0; }
    .badge-enc  { background:#fff8e1; color:#E65100; }
    .badge-term { background:#e8f5e9; color:#2E7D32; }
    @media (max-width:768px) { .charts-grid { grid-template-columns:1fr; } }
    @media print { .actions, .back-title button { display:none !important; } }
  `]
})
export class RapportTourneesComponent implements OnInit, OnDestroy {
  @ViewChild('pieChart') pieRef!: ElementRef;
  @ViewChild('barChart') barRef!: ElementRef;
  data: any = null; loading = false; search = '';
  cols = ['date','chauffeur','vehicule','horaires','distance','livraisons','statut'];
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
    this.rapportSvc.getRapportTournees().subscribe({
      next: d => { this.data = d; this.loading = false; setTimeout(() => this.buildCharts(), 100); },
      error: () => { this.loading = false; this.snack.open('Erreur', 'OK', { duration: 3000 }); }
    });
  }

  private buildCharts(): void {
    this.charts.forEach(c => c.destroy()); this.charts = [];
    if (this.pieRef) {
      this.charts.push(new Chart(this.pieRef.nativeElement, {
        type: 'doughnut',
        data: { labels: ['Planifiées','En cours','Terminées'], datasets: [{ data: [this.data.planifiees, this.data.enCours, this.data.terminees], backgroundColor: ['#1B4F72','#E67E22','#27AE60'], hoverOffset: 4 }] },
        options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
      }));
    }
    if (this.barRef && this.data.rows.length > 0) {
      const top = this.data.rows.slice(0, 8);
      this.charts.push(new Chart(this.barRef.nativeElement, {
        type: 'bar',
        data: { labels: top.map((r: any) => r.date), datasets: [{ label: 'Livraisons', data: top.map((r: any) => r.livraisons), backgroundColor: '#E67E22', borderRadius: 4 }] },
        options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
      }));
    }
  }

  getStatutClass(s: string): string { const m: any = { 'PLANIFIEE':'badge-plan','EN_COURS':'badge-enc','TERMINEE':'badge-term' }; return m[s] || ''; }

  exportExcel(): void {
    const cols = [{ key:'date',label:'Date' },{ key:'chauffeur',label:'Chauffeur' },{ key:'vehicule',label:'Véhicule' },{ key:'horaires',label:'Horaires' },{ key:'distance',label:'Distance' },{ key:'livraisons',label:'Livraisons' },{ key:'statut',label:'Statut' }];
    this.excelSvc.exportToExcelStyled(this.data.rows, cols, 'rapport_tournees', 'Rapport Tournées');
  }
  exportPdf(): void {
    const cols = [{ key:'date',label:'Date',width:22 },{ key:'chauffeur',label:'Chauffeur',width:35 },{ key:'vehicule',label:'Véhicule',width:28 },{ key:'distance',label:'Distance',width:20 },{ key:'livraisons',label:'Livraisons',width:20 },{ key:'statut',label:'Statut',width:22 }];
    const stats = [{ label:'Total',value:String(this.data.total) },{ label:'Planifiées',value:String(this.data.planifiees) },{ label:'En cours',value:String(this.data.enCours) },{ label:'Terminées',value:String(this.data.terminees) },{ label:'Km total',value:this.data.kmTotal+' km' }];
    this.pdfSvc.exportRapportPdf('Rapport des Tournées','',stats,this.data.rows,cols,'rapport_tournees');
  }
  exportCsv(): void { this.excelSvc.exportCsv(this.data.rows,'rapport_tournees'); }
  imprimer(): void { window.print(); }
}
