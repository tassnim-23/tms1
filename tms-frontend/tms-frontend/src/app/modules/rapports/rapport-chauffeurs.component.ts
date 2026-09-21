import { Component, OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RapportService } from '../../core/services/rapport.service';
import { ExcelExportService } from '../../core/services/excel-export.service';
import { PdfExportService } from '../../core/services/pdf-export.service';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

@Component({
  selector: 'app-rapport-chauffeurs',
  template: `
    <div class="rapport-header">
      <div class="back-title">
        <button mat-icon-button (click)="router.navigate(['/rapports'])"><mat-icon>arrow_back</mat-icon></button>
        <div>
          <h1><mat-icon>person</mat-icon> Rapport des Chauffeurs</h1>
          <p>Performance, disponibilité et suivi des chauffeurs</p>
        </div>
      </div>
      <div class="actions">
        <button mat-raised-button (click)="load()"><mat-icon>refresh</mat-icon> Actualiser</button>
        <button mat-raised-button color="primary" [matMenuTriggerFor]="exportMenu">
          <mat-icon>download</mat-icon> Exporter
        </button>
        <mat-menu #exportMenu="matMenu">
          <button mat-menu-item (click)="exportExcel()"><mat-icon>table_view</mat-icon> Excel</button>
          <button mat-menu-item (click)="exportPdf()"><mat-icon>picture_as_pdf</mat-icon> PDF</button>
          <button mat-menu-item (click)="exportCsv()"><mat-icon>description</mat-icon> CSV</button>
          <button mat-menu-item (click)="imprimer()"><mat-icon>print</mat-icon> Imprimer</button>
        </mat-menu>
      </div>
    </div>

    <div *ngIf="loading" class="loading-overlay">
      <mat-spinner diameter="60"></mat-spinner><p>Chargement...</p>
    </div>

    <div *ngIf="!loading && data">
      <!-- STATS -->
      <div class="stats-grid">
        <div class="stat-card primary"><mat-icon>group</mat-icon><div class="val">{{data.total}}</div><div class="lbl">Total chauffeurs</div></div>
        <div class="stat-card success"><mat-icon>check_circle</mat-icon><div class="val">{{data.dispos}}</div><div class="lbl">Disponibles</div></div>
        <div class="stat-card error"><mat-icon>cancel</mat-icon><div class="val">{{data.indispos}}</div><div class="lbl">Indisponibles</div></div>
        <div class="stat-card accent"><mat-icon>map</mat-icon><div class="val">{{data.totalTournees}}</div><div class="lbl">Total tournées</div></div>
      </div>

      <!-- GRAPHIQUES -->
      <div class="charts-grid">
        <div class="tms-card chart-card">
          <h3><mat-icon>pie_chart</mat-icon> Disponibilité</h3>
          <canvas #pieChart width="300" height="200"></canvas>
        </div>
        <div class="tms-card chart-card">
          <h3><mat-icon>bar_chart</mat-icon> Tournées par chauffeur</h3>
          <canvas #barChart width="400" height="200"></canvas>
        </div>
      </div>

      <!-- ALERTES PERMIS -->
      <div *ngIf="permisAExpirer.length > 0" class="alert-box">
        <mat-icon>warning</mat-icon>
        <strong>{{ permisAExpirer.length }} permis expire(nt) dans moins de 30 jours !</strong>
        <span *ngFor="let c of permisAExpirer" class="badge-warn">{{c.nom}} ({{c.permisDays}}j)</span>
      </div>

      <!-- TABLEAU -->
      <div class="tms-card">
        <div class="table-toolbar">
          <h3><mat-icon>table_chart</mat-icon> Détail des chauffeurs</h3>
          <mat-form-field appearance="outline" style="width:220px">
            <mat-label>Rechercher</mat-label>
            <input matInput [(ngModel)]="search">
            <mat-icon matSuffix>search</mat-icon>
          </mat-form-field>
        </div>
        <div class="table-container">
          <table mat-table [dataSource]="filteredRows" class="tms-table">
            <ng-container matColumnDef="nom"><th mat-header-cell *matHeaderCellDef>Nom</th><td mat-cell *matCellDef="let r"><strong>{{r.nom}}</strong></td></ng-container>
            <ng-container matColumnDef="telephone"><th mat-header-cell *matHeaderCellDef>Téléphone</th><td mat-cell *matCellDef="let r">{{r.telephone}}</td></ng-container>
            <ng-container matColumnDef="permis"><th mat-header-cell *matHeaderCellDef>N° Permis</th><td mat-cell *matCellDef="let r">{{r.permis}}</td></ng-container>
            <ng-container matColumnDef="validite">
              <th mat-header-cell *matHeaderCellDef>Validité permis</th>
              <td mat-cell *matCellDef="let r">
                <span [class.expire]="r.permisDays !== null && r.permisDays <= 0"
                      [class.bientot]="r.permisDays !== null && r.permisDays > 0 && r.permisDays <= 30">
                  {{r.validite}}
                  <span *ngIf="r.permisDays !== null && r.permisDays <= 30 && r.permisDays > 0" class="badge-warn">⚠️</span>
                  <span *ngIf="r.permisDays !== null && r.permisDays <= 0" class="badge-danger">EXPIRÉ</span>
                </span>
              </td>
            </ng-container>
            <ng-container matColumnDef="tournees"><th mat-header-cell *matHeaderCellDef>Tournées</th><td mat-cell *matCellDef="let r">{{r.tournees}}</td></ng-container>
            <ng-container matColumnDef="terminees"><th mat-header-cell *matHeaderCellDef>Terminées</th><td mat-cell *matCellDef="let r">{{r.terminees}}</td></ng-container>
            <ng-container matColumnDef="distance"><th mat-header-cell *matHeaderCellDef>Distance</th><td mat-cell *matCellDef="let r">{{r.distance}}</td></ng-container>
            <ng-container matColumnDef="disponible">
              <th mat-header-cell *matHeaderCellDef>Statut</th>
              <td mat-cell *matCellDef="let r">
                <span class="badge" [class.badge-success]="r.disponible==='Disponible'" [class.badge-error]="r.disponible!=='Disponible'">{{r.disponible}}</span>
              </td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="cols"></tr>
            <tr mat-row *matRowDef="let row; columns: cols;" class="table-row"></tr>
            <tr class="mat-row" *matNoDataRow><td class="mat-cell no-data" colspan="8"><mat-icon>person_off</mat-icon><p>Aucun chauffeur</p></td></tr>
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
    .stat-card .val { font-size:26px; font-weight:700; margin:8px 0 4px; }
    .stat-card .lbl { font-size:12px; opacity:.9; }
    .stat-card.primary { background:linear-gradient(135deg,#1B4F72,#2980b9); }
    .stat-card.success { background:linear-gradient(135deg,#27AE60,#2ecc71); }
    .stat-card.error   { background:linear-gradient(135deg,#E74C3C,#c0392b); }
    .stat-card.accent  { background:linear-gradient(135deg,#E67E22,#f39c12); }
    .charts-grid { display:grid; grid-template-columns:1fr 1fr; gap:20px; margin-bottom:24px; }
    .chart-card { padding:20px; }
    .chart-card h3 { display:flex; align-items:center; gap:6px; margin:0 0 16px; font-size:15px; color:#1B4F72; }
    .alert-box { background:#fff3cd; border-left:4px solid #F39C12; padding:12px 16px; border-radius:8px; margin-bottom:20px; display:flex; align-items:center; gap:10px; flex-wrap:wrap; color:#856404; }
    .table-toolbar { display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; }
    .table-toolbar h3 { display:flex; align-items:center; gap:6px; margin:0; color:#1B4F72; }
    .table-container { overflow-x:auto; }
    .tms-table { width:100%; }
    .tms-table th { background:#1B4F72; color:white; font-weight:600; }
    .table-row:hover { background:#f5f9fc; }
    .no-data { text-align:center; padding:30px !important; color:#999; }
    .badge { padding:3px 8px; border-radius:12px; font-size:11px; font-weight:700; }
    .badge-success { background:#e8f5e9; color:#2E7D32; }
    .badge-error { background:#ffebee; color:#C62828; }
    .badge-warn { background:#fff3cd; color:#856404; border-radius:8px; padding:2px 8px; font-size:11px; }
    .badge-danger { background:#ffebee; color:#C62828; border-radius:8px; padding:2px 8px; font-size:11px; margin-left:4px; }
    .expire { color:#E74C3C; font-weight:600; }
    .bientot { color:#F39C12; font-weight:600; }
    @media (max-width:768px) { .charts-grid { grid-template-columns:1fr; } }
    @media print { .actions, .back-title button { display:none !important; } }
  `]
})
export class RapportChauffeursComponent implements OnInit, OnDestroy {
  @ViewChild('pieChart') pieRef!: ElementRef;
  @ViewChild('barChart') barRef!: ElementRef;

  data: any = null;
  loading = false;
  search = '';
  cols = ['nom','telephone','permis','validite','tournees','terminees','distance','disponible'];
  private charts: Chart[] = [];

  get filteredRows(): any[] {
    if (!this.data?.rows) return [];
    const s = this.search.toLowerCase();
    return this.data.rows.filter((r: any) => !s || Object.values(r).some(v => String(v).toLowerCase().includes(s)));
  }

  get permisAExpirer(): any[] {
    return (this.data?.rows || []).filter((r: any) => r.permisDays !== null && r.permisDays <= 30 && r.permisDays > 0);
  }

  constructor(public router: Router, private rapportSvc: RapportService, private excelSvc: ExcelExportService, private pdfSvc: PdfExportService, private snack: MatSnackBar) {}

  ngOnInit(): void { this.load(); }
  ngOnDestroy(): void { this.charts.forEach(c => c.destroy()); }

  load(): void {
    this.loading = true;
    this.rapportSvc.getRapportChauffeurs().subscribe({
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
          labels: ['Disponibles', 'Indisponibles'],
          datasets: [{ data: [this.data.dispos, this.data.indispos], backgroundColor: ['#27AE60','#E74C3C'], hoverOffset: 4 }]
        },
        options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
      }));
    }
    if (this.barRef && this.data.rows.length > 0) {
      this.charts.push(new Chart(this.barRef.nativeElement, {
        type: 'bar',
        data: {
          labels: this.data.rows.map((r: any) => r.nom),
          datasets: [
            { label: 'Tournées', data: this.data.rows.map((r: any) => r.tournees), backgroundColor: '#1B4F72', borderRadius: 4 },
            { label: 'Terminées', data: this.data.rows.map((r: any) => r.terminees), backgroundColor: '#27AE60', borderRadius: 4 }
          ]
        },
        options: { responsive: true, plugins: { legend: { position: 'top' } }, scales: { y: { beginAtZero: true } } }
      }));
    }
  }

  exportExcel(): void {
    const cols = [
      { key:'nom',label:'Chauffeur' },{ key:'telephone',label:'Téléphone' },{ key:'permis',label:'N° Permis' },
      { key:'validite',label:'Validité permis' },{ key:'tournees',label:'Tournées' },
      { key:'terminees',label:'Terminées' },{ key:'distance',label:'Distance' },{ key:'disponible',label:'Statut' }
    ];
    this.excelSvc.exportToExcelStyled(this.data.rows, cols, 'rapport_chauffeurs', 'Rapport Chauffeurs');
  }

  exportPdf(): void {
    const cols = [
      { key:'nom',label:'Chauffeur',width:35 },{ key:'telephone',label:'Téléphone',width:28 },
      { key:'permis',label:'Permis',width:25 },{ key:'validite',label:'Validité',width:25 },
      { key:'tournees',label:'Tournées',width:18 },{ key:'disponible',label:'Statut',width:22 }
    ];
    const stats = [
      { label:'Total',value:String(this.data.total) },{ label:'Disponibles',value:String(this.data.dispos) },
      { label:'Indisponibles',value:String(this.data.indispos) },{ label:'Tournées',value:String(this.data.totalTournees) }
    ];
    this.pdfSvc.exportRapportPdf('Rapport des Chauffeurs','',stats,this.data.rows,cols,'rapport_chauffeurs');
  }

  exportCsv(): void { this.excelSvc.exportCsv(this.data.rows, 'rapport_chauffeurs'); }
  imprimer(): void { window.print(); }
}
